import { createEnv } from "@better-analytics/env";
import { z } from "zod";

const envSchema = {
	API_URL: z.string(),
	API_KEY: z.string(),
	NODE_ENV: z.enum(["development", "production"]),
};

export const env = createEnv({
	schema: envSchema,
	values: {
		API_URL: "http://localhost:4000",
		NODE_ENV: "development",
	},
});
