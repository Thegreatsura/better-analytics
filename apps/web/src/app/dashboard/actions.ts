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

interface NotFoundData {
    id: string;
    client_id: string;
    url: string;
    referrer: string;
    user_agent: string;
    user_id: string;
    session_id: string;
    ip_address: string;
    country: string;
    region: string;
    city: string;
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
        // Get the current user session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const [
            errorCountData,
            logCountData,
            errorsByTypeData,
            errorsBySeverityData
        ] = await Promise.all([
            chQuery<{ count: number }>("SELECT COUNT(*) as count FROM errors WHERE client_id = {clientId:String}", { clientId }),
            chQuery<{ count: number }>("SELECT COUNT(*) as count FROM logs WHERE client_id = {clientId:String}", { clientId }),
            chQuery<{ error_type: string; count: number }>(`
                SELECT 
                    toString(error_type) as error_type,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE error_type IS NOT NULL AND client_id = {clientId:String}
                GROUP BY error_type 
                ORDER BY count DESC
            `, { clientId }),
            chQuery<{ severity: string; count: number }>(`
                SELECT 
                    toString(severity) as severity,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE severity IS NOT NULL AND client_id = {clientId:String}
                GROUP BY severity 
                ORDER BY count DESC
            `, { clientId })
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
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

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
                WHERE created_at >= now() - INTERVAL 14 DAY AND client_id = {clientId:String}
                GROUP BY toDate(created_at)
            ),
            log_data AS (
                SELECT 
                    toDate(created_at) as date,
                    COUNT(*) as total_logs
                FROM logs 
                WHERE created_at >= now() - INTERVAL 14 DAY AND client_id = {clientId:String}
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
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch error vs log trends:', error);
        return { success: false, error: 'Failed to fetch error vs log trends' };
    }
}

export async function getErrorsByEnvironment() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<{
            environment: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE environment IS NOT NULL AND client_id = {clientId:String})
            SELECT 
                environment,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE environment IS NOT NULL AND client_id = {clientId:String}
            GROUP BY environment, total.total_count
            ORDER BY count DESC
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors by environment:', error);
        return { success: false, error: 'Failed to fetch errors by environment' };
    }
}

export async function getLogsByLevel() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<{
            level: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM logs WHERE level IS NOT NULL AND client_id = {clientId:String})
            SELECT 
                toString(level) as level,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM logs, total
            WHERE level IS NOT NULL AND client_id = {clientId:String}
            GROUP BY level, total.total_count
            ORDER BY count DESC
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch logs by level:', error);
        return { success: false, error: 'Failed to fetch logs by level' };
    }
}

export async function getTopErrorUrls() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<{
            url: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE url IS NOT NULL AND client_id = {clientId:String})
            SELECT 
                url,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE url IS NOT NULL AND client_id = {clientId:String}
            GROUP BY url, total.total_count
            ORDER BY count DESC
            LIMIT 25
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch top error URLs:', error);
        return { success: false, error: 'Failed to fetch top error URLs' };
    }
}

export async function getErrorsByBrowser() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<{
            browser_name: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE browser_name IS NOT NULL AND client_id = {clientId:String})
            SELECT 
                browser_name,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE browser_name IS NOT NULL AND client_id = {clientId:String}
            GROUP BY browser_name, total.total_count
            ORDER BY count DESC
            LIMIT 25
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors by browser:', error);
        return { success: false, error: 'Failed to fetch errors by browser' };
    }
}

