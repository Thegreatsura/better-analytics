"use client";

import { Button } from "@better-analytics/ui/components/button";
import { useState } from "react";

export function PageClient() {
	const [error, setError] = useState(false);

	function handleClick() {
		setError(true);
	}

	if (error) {
		throw new Error(
			"A sample error occurred! This is a demo error thrown on button click.",
		);
	}

	return <Button onClick={handleClick}>Click me!</Button>;
}
