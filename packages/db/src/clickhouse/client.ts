import { createClient as createClickHouseClient } from "@clickhouse/client";
import env from "../env";

export const clickhouse = createClickHouseClient({
    url: env.CLICKHOUSE_URL,
});
