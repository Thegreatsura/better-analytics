import "./polyfills/compression";
import { Elysia } from "elysia";
import { clickhouse } from "@better-analytics/db/clickhouse";
import { randomUUID } from "node:crypto";
import { UAParser } from "ua-parser-js";
import { parse as parseDomain } from "tldts";
import { logger } from "./lib/logger";
import { extractIpFromRequest, getGeoData } from "./lib/ip-geo";
import { db, user } from "@better-analytics/db";
import { eq } from "drizzle-orm";
import { ErrorIngestBody, LogIngestBody } from "./types";
import { Autumn } from "autumn-js";
import supabase from "./lib/soup-base";

// Helper function to check quota with Autumn
async function checkQuota(feature_id: string, customer_id: string) {
    try {
        const { data } = await Autumn.check({
            feature_id,
            customer_id,
            send_event: true,
        });

        return data?.allowed ?? false;
    } catch (error) {
        logger.error(`Failed to check quota for ${feature_id}:`, error);
        // On error, allow the request to proceed (fail open)
        return true;
    }
}

// Helper function to send real-time events to specific users
async function sendRealTimeEvent(userId: string, event: string, payload: any) {
    try {
        const channel = supabase.channel(`user:${userId}`);
        await channel.send({
            type: 'broadcast',
            event,
            payload
        });
        logger.info(`Sent real-time ${event} event to user ${userId}`);
    } catch (error) {
        logger.error(`Failed to send real-time event to user ${userId}:`, error);
    }
}

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
    .onBeforeHandle(({ request, set }) => {



        set.headers["Access-Control-Allow-Origin"] = request.headers.get("origin") || "*";
        set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        set.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Origin, X-Requested-With, Accept";
        set.headers["Access-Control-Allow-Credentials"] = "true";
        set.headers["Access-Control-Max-Age"] = "86400";

        if (request.method === "OPTIONS") {
            set.status = 200;
            return;
        }
    })
    .derive(async ({ request, set, body }) => {
        if (new URL(request.url).pathname === "/") {
            return { userId: null };
        }

        const authHeader = request.headers.get("Authorization");
        const potentialBody = body as { accessToken?: string };

        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : potentialBody?.accessToken;

        if (!accessToken) {
            set.status = 401;
            throw new Error("Unauthorized. Access token is missing.");
        }

        const userExists = await db.query.user.findFirst({
            columns: { id: true },
            where: eq(user.accessToken, accessToken),
        });

        if (!userExists) {
            set.status = 401;
            throw new Error("Unauthorized. Invalid access token.");
        }

        return { userId: userExists.id };
    })
    .get("/", () => "Better Analytics API")
    .post("/ingest", async ({ body, request, set, userId }) => {
        logger.info("Received request on /ingest endpoint.");

        // Check quota for error ingestion
        const isAllowed = await checkQuota("error", body.client_id);
        if (!isAllowed) {
            set.status = 429;
            return {
                status: "error",
                message: "Quota exceeded for error ingestion.",
            };
        }

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
        try {
            await clickhouse.insert({ table: 'errors', values: [sanitizedErrorData], format: 'JSONEachRow' });

            // Send real-time event to the specific user
            if (userId) {
                await sendRealTimeEvent(userId, 'error_ingested', {
                    id: sanitizedErrorData.id,
                    message: sanitizedErrorData.message,
                    severity: sanitizedErrorData.severity,
                    error_type: sanitizedErrorData.error_type,
                    source: sanitizedErrorData.source,
                    client_id: sanitizedErrorData.client_id,
                    created_at: sanitizedErrorData.created_at,
                    url: sanitizedErrorData.url,
                    browser_name: sanitizedErrorData.browser_name,
                    os_name: sanitizedErrorData.os_name,
                    device_type: sanitizedErrorData.device_type,
                    country: sanitizedErrorData.country,
                    city: sanitizedErrorData.city
                });
            }

            return { status: "success", id: sanitizedErrorData.id };
        } catch (error) {
            logger.error({ message: 'Failed to ingest error:', error });
            return { status: "error", message: "Failed to process error" };
        }
    }, { body: ErrorIngestBody })
    .post("/log", async ({ body, set, userId }) => {
        logger.info("Received request on /log endpoint.");

        // Check quota for log ingestion
        const isAllowed = await checkQuota("log", body.client_id);
        if (!isAllowed) {
            set.status = 429;
            return {
                status: "error",
                message: "Quota exceeded for log ingestion.",
            };
        }

        const logData = {
            id: randomUUID(),
            ...body,
            created_at: toCHDateTime64(new Date()),
        };

        try {
            await clickhouse.insert({ table: 'logs', values: [logData], format: 'JSONEachRow' });

            // Send real-time event to the specific user
            if (userId) {
                await sendRealTimeEvent(userId, 'log_ingested', {
                    id: logData.id,
                    message: logData.message,
                    level: logData.level,
                    source: logData.source,
                    client_id: logData.client_id,
                    created_at: logData.created_at,
                    context: logData.context,
                    environment: logData.environment,
                    session_id: logData.session_id,
                    user_id: logData.user_id
                });
            }

            return { status: "success", id: logData.id };
        } catch (error) {
            logger.error('Failed to ingest log:', error);
            return { status: "error", message: "Failed to process log" };
        }
    }, { body: LogIngestBody })
    .onError(({ code, error, set }) => {
        const errorMessage = (error as any)?.message || 'An unknown error occurred';
        logger.error(`[${code}] ${errorMessage}`);

        // Handle authentication errors
        if (errorMessage.includes('Unauthorized')) {
            set.status = 401;
            return {
                status: 'error',
                message: errorMessage
            };
        }

        set.status = 500;
        return {
            status: 'error',
            message: 'An internal error occurred.'
        }
    })
    .listen(process.env.PORT || 4000);

logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;