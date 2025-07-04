'use client';

import { BetterAnalyticsSDK } from '@better-analytics/sdk';

export const analytics = new BetterAnalyticsSDK({
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    clientId: '123',
    environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
    debug: process.env.NODE_ENV === 'development',
    autoCapture: true,
});

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_CLIENT_ID) {
        console.warn(
            'BetterAnalytics: NEXT_PUBLIC_CLIENT_ID is not set. Analytics will not be sent. Please set it in your .env.local file.',
        );
    }
} 