"use client";

import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    const [message, setMessage] = useState(error.message);

    useEffect(() => {
        analytics.captureException(error, { tags: ["global-error"] });

        analytics.localize(error.message).then(setMessage);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <h1>Global Error</h1>
                <p>{message}</p>
                <button type="button" onClick={reset}>
                    Reset
                </button>
            </body>
        </html>
    );
}
