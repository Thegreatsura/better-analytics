import { Button } from "@better-analytics/ui/components/button";
import { Card, CardContent } from "@better-analytics/ui/components/card";
import Link from "next/link";
import { RobotIcon, ChartLineIcon, BugIcon } from "@phosphor-icons/react/ssr";

export default function Landing() {
	return (
		<div className="container mx-auto py-8">
			<div className="flex flex-col min-h-screen space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold tracking-tight">Better Analytics</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Advanced error tracking, performance monitoring, and AI-powered insights for your applications.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
					<Card>
						<CardContent className="p-6 space-y-4">
							<div className="flex items-center gap-2 text-lg font-semibold">
								<RobotIcon className="h-5 w-5" />
								AI Assistant
							</div>
							<p className="text-sm text-muted-foreground">
								Chat with AI about your analytics data and get insights
							</p>
							<Link href="/ai">
								<Button className="w-full">Open AI Chat</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 space-y-4">
							<div className="flex items-center gap-2 text-lg font-semibold">
								<ChartLineIcon className="h-5 w-5" />
								Analytics Dashboard
							</div>
							<p className="text-sm text-muted-foreground">
								View real-time analytics and performance metrics
							</p>
							<Link href="/dashboard">
								<Button className="w-full" variant="outline">
									View Dashboard
								</Button>
							</Link>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6 space-y-4">
							<div className="flex items-center gap-2 text-lg font-semibold">
								<BugIcon className="h-5 w-5" />
								Error Tracking
							</div>
							<p className="text-sm text-muted-foreground">
								Test and monitor application errors in real-time
							</p>
							<Link href="/errors">
								<Button className="w-full" variant="outline">
									Error Testing
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
