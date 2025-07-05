"use server";

import { clickhouse } from "@better-analytics/db/clickhouse";

export async function getRecentErrors() {
    try {
        const result = await clickhouse.query({
            query: `
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
                    created_at,
                    occurrence_count,
                    status
                FROM errors 
                ORDER BY created_at DESC 
                LIMIT 50
            `,
            format: 'JSONEachRow',
        });

        const rows = await result.json();
        return { success: true, data: rows };
    } catch (error) {
        console.error('Failed to fetch errors:', error);
        return { success: false, error: 'Failed to fetch errors' };
    }
}

export async function getRecentLogs() {
    try {
        const result = await clickhouse.query({
            query: `
                SELECT 
                    id,
                    client_id,
                    level,
                    message,
                    source,
                    environment,
                    created_at
                FROM logs 
                ORDER BY created_at DESC 
                LIMIT 50
            `,
            format: 'JSONEachRow',
        });

        const rows = await result.json();
        return { success: true, data: rows };
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return { success: false, error: 'Failed to fetch logs' };
    }
}

export async function getAnalyticsStats() {
    try {
        const errorCountResult = await clickhouse.query({
            query: `SELECT COUNT(*) as count FROM errors`,
            format: 'JSONEachRow',
        });

        const logCountResult = await clickhouse.query({
            query: `SELECT COUNT(*) as count FROM logs`,
            format: 'JSONEachRow',
        });

        const errorsByTypeResult = await clickhouse.query({
            query: `
                SELECT 
                    error_type,
                    COUNT(*) as count
                FROM errors 
                GROUP BY error_type 
                ORDER BY count DESC
            `,
            format: 'JSONEachRow',
        });

        const errorsBySeverityResult = await clickhouse.query({
            query: `
                SELECT 
                    severity,
                    COUNT(*) as count
                FROM errors 
                GROUP BY severity 
                ORDER BY count DESC
            `,
            format: 'JSONEachRow',
        });

        const errorCount = await errorCountResult.json() as { count: number }[];
        const logCount = await logCountResult.json() as { count: number }[];
        const errorsByType = await errorsByTypeResult.json() as { error_type: string; count: number }[];
        const errorsBySeverity = await errorsBySeverityResult.json() as { severity: string; count: number }[];

        return {
            success: true,
            data: {
                totalErrors: errorCount[0]?.count || 0,
                totalLogs: logCount[0]?.count || 0,
                errorsByType,
                errorsBySeverity,
            }
        };
    } catch (error) {
        console.error('Failed to fetch analytics stats:', error);
        return { success: false, error: 'Failed to fetch analytics stats' };
    }
} 