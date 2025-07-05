import env from "@better-analytics/db/env";

import { createClient as createClickHouseClient } from "@clickhouse/client";

export const clickhouse = createClickHouseClient({
    url: env.CLICKHOUSE_URL,
});

/**
 * A helper function to query ClickHouse and parse the JSON response.
 * @param query - The SQL query to execute.
 * @param params - Optional parameters for the query.
 * @returns The query result as an array of JSON objects.
 * @throws An error if the query fails.
 */
export async function chQuery<T>({
    query,
    params,
}: {
    query: string;
    params?: Record<string, unknown>;
}): Promise<T[]> {
    try {
        const resultSet = await clickhouse.query({
            query,
            query_params: params,
            format: "JSONEachRow",
        });
        const data = await resultSet.json();
        return data as T[];
    } catch (error) {
        console.error("ClickHouse query failed:", error);
        throw new Error("Failed to execute ClickHouse query.");
    }
}
