"use client";

import { Button } from "@better-analytics/ui/components/button";
import { useState } from "react";

export default function Page() {
	const [error, setError] = useState(false);

	function handleClick() {
		setError(true);
	}

	if (error) {
		throw new Error(
			"A sample error occurred! This is a demo error thrown on button click.",
		);
	}

	return (
		<section className="flex flex-col gap-4 text-center">
			<Button onClick={handleClick}>Click me!</Button>
		</section>
	);
}
