/** biome-ignore-all lint/style/noNonNullAssertion: demo */
import { init, initLogger } from "@better-analytics/sdk";

export const analytics = init({
	apiUrl: process.env.API_URL!,
	clientId: process.env.CLIENT_ID!,
	accessToken: process.env.ACCESS_TOKEN!,
});

export const logger = initLogger({
	apiUrl: process.env.API_URL!,
	clientId: process.env.CLIENT_ID!,
	accessToken: process.env.ACCESS_TOKEN!,
	serviceName: "better-analytics-demo",
});
