import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@better-analytics/ui/components/card";
import {
	getDashboardData,
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
	// Use unified data fetching for consistency
	const dashboardDataResult = await getDashboardData();

	if (!dashboardDataResult.success || !dashboardDataResult.data) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-muted-foreground">
					{dashboardDataResult.error || 'Failed to load dashboard data'}
				</p>
			</div>
		);
	}

	const data = dashboardDataResult.data;

	// Transform data for the client component
	const analyticsStats = data.analyticsStats;
	const analyticsTrends = data.analyticsTrends;

	const errorTypeData = analyticsStats.errorsByType.map((item) => ({
		name: item.error_type,
		value: item.count,
		percentage: Math.round(
			(item.count / (analyticsStats.totalErrors || 1)) * 100,
		),
		color: getErrorTypeColor(item.error_type),
	}));

	const severityData = analyticsStats.errorsBySeverity.map((item) => ({
		name: item.severity,
		value: item.count,
		percentage: Math.round(
			(item.count / (analyticsStats.totalErrors || 1)) * 100,
		),
		color: getSeverityColor(item.severity),
	}));

	const errorVsLogTrendData = data.errorVsLogTrendData.map((item) => ({
		date: item.date,
		errors: typeof item.total_errors === "string" ? Number.parseInt(item.total_errors) : (item.total_errors || 0),
		logs: typeof item.total_logs === "string" ? Number.parseInt(item.total_logs) : (item.total_logs || 0),
	}));

	return (
		<DashboardUI
			analyticsStats={analyticsStats}
			analyticsTrends={analyticsTrends}
			errorTypeData={errorTypeData}
			severityData={severityData}
			errorVsLogTrendData={errorVsLogTrendData}
			topUrlsData={data.topUrlsData}
			topBrowsersData={data.topBrowsersData}
			topLocationsData={data.topLocationsData}
			recentErrorsChartData={data.recentErrorsChartData}
			newErrorsData={data.newErrorsData}
			topErrorsData={data.topErrorsData}
			notFoundPages={data.notFoundPages}
		/>
	);
}