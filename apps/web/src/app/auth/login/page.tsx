import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Noise } from "@better-analytics/ui/components/noise";
import { Logo } from "@better-analytics/ui/icons";
import { LoginForm } from "./login.form";

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

				<LoginForm />
			</div>

			<Noise opacity={0.5} />
		</div>
	);
}
