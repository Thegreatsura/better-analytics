import "@better-analytics/ui/globals.css";

import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cn } from "@better-analytics/ui";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

interface LayoutProps {
	readonly children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					"overscroll-none scroll-smooth font-sans antialiased",
					geistMono.variable,
					geistSans.variable,
				)}
			>
				<ThemeProvider
					disableTransitionOnChange
					defaultTheme="dark"
					attribute="class"
				>
					<main className="container flex h-screen w-screen items-center justify-center">
						{children}
					</main>
				</ThemeProvider>
			</body>
		</html>
	);
}
