"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@better-analytics/ui/components/card";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Warning,
    ChartBar,
    BugBeetle,
    Chat,
    Hourglass,
} from "@phosphor-icons/react";
import { ErrorTypesChart } from "@/components/chart/error-types-chart";
import { ErrorVsLogsChart } from "@/components/chart/error-vs-logs-chart";
import { SeverityLevelsChart } from "@/components/chart/severity-levels-chart";
import { RecentErrorsChart } from "@/components/chart/recent-errors-chart";
import { DataTable } from "./components/data-table";
import { StatCard } from "./components/stat-card";
import { formatDistanceToNow } from "date-fns";

interface TableData {
    name: string;
    count: number;
    percentage: number;
}

const genericColumns: ColumnDef<TableData>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
            <div className="truncate font-medium">{row.getValue("name")}</div>
        ),
        size: 300,
    },
    {
        accessorKey: "count",
        header: "Count",
        cell: ({ row }) => row.getValue("count"),
        size: 150,
    },
    {
        accessorKey: "percentage",
        header: "Share",
        cell: ({ row }) =>
            `${(row.getValue("percentage") as number).toFixed(2)}%`,
        size: 150,
    },
];

export function DashboardUI({
    analyticsStats,
    analyticsTrends,
    errorTypeData,
    severityData,
    errorVsLogTrendData,
    topUrlsData,
    topBrowsersData,
    topLocationsData,
    recentErrorsChartData,
    newErrorsData,
    topErrorsData,
}: {
    analyticsStats: any;
    analyticsTrends: any;
    errorTypeData: any;
    severityData: any;
    errorVsLogTrendData: any;
    topUrlsData: any[];
    topBrowsersData: any[];
    topLocationsData: any[];
    recentErrorsChartData: any[];
    newErrorsData: any[];
    topErrorsData: any[];
}) {
    const browserData = topBrowsersData?.map((item) => ({
        ...item,
        name: item.browser_name,
    }));
    const locationData = topLocationsData?.map((item) => ({
        ...item,
        name: item.country,
    }));
    const urlData = topUrlsData?.map((item) => ({ ...item, name: item.url }));
    const topErrors = topErrorsData?.map((item) => ({ ...item, name: item.name, percentage: (item.count / (analyticsStats?.totalErrors || 1)) * 100 }));

    const tabs = [
        {
            id: "topErrors",
            label: "Top Errors",
            data: topErrors,
            columns: genericColumns,
        },
        {
            id: "urls",
            label: "Top URLs",
            data: urlData,
            columns: genericColumns,
        },
        {
            id: "browsers",
            label: "Browsers",
            data: browserData,
            columns: genericColumns,
        },
        {
            id: "locations",
            label: "Locations",
            data: locationData,
            columns: genericColumns,
        },
    ];
    return (
        <div className="flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Errors (Last 7D)"
                    value={analyticsTrends?.totalErrorsTrend?.current || 0}
                    icon={BugBeetle}
                    trend={analyticsTrends?.totalErrorsTrend}
                    trendLabel="vs previous 7 days"
                    invertTrend
                />
                <StatCard
                    title="Logs (Last 7D)"
                    value={analyticsTrends?.totalLogsTrend?.current || 0}
                    icon={Chat}
                    trend={analyticsTrends?.totalLogsTrend}
                    trendLabel="vs previous 7 days"
                />
                <StatCard
                    title="New Errors (Last 24H)"
                    value={newErrorsData?.length || 0}
                    icon={Hourglass}
                    description="Newly detected error types"
                />
                <StatCard
                    title="Errors by Severity"
                    value={analyticsStats?.errorsBySeverity.length || 0}
                    description={`Most common: ${analyticsStats?.errorsBySeverity[0]?.severity || "N/A"
                        }`}
                    icon={ChartBar}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Recent Error Trends</CardTitle>
                        <CardDescription>Errors over the past 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <RecentErrorsChart data={recentErrorsChartData} />
                    </CardContent>
                </Card>
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Error vs Log Trends</CardTitle>
                        <CardDescription>
                            Comparison of errors and logs over the past two weeks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                        <ErrorVsLogsChart data={errorVsLogTrendData} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <DataTable
                        tabs={tabs}
                        title="Detailed Breakdown"
                        description="Breakdown of errors by different categories"
                        minHeight={450}
                    />
                </div>

                <div className="space-y-4">
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Severity Levels</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <SeverityLevelsChart data={severityData} />
                        </CardContent>
                    </Card>
                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Error Types</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <ErrorTypesChart data={errorTypeData} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {newErrorsData?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>New Errors</CardTitle>
                        <CardDescription>
                            Most recent errors detected in your application for the first time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {newErrorsData?.map((error) => (
                                <div key={error.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{error.error_name}</span>
                                        <span className="text-sm text-muted-foreground">{error.message}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 