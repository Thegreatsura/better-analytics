import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Button } from '@better-analytics/ui/components/button';
import { Activity, AlertTriangle, Bug, Shield } from 'lucide-react';
import { ErrorTypesChart, ErrorTypesChartSkeleton } from '@/components/chart/error-types-chart';
import { SeverityLevelsChart, SeverityLevelsChartSkeleton } from '@/components/chart/severity-levels-chart';
import { ErrorTrendsChart, ErrorTrendsChartSkeleton } from '@/components/chart/error-trends-chart';
import { RecentErrorsChart, RecentErrorsChartSkeleton } from '@/components/chart/recent-errors-chart';
import { RecentLogsChart, RecentLogsChartSkeleton } from '@/components/chart/recent-logs-chart';
import {
    getRecentErrors,
    getRecentLogs,
    getAnalyticsStats,
    getErrorTrends,
    getErrorMetrics,
    getDebugInfo
} from './actions';

function getErrorTypeColor(type: string): string {
    const colors: Record<string, string> = {
        'client': '#3B82F6',
        'server': '#EF4444',
        'network': '#8B5CF6',
        'database': '#F59E0B',
        'validation': '#10B981',
        'auth': '#6366F1',
        'business': '#EC4899',
        'unknown': '#6B7280'
    };
    return colors[type] || '#6B7280';
}

function getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
        'critical': '#EF4444',
        'high': '#F59E0B',
        'medium': '#3B82F6',
        'low': '#10B981'
    };
    return colors[severity] || '#6B7280';
}

// Helper function to format numbers
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Helper function to format percentage
function formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`;
}

// Helper function to format duration
function formatDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)}min`;
    }
    return `${hours.toFixed(1)}h`;
}

