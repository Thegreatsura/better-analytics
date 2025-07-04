import type { LayoutProps } from "@/types/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Better Analytics · Auth",
};

export default async function AuthLayout({ children }: LayoutProps) {
	return (
		<div className="flex min-h-svh w-full items-center justify-center">
			{children}
		</div>
	);
}
