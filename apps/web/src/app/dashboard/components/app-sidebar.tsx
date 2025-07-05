"use client";

import Link from "next/link";

import { Logo } from "@better-analytics/ui/icons";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenuButton,
} from "@better-analytics/ui/components/sidebar";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { sidebarConfig } from "@/config/sidebar";
import { authClient } from "@better-analytics/auth/client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = authClient.useSession();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenuButton tooltip="Go to Landing Page" asChild>
					<Link href="/">
						<Logo className="size-4.5" />
						<span className="font-aeonik font-medium text-base uppercase">
							Better Analytics
						</span>
					</Link>
				</SidebarMenuButton>
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={sidebarConfig.main} />

				<NavSecondary items={sidebarConfig.secondary} className="mt-auto" />
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={session?.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
