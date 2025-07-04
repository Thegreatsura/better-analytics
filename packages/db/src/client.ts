import * as schema from "./drizzle/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Create a PostgreSQL pool
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

// Create the Drizzle client
export const db = drizzle(pool, { schema: schema });
