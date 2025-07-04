import { clickhouse } from "@better-analytics/db/clickhouse";

const errorTable = `
CREATE TABLE IF NOT EXISTS errors (
    id UUID PRIMARY KEY,
    
    error_type Enum8('client' = 1, 'server' = 2, 'network' = 3, 'database' = 4, 'validation' = 5, 'auth' = 6, 'business' = 7, 'unknown' = 8),
    severity Enum8('low' = 1, 'medium' = 2, 'high' = 3, 'critical' = 4),
    
    error_code LowCardinality(String),
    error_name LowCardinality(String),
    message String,
    stack_trace String,
    
    source LowCardinality(String),
    environment LowCardinality(String),
    
    user_agent String,
    browser_name LowCardinality(String),
    browser_version LowCardinality(String),
    os_name LowCardinality(String),
    os_version LowCardinality(String),
    device_type LowCardinality(String),
    viewport_width UInt16,
    viewport_height UInt16,
    url String,
    page_title String,
    referrer String,
    
    server_name LowCardinality(String),
    service_name LowCardinality(String),
    service_version LowCardinality(String),
    endpoint String,
    http_method LowCardinality(String),
    http_status_code UInt16,
    request_id String,
    
    user_id String,
    session_id String,
    ip_address IPv4,
    country LowCardinality(String),
    region LowCardinality(String),
    city LowCardinality(String),
    org LowCardinality(String),
    postal LowCardinality(String),
    loc LowCardinality(String),
    
    response_time_ms UInt32,
    memory_usage_mb Float32,
    cpu_usage_percent Float32,
    
    first_occurrence DateTime64(3) DEFAULT now64(),
    last_occurrence DateTime64(3) DEFAULT now64(),
    occurrence_count UInt32 DEFAULT 1,
    
    status Enum8('new' = 1, 'investigating' = 2, 'resolved' = 3, 'ignored' = 4, 'recurring' = 5),
    resolved_at DateTime64(3),
    resolved_by String,
    resolution_notes String,
    
    custom_data String,
    tags Array(String),
    
    created_at DateTime64(3) DEFAULT now64(),
    updated_at DateTime64(3) DEFAULT now64(),
    client_id LowCardinality(String)
) 
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (id, error_type, severity, created_at)
SETTINGS index_granularity = 8192;
`;

const errorIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_errors_user_id ON errors (user_id) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_session_id ON errors (session_id) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_url ON errors (url) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_endpoint ON errors (endpoint) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_message ON errors (message) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_stack_trace ON errors (stack_trace) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_tags ON errors (tags) TYPE bloom_filter GRANULARITY 1;',
    'CREATE INDEX IF NOT EXISTS idx_errors_client_id ON errors (client_id) TYPE bloom_filter GRANULARITY 1;',
];

const errorSummaryView = `
CREATE VIEW IF NOT EXISTS error_summary AS
SELECT 
    client_id,
    error_type,
    severity,
    error_code,
    error_name,
    source,
    environment,
    COUNT(*) as total_occurrences,
    SUM(occurrence_count) as total_count,
    MIN(first_occurrence) as first_seen,
    MAX(last_occurrence) as last_seen,
    AVG(response_time_ms) as avg_response_time,
    countIf(status = 'resolved') as resolved_count,
    countIf(status = 'new') as new_count,
    countIf(created_at >= now() - INTERVAL 1 DAY) as last_24h_count,
    countIf(created_at >= now() - INTERVAL 7 DAY) as last_7d_count,
    countIf(created_at >= now() - INTERVAL 30 DAY) as last_30d_count
FROM errors
GROUP BY client_id, error_type, severity, error_code, error_name, source, environment
ORDER BY total_occurrences DESC;
`;

const userErrorSummaryView = `
CREATE VIEW IF NOT EXISTS user_error_summary AS
SELECT 
    client_id,
    user_id,
    COUNT(*) as total_errors,
    COUNT(DISTINCT error_code) as unique_error_types,
    MAX(created_at) as last_error_time,
    AVG(response_time_ms) as avg_response_time,
    groupArray(DISTINCT error_type) as error_types,
    groupArray(DISTINCT severity) as severities
FROM errors
WHERE user_id != ''
GROUP BY client_id, user_id
ORDER BY total_errors DESC;
`;

async function initializeDatabase() {
    try {
        await clickhouse.exec({ query: 'DROP VIEW IF EXISTS error_summary;' });
        await clickhouse.exec({ query: 'DROP VIEW IF EXISTS user_error_summary;' });
        await clickhouse.exec({ query: 'DROP TABLE IF EXISTS errors;' });

        await clickhouse.exec({ query: errorTable });

        for (const index of errorIndexes) {
            await clickhouse.exec({ query: index });
        }

        await clickhouse.exec({ query: errorSummaryView });
        await clickhouse.exec({ query: userErrorSummaryView });

    } catch (error) {
        console.error(error);
        throw error;
    }
}

initializeDatabase();