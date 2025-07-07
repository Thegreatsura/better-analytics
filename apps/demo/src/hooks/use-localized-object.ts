"use client";

import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";

export function useLocalizedObject<T extends Record<string, string>>(
	content: T,
) {
	const [localizedContent, setLocalizedContent] = useState<T>(content);

	useEffect(() => {
		analytics.localizeObject(content).then(setLocalizedContent);
	}, []);

	return localizedContent;
}
