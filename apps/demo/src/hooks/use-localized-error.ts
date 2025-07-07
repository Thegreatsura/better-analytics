"use client";

import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";

export function useLocalizedError<T extends Record<string, string>>(
	error: Error,
	content: T,
) {
	const [localizedContent, setLocalizedContent] = useState<T>(content);

	useEffect(() => {
		analytics.captureException(error);
		analytics.localizeObject(content).then(setLocalizedContent);
	}, [error]);

	return localizedContent;
}
