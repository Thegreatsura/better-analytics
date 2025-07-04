import {
    createClient as createClickHouseClient,
} from '@clickhouse/client';

export const clickhouse = createClickHouseClient({
    url: process.env.CLICKHOUSE_URL,
});
