import authEnv from "@better-analytics/auth/env";
import { Button } from "@better-analytics/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@better-analytics/ui/components/card";
import Link from "next/link";
import { Robot, ChartLine, Bug, TestTube } from "@phosphor-icons/react";

export default function Landing() {
	return (
		<div className="container mx-auto py-8">
			<div className="flex flex-col items-center justify-center min-h-screen space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold tracking-tight">Better Analytics</h1>
					<p className="text-xl text-muted-foreground max-w-2xl">
						Advanced error tracking, performance monitoring, and AI-powered insights for your applications.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Robot className="h-5 w-5" />
								AI Assistant
							</CardTitle>
							<CardDescription>
								Chat with AI about your analytics data and get insights
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/ai">
								<Button className="w-full">
									Open AI Chat
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<ChartLine className="h-5 w-5" />
								Analytics Dashboard
							</CardTitle>
							<CardDescription>
								View real-time analytics and performance metrics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/test">
								<Button className="w-full" variant="outline">
									View Dashboard
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Bug className="h-5 w-5" />
								Error Tracking
							</CardTitle>
							<CardDescription>
								Test and monitor application errors in real-time
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/errors">
								<Button className="w-full" variant="outline">
									Error Testing
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-lg">
								<TestTube className="h-5 w-5" />
								Sandbox
							</CardTitle>
							<CardDescription>
								Experiment with features and test configurations
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/sandbox">
								<Button className="w-full" variant="outline">
									Open Sandbox
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>

				<div className="text-center text-sm text-muted-foreground">
					<p>Environment: {authEnv.BETTER_AUTH_URL}</p>
				</div>
			</div>
		</div>
	);
}
