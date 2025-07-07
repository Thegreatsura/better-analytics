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
} from "@phosphor-icons/react";
import { ErrorTypesChart } from "@/components/chart/error-types-chart";
import { ErrorVsLogsChart } from "@/components/chart/error-vs-logs-chart";
import { SeverityLevelsChart } from "@/components/chart/severity-levels-chart";
import { DataTable } from "./components/data-table";
import { StatCard } from "./components/stat-card";

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
}: {
    analyticsStats: any;
    analyticsTrends: any;
    errorTypeData: any;
    severityData: any;
    errorVsLogTrendData: any;
    topUrlsData: any[];
    topBrowsersData: any[];
    topLocationsData: any[];
}) {
    const browserData = topBrowsersData.map((item) => ({
        ...item,
        name: item.browser_name,
    }));
    const locationData = topLocationsData.map((item) => ({
        ...item,
        name: item.country,
    }));
    const urlData = topUrlsData.map((item) => ({ ...item, name: item.url }));

    const tabs = [
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
                    title="Total Errors"
                    value={analyticsStats?.totalErrors || 0}
                    icon={BugBeetle}
                    trend={analyticsTrends?.totalErrorsTrend}
                    trendLabel="vs last 7 days"
                    invertTrend
                />
                <StatCard
                    title="Total Logs"
                    value={analyticsStats?.totalLogs || 0}
                    icon={Chat}
                    trend={analyticsTrends?.totalLogsTrend}
                    trendLabel="vs last 7 days"
                />
                <StatCard
                    title="Errors by Type"
                    value={analyticsStats?.errorsByType.length || 0}
                    description={`Most common: ${analyticsStats?.errorsByType[0]?.error_type || "N/A"
                        }`}
                    icon={Warning}
                />
                <StatCard
                    title="Errors by Severity"
                    value={analyticsStats?.errorsBySeverity.length || 0}
                    description={`Most common: ${analyticsStats?.errorsBySeverity[0]?.severity || "N/A"
                        }`}
                    icon={ChartBar}
                />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-card/50 backdrop-blur-sm">
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

                <Card className="bg-card/50 backdrop-blur-sm">
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
            <Card className="bg-card/50 backdrop-blur-sm">
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
            <div className="grid grid-cols-1 gap-4">
                <DataTable
                    tabs={tabs}
                    title="Detailed Breakdown"
                    description="Breakdown of errors by different categories"
                    minHeight={300}
                />
            </div>
        </div>
    );
} 