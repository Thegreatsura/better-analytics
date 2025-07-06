import React, { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Badge } from '@better-analytics/ui/components/badge';
import {
    AlertTriangle,
    Zap,
    Bug,
    Shield,
    TrendingUp,
    TrendingDown,
    Activity,
    Globe
} from 'lucide-react';
import { ErrorTypesChart, ErrorTypesChartSkeleton } from '@/components/chart/error-types-chart';
import { SeverityLevelsChart, SeverityLevelsChartSkeleton } from '@/components/chart/severity-levels-chart';
import { ErrorTrendsChart, ErrorTrendsChartSkeleton } from '@/components/chart/error-trends-chart';
import { RecentErrorsChart, RecentErrorsChartSkeleton } from '@/components/chart/recent-errors-chart';
import { getAnalyticsStats, getErrorTrends, getTopErrors, getErrorsByEnvironment, getRecentErrors, getErrorMetrics } from '../../actions';

// Helper functions for chart data transformation
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

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`;
}

export async function ErrorsAnalytics() {
    const [
        analyticsStatsResult,
        errorTrendsResult,
        topErrorsResult,
        errorsByEnvResult,
        recentErrorsResult,
        errorMetricsResult
    ] = await Promise.all([
        getAnalyticsStats(),
        getErrorTrends(),
        getTopErrors(),
        getErrorsByEnvironment(),
        getRecentErrors(),
        getErrorMetrics()
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
            value: typeof item.total_errors === 'string' ? parseInt(item.total_errors) : item.total_errors,
            client: typeof item.client_errors === 'string' ? parseInt(item.client_errors) : item.client_errors,
            server: typeof item.server_errors === 'string' ? parseInt(item.server_errors) : item.server_errors
        }))
        : [];

    const recentErrorsData = recentErrorsResult.success && recentErrorsResult.data
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

    const topErrors = topErrorsResult.success && topErrorsResult.data ? topErrorsResult.data : [];
    const errorsByEnv = errorsByEnvResult.success && errorsByEnvResult.data ? errorsByEnvResult.data : [];

    // Get metrics data
    const metrics = errorMetricsResult.success && errorMetricsResult.data ? errorMetricsResult.data : {
        totalErrors: 0,
        errorRate: 0,
        avgResolutionTime: 0,
        systemHealth: 100
    };

    const stats = analyticsStatsResult.success ? analyticsStatsResult.data : null;
    const totalErrors = stats ? (typeof stats.totalErrors === 'string' ? Number.parseInt(stats.totalErrors) : stats.totalErrors) : 0;
    const criticalErrors = stats?.errorsBySeverity.find(s => s.severity === 'critical')?.count || 0;
    const trends = errorTrendsResult.success && errorTrendsResult.data ? errorTrendsResult.data : [];
    const yesterdayErrors = trends.length > 1 ? (typeof trends[trends.length - 2]?.total_errors === 'string' ? Number.parseInt(trends[trends.length - 2]?.total_errors) : trends[trends.length - 2]?.total_errors) || 0 : 0;
    const todayErrors = trends.length > 0 ? (typeof trends[trends.length - 1]?.total_errors === 'string' ? Number.parseInt(trends[trends.length - 1]?.total_errors) : trends[trends.length - 1]?.total_errors) || 0 : 0;
    const errorTrend = todayErrors - yesterdayErrors;

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Total Errors (24h)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(typeof metrics.totalErrors === 'string' ? Number.parseInt(metrics.totalErrors) : metrics.totalErrors)}</div>
                        <div className="mt-1 flex items-center text-muted-foreground text-xs">
                            {errorTrend > 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
                            ) : (
                                <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                            )}
                            <span className={errorTrend > 0 ? 'text-red-500' : 'text-green-500'}>
                                {Math.abs(errorTrend)} from yesterday
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Error Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl">{formatPercentage(metrics.errorRate || 0)}</div>
                        <div className="mt-1 text-muted-foreground text-xs">
                            vs logs
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">Critical Errors</CardTitle>
                        <Zap className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl text-red-500">{criticalErrors}</div>
                        <div className="mt-1 text-muted-foreground text-xs">
                            {totalErrors > 0 ? ((criticalErrors / totalErrors) * 100).toFixed(1) : 0}% of total
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="font-medium text-sm">System Health</CardTitle>
                        <Shield className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl text-green-500">{formatPercentage(metrics.systemHealth || 100)}</div>
                        <div className="mt-1 text-muted-foreground text-xs">
                            Overall health score
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Error Types Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5" />
                            Error Types Distribution
                        </CardTitle>
                        <CardDescription>Distribution of error types across your application</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <Suspense fallback={<ErrorTypesChartSkeleton />}>
                            <ErrorTypesChart data={errorTypeData} />
                        </Suspense>
                    </CardContent>
                </Card>

                {/* Severity Levels Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Severity Levels
                        </CardTitle>
                        <CardDescription>Error severity distribution and impact assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        <Suspense fallback={<SeverityLevelsChartSkeleton />}>
                            <SeverityLevelsChart data={severityData} />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>

            {/* Error Trends Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Error Trends (Last 14 Days)
                    </CardTitle>
                    <CardDescription>Error occurrence trends over the past two weeks</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                    <Suspense fallback={<ErrorTrendsChartSkeleton />}>
                        <ErrorTrendsChart data={trendData} />
                    </Suspense>
                </CardContent>
            </Card>

            {/* Recent Errors Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Errors
                    </CardTitle>
                    <CardDescription>Latest error events from your application</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<RecentErrorsChartSkeleton />}>
                        <RecentErrorsChart data={recentErrorsData} />
                    </Suspense>
                </CardContent>
            </Card>

            {/* Most Common Errors & Environment Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Most Common Errors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5" />
                            Most Common Errors
                        </CardTitle>
                        <CardDescription>Top error patterns in your application</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topErrors.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No errors found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topErrors.slice(0, 6).map((error, index) => (
                                    <div key={error.error_name + index.toString()} className="flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30">
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`flex items-center gap-1 px-2 py-1 ${error.severity === 'critical' ? "border-red-500/20 bg-red-500/10 text-red-500" :
                                                    error.severity === 'high' ? "border-orange-500/20 bg-orange-500/10 text-orange-500" :
                                                        error.severity === 'medium' ? "border-blue-500/20 bg-blue-500/10 text-blue-500" :
                                                            "border-green-500/20 bg-green-500/10 text-green-500"
                                                    }`}
                                            >
                                                {error.severity}
                                            </Badge>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium text-sm">
                                                    {error.error_name}
                                                </div>
                                                <div className="truncate text-muted-foreground text-xs">
                                                    {error.message}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm">{error.count}</div>
                                            <div className="text-muted-foreground text-xs">occurrences</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Environment Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Environment Distribution
                        </CardTitle>
                        <CardDescription>Error distribution across different environments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {errorsByEnv.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                    No environment data available
                                </div>
                            ) : (
                                errorsByEnv.map((env) => (
                                    <div key={env.environment} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-blue-500/30" />
                                            <div>
                                                <div className="font-medium text-sm capitalize">{env.environment}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {env.percentage.toFixed(1)}% of errors
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm">{env.count}</div>
                                            <div className="text-muted-foreground text-xs">errors</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 