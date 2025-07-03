interface PlaceholderProps {
	params: Promise<{ path: string }>;
}

export default async function Placeholder({ params }: PlaceholderProps) {
	const { path } = await params;

	return (
		<div className="container mx-auto flex h-svh w-full flex-col items-center justify-center">
			<kbd className="font-medium text-muted-foreground">/{path}</kbd>
		</div>
	);
}
