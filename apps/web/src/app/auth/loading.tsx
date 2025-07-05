import { SpinnerBallIcon } from "@phosphor-icons/react";

import { Gradient } from "@better-analytics/ui/components/gradient";

export default function Loading() {
	return (
		<div className="container flex h-svh w-full flex-col items-center justify-center">
			<SpinnerBallIcon className="size-6 animate-spin text-muted-foreground" />

			<Gradient className="bg-primary/20" position="top" />
		</div>
	);
}
