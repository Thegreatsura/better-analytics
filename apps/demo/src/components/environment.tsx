import { env } from "@/env";

export function Environment() {
	const envArray = Object.entries(env);

	return (
		<div className="flex flex-col gap-2">
			{envArray.map(([key, value]) => (
				<kbd key={key}>
					{key}: {value}
				</kbd>
			))}
		</div>
	);
}
