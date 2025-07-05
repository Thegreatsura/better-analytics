import "./polyfills/compression";
import { Elysia } from "elysia";
import { clickhouse } from "@better-analytics/db/clickhouse";
import { randomUUID } from "node:crypto";
import { UAParser } from "ua-parser-js";
import { parse as parseDomain } from "tldts";
import { logger } from "./lib/logger";
import { analytics } from "./lib/analytics";
import { extractIpFromRequest, getGeoData } from "./lib/ip-geo";
import { db, user } from "@better-analytics/db";
import { eq } from "drizzle-orm";
import { ErrorIngestBody, LogIngestBody } from "./types";
import { cors } from "@elysiajs/cors";


function replaceUndefinedWithNull(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(replaceUndefinedWithNull);
    }
    if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : replaceUndefinedWithNull(v)])
        );
    }
    return obj;
}

function toCHDateTime64(date: Date | string | number | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

const app = new Elysia()
    .use(cors())
    .onBeforeHandle(async ({ request, set, body }) => {
        if (new URL(request.url).pathname === "/") {
            return;
        }

        const authHeader = request.headers.get("Authorization");
        const potentialBody = body as { accessToken?: string };

        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : potentialBody?.accessToken;

        if (!accessToken) {
            await analytics.warn("Unauthorized API request", {
                endpoint: new URL(request.url).pathname,
                ip: extractIpFromRequest(request),
                userAgent: request.headers.get("user-agent") || undefined,
            });
            set.status = 401;
            return {
                status: "error",
                message: "Unauthorized. Access token is missing.",
            };
        }

        try {
            const userExists = await db.query.user.findFirst({
                columns: { id: true },
                where: eq(user.accessToken, accessToken),
            });

            if (!userExists) {
                await analytics.warn("Invalid access token used", {
                    endpoint: new URL(request.url).pathname,
                    ip: extractIpFromRequest(request),
                    userAgent: request.headers.get("user-agent") || undefined,
                });
                set.status = 401;
                return {
                    status: "error",
                    message: "Unauthorized. Invalid access token.",
                };
            }
        } catch (error) {
            await analytics.captureException(error as Error, {
                error_name: "DatabaseAuthError",
                severity: "high",
                tags: ["database", "auth"],
                custom_data: {
                    endpoint: new URL(request.url).pathname,
                    ip: extractIpFromRequest(request),
                },
            });
            set.status = 500;
            return {
                status: "error",
                message: "Internal server error during authentication.",
            };
        }
    })
    .get("/", () => "Better Analytics API")
    .post("/ingest", async ({ body, request }) => {
        const requestId = randomUUID();

        try {
            logger.info("Received request on /ingest endpoint.");
            await analytics.info("Processing error ingest request", {
                requestId,
                clientId: body.client_id,
            });

            const userAgent = request.headers.get("user-agent") || "";
            const uaResult = UAParser(userAgent);
            const ip = extractIpFromRequest(request);
            const geo = await getGeoData(ip);
            const domainInfo = body.url ? parseDomain(body.url) : null;
            const now = new Date();

            const errorData = {
                id: randomUUID(),
                ...body,
                tags: body.tags ?? [],
                occurrence_count: body.occurrence_count ?? 1,
                source: body.source || domainInfo?.domain,
                user_agent: userAgent,
                browser_name: body.browser_name ?? uaResult.browser.name,
                browser_version: body.browser_version ?? uaResult.browser.version,
                os_name: body.os_name ?? uaResult.os.name,
                os_version: body.os_version ?? uaResult.os.version,
                device_type: body.device_type ?? uaResult.device.type ?? "desktop",
                ip_address: ip,
                country: geo.country,
                region: geo.region,
                city: geo.city,
                org: geo.org,
                postal: geo.postal,
                loc: geo.loc,
                first_occurrence: toCHDateTime64(body.first_occurrence) || toCHDateTime64(now),
                last_occurrence: toCHDateTime64(body.last_occurrence) || toCHDateTime64(now),
                resolved_at: toCHDateTime64(body.resolved_at),
                created_at: toCHDateTime64(now),
                updated_at: toCHDateTime64(now),
            };

            const sanitizedErrorData = replaceUndefinedWithNull(errorData);

            await clickhouse.insert({ table: 'errors', values: [sanitizedErrorData], format: 'JSONEachRow' });

            await analytics.info("Error ingested successfully", {
                requestId,
                errorId: sanitizedErrorData.id,
                clientId: body.client_id,
                errorType: body.error_type,
                severity: body.severity,
            });

            return { status: "success", id: sanitizedErrorData.id };
        } catch (error) {
            logger.error({ message: 'Failed to ingest error:', error });

            await analytics.captureException(error as Error, {
                error_name: "ErrorIngestFailure",
                severity: "critical",
                tags: ["ingest", "database"],
                custom_data: {
                    requestId,
                    clientId: body.client_id,
                    originalError: body.error_name,
                },
            });

            return { status: "error", message: "Failed to process error" };
        }
    }, { body: ErrorIngestBody })
    .post("/log", async ({ body }) => {
        const requestId = randomUUID();

        try {
            await analytics.debug("Processing log ingest request", {
                requestId,
                clientId: body.client_id,
                level: body.level,
            });

            const logData = {
                id: randomUUID(),
                ...body,
                created_at: toCHDateTime64(new Date()),
            };

            await clickhouse.insert({ table: 'logs', values: [logData], format: 'JSONEachRow' });

            await analytics.debug("Log ingested successfully", {
                requestId,
                logId: logData.id,
                clientId: body.client_id,
                level: body.level,
            });

            return { status: "success", id: logData.id };
        } catch (error) {
            logger.error('Failed to ingest log:', error);

            await analytics.captureException(error as Error, {
                error_name: "LogIngestFailure",
                severity: "high",
                tags: ["ingest", "database", "logs"],
                custom_data: {
                    requestId,
                    clientId: body.client_id,
                    logLevel: body.level,
                },
            });

            return { status: "error", message: "Failed to process log" };
        }
    }, { body: LogIngestBody })
    .onError(async ({ code, error, set, request }) => {
        const errorMessage = (error as any)?.message || 'An unknown error occurred';
        const requestId = randomUUID();

        logger.error(`[${code}] ${errorMessage}`);

        await analytics.captureException(error as Error, {
            error_name: "APIError",
            severity: "high",
            tags: ["api", "unhandled"],
            custom_data: {
                requestId,
                code,
                endpoint: new URL(request.url).pathname,
                method: request.method,
                ip: extractIpFromRequest(request),
                userAgent: request.headers.get("user-agent") || undefined,
            },
        });

        set.status = 500;
        return {
            status: 'error',
            message: 'An internal error occurred.',
            requestId,
        }
    })
    .listen(process.env.PORT || 4000);

logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
await analytics.info("Better Analytics API started", {
    hostname: app.server?.hostname,
    port: app.server?.port,
    environment: process.env.NODE_ENV || 'development',
});

export type App = typeof app;