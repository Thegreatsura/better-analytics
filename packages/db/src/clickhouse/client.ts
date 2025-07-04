import env from "@better-analytics/db/env";

import { createClient as createClickHouseClient } from "@clickhouse/client";

export const clickhouse = createClickHouseClient({
	url: env.CLICKHOUSE_URL,
});
