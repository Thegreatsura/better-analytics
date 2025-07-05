import { t } from "elysia";

export const ErrorType = t.Enum({
    client: "client",
    server: "server",
    network: "network",
    database: "database",
    validation: "validation",
    auth: "auth",
    business: "business",
    unknown: "unknown",
});

export const Severity = t.Enum({
    low: "low",
    medium: "medium",
    high: "high",
    critical: "critical",
});

export const Status = t.Enum({
    new: "new",
    investigating: "investigating",
    resolved: "resolved",
    ignored: "ignored",
    recurring: "recurring",
});

const BaseIngestBody = {
    client_id: t.String({ maxLength: 100 }),
    source: t.Optional(t.String({ maxLength: 100 })),
    environment: t.Optional(t.String({ maxLength: 50 })),
    user_id: t.Optional(t.String({ maxLength: 100 })),
    session_id: t.Optional(t.String({ maxLength: 100 })),
    tags: t.Optional(t.Array(t.String({ maxLength: 50 }))),
    accessToken: t.Optional(t.String()),
};

export const ErrorIngestBody = t.Object({
    ...BaseIngestBody,
    error_type: t.Optional(ErrorType),
    severity: t.Optional(Severity),
    error_code: t.Optional(t.String({ maxLength: 100 })),
    error_name: t.Optional(t.String({ maxLength: 200 })),
    message: t.String({ maxLength: 2000 }),
    stack_trace: t.Optional(t.String({ maxLength: 5000 })),
    url: t.String({ maxLength: 500 }),
    page_title: t.Optional(t.String({ maxLength: 200 })),
    referrer: t.Optional(t.String({ maxLength: 500 })),
    browser_name: t.Optional(t.String({ maxLength: 100 })),
    browser_version: t.Optional(t.String({ maxLength: 50 })),
    os_name: t.Optional(t.String({ maxLength: 50 })),
    os_version: t.Optional(t.String({ maxLength: 50 })),
    device_type: t.Optional(t.String({ maxLength: 50 })),
    server_name: t.Optional(t.String({ maxLength: 100 })),
    service_name: t.Optional(t.String({ maxLength: 100 })),
    service_version: t.Optional(t.String({ maxLength: 50 })),
    endpoint: t.Optional(t.String({ maxLength: 200 })),
    http_method: t.Optional(t.String({ maxLength: 10 })),
    http_status_code: t.Optional(t.Number()),
    request_id: t.Optional(t.String({ maxLength: 100 })),
    response_time_ms: t.Optional(t.Number()),
    memory_usage_mb: t.Optional(t.Number()),
    cpu_usage_percent: t.Optional(t.Number()),
    first_occurrence: t.Optional(t.Union([t.String(), t.Date(), t.Number()])),
    last_occurrence: t.Optional(t.Union([t.String(), t.Date(), t.Number()])),
    occurrence_count: t.Optional(t.Number()),
    status: t.Optional(Status),
    resolved_at: t.Optional(t.Union([t.String(), t.Date(), t.Number()])),
    resolved_by: t.Optional(t.String({ maxLength: 100 })),
    resolution_notes: t.Optional(t.String({ maxLength: 1000 })),
    custom_data: t.Optional(t.String({ maxLength: 2000 })),
    viewport_width: t.Optional(t.Number()),
    viewport_height: t.Optional(t.Number()),
    connection_type: t.Optional(t.String({ maxLength: 50 })),
    connection_effective_type: t.Optional(t.String({ maxLength: 50 })),
    connection_downlink: t.Optional(t.Number()),
    connection_rtt: t.Optional(t.Number()),
    device_memory: t.Optional(t.Number()),
    device_cpu_cores: t.Optional(t.Number()),
});

export const LogIngestBody = t.Object({
    ...BaseIngestBody,
    level: t.Optional(t.String({ maxLength: 20 })),
    message: t.String({ maxLength: 5000 }),
    context: t.Optional(t.String({ maxLength: 5000 })),
});

export type ErrorIngest = (typeof ErrorIngestBody)["static"];
export type LogIngest = (typeof LogIngestBody)["static"]; 