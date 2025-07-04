/**
 * Error data structure for Better Analytics
 */
export interface ErrorData {
    /** Required client ID for multi-tenant support */
    client_id: string;

    /** Type of error */
    error_type?: 'client' | 'server' | 'network' | 'database' | 'validation' | 'auth' | 'business' | 'unknown';

    /** Severity level */
    severity?: 'low' | 'medium' | 'high' | 'critical';

    /** Error identification */
    error_code?: string;
    error_name?: string;
    message?: string;
    stack_trace?: string;

    /** Context information */
    source?: string;
    environment?: 'development' | 'staging' | 'production';

    /** Browser/Device info (auto-detected on client-side) */
    user_agent?: string;
    browser_name?: string;
    browser_version?: string;
    os_name?: string;
    os_version?: string;
    device_type?: string;
    viewport_width?: number;
    viewport_height?: number;

    /** Page information (client-side) */
    url?: string;
    page_title?: string;
    referrer?: string;

    /** Server information (server-side) */
    server_name?: string;
    service_name?: string;
    service_version?: string;
    endpoint?: string;
    http_method?: string;
    http_status_code?: number;
    request_id?: string;
    node_version?: string;
    process_id?: number;

    /** User identification */
    user_id?: string;
    session_id?: string;

    /** Performance metrics */
    response_time_ms?: number;
    memory_usage_mb?: number;
    cpu_usage_percent?: number;

    /** Error status and metadata */
    status?: 'new' | 'investigating' | 'resolved' | 'ignored';
    custom_data?: string;
    tags?: string[];
}

/**
 * SDK configuration options
 */
export interface SDKConfig {
    /** API endpoint URL */
    apiUrl: string;

    /** Client ID for authentication */
    clientId: string;

    /** Environment (defaults to 'production') */
    environment?: 'development' | 'staging' | 'production';

    /** Enable debug logging (defaults to false) */
    debug?: boolean;

    /** Auto-capture unhandled errors (defaults to false) */
    autoCapture?: boolean;

    /** Maximum retry attempts (defaults to 3) */
    maxRetries?: number;

    /** Retry delay in milliseconds (defaults to 1000) */
    retryDelay?: number;

    /** Server hostname (auto-detected on server-side) */
    serverName?: string;

    /** Service name */
    serviceName?: string;

    /** Service version */
    serviceVersion?: string;

    /** Force server/client mode (auto-detected if not provided) */
    isServer?: boolean;
}

/**
 * Internal SDK configuration with all required fields
 */
export interface InternalSDKConfig extends Required<Omit<SDKConfig, 'serverName' | 'serviceName' | 'serviceVersion'>> {
    serverName?: string;
    serviceName?: string;
    serviceVersion?: string;
}

/**
 * API response structure
 */
export interface SDKResponse {
    status: 'success' | 'error';
    id?: string;
    message?: string;
}

/**
 * Server-side request context
 */
export interface RequestContext {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    ip?: string;
    userAgent?: string;
}

/**
 * Server-side response context
 */
export interface ResponseContext {
    statusCode?: number;
    headers?: Record<string, string>;
}

/**
 * Complete server context for error reporting
 */
export interface ServerErrorContext {
    req?: RequestContext;
    res?: ResponseContext;
    requestId?: string;
    userId?: string;
} 