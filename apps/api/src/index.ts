import "./polyfills/compression";
import { Elysia, t } from "elysia";
import { clickhouse } from "@better-analytics/db/clickhouse";
import { randomUUID } from "node:crypto";
import { UAParser } from "ua-parser-js";
import { parse as parseDomain } from "tldts";
import { logger } from "./lib/logger";
import { extractIpFromRequest, getGeoData } from "./lib/ip-geo";
import { db, user } from "@better-analytics/db";
import { eq } from "drizzle-orm";
import { ErrorIngestBody, LogIngestBody } from "./types";
import { InMemoryCache } from "./lib/cache";
import { cors } from "@elysiajs/cors";

function safeDate(date: string | number | Date | undefined): Date | null {
    if (!date) return null;
    try {
        const d = new Date(date);
        return Number.isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

const cache = new InMemoryCache(60);

const app = new Elysia()
    .use(cors())
    .onBeforeHandle(async ({ request, set, body }) => {
        if (new URL(request.url).pathname === "/") {
            return;
        }

        const cachedUser = cache.get(request.headers.get("Authorization") || "");

        if (cachedUser) {
            return cachedUser;
        }

        const authHeader = request.headers.get("Authorization");
        const potentialBody = body as { accessToken?: string };

        const accessToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : potentialBody?.accessToken;

        if (!accessToken) {
            set.status = 401;
            return {
                status: "error",
                message: "Unauthorized. Access token is missing.",
            };
        }

        const userExists = await db.query.user.findFirst({
            columns: { id: true },
            where: eq(user.accessToken, accessToken),
        });

        if (!userExists) {
            set.status = 401;
            return {
                status: "error",
                message: "Unauthorized. Invalid access token.",
            };
        }

        cache.set(request.headers.get("Authorization") || "", userExists);
        return userExists;
    })
    .get("/", () => "Better Analytics API")
    .post("/ingest", async ({ body, request }) => {
        const userAgent = request.headers.get("user-agent") || "";
        const uaResult = UAParser(userAgent);
        const ip = extractIpFromRequest(request);
        const geo = await getGeoData(ip);
        const domainInfo = body.url ? parseDomain(body.url) : null;
        const now = new Date();

        const errorData = {
            id: randomUUID(),
            ...body,
            source: body.source || domainInfo?.domain,
            user_agent: userAgent,
            browser_name: uaResult.browser.name,
            browser_version: uaResult.browser.version,
            os_name: uaResult.os.name,
            os_version: uaResult.os.version,
            device_type: uaResult.device.type || 'desktop',
            ip_address: ip,
            country: geo.country,
            region: geo.region,
            city: geo.city,
            org: geo.org,
            postal: geo.postal,
            loc: geo.loc,
            first_occurrence: safeDate(body.first_occurrence) || now,
            last_occurrence: safeDate(body.last_occurrence) || now,
            resolved_at: safeDate(body.resolved_at),
            created_at: now,
            updated_at: now,
        };

        try {
            await clickhouse.insert({ table: 'errors', values: [errorData], format: 'JSONEachRow' });
            return { status: "success", id: errorData.id };
        } catch (error) {
            logger.error('Failed to ingest error:', error);
            return { status: "error", message: "Failed to process error" };
        }
    }, { body: ErrorIngestBody })
    .post("/log", async ({ body }) => {
        const logData = {
            id: randomUUID(),
            ...body,
            created_at: new Date(),
        };

        try {
            await clickhouse.insert({ table: 'logs', values: [logData], format: 'JSONEachRow' });
            return { status: "success", id: logData.id };
        } catch (error) {
            logger.error('Failed to ingest log:', error);
            return { status: "error", message: "Failed to process log" };
        }
    }, { body: LogIngestBody })
    .onError(({ code, error, set }) => {
        const errorMessage = (error as any)?.message || 'An unknown error occurred';
        logger.error(`[${code}] ${errorMessage}`);
        set.status = 500;
        return {
            status: 'error',
            message: 'An internal error occurred.'
        }
    })
    .listen(process.env.PORT || 4000);

logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);