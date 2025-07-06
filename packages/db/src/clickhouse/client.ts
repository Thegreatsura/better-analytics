import env from "@better-analytics/db/env";

import { createClient as createClickHouseClient } from "@clickhouse/client";

export const clickhouse = createClickHouseClient({
    url: env.CLICKHOUSE_URL,
});

/**
 * Execute a ClickHouse query and return JSON results
 * @param query - SQL query string
 * @param params - Query parameters for parameterized queries
 * @returns Promise with query results as JSON
 */
export async function chQuery<T = any>(
    query: string,
    params?: Record<string, any>
): Promise<T[]> {
    try {
        const result = await clickhouse.query({
            query,
            query_params: params,
            format: 'JSONEachRow',
        });

        const data = await result.json();
        return data as T[];
    } catch (error) {
        console.error('ClickHouse query error:', {
            query,
            params,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
}

/**
 * Execute a ClickHouse query and return a single row
 * @param query - SQL query string
 * @param params - Query parameters for parameterized queries
 * @returns Promise with single row result or null
 */
export async function chQueryOne<T = any>(
    query: string,
    params?: Record<string, any>
): Promise<T | null> {
    const results = await chQuery<T>(query, params);
    return results.length > 0 ? results[0] ?? null : null;
}

/**
 * Execute a ClickHouse query and return the count
 * @param query - SQL query string (should use COUNT())
 * @param params - Query parameters for parameterized queries
 * @returns Promise with count as number
 */
export async function chQueryCount(
    query: string,
    params?: Record<string, any>
): Promise<number> {
    const result = await chQueryOne<{ count: string }>(query, params);
    return result ? Number.parseInt(result.count, 10) : 0;
}

/**
 * Execute a ClickHouse INSERT statement
 * @param table - Table name
 * @param data - Data to insert (array of objects)
 * @returns Promise with insert result
 */
export async function chInsert<T = any>(
    table: string,
    data: T[]
): Promise<void> {
    try {
        await clickhouse.insert({
            table,
            values: data,
            format: 'JSONEachRow',
        });
    } catch (error) {
        console.error('ClickHouse insert error:', {
            table,
            dataCount: data.length,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
}

/**
 * Execute a raw ClickHouse command (for DDL, etc.)
 * @param command - SQL command string
 * @returns Promise with command result
 */
export async function chCommand(command: string): Promise<void> {
    try {
        await clickhouse.command({
            query: command,
        });
    } catch (error) {
        console.error('ClickHouse command error:', {
            command,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
}
