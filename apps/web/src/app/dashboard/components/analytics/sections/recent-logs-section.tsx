'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { RecentLogsChart, RecentLogItem } from '@/components/chart/recent-logs-chart';
import { useTimeFilter } from '../time-filter-context';

export const RecentLogsSection = () => {
    const { timeFilter } = useTimeFilter();

    // Log the current filter value
    console.log('Current time filter in logs section:', timeFilter);

    // Static mock data
    const recentLogs: RecentLogItem[] = [
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>Latest log entries from your application</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentLogsChart data={recentLogs} />
            </CardContent>
        </Card>
    );
};