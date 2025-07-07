import { createErrorTracker } from "@better-analytics/sdk";
import env from "@/env";

export const analytics = createErrorTracker({
	apiUrl: env.API_URL,
	clientId: env.CLIENT_ID,
	accessToken: env.ACCESS_TOKEN,
	autoCapture: true,
});
