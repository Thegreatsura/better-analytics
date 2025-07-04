import "./polyfills/compression";
import { Elysia } from "elysia";
import { clickhouse } from "@better-analytics/db/clickhouse";
import { randomUUID } from "node:crypto";
import { UAParser } from "ua-parser-js";
import { parse as parseDomain } from "tldts";
import { logger } from "./lib/logger";
import { extractIpFromRequest, getGeoData } from "./lib/ip-geo";

function sanitizeString(value: any, maxLength = 1000): string {
    if (typeof value !== 'string') return '';
    return value.slice(0, maxLength);
}

const app = new Elysia()
    .get("/", () => "Better Analytics API")
    .post("/ingest", async ({ body, request }: { body: any; request: Request }) => {
        try {
            if (!body?.client_id) {
                return { status: "error", message: "Missing client_id" };
            }

            const userAgent = request.headers.get("user-agent") || "";
            const uaResult = UAParser(userAgent);
            const browser = uaResult.browser;
            const os = uaResult.os;
            const device = uaResult.device;

            const ip = extractIpFromRequest(request);
            const geo = await getGeoData(ip);

            const domainInfo = body.url ? parseDomain(body.url) : null;

            const now = new Date();
            const errorData = {
                id: randomUUID(),
                client_id: sanitizeString(body.client_id, 100),

                error_type: sanitizeString(body.error_type || 'unknown', 50),
                severity: sanitizeString(body.severity || 'medium', 20),

                error_code: sanitizeString(body.error_code, 100),
                error_name: sanitizeString(body.error_name, 200),
                message: sanitizeString(body.message, 2000),
                stack_trace: sanitizeString(body.stack_trace, 5000),

                source: sanitizeString(body.source || domainInfo?.domain, 100),
                environment: sanitizeString(body.environment || 'production', 50),

                user_agent: sanitizeString(userAgent, 500),
                browser_name: sanitizeString(browser.name, 50),
                browser_version: sanitizeString(browser.version, 50),
                os_name: sanitizeString(os.name, 50),
                os_version: sanitizeString(os.version, 50),
                device_type: sanitizeString(device.type || 'desktop', 50),
                viewport_width: body.viewport_width || 0,
                viewport_height: body.viewport_height || 0,
                url: sanitizeString(body.url, 500),
                page_title: sanitizeString(body.page_title, 200),
                referrer: sanitizeString(body.referrer, 500),

                server_name: sanitizeString(body.server_name, 100),
                service_name: sanitizeString(body.service_name, 100),
                service_version: sanitizeString(body.service_version, 50),
                endpoint: sanitizeString(body.endpoint, 200),
                http_method: sanitizeString(body.http_method, 10),
                http_status_code: body.http_status_code || 0,
                request_id: sanitizeString(body.request_id, 100),

                user_id: sanitizeString(body.user_id, 100),
                session_id: sanitizeString(body.session_id, 100),
                ip_address: sanitizeString(ip, 45),
                country: sanitizeString(geo.country, 50),
                region: sanitizeString(geo.region, 100),
                city: sanitizeString(geo.city, 100),
                org: sanitizeString(geo.org, 100),
                postal: sanitizeString(geo.postal, 100),
                loc: sanitizeString(geo.loc, 100),

                response_time_ms: body.response_time_ms || 0,
                memory_usage_mb: body.memory_usage_mb || 0,
                cpu_usage_percent: body.cpu_usage_percent || 0,

                first_occurrence: body.first_occurrence ? new Date(body.first_occurrence) : now,
                last_occurrence: body.last_occurrence ? new Date(body.last_occurrence) : now,
                occurrence_count: body.occurrence_count || 1,

                status: sanitizeString(body.status || 'new', 20),
                resolved_at: body.resolved_at ? new Date(body.resolved_at) : null,
                resolved_by: sanitizeString(body.resolved_by, 100),
                resolution_notes: sanitizeString(body.resolution_notes, 1000),

                custom_data: sanitizeString(body.custom_data, 2000),
                tags: Array.isArray(body.tags) ? body.tags.map((tag: any) => sanitizeString(tag, 50)) : [],

                created_at: now,
                updated_at: now
            };

            await clickhouse.insert({
                table: 'errors',
                values: [errorData],
                format: 'JSONEachRow'
            });

            return { status: "success", id: errorData.id };

        } catch (error) {
            logger.error('Failed to ingest error:', error);
            return { status: "error", message: "Failed to process error" };
        }
    })
    .listen(process.env.PORT || 4000);

logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);