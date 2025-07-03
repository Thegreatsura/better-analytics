import type { ComponentPropsWithoutRef } from "react";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { cn } from "@better-analytics/ui";
import { Button } from "@better-analytics/ui/button";

interface LinkButtonProps extends ComponentPropsWithoutRef<typeof Button> {
	href: string;
	external?: boolean;
	externalIcon?: boolean;
}

export function LinkButton({
	className,
	children,
	href,
	external = false,
	externalIcon = true,
	...props
}: LinkButtonProps) {
	return props.disabled ? (
		<Button
			{...props}
			className={cn("flex cursor-not-allowed items-center gap-2", className)}
		>
			{children}
			{external && <ExternalLink className="size-3.5 opacity-50" />}
		</Button>
	) : (
		<Button
			className={cn("flex flex-row items-center gap-2", className)}
			{...props}
			asChild
		>
			<Link href={href} target={external ? "_blank" : undefined}>
				{children}
				{external && externalIcon && (
					<ExternalLink className="size-3.5 opacity-50" />
				)}
			</Link>
		</Button>
	);
}
