import 'dotenv/config';

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@better-analytics/db";

function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export const auth = betterAuth({
    // Database configuration
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

    // Auth configuration
    secret: process.env.BETTER_AUTH_SECRET,
    baseUrl: process.env.BETTER_AUTH_URL,

    // Security configurations
    cookies: {
        secure: isProduction(),
    },

    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
});

export type Session = typeof auth.$Infer.Session;