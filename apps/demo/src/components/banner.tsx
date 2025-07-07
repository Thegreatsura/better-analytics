import { Logo } from "@better-analytics/ui/icons";
import Link from "next/link";

export function Banner() {
	return (
		<div className="fixed inset-0 flex h-16 select-none items-center justify-center">
			<Link href="/dashboard" className="flex items-center gap-2">
				<Logo className="size-4" />
				<span className="font-aeonik font-medium text-sm uppercase">
					Better Analytics
				</span>
			</Link>
		</div>
	);
}
