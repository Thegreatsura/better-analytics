import { Suspense } from 'react';
import { getRecentErrors, getRecentLogs, getAnalyticsStats } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Badge } from '@better-analytics/ui/components/badge';
import { Skeleton } from '@better-analytics/ui/components/skeleton';

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
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

async function StatsSection() {
    const statsResult = await getAnalyticsStats();

    if (!statsResult.success || !statsResult.data) {
        return <div className="text-red-500">Failed to load stats: {statsResult.error}</div>;
    }

    const { data } = statsResult;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalErrors}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalLogs}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Error Types</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {data.errorsByType.map((item: any) => (
                            <div key={item.error_type} className="flex justify-between text-sm">
                                <span>{item.error_type || 'unknown'}</span>
                                <span className="font-medium">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Error Severity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {data.errorsBySeverity.map((item: any) => (
                            <div key={item.severity} className="flex justify-between text-sm">
                                <span>{item.severity || 'unknown'}</span>
                                <span className="font-medium">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function ErrorsTable() {
    const errorsResult = await getRecentErrors();

    if (!errorsResult.success || !errorsResult.data) {
        return <div className="text-red-500">Failed to load errors: {errorsResult.error}</div>;
    }

    const { data: errors } = errorsResult;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Last 50 errors from the analytics system</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Time</th>
                                <th className="text-left p-2">Client</th>
                                <th className="text-left p-2">Error Name</th>
                                <th className="text-left p-2">Message</th>
                                <th className="text-left p-2">Severity</th>
                                <th className="text-left p-2">Type</th>
                                <th className="text-left p-2">Source</th>
                                <th className="text-left p-2">Environment</th>
                                <th className="text-left p-2">Browser</th>
                                <th className="text-left p-2">OS</th>
                                <th className="text-left p-2">Country</th>
                                <th className="text-left p-2">Count</th>
                                <th className="text-left p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.map((error: any) => (
                                <tr key={error.id} className="border-b hover:bg-muted/50">
                                    <td className="p-2">{formatDate(error.created_at)}</td>
                                    <td className="p-2 font-mono text-xs">{error.client_id}</td>
                                    <td className="p-2 font-medium">{error.error_name || '-'}</td>
                                    <td className="p-2 max-w-xs truncate" title={error.message}>
                                        {error.message || '-'}
                                    </td>
                                    <td className="p-2">
                                        <Badge variant={getSeverityColor(error.severity) as any}>
                                            {error.severity || 'unknown'}
                                        </Badge>
                                    </td>
                                    <td className="p-2">{error.error_type || '-'}</td>
                                    <td className="p-2">{error.source || '-'}</td>
                                    <td className="p-2">{error.environment || '-'}</td>
                                    <td className="p-2">{error.browser_name || '-'}</td>
                                    <td className="p-2">{error.os_name || '-'}</td>
                                    <td className="p-2">{error.country || '-'}</td>
                                    <td className="p-2">{error.occurrence_count || 1}</td>
                                    <td className="p-2">
                                        <Badge variant="outline">{error.status || 'new'}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

async function LogsTable() {
    const logsResult = await getRecentLogs();

    if (!logsResult.success || !logsResult.data) {
        return <div className="text-red-500">Failed to load logs: {logsResult.error}</div>;
    }

    const { data: logs } = logsResult;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>Last 50 logs from the analytics system</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Time</th>
                                <th className="text-left p-2">Client</th>
                                <th className="text-left p-2">Level</th>
                                <th className="text-left p-2">Message</th>
                                <th className="text-left p-2">Source</th>
                                <th className="text-left p-2">Environment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log: any) => (
                                <tr key={log.id} className="border-b hover:bg-muted/50">
                                    <td className="p-2">{formatDate(log.created_at)}</td>
                                    <td className="p-2 font-mono text-xs">{log.client_id}</td>
                                    <td className="p-2">
                                        <Badge variant={getLogLevelColor(log.level) as any}>
                                            {log.level || 'info'}
                                        </Badge>
                                    </td>
                                    <td className="p-2 max-w-md truncate" title={log.message}>
                                        {log.message || '-'}
                                    </td>
                                    <td className="p-2">{log.source || '-'}</td>
                                    <td className="p-2">{log.environment || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TestPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Analytics Data Test</h1>
                <p className="text-muted-foreground mt-1">
                    View recent analytics data from the database
                </p>
            </header>

            <div className="space-y-8">
                <Suspense fallback={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-20" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-12" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                }>
                    <StatsSection />
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
                    <ErrorsTable />
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
                    <LogsTable />
                </Suspense>
            </div>
        </div>
    );
} 