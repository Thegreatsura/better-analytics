'use client';

import { BetterAnalyticsSDK } from '@better-analytics/sdk';

export const analytics = new BetterAnalyticsSDK({
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    accessToken: "6db3f28eca8b39f0e4d00a84523629c06f412d6b118a63395f746b21993cd70a",
    clientId: '123',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    autoCapture: true,
    autoLog: false,
    logLevel: 'info',
});

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_CLIENT_ID) {
        console.warn(
            'BetterAnalytics: NEXT_PUBLIC_CLIENT_ID is not set. Analytics will not be sent. Please set it in your .env.local file.',
        );
    }
} 