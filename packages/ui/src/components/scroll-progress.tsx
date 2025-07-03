"use client";

import { cn } from "@better-analytics/ui";
import {
	motion,
	type MotionProps,
	useScroll,
	useTransform,
} from "motion/react";
import React from "react";
interface ScrollProgressProps
	extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {}

export const ScrollProgress = React.forwardRef<
	HTMLDivElement,
	ScrollProgressProps
>(({ className, ...props }, ref) => {
	const { scrollYProgress } = useScroll();

	return (
		<motion.div
			ref={ref}
			className={cn(
				"fixed inset-x-0 top-0 z-50 h-px origin-left bg-gradient-to-r from-emerald-400 to-brand",
				className,
			)}
			style={{
				scaleX: useTransform(scrollYProgress, [0, 1], [0, 1]),
			}}
			{...props}
		/>
	);
});

ScrollProgress.displayName = "ScrollProgress";
