"use client";

import type { SidebarItem } from "@/config/sidebar";
import { Label } from "@better-analytics/ui/components/label";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@better-analytics/ui/components/sidebar";
import Link from "next/link";

interface NavProps {
	items: SidebarItem[];
	title?: string;
}

export function NavMain({ items, title }: NavProps) {
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				{title && (
					<Label className="text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
						{title}
					</Label>
				)}

				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton tooltip={getTooltip(title, item)} asChild>
								<Link href={item.url}>
									{item.icon && <item.icon className="text-brand" />}
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function getTooltip(title: string | undefined, item: SidebarItem) {
	return title ? `${title} • ${item.title}` : item.title;
}
