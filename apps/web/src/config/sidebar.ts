import {
	HouseIcon,
	BugIcon,
	TerminalIcon,
	ChartBarHorizontalIcon,
} from "@phosphor-icons/react";

export interface SidebarItem {
	title: string;
	url: string;
	icon: React.ElementType;
}

export interface SidebarConfig {
	main: SidebarItem[];
	errors: SidebarItem[];
}

export const sidebarConfig: SidebarConfig = {
	main: [
		{
			title: "Overview",
			url: "/dashboard",
			icon: HouseIcon,
		},
		{
			title: "Console",
			url: "/dashboard/console",
			icon: TerminalIcon,
		},
	],
	errors: [
		{
			title: "Console",
			url: "/dashboard/errors/console",
			icon: BugIcon,
		},
		{
			title: "Analyics",
			url: "/dashboard/errors/analytics",
			icon: ChartBarHorizontalIcon,
		},
	],
};
