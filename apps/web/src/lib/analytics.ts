"use client";

import { createErrorTracker } from "@better-analytics/sdk";


export const analytics = createErrorTracker({
	apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
	clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
	accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
	environment: process.env.NODE_ENV || "",
	debug: process.env.NODE_ENV === "development",
	autoCapture: true,
});
