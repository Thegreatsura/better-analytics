"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";

export default function NotFound() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname) {
            analytics.track404(pathname, document.referrer);
        }
    }, [pathname]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-lg mb-8">
                The page you are looking for does not exist.
            </p>
            <a href="/" className="text-blue-500 hover:underline">
                Go back to the homepage
            </a>
        </div>
    );
} 