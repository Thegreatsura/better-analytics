import { t } from "elysia";

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
    error_type: t.Optional(t.String({ maxLength: 50 })),
    severity: t.Optional(t.String({ maxLength: 20 })),
    error_code: t.Optional(t.String({ maxLength: 100 })),
    error_name: t.Optional(t.String({ maxLength: 200 })),
    message: t.Optional(t.String({ maxLength: 2000 })),
    stack_trace: t.Optional(t.String({ maxLength: 5000 })),
    url: t.Optional(t.String({ maxLength: 500 })),
    page_title: t.Optional(t.String({ maxLength: 200 })),
    referrer: t.Optional(t.String({ maxLength: 500 })),
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
    status: t.Optional(t.String({ maxLength: 20 })),
    resolved_at: t.Optional(t.Union([t.String(), t.Date(), t.Number()])),
    resolved_by: t.Optional(t.String({ maxLength: 100 })),
    resolution_notes: t.Optional(t.String({ maxLength: 1000 })),
    custom_data: t.Optional(t.String({ maxLength: 2000 })),
    viewport_width: t.Optional(t.Number()),
    viewport_height: t.Optional(t.Number()),
});

export const LogIngestBody = t.Object({
    ...BaseIngestBody,
    level: t.Optional(t.String({ maxLength: 20 })),
    message: t.String({ maxLength: 5000 }),
    context: t.Optional(t.String({ maxLength: 5000 })),
});

export type ErrorIngest = (typeof ErrorIngestBody)["static"];
export type LogIngest = (typeof LogIngestBody)["static"]; 