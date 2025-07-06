"use server";

import { chQuery } from "@better-analytics/db/clickhouse";

// Types based on the database schema
interface ErrorData {
    id: string;
    client_id: string;
    error_type: string;
    severity: string;
    error_code: string;
    error_name: string;
    message: string;
    stack_trace: string;
    source: string;
    environment: string;
    user_agent: string;
    browser_name: string;
    browser_version: string;
    os_name: string;
    os_version: string;
    device_type: string;
    viewport_width: number;
    viewport_height: number;
    url: string;
    page_title: string;
    referrer: string;
    server_name: string;
    service_name: string;
    service_version: string;
    endpoint: string;
    http_method: string;
    http_status_code: number;
    request_id: string;
    user_id: string;
    session_id: string;
    ip_address: string;
    country: string;
    region: string;
    city: string;
    org: string;
    postal: string;
    loc: string;
    response_time_ms: number;
    memory_usage_mb: number;
    cpu_usage_percent: number;
    first_occurrence: string;
    last_occurrence: string;
    occurrence_count: number;
    status: string;
    resolved_at: string;
    resolved_by: string;
    resolution_notes: string;
    custom_data: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

interface LogData {
    id: string;
    client_id: string;
    level: string;
    message: string;
    context: string;
    source: string;
    environment: string;
    user_id: string;
    session_id: string;
    tags: string[];
    created_at: string;
}

export async function getRecentErrors() {
    try {
        const data = await chQuery<ErrorData>(`
            SELECT 
                id,
                client_id,
                error_name,
                message,
                severity,
                error_type,
                source,
                environment,
                browser_name,
                os_name,
                country,
                url,
                endpoint,
                http_status_code,
                created_at,
                occurrence_count,
                status
            FROM errors 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors:', error);
        return { success: false, error: 'Failed to fetch errors' };
    }
}

export async function getRecentLogs() {
    try {
        const data = await chQuery<LogData>(`
            SELECT 
                id,
                client_id,
                level,
                message,
                source,
                environment,
                user_id,
                session_id,
                created_at
            FROM logs 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return { success: false, error: 'Failed to fetch logs' };
    }
}

export async function getAnalyticsStats() {
    try {
        const [
            errorCountData,
            logCountData,
            errorsByTypeData,
            errorsBySeverityData
        ] = await Promise.all([
            chQuery<{ count: number }>(`SELECT COUNT(*) as count FROM errors`),
            chQuery<{ count: number }>(`SELECT COUNT(*) as count FROM logs`),
            chQuery<{ error_type: string; count: number }>(`
                SELECT 
                    toString(error_type) as error_type,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE error_type IS NOT NULL
                GROUP BY error_type 
                ORDER BY count DESC
            `),
            chQuery<{ severity: string; count: number }>(`
                SELECT 
                    toString(severity) as severity,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE severity IS NOT NULL
                GROUP BY severity 
                ORDER BY count DESC
            `)
        ]);

        return {
            success: true,
            data: {
                totalErrors: errorCountData[0]?.count || 0,
                totalLogs: logCountData[0]?.count || 0,
                errorsByType: errorsByTypeData,
                errorsBySeverity: errorsBySeverityData,
            }
        };
    } catch (error) {
        console.error('Failed to fetch analytics stats:', error);
        return { success: false, error: 'Failed to fetch analytics stats' };
    }
}

export async function getErrorTrends() {
    try {
        const data = await chQuery<{
            date: string;
            total_errors: number;
            client_errors: number;
            server_errors: number;
        }>(`
            WITH date_range AS (
                SELECT 
                    toDate(now() - INTERVAL number DAY) as date
                FROM numbers(14)
            )
            SELECT 
                date_range.date as date,
                COALESCE(error_data.total_errors, 0) as total_errors,
                COALESCE(error_data.client_errors, 0) as client_errors,
                COALESCE(error_data.server_errors, 0) as server_errors
            FROM date_range
            LEFT JOIN (
                SELECT 
                    toDate(created_at) as date,
                    COUNT(*) as total_errors,
                    countIf(error_type = 'client') as client_errors,
                    countIf(error_type = 'server') as server_errors
                FROM errors 
                WHERE created_at >= now() - INTERVAL 14 DAY
                GROUP BY toDate(created_at)
            ) error_data ON date_range.date = error_data.date
            ORDER BY date ASC
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch error trends:', error);
        return { success: false, error: 'Failed to fetch error trends' };
    }
}

export async function getErrorMetrics() {
    try {
        const [
            totalErrorsData,
            errorRateData,
            avgResolutionTimeData,
            systemHealthData
        ] = await Promise.all([
            chQuery<{ count: number }>(`
                SELECT COUNT(*) as count 
                FROM errors 
                WHERE created_at >= now() - INTERVAL 24 HOUR
            `),
            chQuery<{ error_rate: number }>(`
                SELECT 
                    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM logs WHERE created_at >= now() - INTERVAL 24 HOUR)) as error_rate
                FROM errors 
                WHERE created_at >= now() - INTERVAL 24 HOUR
            `),
            chQuery<{ avg_resolution_hours: number }>(`
                SELECT 
                    AVG(dateDiff('hour', created_at, resolved_at)) as avg_resolution_hours
                FROM errors 
                WHERE resolved_at IS NOT NULL 
                AND created_at >= now() - INTERVAL 7 DAY
            `),
            chQuery<{ health_score: number }>(`
                SELECT 
                    (100.0 - (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM logs WHERE created_at >= now() - INTERVAL 24 HOUR))) as health_score
                FROM errors 
                WHERE severity IN ('high', 'critical') 
                AND created_at >= now() - INTERVAL 24 HOUR
            `)
        ]);

        return {
            success: true,
            data: {
                totalErrors: totalErrorsData[0]?.count || 0,
                errorRate: errorRateData[0]?.error_rate || 0,
                avgResolutionTime: avgResolutionTimeData[0]?.avg_resolution_hours || 0,
                systemHealth: systemHealthData[0]?.health_score || 100,
            }
        };
    } catch (error) {
        console.error('Failed to fetch error metrics:', error);
        return { success: false, error: 'Failed to fetch error metrics' };
    }
}

export async function getTopErrors() {
    try {
        const data = await chQuery<{
            error_name: string;
            message: string;
            error_type: string;
            severity: string;
            count: number;
            last_occurrence: string;
        }>(`
            SELECT 
                error_name,
                message,
                error_type,
                severity,
                COUNT(*) as count,
                MAX(created_at) as last_occurrence
            FROM errors 
            WHERE created_at >= now() - INTERVAL 7 DAY
            GROUP BY error_name, message, error_type, severity
            ORDER BY count DESC
            LIMIT 10
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch top errors:', error);
        return { success: false, error: 'Failed to fetch top errors' };
    }
}

