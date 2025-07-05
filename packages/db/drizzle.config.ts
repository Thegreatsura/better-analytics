import { defineConfig } from "drizzle-kit";
import env from "@better-analytics/db/env";

export default defineConfig({
	out: "./src/drizzle",
	schema: ["./src/drizzle/schema.ts", "./src/drizzle/analytics.schema.ts"],
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL as string,
	},
});
