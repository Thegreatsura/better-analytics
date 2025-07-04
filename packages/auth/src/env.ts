import { createEnv, envValue } from "@better-analytics/env";
import { z } from "zod";

export default createEnv({
	schema: {
		BETTER_AUTH_SECRET: z.string(),
		BETTER_AUTH_URL: z.string(),
		GITHUB_CLIENT_ID: z.string(),
		GITHUB_CLIENT_SECRET: z.string(),
	},
	values: {
		BETTER_AUTH_URL: envValue(
			"http://localhost:3000",
			"https://better-analytics.vercel.app",
		),
	},
});
