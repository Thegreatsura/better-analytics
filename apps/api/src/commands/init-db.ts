import { clickhouse } from "@better-analytics/db/clickhouse";

const errorTable = `
CREATE TABLE IF NOT EXISTS errors (
    id UUID PRIMARY KEY,
    
    error_type Nullable(Enum8('client' = 1, 'server' = 2, 'network' = 3, 'database' = 4, 'validation' = 5, 'auth' = 6, 'business' = 7, 'unknown' = 8)),
    severity Nullable(Enum8('low' = 1, 'medium' = 2, 'high' = 3, 'critical' = 4)),
    
    error_code LowCardinality(Nullable(String)),
    error_name LowCardinality(Nullable(String)),
    message Nullable(String),
    stack_trace Nullable(String),
    
    source LowCardinality(Nullable(String)),
    environment LowCardinality(Nullable(String)),
    
    user_agent Nullable(String),
    browser_name LowCardinality(Nullable(String)),
    browser_version LowCardinality(Nullable(String)),
    os_name LowCardinality(Nullable(String)),
    os_version LowCardinality(Nullable(String)),
    device_type LowCardinality(Nullable(String)),
    viewport_width Nullable(UInt16),
    viewport_height Nullable(UInt16),
    
    connection_type LowCardinality(Nullable(String)),
    connection_effective_type LowCardinality(Nullable(String)),
    connection_downlink Nullable(Float32),
    connection_rtt Nullable(UInt32),
    device_memory Nullable(UInt8),
    device_cpu_cores Nullable(UInt8),

    url Nullable(String),
    page_title Nullable(String),
    referrer Nullable(String),
    
    server_name LowCardinality(Nullable(String)),
    service_name LowCardinality(Nullable(String)),
    service_version LowCardinality(Nullable(String)),
    endpoint Nullable(String),
    http_method LowCardinality(Nullable(String)),
    http_status_code Nullable(UInt16),
    request_id Nullable(String),
    
    user_id Nullable(String),
    session_id Nullable(String),
    ip_address Nullable(String),
    country LowCardinality(Nullable(String)),
    region LowCardinality(Nullable(String)),
    city LowCardinality(Nullable(String)),
    org LowCardinality(Nullable(String)),
    postal LowCardinality(Nullable(String)),
    loc LowCardinality(Nullable(String)),
    
    response_time_ms Nullable(UInt32),
    memory_usage_mb Nullable(Float32),
    cpu_usage_percent Nullable(Float32),
    
    first_occurrence DateTime64(3) DEFAULT now64(),
    last_occurrence DateTime64(3) DEFAULT now64(),
    occurrence_count UInt32 DEFAULT 1,
    
    status Nullable(Enum8('new' = 1, 'investigating' = 2, 'resolved' = 3, 'ignored' = 4, 'recurring' = 5)),
    resolved_at Nullable(DateTime64(3)),
    resolved_by Nullable(String),
    resolution_notes Nullable(String),
    
    custom_data Nullable(String),
    tags Array(String),
    
    created_at DateTime64(3) DEFAULT now64(),
    updated_at DateTime64(3) DEFAULT now64(),
    client_id LowCardinality(String)
) 
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (id, error_type, severity, created_at)
SETTINGS index_granularity = 8192, allow_nullable_key = 1;
`;

const logsTable = `
CREATE TABLE IF NOT EXISTS logs (
    id UUID,
    client_id LowCardinality(String),
    level Nullable(Enum8('log' = 1, 'info' = 2, 'warn' = 3, 'error' = 4, 'debug' = 5, 'trace' = 6)),
    message String,
    context Nullable(String), 
    source LowCardinality(Nullable(String)),
    environment LowCardinality(Nullable(String)),
    user_id Nullable(String),
    session_id Nullable(String),
    tags Array(String),
    created_at DateTime64(3) DEFAULT now64()
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (client_id, level, created_at)
SETTINGS index_granularity = 8192, allow_nullable_key = 1;
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
    console.log("Dropping existing tables and views to apply new schema...");
    await Promise.all([
        clickhouse.exec({ query: 'DROP VIEW IF EXISTS error_summary;' }),
        clickhouse.exec({ query: 'DROP VIEW IF EXISTS user_error_summary;' }),
        clickhouse.exec({ query: 'DROP TABLE IF EXISTS errors;' }),
        clickhouse.exec({ query: 'DROP TABLE IF EXISTS logs;' }),
    ]);
    console.log("Tables and views dropped.");

    console.log("Creating tables with new schema...");
    await Promise.all([
        clickhouse.exec({ query: errorTable }),
        clickhouse.exec({ query: logsTable }),
    ]);
    console.log("Tables created.");

    console.log("Creating indexes...");
    await Promise.all(
        errorIndexes.map((indexQuery) =>
            clickhouse.exec({ query: indexQuery })
        )
    );
    console.log("Indexes created.");

    console.log("Creating views...");
    await Promise.all([
        clickhouse.exec({ query: errorSummaryView }),
        clickhouse.exec({ query: userErrorSummaryView }),
    ]);
    console.log("Views created.");
}

async function run() {
    try {
        await initializeDatabase();
        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
    }
}

run();