"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@better-analytics/ui/components/avatar";

import {
	SidebarMenu,
	SidebarMenuItem,
} from "@better-analytics/ui/components/sidebar";
import type { Session } from "@better-analytics/auth";

interface NavUserProps {
	user: Session["user"] | undefined;
}

export function NavUser({ user }: NavUserProps) {
	return (
		user && (
			<SidebarMenu className="select-none">
				<SidebarMenuItem className="flex flex-row gap-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
					<Avatar className="size-8 rounded-lg">
						<AvatarImage src={user.image ?? ""} alt={user.name} />
						<AvatarFallback className="rounded-lg font-aeonik text-base uppercase">
							{user.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{user.name}</span>
						<span className="truncate text-muted-foreground text-xs">
							{user.email}
						</span>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		)
	);
}
