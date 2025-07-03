import { cn } from "@better-analytics/ui";

interface GradientProps {
	position: "top" | "bottom";
	className?: string;
}

export function Gradient({ position, className }: GradientProps) {
	return (
		<div
			className={cn(
				"-z-10 absolute h-40 w-full max-w-7xl rounded-bl-full bg-brand/15 blur-[250px]",
				position === "bottom" && "-bottom-20 rounded-t-full",
				position === "top" && "-top-20 rounded-b-full",
				className,
			)}
		/>
	);
}
