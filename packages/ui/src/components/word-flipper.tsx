"use client";

import { AnimatePresence, motion, MotionProps } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@better-analytics/ui";

interface WordFlipperProps {
	words: string[];
	duration?: number;
	motionProps?: MotionProps;
	className?: string;
}

export function WordFlipper({
	words,
	duration = 2500,
	motionProps = {
		initial: { opacity: 0, y: -20, filter: "blur(2px)" },
		animate: { opacity: 1, y: 0, filter: "blur(0px)" },
		exit: { opacity: 0, y: 20, filter: "blur(2px)" },
		transition: {
			duration: 0.4,
			ease: [0.4, 0, 0.2, 1], // Custom easing for smoother motion
		},
	},
	className,
}: WordFlipperProps) {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setIndex((prevIndex) => (prevIndex + 1) % words.length);
		}, duration);

		// Clean up interval on unmount
		return () => clearInterval(interval);
	}, [words, duration]);

	return (
		<div className="overflow-hidden py-2">
			<AnimatePresence mode="wait">
				<motion.h1
					key={words[index]}
					className={cn(className)}
					{...motionProps}
				>
					{words[index]}
				</motion.h1>
			</AnimatePresence>
		</div>
	);
}
