import { createEnv } from "@better-analytics/env";
import { z } from "zod";

const envSchema = {
	API_URL: z.string(),
	CLIENT_ID: z.string(),
	ACCESS_TOKEN: z.string(),
	NODE_ENV: z.enum(["development", "production"]),
};

export default createEnv({
	schema: envSchema,
	values: {
		API_URL: "http://localhost:4000",
		NODE_ENV: "development",
	},
});
