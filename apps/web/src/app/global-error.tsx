'use client';

import { analytics } from '@/lib/analytics';
import { useEffect, useState } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [localizedMessages, setLocalizedMessages] = useState({
        title: 'Global Error',
        message: 'An unknown error occurred',
        resetButton: 'Reset'
    });

    useEffect(() => {
        analytics.captureException(error, { tags: ['global-error'] });

        const localizeMessages = async () => {
            try {
                const [title, message, resetButton] = await Promise.all([
                    analytics.localizeError('Global Error'),
                    analytics.localizeError(error.message || 'An unknown error occurred'),
                    analytics.localizeError('Reset')
                ]);

                setLocalizedMessages({
                    title,
                    message,
                    resetButton
                });
            } catch (err) {
                console.warn('Failed to localize error messages:', err);
            }
        };

        localizeMessages();
    }, [error]);

    return (
        <html lang="en">
            <body>
                <h1>{localizedMessages.title}</h1>
                <p>{localizedMessages.message}</p>
                <button type="button" onClick={reset}>{localizedMessages.resetButton}</button>
            </body>
        </html>
    );
} 