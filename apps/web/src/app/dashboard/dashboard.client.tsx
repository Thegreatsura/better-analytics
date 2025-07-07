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

// Consolidated color maps
const colorMap = {
	errorType: {
		client: "#3B82F6", server: "#EF4444", network: "#8B5CF6",
		database: "#F59E0B", validation: "#10B981", auth: "#6366F1",
		business: "#EC4899", unknown: "#6B7280"
	},
	severity: {
		critical: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#10B981"
	},
	logLevel: {
		error: "#EF4444", warn: "#F59E0B", info: "#3B82F6",
		debug: "#10B981", trace: "#8B5CF6", log: "#6B7280"
	}
};

export async function DashboardClient() {
	// Fetch all data in parallel
	const [
		stats,
		trends,
		environments,
		logLevels,
		urls,
		browsers,
		locations
	] = await Promise.all([
		getAnalyticsStats(),
		getErrorVsLogTrends(),
		getErrorsByEnvironment(),
		getLogsByLevel(),
		getTopErrorUrls(),
		getErrorsByBrowser(),
		getErrorsByLocation()
	]);

	// Extract metrics data with fallbacks
	const totalErrors = stats.success ? stats.data?.totalErrors || 0 : 0;
	const totalLogs = stats.success ? stats.data?.totalLogs || 0 : 0;

	const topBrowsers = browsers.success && browsers.data && browsers.data.length > 0
		? browsers.data.slice(0, 2).map(b => b.browser_name || 'Unknown').join(', ')
		: 'No data available';

	const topLocations = locations.success && locations.data && locations.data.length > 0
		? locations.data.slice(0, 3).map(l => l.country || 'Unknown').join(', ')
		: 'No data available';

	// Transform chart data with fallbacks
	const errorTypeData = stats.success && stats.data
		? stats.data.errorsByType.map(item => ({
			name: item.error_type,
			value: item.count,
			percentage: Math.round((item.count / totalErrors) * 100),
			color: colorMap.errorType[item.error_type as keyof typeof colorMap.errorType] || "#6B7280",
		}))
		: [];

	const severityData = stats.success && stats.data
		? stats.data.errorsBySeverity.map(item => ({
			name: item.severity,
			value: item.count,
			percentage: Math.round((item.count / totalErrors) * 100),
			color: colorMap.severity[item.severity as keyof typeof colorMap.severity] || "#6B7280",
		}))
		: [];

	const trendData = trends.success && trends.data
		? trends.data.map(item => ({
			date: item.date,
			errors: Number(item.total_errors || 0),
			logs: Number(item.total_logs || 0),
		}))
		: [];

	// Get list data with fallbacks
	const errorsByEnvironment = environments.success ? environments.data || [] : [];
	const logsByLevel = logLevels.success ? logLevels.data || [] : [];
	const topErrorUrls = urls.success ? urls.data || [] : [];

	return (
		<div className="flex-1 space-y-4">
			{/* Metrics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Total Errors (24h)"
					value={totalErrors}
					description="From all applications and services"
				/>
				<MetricCard
					title="Total Logs"
					value={totalLogs}
					description="Total log entries collected"
				/>
				<MetricCard
					title="Top Browsers"
					value={topBrowsers}
					description="Most common browsers with errors"
				/>
				<MetricCard
					title="Top Locations"
					value={topLocations}
					description="Regions with most errors reported"
				/>
			</div>

			{/* Error Types and Severity Charts */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Error Types</CardTitle>
						<CardDescription>Distribution of error types across your application</CardDescription>
					</CardHeader>
					<CardContent className="h-64">
						<ErrorTypesChart data={errorTypeData} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Severity Levels</CardTitle>
						<CardDescription>Error severity distribution and impact assessment</CardDescription>
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
					<CardDescription>Comparison of errors and logs over the past two weeks</CardDescription>
				</CardHeader>
				<CardContent className="h-64">
					<ErrorVsLogsChart data={trendData} />
				</CardContent>
			</Card>

			{/* Additional Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Top URLs</CardTitle>
						<CardDescription>Most error-prone pages in your application</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{topErrorUrls.length > 0 ? (
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
						<CardDescription>Distribution across different environments</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{errorsByEnvironment.length > 0 ? (
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
						<CardDescription>Distribution of log levels</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{logsByLevel.length > 0 ? (
								logsByLevel.slice(0, 5).map((item, index) => (
									<li key={index} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div
												className="w-2 h-2 rounded-full"
												style={{ backgroundColor: colorMap.logLevel[item.level as keyof typeof colorMap.logLevel] || "#6B7280" }}
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