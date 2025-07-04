import "@better-analytics/ui/globals.css";

import type { LayoutProps } from "@/types/layout";
import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { siteConfig } from "@/config/site";
import { TooltipProvider } from "@better-analytics/ui/components/tooltip";
import { cn } from "@better-analytics/ui";
import { Toaster } from "@/components/sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: siteConfig.name,
	description: siteConfig.description,
};

export const viewport: Viewport = {
	themeColor: "#ebff0a",
};

export default async function RootLayout({ children }: LayoutProps) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					"overscroll-none scroll-smooth font-sans antialiased",
					geistSans.variable,
					geistMono.variable,
				)}
			>
				<ThemeProvider
					disableTransitionOnChange
					defaultTheme="system"
					attribute="class"
					enableSystem
				>
					<Toaster richColors />

					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
