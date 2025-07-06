import {
	LifebuoyIcon,
	HouseIcon,
	BugIcon,
	FileTextIcon,
	TerminalIcon,
} from "@phosphor-icons/react";

export interface SidebarItem {
	title: string;
	url: string;
	icon: React.ElementType;
}

export interface SidebarConfig {
	main: SidebarItem[];
	secondary: SidebarItem[];
}

export const sidebarConfig: SidebarConfig = {
	main: [
		{
			title: "Overview",
			url: "/dashboard",
			icon: HouseIcon,
		},
		{
			title: "Logs",
			url: "/dashboard/logs",
			icon: FileTextIcon,
		},
		{
			title: "Console",
			url: "/dashboard/console",
			icon: TerminalIcon,
		},
		{
			title: "Errors",
			url: "/dashboard/errors",
			icon: BugIcon,
		},
	],
	secondary: [
		{
			title: "Get Help",
			url: "/support",
			icon: LifebuoyIcon,
		},
	],
};
