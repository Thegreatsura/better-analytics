import { createEnv } from "@better-analytics/env";
import { z } from "zod";

const envSchema = createEnv({
	schema: {
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_URL: z.string(),
		GITHUB_CLIENT_ID: z.string(),
		GITHUB_CLIENT_SECRET: z.string(),
	},
});

export default envSchema;
