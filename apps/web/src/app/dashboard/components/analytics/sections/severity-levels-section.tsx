'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { SeverityLevelsChart } from '@/components/chart/severity-levels-chart';
import type { ErrorTypeItem } from '@/components/chart/types';
import { useTimeFilter } from '../time-filter-context';

export const SeverityLevelsSection = () => {
    const { timeFilter } = useTimeFilter();

    // Log the current filter value
    console.log('Current time filter in severity section:', timeFilter);

    // Static mock data
    const severityData: ErrorTypeItem[] = [
        { name: 'critical', value: 120, percentage: 12, color: '#EF4444' },
        { name: 'high', value: 280, percentage: 28, color: '#F59E0B' },
        { name: 'medium', value: 420, percentage: 42, color: '#3B82F6' },
        { name: 'low', value: 180, percentage: 18, color: '#10B981' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Severity Levels</CardTitle>
                <CardDescription>Error severity distribution and impact assessment</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
                <SeverityLevelsChart data={severityData} />
            </CardContent>
        </Card>
    );
};