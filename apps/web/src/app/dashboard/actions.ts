"use server";

import { chQuery } from "@better-analytics/db/clickhouse";
import { auth } from "@better-analytics/auth";
import { headers } from "next/headers";

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
        // Get the current user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<ErrorData>(`
            SELECT 
                id,
                client_id,
                error_name,
                message,
                stack_trace,
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
                user_id,
                session_id,
                custom_data,
                created_at,
                occurrence_count,
                status
            FROM errors 
            WHERE client_id = {clientId:String}
            ORDER BY created_at DESC 
            LIMIT 50
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors:', error);
        return { success: false, error: 'Failed to fetch errors' };
    }
}

export async function getRecentLogs() {
    try {
        // Get the current user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<LogData>(`
            SELECT 
                id,
                client_id,
                level,
                message,
                context,
                source,
                environment,
                user_id,
                session_id,
                tags,
                created_at
            FROM logs 
            WHERE client_id = {clientId:String}
            ORDER BY created_at DESC 
            LIMIT 50
        `, { clientId });

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
            chQuery<{ count: number }>("SELECT COUNT(*) as count FROM errors"),
            chQuery<{ count: number }>("SELECT COUNT(*) as count FROM logs"),
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

export async function getErrorVsLogTrends() {
    try {
        const data = await chQuery<{
            date: string;
            total_errors: number;
            total_logs: number;
        }>(`
            WITH date_range AS (
                SELECT 
                    toDate(now() - INTERVAL number DAY) as date
                FROM numbers(14)
            ),
            error_data AS (
                SELECT 
                    toDate(created_at) as date,
                    COUNT(*) as total_errors
                FROM errors 
                WHERE created_at >= now() - INTERVAL 14 DAY
                GROUP BY toDate(created_at)
            ),
            log_data AS (
                SELECT 
                    toDate(created_at) as date,
                    COUNT(*) as total_logs
                FROM logs 
                WHERE created_at >= now() - INTERVAL 14 DAY
                GROUP BY toDate(created_at)
            )
            SELECT 
                date_range.date as date,
                COALESCE(error_data.total_errors, 0) as total_errors,
                COALESCE(log_data.total_logs, 0) as total_logs
            FROM date_range
            LEFT JOIN error_data ON date_range.date = error_data.date
            LEFT JOIN log_data ON date_range.date = log_data.date
            ORDER BY date ASC
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch error vs log trends:', error);
        return { success: false, error: 'Failed to fetch error vs log trends' };
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
                toString(level) as level,
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

export async function getTopErrorUrls() {
    try {
        const data = await chQuery<{
            url: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE url IS NOT NULL)
            SELECT 
                url,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE url IS NOT NULL
            GROUP BY url, total.total_count
            ORDER BY count DESC
            LIMIT 10
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch top error URLs:', error);
        return { success: false, error: 'Failed to fetch top error URLs' };
    }
}

export async function getErrorsByBrowser() {
    try {
        const data = await chQuery<{
            browser_name: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE browser_name IS NOT NULL)
            SELECT 
                browser_name,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE browser_name IS NOT NULL
            GROUP BY browser_name, total.total_count
            ORDER BY count DESC
            LIMIT 10
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors by browser:', error);
        return { success: false, error: 'Failed to fetch errors by browser' };
    }
}

export async function getErrorsByLocation() {
    try {
        const data = await chQuery<{
            country: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE country IS NOT NULL)
            SELECT 
                country,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE country IS NOT NULL
            GROUP BY country, total.total_count
            ORDER BY count DESC
            LIMIT 10
        `);

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors by location:', error);
        return { success: false, error: 'Failed to fetch errors by location' };
    }
}