export async function getErrorsByLocation() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<{
            country: string;
            count: number;
            percentage: number;
        }>(`
            WITH total AS (SELECT COUNT(*) as total_count FROM errors WHERE country IS NOT NULL AND client_id = {clientId:String})
            SELECT 
                country,
                COUNT(*) as count,
                (COUNT(*) * 100.0 / total.total_count) as percentage
            FROM errors, total
            WHERE country IS NOT NULL AND client_id = {clientId:String}
            GROUP BY country, total.total_count
            ORDER BY count DESC
            LIMIT 25
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch errors by location:', error);
        return { success: false, error: 'Failed to fetch errors by location' };
    }
}

function getPeriod(endDate: Date, days: number) {
    const end = new Date(endDate);
    const start = new Date(endDate);
    start.setDate(end.getDate() - days);
    return { start, end };
}

const formatForClickHouse = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

export async function getAnalyticsTrends() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }
        const clientId = session.user.id;

        const today = new Date();
        const last7Days = getPeriod(today, 7);
        const previous7Days = getPeriod(last7Days.start, 7);

        const [
            currentErrorsData,
            previousErrorsData,
            currentLogsData,
            previousLogsData
        ] = await Promise.all([
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM errors WHERE client_id = {clientId:String} AND created_at BETWEEN {start:String} AND {end:String}", { clientId, start: formatForClickHouse(last7Days.start), end: formatForClickHouse(last7Days.end) }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM errors WHERE client_id = {clientId:String} AND created_at BETWEEN {start:String} AND {end:String}", { clientId, start: formatForClickHouse(previous7Days.start), end: formatForClickHouse(previous7Days.end) }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM logs WHERE client_id = {clientId:String} AND created_at BETWEEN {start:String} AND {end:String}", { clientId, start: formatForClickHouse(last7Days.start), end: formatForClickHouse(last7Days.end) }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM logs WHERE client_id = {clientId:String} AND created_at BETWEEN {start:String} AND {end:String}", { clientId, start: formatForClickHouse(previous7Days.start), end: formatForClickHouse(previous7Days.end) }),
        ]);

        const currentErrors = currentErrorsData[0]?.count || 0;
        const previousErrors = previousErrorsData[0]?.count || 0;
        const errorChange = previousErrors === 0 ? (currentErrors > 0 ? 100 : 0) : ((currentErrors - previousErrors) / previousErrors) * 100;

        const currentLogs = currentLogsData[0]?.count || 0;
        const previousLogs = previousLogsData[0]?.count || 0;
        const logChange = previousLogs === 0 ? (currentLogs > 0 ? 100 : 0) : ((currentLogs - previousLogs) / previousLogs) * 100;

        return {
            success: true,
            data: {
                totalErrorsTrend: {
                    current: currentErrors,
                    previous: previousErrors,
                    change: errorChange,
                    currentPeriod: { start: last7Days.start.toISOString(), end: last7Days.end.toISOString() },
                    previousPeriod: { start: previous7Days.start.toISOString(), end: previous7Days.end.toISOString() },
                },
                totalLogsTrend: {
                    current: currentLogs,
                    previous: previousLogs,
                    change: logChange,
                    currentPeriod: { start: last7Days.start.toISOString(), end: last7Days.end.toISOString() },
                    previousPeriod: { start: previous7Days.start.toISOString(), end: previous7Days.end.toISOString() },
                },
            },
        };

    } catch (error) {
        console.error('Failed to fetch analytics trends:', error);
        return { success: false, error: 'Failed to fetch analytics trends' };
    }
}

export const getRecentErrorsChart = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
        const clientId = session.user.id;

        const data = await chQuery<{ hour: number; severity: string; count: number }>(`
            SELECT 
                toHour(created_at) as hour,
                severity,
                toUInt32(COUNT(*)) as count
            FROM errors
            WHERE created_at >= now() - INTERVAL 24 HOUR AND client_id = {clientId:String}
            GROUP BY hour, severity
            ORDER BY hour, severity
        `, { clientId });

        // Transform data into chart format with severity breakdown
        const chartData = Array.from({ length: 24 }, (_, i) => {
            const hourData = data.filter(d => d.hour === i);
            return {
                hour: i,
                critical: hourData.find(d => d.severity === 'critical')?.count || 0,
                high: hourData.find(d => d.severity === 'high')?.count || 0,
                medium: hourData.find(d => d.severity === 'medium')?.count || 0,
                low: hourData.find(d => d.severity === 'low')?.count || 0,
                total: hourData.reduce((sum, d) => sum + d.count, 0)
            };
        });

        return { success: true, data: chartData };
    } catch (error) {
        console.error('Failed to get recent errors chart data:', error);
        return { success: false, error: 'Failed to get recent errors chart data' };
    }
}

export const getNewErrors = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
        const clientId = session.user.id;

        const data = await chQuery<ErrorData>(`
            SELECT * FROM errors
            WHERE status = 'new' AND client_id = {clientId:String}
            ORDER BY created_at DESC
            LIMIT 5
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to get new errors:', error);
        return { success: false, error: 'Failed to get new errors' };
    }
}

