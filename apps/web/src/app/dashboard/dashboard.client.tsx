import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@better-analytics/ui/components/card";
import { ErrorTypesChart } from "@/components/chart/error-types-chart";
import { SeverityLevelsChart } from "@/components/chart/severity-levels-chart";
import { ErrorVsLogsChart } from "@/components/chart/error-vs-logs-chart";
import {
	getAnalyticsStats,
	getErrorsByEnvironment,
	getLogsByLevel,
	getErrorVsLogTrends,
	getTopErrorUrls,
	getErrorsByBrowser,
	getErrorsByLocation
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

function getLogLevelColor(level: string): string {
	const colors: Record<string, string> = {
		error: "#EF4444",
		warn: "#F59E0B",
		info: "#3B82F6",
		debug: "#10B981",
		trace: "#8B5CF6",
		log: "#6B7280",
	};
	return colors[level] || "#6B7280";
}

export async function DashboardClient() {
	const [
		analyticsStatsResult,
		errorVsLogTrendsResult,
		errorsByEnvironmentResult,
		logsByLevelResult,
		topErrorUrlsResult,
		errorsByBrowserResult,
		errorsByLocationResult
	] = await Promise.all([
		getAnalyticsStats(),
		getErrorVsLogTrends(),
		getErrorsByEnvironment(),
		getLogsByLevel(),
		getTopErrorUrls(),
		getErrorsByBrowser(),
		getErrorsByLocation()
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

	const errorVsLogTrendData =
		errorVsLogTrendsResult.success && errorVsLogTrendsResult.data
			? errorVsLogTrendsResult.data.map((item) => ({
				date: item.date,
				errors: typeof item.total_errors === "string" ? Number.parseInt(item.total_errors) : (item.total_errors || 0),
				logs: typeof item.total_logs === "string" ? Number.parseInt(item.total_logs) : (item.total_logs || 0),
			}))
			: []

	// Safe fallbacks for all data
	const errorsByEnvironment = errorsByEnvironmentResult.success && errorsByEnvironmentResult.data
		? errorsByEnvironmentResult.data
		: [];

	const logsByLevel = logsByLevelResult.success && logsByLevelResult.data
		? logsByLevelResult.data
		: [];

	const topErrorUrls = topErrorUrlsResult.success && topErrorUrlsResult.data
		? topErrorUrlsResult.data
		: [];

	// Get top browsers and locations for the summary cards
	const topBrowsers = errorsByBrowserResult.success && errorsByBrowserResult.data && errorsByBrowserResult.data.length > 0
		? errorsByBrowserResult.data.slice(0, 2).map(b => b.browser_name || 'Unknown').join(', ')
		: '';

	const topLocations = errorsByLocationResult.success && errorsByLocationResult.data && errorsByLocationResult.data.length > 0
		? errorsByLocationResult.data.slice(0, 3).map(l => l.country || 'Unknown').join(', ')
		: '';

	return (
		<div className="flex-1 space-y-4">
			{/* Metrics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Errors (24h)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analyticsStatsResult.success && analyticsStatsResult.data ? analyticsStatsResult.data.totalErrors || 0 : 0}
						</div>
						<p className="text-xs text-muted-foreground">
							From all applications and services
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Logs
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analyticsStatsResult.success && analyticsStatsResult.data ? analyticsStatsResult.data.totalLogs || 0 : 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Total log entries collected
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Top Browsers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-md font-medium">
							{topBrowsers || 'No data available'}
						</div>
						<p className="text-xs text-muted-foreground">
							Most common browsers with errors
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Top Locations
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-md font-medium">
							{topLocations || 'No data available'}
						</div>
						<p className="text-xs text-muted-foreground">
							Regions with most errors reported
						</p>
					</CardContent>
				</Card>
			</div>

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

			{/* Error vs Log Trends */}
			<Card>
				<CardHeader>
					<CardTitle>Error vs Log Trends</CardTitle>
					<CardDescription>
						Comparison of errors and logs over the past two weeks
					</CardDescription>
				</CardHeader>
				<CardContent className="h-64">
					<ErrorVsLogsChart data={errorVsLogTrendData} />
				</CardContent>
			</Card>

			{/* Additional Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Top URLs</CardTitle>
						<CardDescription>
							Most error-prone pages in your application
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{topErrorUrls && topErrorUrls.length > 0 ? (
								topErrorUrls.slice(0, 5).map((item, index) => (
									<li key={index} className="flex items-center justify-between">
										<span className="text-sm truncate max-w-[70%]">{item.url || 'Unknown'}</span>
										<span className="text-xs text-muted-foreground">{item.percentage?.toFixed(1) || 0}%</span>
									</li>
								))
							) : (
								<li className="text-sm text-muted-foreground">No data available</li>
							)}
						</ul>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Errors by Environment</CardTitle>
						<CardDescription>
							Distribution across different environments
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{errorsByEnvironment && errorsByEnvironment.length > 0 ? (
								errorsByEnvironment.slice(0, 5).map((item, index) => (
									<li key={index} className="flex items-center justify-between">
										<span className="text-sm">{item.environment || 'Unknown'}</span>
										<span className="text-xs text-muted-foreground">
											{item.count || 0} ({item.percentage?.toFixed(1) || 0}%)
										</span>
									</li>
								))
							) : (
								<li className="text-sm text-muted-foreground">No data available</li>
							)}
						</ul>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Logs by Level</CardTitle>
						<CardDescription>
							Distribution of log levels
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{logsByLevel && logsByLevel.length > 0 ? (
								logsByLevel.slice(0, 5).map((item, index) => (
									<li key={index} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div
												className="w-2 h-2 rounded-full"
												style={{ backgroundColor: getLogLevelColor(item.level || 'unknown') }}
											/>
											<span className="text-sm">{item.level || 'Unknown'}</span>
										</div>
										<span className="text-xs text-muted-foreground">
											{item.count || 0} ({item.percentage?.toFixed(1) || 0}%)
										</span>
									</li>
								))
							) : (
								<li className="text-sm text-muted-foreground">No data available</li>
							)}
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}