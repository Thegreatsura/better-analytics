export interface ErrorData {
    client_id: string;
    error_type?: 'client' | 'server' | 'network' | 'database' | 'validation' | 'auth' | 'business' | 'unknown';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    error_code?: string;
    error_name?: string;
    message?: string;
    stack_trace?: string;
    source?: string;
    environment?: 'development' | 'staging' | 'production' | string;
    user_agent?: string;
    browser_name?: string;
    browser_version?: string;
    os_name?: string;
    os_version?: string;
    device_type?: string;
    viewport_width?: number;
    viewport_height?: number;
    connection_type?: string;
    connection_effective_type?: string;
    connection_downlink?: number;
    connection_rtt?: number;
    device_memory?: number;
    device_cpu_cores?: number;
    url?: string;
    page_title?: string;
    referrer?: string;
    server_name?: string;
    service_name?: string;
    service_version?: string;
    endpoint?: string;
    http_method?: string;
    http_status_code?: number;
    request_id?: string;
    node_version?: string;
    process_id?: number;
    user_id?: string;
    session_id?: string;
    response_time_ms?: number;
    memory_usage_mb?: number;
    cpu_usage_percent?: number;
    status?: 'new' | 'investigating' | 'resolved' | 'ignored' | 'recurring';
    occurrence_count?: number;
    first_occurrence?: Date | string | number;
    last_occurrence?: Date | string | number;
    resolved_at?: Date | string | number;
    resolved_by?: string;
    resolution_notes?: string;
    custom_data?: string | Record<string, any>;
    tags?: string[];
}

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';

export interface LogData {
    client_id: string;
    level: LogLevel;
    message: string;
    context?: string | Record<string, any>;
    source?: string;
    environment?: 'development' | 'staging' | 'production' | string;
    user_id?: string;
    session_id?: string;
    tags?: string[];
}

export interface SDKConfig {
    apiUrl: string;
    clientId: string;
    accessToken?: string;
    environment?: 'development' | 'staging' | 'production' | string;
    debug?: boolean;
    autoCapture?: boolean;
    autoLog?: boolean;
    logLevel?: LogLevel;
    maxRetries?: number;
    retryDelay?: number;
    serverName?: string;
    serviceName?: string;
    serviceVersion?: string;
    isServer?: boolean;
}

export interface InternalSDKConfig
    extends Required<
        Omit<
            SDKConfig,
            "serverName" | "serviceName" | "serviceVersion" | "accessToken"
        >
    > {
    serverName?: string;
    serviceName?: string;
    serviceVersion?: string;
    accessToken?: string;
}

export interface SDKResponse {
    success: boolean;
    id?: string;
    message?: string;
}

export interface RequestContext {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    ip?: string;
    userAgent?: string;
}

export interface ResponseContext {
    statusCode?: number;
    headers?: Record<string, string>;
}

export interface ServerErrorContext {
    req?: RequestContext;
    res?: ResponseContext;
    requestId?: string;
    userId?: string;
} 