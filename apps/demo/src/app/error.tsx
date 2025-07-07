/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: demo */

"use client";

import { Button } from "@better-analytics/ui/components/button";
import { LinkButton } from "@better-analytics/ui/components/link-button";
import { useLocalizedError } from "@/hooks/use-localized-error";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
	const translated = useLocalizedError(error, {
		errorTitle: "Well this is awkward...",
		errorMessage: error.message,
		resetButtonText: "Try again",
		dashboardButtonText: "Go to dashboard",
	});

	return (
		<div className="flex flex-col items-center justify-center gap-4 text-center">
			<div className="flex flex-col gap-2">
				<h2 className="font-bold text-2xl">{translated.errorTitle}</h2>

				<p className="max-w-sm text-muted-foreground text-sm">
					{translated.errorMessage}
				</p>
			</div>

			<div className="flex justify-center gap-2">
				<LinkButton href="/dashboard">
					{translated.dashboardButtonText}
				</LinkButton>

				<Button onClick={reset} variant="secondary">
					{translated.resetButtonText}
				</Button>
			</div>
		</div>
	);
}
