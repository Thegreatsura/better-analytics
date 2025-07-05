import { createEnv, envValue } from "@better-analytics/env";
import { z } from "zod";

export default createEnv({
	schema: {
		ACCESS_TOKEN: z.string(),
		OPENROUTER_API_KEY: z.string(),
		OPENROUTER_BASE_URL: z.string().url(),
		NEXT_PUBLIC_CLIENT_ID: z.string(),
		NEXT_PUBLIC_API_URL: z.string().url(),
		NODE_ENV: z.enum(["development", "production"]),
	},
	values: {
		NEXT_PUBLIC_API_URL: envValue(
			"http://localhost:4000",
			"http://localhost:4000", // TODO: change to the actual API URL when deployed
		),
		OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
	},
});