export const getTopErrors = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
        const clientId = session.user.id;

        const data = await chQuery<{ name: string, count: number }>(`
            SELECT 
                toString(error_name) as name,
                toUInt32(COUNT(*)) as count
            FROM errors
            WHERE client_id = {clientId:String} AND error_name IS NOT NULL
            GROUP BY name
            ORDER BY count DESC
            LIMIT 5
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to get top errors:', error);
        return { success: false, error: 'Failed to get top errors' };
    }
}

export async function getNotFoundPages() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const clientId = session.user.id;

        const data = await chQuery<NotFoundData>(`
            SELECT
                id,
                client_id,
                url,
                referrer,
                user_agent,
                user_id,
                session_id,
                ip_address,
                country,
                region,
                city,
                created_at
            FROM not_found_pages
            WHERE client_id = {clientId:String}
            ORDER BY created_at DESC
            LIMIT 50
        `, { clientId });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to fetch not found pages:', error);
        return { success: false, error: 'Failed to fetch not found pages' };
    }
}

// Add a unified dashboard data function for consistency
export async function getDashboardData() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }
        const clientId = session.user.id;

        // Define consistent time ranges
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const [
            // All-time totals for overview
            totalErrorsData,
            totalLogsData,

            // Last 7 days for trends
            last7DaysErrorsData,
            previous7DaysErrorsData,
            last7DaysLogsData,
            previous7DaysLogsData,

            // Breakdowns (all-time for consistency with totals)
            errorsByTypeData,
            errorsBySeverityData,

            // Recent data for specific charts
            recentErrorsChartData,
            newErrorsData,
            topErrorsData,

            // Other breakdowns
            topUrlsData,
            topBrowsersData,
            topLocationsData,
            errorVsLogTrendsData,
            notFoundPagesData
        ] = await Promise.all([
            // All-time totals
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM errors WHERE client_id = {clientId:String}", { clientId }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM logs WHERE client_id = {clientId:String}", { clientId }),

            // 7-day trends
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM errors WHERE client_id = {clientId:String} AND created_at >= {start:String}", { clientId, start: formatForClickHouse(last7Days) }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM errors WHERE client_id = {clientId:String} AND created_at >= {start:String} AND created_at < {end:String}", { clientId, start: formatForClickHouse(previous7Days), end: formatForClickHouse(last7Days) }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM logs WHERE client_id = {clientId:String} AND created_at >= {start:String}", { clientId, start: formatForClickHouse(last7Days) }),
            chQuery<{ count: number }>("SELECT toUInt32(COUNT(*)) as count FROM logs WHERE client_id = {clientId:String} AND created_at >= {start:String} AND created_at < {end:String}", { clientId, start: formatForClickHouse(previous7Days), end: formatForClickHouse(last7Days) }),

            // Breakdowns (all-time)
            chQuery<{ error_type: string; count: number }>(`
                SELECT 
                    toString(error_type) as error_type,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE error_type IS NOT NULL AND client_id = {clientId:String}
                GROUP BY error_type 
                ORDER BY count DESC
            `, { clientId }),
            chQuery<{ severity: string; count: number }>(`
                SELECT 
                    toString(severity) as severity,
                    toUInt32(COUNT(*)) as count
                FROM errors 
                WHERE severity IS NOT NULL AND client_id = {clientId:String}
                GROUP BY severity 
                ORDER BY count DESC
            `, { clientId }),

            // Recent errors chart (24 hours)
            chQuery<{ hour: number; severity: string; count: number }>(`
                SELECT 
                    toHour(created_at) as hour,
                    toString(severity) as severity,
                    toUInt32(COUNT(*)) as count
                FROM errors
                WHERE created_at >= {start:String} AND client_id = {clientId:String} AND severity IS NOT NULL
                GROUP BY hour, severity
                ORDER BY hour, severity
            `, { clientId, start: formatForClickHouse(last24Hours) }),

            // New errors (last 24 hours)
            chQuery<ErrorData>(`
                SELECT * FROM errors
                WHERE status = 'new' AND client_id = {clientId:String} AND created_at >= {start:String}
                ORDER BY created_at DESC
                LIMIT 5
            `, { clientId, start: formatForClickHouse(last24Hours) }),

            // Top errors (all-time)
            chQuery<{ name: string, count: number }>(`
                SELECT 
                    toString(error_name) as name,
                    toUInt32(COUNT(*)) as count
                FROM errors
                WHERE client_id = {clientId:String} AND error_name IS NOT NULL
                GROUP BY name
                ORDER BY count DESC
                LIMIT 5
            `, { clientId }),

            // Top URLs (all-time)
            chQuery<{ url: string; count: number; percentage: number }>(`
                WITH total AS (SELECT toUInt32(COUNT(*)) as total_count FROM errors WHERE url IS NOT NULL AND client_id = {clientId:String})
                SELECT 
                    url,
                    toUInt32(COUNT(*)) as count,
                    (COUNT(*) * 100.0 / total.total_count) as percentage
                FROM errors, total
                WHERE url IS NOT NULL AND client_id = {clientId:String}
                GROUP BY url, total.total_count
                ORDER BY count DESC
                LIMIT 25
            `, { clientId }),

            // Top browsers (all-time)
            chQuery<{ browser_name: string; count: number; percentage: number }>(`
                WITH total AS (SELECT toUInt32(COUNT(*)) as total_count FROM errors WHERE browser_name IS NOT NULL AND client_id = {clientId:String})
                SELECT 
                    browser_name,
                    toUInt32(COUNT(*)) as count,
                    (COUNT(*) * 100.0 / total.total_count) as percentage
                FROM errors, total
                WHERE browser_name IS NOT NULL AND client_id = {clientId:String}
                GROUP BY browser_name, total.total_count
                ORDER BY count DESC
                LIMIT 25
            `, { clientId }),

            // Top locations (all-time)
            chQuery<{ country: string; count: number; percentage: number }>(`
                WITH total AS (SELECT toUInt32(COUNT(*)) as total_count FROM errors WHERE country IS NOT NULL AND client_id = {clientId:String})
                SELECT 
                    country,
                    toUInt32(COUNT(*)) as count,
                    (COUNT(*) * 100.0 / total.total_count) as percentage
                FROM errors, total
                WHERE country IS NOT NULL AND client_id = {clientId:String}
                GROUP BY country, total.total_count
                ORDER BY count DESC
                LIMIT 25
            `, { clientId }),

            // Error vs Log trends (14 days)
            chQuery<{ date: string; total_errors: number; total_logs: number }>(`
                WITH date_range AS (
                    SELECT 
                        toDate(now() - INTERVAL number DAY) as date
                    FROM numbers(14)
                ),
                error_data AS (
                    SELECT 
                        toDate(created_at) as date,
                        toUInt32(COUNT(*)) as total_errors
                    FROM errors 
                    WHERE created_at >= now() - INTERVAL 14 DAY AND client_id = {clientId:String}
                    GROUP BY toDate(created_at)
                ),
                log_data AS (
                    SELECT 
                        toDate(created_at) as date,
                        toUInt32(COUNT(*)) as total_logs
                    FROM logs 
                    WHERE created_at >= now() - INTERVAL 14 DAY AND client_id = {clientId:String}
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
            `, { clientId }),

            // Not found pages (all-time)
            chQuery<NotFoundData>(`
                SELECT
                    id,
                    client_id,
                    url,
                    referrer,
                    user_agent,
                    user_id,
                    session_id,
                    ip_address,
                    country,
                    region,
                    city,
                    created_at
                FROM not_found_pages
                WHERE client_id = {clientId:String}
                ORDER BY created_at DESC
                LIMIT 50
            `, { clientId })
        ]);

        // Calculate trends
        const currentErrors = last7DaysErrorsData[0]?.count || 0;
        const previousErrors = previous7DaysErrorsData[0]?.count || 0;
        const errorChange = previousErrors === 0 ? (currentErrors > 0 ? 100 : 0) : ((currentErrors - previousErrors) / previousErrors) * 100;

        const currentLogs = last7DaysLogsData[0]?.count || 0;
        const previousLogs = previous7DaysLogsData[0]?.count || 0;
        const logChange = previousLogs === 0 ? (currentLogs > 0 ? 100 : 0) : ((currentLogs - previousLogs) / previousLogs) * 100;

        // Transform recent errors chart data
        const recentErrorsChartFormatted = Array.from({ length: 24 }, (_, i) => {
            const hourData = recentErrorsChartData.filter(d => d.hour === i);
            return {
                hour: i,
                critical: hourData.find(d => d.severity === 'critical')?.count || 0,
                high: hourData.find(d => d.severity === 'high')?.count || 0,
                medium: hourData.find(d => d.severity === 'medium')?.count || 0,
                low: hourData.find(d => d.severity === 'low')?.count || 0,
                total: hourData.reduce((sum, d) => sum + d.count, 0)
            };
        });

        return {
            success: true,
            data: {
                // All-time totals
                analyticsStats: {
                    totalErrors: totalErrorsData[0]?.count || 0,
                    totalLogs: totalLogsData[0]?.count || 0,
                    errorsByType: errorsByTypeData,
                    errorsBySeverity: errorsBySeverityData,
                },

                // Trends
                analyticsTrends: {
                    totalErrorsTrend: {
                        current: currentErrors,
                        previous: previousErrors,
                        change: errorChange,
                        currentPeriod: { start: last7Days.toISOString(), end: now.toISOString() },
                        previousPeriod: { start: previous7Days.toISOString(), end: last7Days.toISOString() },
                    },
                    totalLogsTrend: {
                        current: currentLogs,
                        previous: previousLogs,
                        change: logChange,
                        currentPeriod: { start: last7Days.toISOString(), end: now.toISOString() },
                        previousPeriod: { start: previous7Days.toISOString(), end: last7Days.toISOString() },
                    },
                },

                // Chart data
                recentErrorsChartData: recentErrorsChartFormatted,
                errorVsLogTrendData: errorVsLogTrendsData,

                // Lists
                newErrorsData: newErrorsData,
                topErrorsData: topErrorsData,
                topUrlsData: topUrlsData,
                topBrowsersData: topBrowsersData,
                topLocationsData: topLocationsData,
                notFoundPages: notFoundPagesData
            }
        };

    } catch (error) {
        console.error('Failed to fetch unified dashboard data:', error);
        return { success: false, error: 'Failed to fetch unified dashboard data' };
    }
}