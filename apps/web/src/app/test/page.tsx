import { Suspense } from 'react';
import { getRecentErrors, getRecentLogs, getAnalyticsStats } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Badge } from '@better-analytics/ui/components/badge';
import { Skeleton } from '@better-analytics/ui/components/skeleton';
import { Button } from '@better-analytics/ui/components/button';
import { BarChart, Activity, AlertTriangle, Info, Bug, Shield, Globe, Clock } from 'lucide-react';

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

function formatRelativeTime(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getSeverityColor(severity: string) {
    switch (severity) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'default';
        case 'low': return 'secondary';
        default: return 'outline';
    }
}

function getSeverityIcon(severity: string) {
    switch (severity) {
        case 'critical': return <AlertTriangle className="h-3 w-3" />;
        case 'high': return <AlertTriangle className="h-3 w-3" />;
        case 'medium': return <Info className="h-3 w-3" />;
        case 'low': return <Info className="h-3 w-3" />;
        default: return <Bug className="h-3 w-3" />;
    }
}

function getLogLevelColor(level: string) {
    switch (level) {
        case 'error': return 'destructive';
        case 'warn': return 'default';
        case 'info': return 'secondary';
        case 'debug': return 'outline';
        case 'trace': return 'outline';
        default: return 'secondary';
    }
}

async function StatsOverview() {
    const statsResult = await getAnalyticsStats();

    if (!statsResult.success || !statsResult.data) {
        return (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm text-destructive">Failed to load analytics overview</p>
            </div>
        );
    }

    const { data } = statsResult;

    const stats = [
        {
            title: "Total Errors",
            value: data.totalErrors.toLocaleString(),
            icon: <AlertTriangle className="h-4 w-4" />,
            change: "+12% from last month",
            changeType: "negative" as const,
        },
        {
            title: "Total Logs",
            value: data.totalLogs.toLocaleString(),
            icon: <Activity className="h-4 w-4" />,
            change: "+23% from last month",
            changeType: "positive" as const,
        },
        {
            title: "Error Types",
            value: data.errorsByType.length.toString(),
            icon: <Bug className="h-4 w-4" />,
            change: "3 new types",
            changeType: "neutral" as const,
        },
        {
            title: "Severity Levels",
            value: data.errorsBySeverity.length.toString(),
            icon: <Shield className="h-4 w-4" />,
            change: "Stable",
            changeType: "neutral" as const,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className="text-muted-foreground">
                            {stat.icon}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' :
                            stat.changeType === 'negative' ? 'text-red-600' :
                                'text-muted-foreground'
                            }`}>
                            {stat.change}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

async function ErrorBreakdown() {
    const statsResult = await getAnalyticsStats();

    if (!statsResult.success || !statsResult.data) {
        return null;
    }

    const { data } = statsResult;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-4 w-4" />
                        Error Types
                    </CardTitle>
                    <CardDescription>
                        Distribution of error types across your application
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.errorsByType.map((item: any) => {
                            const percentage = data.totalErrors > 0 ?
                                Math.round((item.count / data.totalErrors) * 100) : 0;
                            return (
                                <div key={item.error_type} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <span className="text-sm font-medium capitalize">
                                            {item.error_type || 'unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-muted-foreground">
                                            {percentage}%
                                        </div>
                                        <div className="text-sm font-medium">
                                            {item.count}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Severity Levels
                    </CardTitle>
                    <CardDescription>
                        Error severity distribution and impact assessment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.errorsBySeverity.map((item: any) => {
                            const percentage = data.totalErrors > 0 ?
                                Math.round((item.count / data.totalErrors) * 100) : 0;
                            return (
                                <div key={item.severity} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getSeverityIcon(item.severity)}
                                        <span className="text-sm font-medium capitalize">
                                            {item.severity || 'unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-muted-foreground">
                                            {percentage}%
                                        </div>
                                        <div className="text-sm font-medium">
                                            {item.count}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function RecentErrorsList() {
    const errorsResult = await getRecentErrors();

    if (!errorsResult.success || !errorsResult.data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Errors</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Failed to load recent errors</p>
                </CardContent>
            </Card>
        );
    }

    const { data: errors } = errorsResult;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Recent Errors
                    </CardTitle>
                    <CardDescription>
                        Latest error reports from your applications
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                    View All
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {errors.slice(0, 10).map((error: any) => (
                        <div key={error.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex-shrink-0 mt-1">
                                <Badge variant={getSeverityColor(error.severity) as any} className="text-xs">
                                    {error.severity || 'unknown'}
                                </Badge>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-sm truncate">
                                        {error.error_name || 'Unknown Error'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeTime(error.created_at)}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                    {error.message || 'No message available'}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        {error.error_type || 'unknown'}
                                    </Badge>
                                    {error.source && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Globe className="h-3 w-3" />
                                            {error.source}
                                        </div>
                                    )}
                                    {error.environment && (
                                        <Badge variant="secondary" className="text-xs">
                                            {error.environment}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

async function RecentLogsList() {
    const logsResult = await getRecentLogs();

    if (!logsResult.success || !logsResult.data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Failed to load recent logs</p>
                </CardContent>
            </Card>
        );
    }

    const { data: logs } = logsResult;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Recent Logs
                    </CardTitle>
                    <CardDescription>
                        Latest log entries from your systems
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                    View All
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {logs.slice(0, 8).map((log: any) => (
                        <div key={log.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                            <Badge variant={getLogLevelColor(log.level) as any} className="text-xs">
                                {log.level || 'info'}
                            </Badge>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">
                                    {log.message || 'No message'}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatRelativeTime(log.created_at)}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function TestPage() {
    return (
        <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
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

            {/* Stats Overview */}
            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-20" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }>
                <StatsOverview />
            </Suspense>

            {/* Error Breakdown */}
            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-32 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }>
                <ErrorBreakdown />
            </Suspense>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Suspense fallback={
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                }>
                    <RecentErrorsList />
                </Suspense>

                <Suspense fallback={
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                }>
                    <RecentLogsList />
                </Suspense>
            </div>
        </div>
    );
} 