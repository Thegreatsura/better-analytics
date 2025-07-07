import "dotenv/config";

import { betterAuth, generateId } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@better-analytics/db";
import env from "@better-analytics/auth/env";
import { resend } from "@better-analytics/email";
import WelcomeEmail from "@better-analytics/email/welcome";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseUrl: env.BETTER_AUTH_URL,
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await resend.emails.send({
						from: "Better Analytics <noreply@kly.ng>",
						to: user.email,
						subject: "Welcome to Better Analytics",
						react: WelcomeEmail({ username: user.name, url: env.BETTER_AUTH_URL }),
					});
				},
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
export { generateId };
