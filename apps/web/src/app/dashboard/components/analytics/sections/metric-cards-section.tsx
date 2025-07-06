'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Activity, AlertTriangle, Bug, Shield } from 'lucide-react';
import { useTimeFilter } from '../time-filter-context';

export const MetricCardsSection = () => {
    const { timeFilter } = useTimeFilter();

    // Log the current filter value
    console.log('Current time filter in metric cards:', timeFilter);

    // Static metrics data based on the filter
    const metrics = {
        totalErrors: timeFilter === 'realtime' ? 1238 :
            timeFilter === 'hourly' ? 547 :
                timeFilter === 'weekly' ? 3490 : 5840,
        errorRate: timeFilter === 'realtime' ? 2.4 :
            timeFilter === 'hourly' ? 1.8 :
                timeFilter === 'weekly' ? 2.7 : 3.1,
        avgResolutionTime: timeFilter === 'realtime' ? 3.2 :
            timeFilter === 'hourly' ? 2.8 :
                timeFilter === 'weekly' ? 3.5 : 4.2,
        systemHealth: timeFilter === 'realtime' ? 97.8 :
            timeFilter === 'hourly' ? 98.2 :
                timeFilter === 'weekly' ? 97.5 : 96.9,
    };

    return (
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
                        <div className="text-2xl font-bold">{metrics.totalErrors.toLocaleString()}</div>
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
                        <div className="text-2xl font-bold">{metrics.errorRate}%</div>
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
                        <div className="text-2xl font-bold">{metrics.avgResolutionTime}h</div>
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
                        <div className="text-2xl font-bold">{metrics.systemHealth}%</div>
                        <div className="text-red-600">-0.2%</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};