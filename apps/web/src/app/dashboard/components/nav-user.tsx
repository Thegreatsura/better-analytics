"use client";

import {
	CreditCardIcon,
	DotsThreeVerticalIcon,
	SignOutIcon,
	UserIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

import { cn } from "@better-analytics/ui";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@better-analytics/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@better-analytics/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@better-analytics/ui/components/sidebar";
import type { Session } from "@better-analytics/auth";

interface NavUserProps {
	user: Session["user"] | undefined;
}

export function NavUser({ user }: NavUserProps) {
	const { isMobile } = useSidebar();

	return (
		user && (
			<SidebarMenu className="select-none">
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								size="lg"
							>
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

								<DotsThreeVerticalIcon
									className={cn("ml-auto size-4", isMobile && "hidden")}
								/>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
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
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem asChild>
									<Link href="/dashboard/account" className="cursor-pointer">
										<UserIcon />
										Account
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="/dashboard/billing" className="cursor-pointer">
										<CreditCardIcon />
										Billing
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								className="cursor-pointer"
							>
								<SignOutIcon />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		)
	);
}
