import { SidebarTrigger } from "@better-analytics/ui/components/sidebar";
import { LinkButton } from "@better-analytics/ui/components/link-button";
import { Github } from "@better-analytics/ui/icons";

export function SiteHeader() {
	return (
		<header className="flex h-(--header-height) shrink-0 select-none items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />

				<div className="ml-auto flex items-center gap-2">
					<LinkButton href="https://github.com/databuddy-analytics/better-analytics" size="sm" external variant="outline">
						<Github />
						GitHub
					</LinkButton>
				</div>
			</div>
		</header>
	);
}
