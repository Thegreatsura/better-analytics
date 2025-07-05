"use client";

import { createErrorTracker } from "@better-analytics/sdk";
import env from "@/env";

export const analytics = createErrorTracker({
	apiUrl: env.NEXT_PUBLIC_API_URL,
	clientId: env.NEXT_PUBLIC_CLIENT_ID,
	accessToken: env.ACCESS_TOKEN,
	environment: env.NODE_ENV,
	debug: env.NODE_ENV === "development",
	autoCapture: true,
});
