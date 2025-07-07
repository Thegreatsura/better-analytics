"use client";

import { Button } from "@better-analytics/ui/components/button";
import { useLocalizedObject } from "@/hooks/use-localized-object";
import { useRouter } from "next/navigation";

export default function NotFound() {
	const router = useRouter();

	const translated = useLocalizedObject({
		errorTitle: "Page not found",
		errorMessage: "The page you are looking for does not exist.",
		returnButtonText: "Go back",
	});

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

			<div className="flex justify-center gap-2">
				<Button onClick={handleReturn}>{translated.returnButtonText}</Button>
			</div>
		</div>
	);
}
