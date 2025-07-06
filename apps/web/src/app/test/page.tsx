'use client';

import React from 'react';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Button } from '@better-analytics/ui/components/button';
import { Activity, AlertTriangle, Bug, Shield } from 'lucide-react';
import { ErrorTypesChart, ErrorTypesChartSkeleton } from '@/components/chart/error-types-chart';
import { SeverityLevelsChart, SeverityLevelsChartSkeleton } from '@/components/chart/severity-levels-chart';
import { ErrorTrendsChart, ErrorTrendsChartSkeleton } from '@/components/chart/error-trends-chart';
import { RecentErrorsChart, RecentErrorsChartSkeleton, RecentErrorItem } from '@/components/chart/recent-errors-chart';
import { RecentLogsChart, RecentLogsChartSkeleton, RecentLogItem } from '@/components/chart/recent-logs-chart';
import { ErrorTrendItem, ErrorTypeItem } from '@/components/chart/types';

const mockErrorTypes: ErrorTypeItem[] = [
    { name: 'client', value: 352, percentage: 35, color: '#3B82F6' },
    { name: 'server', value: 240, percentage: 24, color: '#EF4444' },
    { name: 'network', value: 220, percentage: 22, color: '#8B5CF6' },
    { name: 'database', value: 200, percentage: 20, color: '#F59E0B' },
    { name: 'validation', value: 150, percentage: 15, color: '#10B981' },
    { name: 'auth', value: 40, percentage: 4, color: '#6366F1' },
    { name: 'business', value: 20, percentage: 2, color: '#EC4899' }
];

const mockSeverityData: ErrorTypeItem[] = [
    { name: 'critical', value: 120, percentage: 12, color: '#EF4444' },
    { name: 'high', value: 280, percentage: 28, color: '#F59E0B' },
    { name: 'medium', value: 420, percentage: 42, color: '#3B82F6' },
    { name: 'low', value: 180, percentage: 18, color: '#10B981' }
];

const mockTrendData: ErrorTrendItem[] = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const formattedDate = date.toISOString().split('T')[0];

    const isWeekend = [0, 6].includes(date.getDay());
    const baseValue = isWeekend ? 80 : 50;
    const randomVariation = Math.floor(Math.random() * 30);

    return {
        date: formattedDate,
        value: baseValue + randomVariation,
        client: Math.floor((baseValue + randomVariation) * 0.7),
        server: Math.floor((baseValue + randomVariation) * 0.3)
    };
});

const mockRecentErrors: RecentErrorItem[] = [
    {
        id: 'err-001',
        message: 'Failed to load user data: Network timeout',
        type: 'network',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        status: 408,
        path: '/api/users/profile',
        color: '#8B5CF6'
    },
    {
        id: 'err-002',
        message: 'Authentication failed: Invalid token',
        type: 'auth',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        status: 401,
        path: '/api/auth/validate',
        color: '#6366F1'
    },
    {
        id: 'err-003',
        message: 'Server error: Database connection failed',
        type: 'database',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        status: 500,
        path: '/api/products/list',
        color: '#F59E0B'
    },
    {
        id: 'err-004',
        message: 'Validation error: Required field missing',
        type: 'validation',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        status: 400,
        path: '/api/orders/create',
        color: '#10B981'
    },
    {
        id: 'err-005',
        message: 'Client-side rendering error: Component failed',
        type: 'client',
        timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
        status: 0,
        path: '/dashboard/analytics',
        color: '#3B82F6'
    }
];

const mockRecentLogs: RecentLogItem[] = [
    {
        id: 'log-001',
        message: 'User login successful',
        level: 'info',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        source: 'AuthService'
    },
    {
        id: 'log-002',
        message: 'API rate limit approaching threshold',
        level: 'warning',
        timestamp: new Date(Date.now() - 23 * 60000).toISOString(),
        source: 'RateLimiter'
    },
    {
        id: 'log-003',
        message: 'Database query executed in 1.2s',
        level: 'debug',
        timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
        source: 'DatabaseService'
    },
    {
        id: 'log-004',
        message: 'Payment processing failed',
        level: 'error',
        timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
        source: 'PaymentGateway'
    },
    {
        id: 'log-005',
        message: 'System backup completed',
        level: 'info',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        source: 'BackupService'
    }
];

export default function TestPage() {
    const [errorTypeData] = React.useState<ErrorTypeItem[]>(mockErrorTypes);
    const [severityData] = React.useState<ErrorTypeItem[]>(mockSeverityData);
    const [trendData] = React.useState<ErrorTrendItem[]>(mockTrendData);
    const [recentErrors] = React.useState<RecentErrorItem[]>(mockRecentErrors);
    const [recentLogs] = React.useState<RecentLogItem[]>(mockRecentLogs);

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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                            <CardTitle className="font-medium">Total Errors</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold">1,238</div>
                            <div className="text-green-600">+12%</div>
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
                            <div className="text-2xl font-bold">2.4%</div>
                            <div className="text-red-600">-0.3%</div>
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
                            <div className="text-2xl font-bold">3.2h</div>
                            <div className="text-red-600">+20min</div>
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
                            <div className="text-2xl font-bold">97.8%</div>
                            <div className="text-red-600">-0.2%</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
        </div>
    );
}