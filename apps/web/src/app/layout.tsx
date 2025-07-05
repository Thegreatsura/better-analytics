import "@better-analytics/ui/globals.css";

import type { LayoutProps } from "@/types/layout";
import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { siteConfig } from "@/config/site";
import { QueryClientProvider } from "@/providers/query-client";
import { TooltipProvider } from "@better-analytics/ui/components/tooltip";
import { IconProvider } from "@better-analytics/ui/providers/icon.provider";
import { cn } from "@better-analytics/ui";
import { Toaster } from "@/components/sonner";
import { AutumnProvider } from "autumn-js/next";
import { LingoProvider, loadDictionary } from "lingo.dev/react/rsc";

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
				<QueryClientProvider>
					<ThemeProvider
						disableTransitionOnChange
						defaultTheme="dark"
						attribute="class"
						forcedTheme="dark"
						enableSystem
					>
						<IconProvider>
							<Toaster richColors />

							<TooltipProvider>
								<AutumnProvider>{children}</AutumnProvider>
							</TooltipProvider>
						</IconProvider>
					</ThemeProvider>
				</QueryClientProvider>
			</body>
		</html>
	);
}
