import {
	HouseIcon,
	BugIcon,
	ChartBarHorizontalIcon,
	CreditCardIcon,
	GearIcon,
	Brain,
} from "@phosphor-icons/react";

export interface SidebarItem {
	title: string;
	url: string;
	icon: React.ElementType;
}

export interface SidebarConfig {
	main: SidebarItem[];
	console: SidebarItem[];
	settings: SidebarItem[];
}

export const sidebarConfig: SidebarConfig = {
	main: [
		{
			title: "Overview",
			url: "/dashboard",
			icon: HouseIcon,
		},
		{
			title: "AI",
			url: "/dashboard/ai",
			icon: Brain,
		},
	],
	console: [
		{
			title: "Errors",
			url: "/dashboard/errors",
			icon: BugIcon,
		},
		{
			title: "Logs",
			url: "/dashboard/logs",
			icon: ChartBarHorizontalIcon,
		},
	],
	settings: [
		{
			title: "Account",
			url: "/dashboard/account",
			icon: GearIcon,
		},
		{
			title: "Billing",
			url: "/dashboard/billing",
			icon: CreditCardIcon,
		},
	],
};
