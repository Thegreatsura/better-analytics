/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: demo */

"use client";

import { analytics } from "@/lib/analytics";
import { useEffect } from "react";

import { Button } from "@better-analytics/ui/components/button";
import { LinkButton } from "@better-analytics/ui/components/link-button";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
	useEffect(() => {
		analytics.captureException(error);
	}, [error]);

	function handleReset() {
		reset();
	}

	return (
		<div className="flex max-w-xs flex-col items-center justify-center gap-4 text-center">
			<div className="flex flex-col gap-2">
				<h2 className="font-bold text-2xl">Well this is awkward...</h2>
				<p className="text-muted-foreground text-sm">{error.message}</p>
			</div>

			<div className="flex justify-center gap-2">
				<LinkButton href="/dashboard">Go to dashboard</LinkButton>

				<Button onClick={handleReset} variant="secondary">
					Try again
				</Button>
			</div>
		</div>
	);
}
