import { cn } from "@better-analytics/ui";

interface NoiseProps {
	className?: string;
	opacity?: number;
}

export function Noise({ className, opacity = 10 }: NoiseProps) {
	return (
		<div
			className={cn(
				"-z-10 absolute inset-0 h-full w-full scale-[1.2] transform",
				className,
			)}
			style={{
				backgroundImage: "url(/noise.webp)",
				backgroundSize: "30%",
				opacity: opacity / 100,
			}}
		/>
	);
}
