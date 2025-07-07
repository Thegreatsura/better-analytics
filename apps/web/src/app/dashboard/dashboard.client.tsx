import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@better-analytics/ui/components/card";
import { ErrorTypesChart } from "@/components/chart/error-types-chart";
import { SeverityLevelsChart } from "@/components/chart/severity-levels-chart";
import { ErrorTrendsChart } from "@/components/chart/error-trends-chart";
import {
	getAnalyticsStats,
	getErrorTrends,
} from "./actions";

// Helper functions for data transformation
function getErrorTypeColor(type: string): string {
	const colors: Record<string, string> = {
		client: "#3B82F6",
		server: "#EF4444",
		network: "#8B5CF6",
		database: "#F59E0B",
		validation: "#10B981",
		auth: "#6366F1",
		business: "#EC4899",
		unknown: "#6B7280",
	};
	return colors[type] || "#6B7280";
}

function getSeverityColor(severity: string): string {
	const colors: Record<string, string> = {
		critical: "#EF4444",
		high: "#F59E0B",
		medium: "#3B82F6",
		low: "#10B981",
	};
	return colors[severity] || "#6B7280";
}

export async function DashboardClient() {
	const [
		analyticsStatsResult,
		errorTrendsResult,
	] = await Promise.all([
		getAnalyticsStats(),
		getErrorTrends(),
	]);

	// Transform data for the client component
	const errorTypeData =
		analyticsStatsResult.success && analyticsStatsResult.data
			? analyticsStatsResult.data.errorsByType.map((item) => ({
				name: item.error_type,
				value: item.count,
				percentage: Math.round(
					(item.count / analyticsStatsResult.data?.totalErrors) * 100,
				),
				color: getErrorTypeColor(item.error_type),
			}))
			: [];

	const severityData =
		analyticsStatsResult.success && analyticsStatsResult.data
			? analyticsStatsResult.data.errorsBySeverity.map((item) => ({
				name: item.severity,
				value: item.count,
				percentage: Math.round(
					(item.count / analyticsStatsResult.data?.totalErrors) * 100,
				),
				color: getSeverityColor(item.severity),
			}))
			: [];

	const trendData =
		errorTrendsResult.success && errorTrendsResult.data
			? errorTrendsResult.data.map((item) => ({
				date: item.date,
				value:
					typeof item.total_errors === "string"
						? Number.parseInt(item.total_errors)
						: item.total_errors,
				client:
					typeof item.client_errors === "string"
						? Number.parseInt(item.client_errors)
						: item.client_errors,
				server:
					typeof item.server_errors === "string"
						? Number.parseInt(item.server_errors)
						: item.server_errors,
			}))
			: []

	return (
		<div className="flex-1 space-y-4">
			{/* Error Types and Severity Charts */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Error Types</CardTitle>
						<CardDescription>
							Distribution of error types across your application
						</CardDescription>
					</CardHeader>
					<CardContent className="h-64">
						<ErrorTypesChart data={errorTypeData} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Severity Levels</CardTitle>
						<CardDescription>
							Error severity distribution and impact assessment
						</CardDescription>
					</CardHeader>
					<CardContent className="h-64">
						<SeverityLevelsChart data={severityData} />
					</CardContent>
				</Card>
			</div>

			{/* Error Trends */}
			<Card>
				<CardHeader>
					<CardTitle>Error Trends</CardTitle>
					<CardDescription>
						Error patterns over the past two weeks
					</CardDescription>
				</CardHeader>
				<CardContent className="h-64">
					<ErrorTrendsChart data={trendData} />
				</CardContent>
			</Card>
		</div>
	);
}
