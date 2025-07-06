"use client";

import Link from "next/link";

import { authClient } from "@better-analytics/auth/client";
import { Logo } from "@better-analytics/ui/icons";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenuButton,
} from "@better-analytics/ui/components/sidebar";
import { sidebarConfig } from "@/config/sidebar";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = authClient.useSession();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenuButton tooltip="Go to Landing Page" asChild>
					<Link href="/">
						<Logo />
						<span className="font-aeonik font-medium text-xs uppercase">
							Better Analytics
						</span>
					</Link>
				</SidebarMenuButton>
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={sidebarConfig.main} />

				<NavMain items={sidebarConfig.errors} title="Errors" />
			</SidebarContent>

			<SidebarFooter>
				<NavUser user={session?.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
