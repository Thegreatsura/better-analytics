"use client";

import { svgConfig, type SvgItem } from "@/config/brand";
import { toast } from "sonner";
import Link from "next/link";

import { Logo } from "@better-analytics/ui/icons";
import { useCallback } from "react";
import {
	ContextMenuContent,
	ContextMenuTrigger,
	ContextMenuItem,
	ContextMenu,
} from "@better-analytics/ui/components/context-menu";

interface LogobuddyProps {
	readonly children: React.ReactNode;
}

export function Logobuddy({ children }: LogobuddyProps) {
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<Link
					className="flex w-fit flex-row items-center gap-2 rounded-md"
					href="/"
				>
					<Logo className="size-4.5 text-brand" />
					<p className="font-medium text-lg uppercase tracking-wide">
						{children}
					</p>
				</Link>
			</ContextMenuTrigger>

			<ContextMenuContent>
				{svgConfig.map((item) => (
					<CopySvgItem key={item.id} {...item} />
				))}
			</ContextMenuContent>
		</ContextMenu>
	);
}

function CopySvgItem({ icon: Icon, label, data, id }: SvgItem) {
	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(data);
		toast.success(`Copied ${id} SVG to clipboard!`);
	}, [data, id]);

	return (
		<ContextMenuItem onClick={handleCopy} className="cursor-pointer">
			<Icon className="size-4 text-brand" />
			{label}
		</ContextMenuItem>
	);
}
