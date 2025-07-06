import { TimeFilterProvider } from "../components/analytics/time-filter-context";
import { AnalyticsHeader } from "../components/analytics/analytics-header";
import { MetricCardsSection } from "../components/analytics/sections/metric-cards-section";
import { RecentErrorsSection } from "../components/analytics/sections/recent-errors-section";
import { ErrorTypesSection } from "../components/analytics/sections/error-types-section";
import { SeverityLevelsSection } from "../components/analytics/sections/severity-levels-section";
import { ErrorTrendsSection } from "../components/analytics/sections/error-trends-section";
import { RecentLogsSection } from "../components/analytics/sections/recent-logs-section";

interface PlaceholderProps {
	params: Promise<{ path: string | string[] }>;
}

export default async function Placeholder({ params }: PlaceholderProps) {
	const { path } = await params;

	if (!path) {
		return (
			<TimeFilterProvider>
				<AnalyticsHeader />
				<MetricCardsSection />
				<div className="grid gap-4 lg:grid-cols-2">
					<RecentErrorsSection />
					<RecentLogsSection />
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<ErrorTypesSection />
					<SeverityLevelsSection />
				</div>
				<ErrorTrendsSection />
			</TimeFilterProvider>
		);
	}

	function parsePath(base: string, path: string | string[]) {
		return Array.isArray(path) ? `${base}/${path.join("/")}` : base;
	}

	return (
		<div className="flex h-full w-full flex-col items-center justify-center">
			<kbd className="font-medium text-muted-foreground">
				{parsePath("dashboard", path)}
			</kbd>
		</div>
	);
}
