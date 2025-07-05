import type { LayoutProps } from "@/types/layout";
import type { Metadata } from "next";

import { auth } from "@better-analytics/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
	SidebarProvider,
	SidebarInset,
} from "@better-analytics/ui/components/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { SiteHeader } from "./components/site-header";
import { AutumnProvider } from "autumn-js/react";

export const metadata: Metadata = {
	title: "Better Analytics · Dashboard",
};

export default async function DashboardLayout({ children }: LayoutProps) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/login");
	}

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 54)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" className="select-none" />
			<SidebarInset>
				<SiteHeader />

				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex h-full flex-col gap-4 py-4 md:gap-6 md:py-6">
							{children}
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
