"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@better-analytics/ui/components/button";
import { useLocalizedObject } from "@/hooks/use-localized-object";
import { analytics } from "@/lib/analytics";

export default function NotFound() {
    const pathname = usePathname();
    const router = useRouter();

    const translated = useLocalizedObject({
        errorTitle: "Page not found",
        errorMessage: "The page you are looking for does not exist.",
        returnButtonText: "Go back",
    });

    useEffect(() => {
        if (pathname) {
            analytics.track404(pathname, document.referrer);
        }
    }, [pathname]);

    function handleReturn() {
        router.back();
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="flex flex-col gap-2">
                <h2 className="font-bold text-2xl">{translated.errorTitle}</h2>

                <p className="max-w-sm text-muted-foreground text-sm">
                    {translated.errorMessage}
                </p>
            </div>

            <Button onClick={handleReturn}>{translated.returnButtonText}</Button>
        </div>
    );
}
