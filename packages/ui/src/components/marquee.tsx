import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@better-analytics/ui";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
	className?: string;
	reverse?: boolean;
	pauseOnHover?: boolean;
	children: React.ReactNode;
	vertical?: boolean;
	repeat?: number;
}

export function Marquee({
	className,
	reverse = false,
	pauseOnHover = false,
	children,
	vertical = false,
	...props
}: MarqueeProps) {
	return (
		<div
			{...props}
			className={cn(
				"group/marquee flex w-full overflow-hidden p-2 [--duration:20s] [--gap:1rem] [gap:var(--gap)]",
				{
					"flex-row": !vertical,
					"flex-col": vertical,
				},
				className,
			)}
		>
			<MarqueeItem
				pauseOnHover={pauseOnHover}
				vertical={vertical}
				reverse={reverse}
			>
				{children}
			</MarqueeItem>

			<MarqueeItem
				className="hidden md:flex"
				pauseOnHover={pauseOnHover}
				vertical={vertical}
				reverse={reverse}
				aria-hidden
			>
				{children}
			</MarqueeItem>
		</div>
	);
}

function MarqueeItem({
	children,
	vertical = false,
	reverse = false,
	pauseOnHover = false,
}: Partial<MarqueeProps>) {
	return (
		<div
			className={cn(
				"flex shrink-0 justify-around [gap:var(--gap)]",
				{
					"animate-marquee flex-row": !vertical,
					"animate-marquee-vertical flex-col": vertical,
					"group-hover/marquee:[animation-play-state:paused]": pauseOnHover,
					"[animation-direction:reverse]": reverse,
				},
				"will-change-transform",
			)}
		>
			{children}
		</div>
	);
}
