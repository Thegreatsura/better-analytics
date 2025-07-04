'use client';

import { analytics } from '@/lib/analytics';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        analytics.captureException(error, { tags: ['global-error'] });
    }, [error]);

    return (
        <html lang="en">
            <body>
                <h1>Global Error</h1>
                <p>{error.message}</p>
                <button type="button" onClick={reset}>Reset</button>
            </body>
        </html>
    );
} 