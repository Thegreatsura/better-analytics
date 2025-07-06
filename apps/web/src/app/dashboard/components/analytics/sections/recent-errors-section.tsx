'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { RecentErrorsChart, RecentErrorItem } from '@/components/chart/recent-errors-chart';
import { useTimeFilter } from '../time-filter-context';

export const RecentErrorsSection = () => {
    const { timeFilter } = useTimeFilter();

    // Log the current filter value
    console.log('Current time filter:', timeFilter);

    // Static mock data - no async loading
    const recentErrors: RecentErrorItem[] = [
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest error events from your application</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentErrorsChart data={recentErrors} />
            </CardContent>
        </Card>
    );
};