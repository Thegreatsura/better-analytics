'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { ErrorTypesChart } from '@/components/chart/error-types-chart';
import { ErrorTypeItem } from '@/components/chart/types';
import { useTimeFilter } from '../time-filter-context';

export const ErrorTypesSection = () => {
    const { timeFilter } = useTimeFilter();

    // Log the current filter value
    console.log('Current time filter in error types section:', timeFilter);

    // Static mock data
    const errorTypeData: ErrorTypeItem[] = [
        { name: 'client', value: 352, percentage: 35, color: '#3B82F6' },
        { name: 'server', value: 240, percentage: 24, color: '#EF4444' },
        { name: 'network', value: 220, percentage: 22, color: '#8B5CF6' },
        { name: 'database', value: 200, percentage: 20, color: '#F59E0B' },
        { name: 'validation', value: 150, percentage: 15, color: '#10B981' },
        { name: 'auth', value: 40, percentage: 4, color: '#6366F1' },
        { name: 'business', value: 20, percentage: 2, color: '#EC4899' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Error Types</CardTitle>
                <CardDescription>Distribution of error types across your application</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
                <ErrorTypesChart data={errorTypeData} />
            </CardContent>
        </Card>
    );
};