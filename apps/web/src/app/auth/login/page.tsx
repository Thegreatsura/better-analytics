import Link from "next/link";

import { Logo } from "@better-analytics/ui/icons";
import { LoginClient } from "./login.client";
import { siteConfig } from "@/config/site";
import { Gradient } from "@better-analytics/ui/components/gradient";
import { Noise } from "@better-analytics/ui/components/noise";

export default function Login() {
	return (
		<div className="container flex min-h-svh w-full items-center justify-center">
			<div className="flex max-w-sm flex-col items-center gap-6">
				<Link href="/" className="flex select-none items-center gap-3">
					<Logo className="size-4.5" />
					<span className="font-medium uppercase">Better-Analytics</span>
				</Link>

				<div className="flex flex-col gap-3 text-center">
					<h1 className="font-bold text-2xl">Welcome to {siteConfig.name}</h1>
					<p className="text-muted-foreground text-sm">
						Use your GitHub account to get started.
					</p>
				</div>

				<LoginClient />
			</div>

			<Noise opacity={0.5} />

			<Gradient
				className="h-full translate-y-1/2 bg-brand/5"
				position="bottom"
			/>
		</div>
	);
}
