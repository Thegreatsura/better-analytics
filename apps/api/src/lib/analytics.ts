import { BetterAnalyticsSDK } from '@better-analytics/sdk';

export const analytics = new BetterAnalyticsSDK({
    apiUrl: process.env.API_URL || 'http://localhost:4000',
    accessToken: process.env.ACCESS_TOKEN || "6db3f28eca8b39f0e4d00a84523629c06f412d6b118a63395f746b21993cd70a",
    clientId: 'better-analytics-api',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    autoCapture: true,
    autoLog: false,
    logLevel: 'info',
    isServer: true,
    serviceName: 'better-analytics-api',
    serviceVersion: '1.0.0',
}); 