export default async function TestPage() {
    // Fetch all data in parallel
    const [
        recentErrorsResult,
        recentLogsResult,
        analyticsStatsResult,
        errorTrendsResult,
        errorMetricsResult,
        debugInfoResult
    ] = await Promise.all([
        getRecentErrors(),
        getRecentLogs(),
        getAnalyticsStats(),
        getErrorTrends(),
        getErrorMetrics(),
        getDebugInfo()
    ]);

    // Transform data for charts
    const errorTypeData = analyticsStatsResult.success && analyticsStatsResult.data
        ? analyticsStatsResult.data.errorsByType.map(item => ({
            name: item.error_type,
            value: item.count,
            percentage: Math.round((item.count / analyticsStatsResult.data!.totalErrors) * 100),
            color: getErrorTypeColor(item.error_type)
        }))
        : [];

    const severityData = analyticsStatsResult.success && analyticsStatsResult.data
        ? analyticsStatsResult.data.errorsBySeverity.map(item => ({
            name: item.severity,
            value: item.count,
            percentage: Math.round((item.count / analyticsStatsResult.data!.totalErrors) * 100),
            color: getSeverityColor(item.severity)
        }))
        : [];

    const trendData = errorTrendsResult.success && errorTrendsResult.data
        ? errorTrendsResult.data.map(item => ({
            date: item.date,
            value: item.total_errors,
            client: item.client_errors,
            server: item.server_errors
        }))
        : [];

    const recentErrors = recentErrorsResult.success && recentErrorsResult.data
        ? recentErrorsResult.data.slice(0, 10).map(error => ({
            id: error.id,
            message: error.message || 'Unknown error',
            type: error.error_type || 'unknown',
            timestamp: error.created_at,
            status: error.http_status_code || 0,
            path: error.url || error.endpoint || 'Unknown path',
            color: getErrorTypeColor(error.error_type || 'unknown')
        }))
        : [];

    const recentLogs = recentLogsResult.success && recentLogsResult.data
        ? recentLogsResult.data.slice(0, 10).map(log => ({
            id: log.id,
            message: log.message,
            level: (log.level === 'log' || log.level === 'info' || log.level === 'warn' || log.level === 'error' || log.level === 'debug' || log.level === 'trace')
                ? (log.level === 'warn' ? 'warning' : log.level === 'log' ? 'info' : log.level === 'trace' ? 'debug' : log.level) as 'info' | 'warning' | 'error' | 'debug'
                : 'info' as const,
            timestamp: log.created_at,
            source: log.source || 'Unknown'
        }))
        : [];

    // Get metrics data
    const metrics = errorMetricsResult.success && errorMetricsResult.data ? errorMetricsResult.data : {
        totalErrors: 0,
        errorRate: 0,
        avgResolutionTime: 0,
        systemHealth: 100
    };

    return (
        <div className="flex-1 space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor your application's health and performance in real-time
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        Export Data
                    </Button>
                    <Button size="sm">
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                            <CardTitle className="font-medium">Total Errors (24h)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{formatNumber(metrics.totalErrors)}</div>
                            <div className="text-muted-foreground text-sm">Last 24 hours</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0">
                        <Activity className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                            <CardTitle className="font-medium">Error Rate</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{formatPercentage(metrics.errorRate)}</div>
                            <div className="text-muted-foreground text-sm">vs logs</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0">
                        <Bug className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                            <CardTitle className="font-medium">Avg. Resolution Time</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{formatDuration(metrics.avgResolutionTime)}</div>
                            <div className="text-muted-foreground text-sm">Last 7 days</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0">
                        <Shield className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                            <CardTitle className="font-medium">System Health</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">{formatPercentage(metrics.systemHealth)}</div>
                            <div className={`text-sm ${metrics.systemHealth > 95 ? 'text-green-600' : metrics.systemHealth > 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {metrics.systemHealth > 95 ? 'Excellent' : metrics.systemHealth > 90 ? 'Good' : 'Needs Attention'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Errors and Logs */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Errors</CardTitle>
                        <CardDescription>Latest error events from your application</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<RecentErrorsChartSkeleton />}>
                            <RecentErrorsChart data={recentErrors} />
                        </Suspense>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Logs</CardTitle>
                        <CardDescription>Latest log entries from your application</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<RecentLogsChartSkeleton />}>
                            <RecentLogsChart data={recentLogs} />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>

            {/* Error Types and Severity Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Error Types</CardTitle>
                        <CardDescription>Distribution of error types across your application</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <Suspense fallback={<ErrorTypesChartSkeleton />}>
                            <ErrorTypesChart data={errorTypeData} />
                        </Suspense>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Severity Levels</CardTitle>
                        <CardDescription>Error severity distribution and impact assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <Suspense fallback={<SeverityLevelsChartSkeleton />}>
                            <SeverityLevelsChart data={severityData} />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>

            {/* Error Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Error Trends</CardTitle>
                    <CardDescription>Error patterns over the past two weeks</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                    <Suspense fallback={<ErrorTrendsChartSkeleton />}>
                        <ErrorTrendsChart data={trendData} />
                    </Suspense>
                </CardContent>
            </Card>

            {/* Data Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Status</CardTitle>
                    <CardDescription>Current data availability and connection status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${recentErrorsResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">
                                Errors: {recentErrorsResult.success ? 'Connected' : 'Error'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${recentLogsResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">
                                Logs: {recentLogsResult.success ? 'Connected' : 'Error'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${analyticsStatsResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">
                                Analytics: {analyticsStatsResult.success ? 'Connected' : 'Error'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${errorTrendsResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">
                                Trends: {errorTrendsResult.success ? 'Connected' : 'Error'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Debug Info */}
            {debugInfoResult.success && debugInfoResult.data && (
                <Card>
                    <CardHeader>
                        <CardTitle>Debug Information</CardTitle>
                        <CardDescription>Database content analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="font-medium mb-2">Database Counts</h4>
                                <div className="space-y-1 text-sm">
                                    <div>Total Errors: {debugInfoResult.data.totalErrors}</div>
                                    <div>Total Logs: {debugInfoResult.data.totalLogs}</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Severity Breakdown</h4>
                                <div className="space-y-1 text-sm">
                                    {debugInfoResult.data.severityBreakdown.length > 0 ? (
                                        debugInfoResult.data.severityBreakdown.map((item, index) => (
                                            <div key={index}>
                                                {item.severity}: {item.count}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">No severity data found</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Error Type Breakdown</h4>
                                <div className="space-y-1 text-sm">
                                    {debugInfoResult.data.errorTypeBreakdown.length > 0 ? (
                                        debugInfoResult.data.errorTypeBreakdown.map((item, index) => (
                                            <div key={index}>
                                                {item.error_type}: {item.count}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">No error type data found</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Sample Errors</h4>
                                <div className="space-y-1 text-sm">
                                    {debugInfoResult.data.sampleErrors.length > 0 ? (
                                        debugInfoResult.data.sampleErrors.map((error, index) => (
                                            <div key={index} className="text-xs">
                                                {error.severity} | {error.error_type} | {error.created_at}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground">No sample errors found</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}