import env from "@/env";

export function Environment() {
	const envArray = Object.entries(env);

	return (
		<div className="flex flex-col gap-2">
			{envArray.map(([key, value]) => (
				<kbd
					key={key}
					className="rounded-md border bg-border/50 p-2 px-4 text-muted-foreground text-xs"
				>
					{key}: {value}
				</kbd>
			))}
		</div>
	);
}
