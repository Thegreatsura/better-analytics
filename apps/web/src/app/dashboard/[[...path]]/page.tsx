interface PlaceholderProps {
	params: Promise<{ path: string | string[] }>;
}

export default async function Placeholder({ params }: PlaceholderProps) {
	const { path } = await params;

	function parsePath(base: string, path: string | string[]) {
		return Array.isArray(path) ? `${base}/${path.join("/")}` : base;
	}

	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
			<kbd className="font-medium text-muted-foreground">
				{parsePath("dashboard", path)}
			</kbd>
		</div>
	);
}
