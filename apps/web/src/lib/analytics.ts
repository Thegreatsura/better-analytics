'use client';

import { createErrorTracker } from '@better-analytics/sdk';

export const analytics = createErrorTracker({
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID || '123',
    accessToken: "6db3f28eca8b39f0e4d00a84523629c06f412d6b118a63395f746b21993cd70a",
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
    autoCapture: true,
});

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    if (!process.env.NEXT_PUBLIC_CLIENT_ID) {
        console.warn(
            'ErrorTracker: NEXT_PUBLIC_CLIENT_ID is not set. Error tracking will not work properly. Please set it in your .env.local file.',
        );
    }
} 