import { createEnv } from "@better-analytics/env";
import { z } from "zod";

export default createEnv({
	schema: {
		DATABASE_URL: z.string().url(),
		CLICKHOUSE_URL: z.string().url().optional(),
	},
});
