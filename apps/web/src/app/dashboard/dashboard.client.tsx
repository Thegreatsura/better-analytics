import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@better-analytics/ui/components/card";
import {
	getAnalyticsStats,
	getErrorsByEnvironment,
	getLogsByLevel,
	getRecentErrorsChart,
	getErrorVsLogTrends,
	getTopErrorUrls,
	getErrorsByBrowser,
	getErrorsByLocation,
	getAnalyticsTrends,
	getNewErrors,
	getTopErrors,
} from "./actions";
import { DashboardUI } from "./dashboard-ui";

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


interface MetricCardProps {
	title: string;
	value: string | number;
	description: string;
}

export const MetricCard = ({ title, value, description }: MetricCardProps) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				<p className="text-xs text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
};


export async function DashboardClient() {
	const [
		analyticsStatsResult,
		errorVsLogTrendsResult,
		topErrorUrlsResult,
		errorsByBrowserResult,
		errorsByLocationResult,
		analyticsTrendsResult,
		recentErrorsChartResult,
		newErrorsResult,
		topErrorsResult,
	] = await Promise.all([
		getAnalyticsStats(),
		getErrorVsLogTrends(),
		getTopErrorUrls(),
		getErrorsByBrowser(),
		getErrorsByLocation(),
		getAnalyticsTrends(),
		getRecentErrorsChart(),
		getNewErrors(),
		getTopErrors(),
	]);

	// Transform data for the client component
	const analyticsStats = analyticsStatsResult.success ? analyticsStatsResult.data : null;
	const analyticsTrends = analyticsTrendsResult.success ? analyticsTrendsResult.data : null;

	const errorTypeData =
		analyticsStatsResult.success && analyticsStatsResult.data
			? analyticsStatsResult.data.errorsByType.map((item) => ({
				name: item.error_type,
				value: item.count,
				percentage: Math.round(
					(item.count / (analyticsStatsResult.data?.totalErrors || 1)) * 100,
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
					(item.count / (analyticsStatsResult.data?.totalErrors || 1)) * 100,
				),
				color: getSeverityColor(item.severity),
			}))
			: [];

	const errorVsLogTrendData =
		errorVsLogTrendsResult.success && errorVsLogTrendsResult.data
			? errorVsLogTrendsResult.data.map((item) => ({
				date: item.date,
				errors: typeof item.total_errors === "string" ? Number.parseInt(item.total_errors) : (item.total_errors || 0),
				logs: typeof item.total_logs === "string" ? Number.parseInt(item.total_logs) : (item.total_logs || 0),
			}))
			: []

	// Safe fallbacks for all data
	const topUrlsData = topErrorUrlsResult.success ? topErrorUrlsResult.data : [];
	const topBrowsersData = errorsByBrowserResult.success ? errorsByBrowserResult.data : [];
	const topLocationsData = errorsByLocationResult.success ? errorsByLocationResult.data : [];
	const recentErrorsChartData = recentErrorsChartResult.success ? recentErrorsChartResult.data : [];
	const newErrorsData = newErrorsResult.success ? newErrorsResult.data : [];
	const topErrorsData = topErrorsResult.success ? topErrorsResult.data : [];

	return (
		<DashboardUI
			analyticsStats={analyticsStats}
			analyticsTrends={analyticsTrends}
			errorTypeData={errorTypeData}
			severityData={severityData}
			errorVsLogTrendData={errorVsLogTrendData}
			topUrlsData={topUrlsData || []}
			topBrowsersData={topBrowsersData || []}
			topLocationsData={topLocationsData || []}
			recentErrorsChartData={recentErrorsChartData || []}
			newErrorsData={newErrorsData || []}
			topErrorsData={topErrorsData || []}
		/>
	);
}