"use client";

import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        analytics.captureException(error, { tags: ["global-error"] });
    }, [error]);

    return (
        <html lang="en">
            <body>
                <h1>Global Error</h1>
                <p>{error.message}</p>
                <button type="button" onClick={reset}>
                    Reset
                </button>
            </body>
        </html>
    );
}
