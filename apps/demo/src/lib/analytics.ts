"use client";

/** biome-ignore-all lint/style/noNonNullAssertion: demo */
import { init } from "@better-analytics/sdk";

export const analytics = init({
	apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
	clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
	accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
});