export async function getErrorsByEnvironment() {
    try {
        const data = await chQuery<{
            environment: string;
            count: number;
            percentage: number;
        }>(`
            SELECT 
                environment,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM errors)) as percentage
            FROM errors 
            WHERE environment IS NOT NULL
            GROUP BY environment
            ORDER BY count DESC
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors by environment:', error);
        return { success: false, error: 'Failed to fetch errors by environment' };
    }
}

export async function getLogsByLevel() {
    try {
        const data = await chQuery<{
            level: string;
            count: number;
            percentage: number;
        }>(`
            SELECT 
                level,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM logs)) as percentage
            FROM logs 
            WHERE level IS NOT NULL
            GROUP BY level
            ORDER BY count DESC
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch logs by level:', error);
        return { success: false, error: 'Failed to fetch logs by level' };
    }
}

export async function getDebugInfo() {
    try {
        const [
            totalErrorsData,
            totalLogsData,
            sampleErrorsData,
            severityCountData,
            errorTypeCountData
        ] = await Promise.all([
            chQuery<{ count: number }>(`SELECT COUNT(*) as count FROM errors`),
            chQuery<{ count: number }>(`SELECT COUNT(*) as count FROM logs`),
            chQuery<{ id: string; severity: string; error_type: string; created_at: string }>(`
                SELECT id, toString(severity) as severity, toString(error_type) as error_type, created_at
                FROM errors 
                LIMIT 5
            `),
            chQuery<{ severity: string; count: number }>(`
                SELECT 
                    toString(severity) as severity,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE severity IS NOT NULL
                GROUP BY severity
            `),
            chQuery<{ error_type: string; count: number }>(`
                SELECT 
                    toString(error_type) as error_type,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE error_type IS NOT NULL
                GROUP BY error_type
            `)
        ]);

        return {
            success: true,
            data: {
                totalErrors: totalErrorsData[0]?.count || 0,
                totalLogs: totalLogsData[0]?.count || 0,
                sampleErrors: sampleErrorsData,
                severityBreakdown: severityCountData,
                errorTypeBreakdown: errorTypeCountData,
            }
        };
    } catch (error) {
        console.error('Failed to fetch debug info:', error);
        return { success: false, error: 'Failed to fetch debug info' };
    }
} 