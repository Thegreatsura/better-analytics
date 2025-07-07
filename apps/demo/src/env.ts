import { createEnv } from "@better-analytics/env";
import { z } from "zod";

const envSchema = {
	NEXT_PUBLIC_API_URL: z.string(),
	NEXT_PUBLIC_CLIENT_ID: z.string(),
	NEXT_PUBLIC_ACCESS_TOKEN: z.string(),
	NODE_ENV: z.enum(["development", "production"]),
};

export default createEnv({
	schema: envSchema,
	values: {
		NEXT_PUBLIC_API_URL: "http://localhost:4000",
		NODE_ENV: "development",
	},
});
