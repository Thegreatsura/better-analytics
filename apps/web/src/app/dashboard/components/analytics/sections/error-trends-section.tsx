'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { ErrorTrendsChart } from '@/components/chart/error-trends-chart';
import type { ErrorTrendItem } from '@/components/chart/types';
import { useTimeFilter } from '../time-filter-context';

export const ErrorTrendsSection = () => {
    const { timeFilter } = useTimeFilter();

    // Log the current filter value
    console.log('Current time filter in trends section:', timeFilter);

    // Generate static mock data based on time filter
    let trendData: ErrorTrendItem[] = [];

    if (timeFilter === 'realtime' || timeFilter === 'hourly') {
        // For realtime and hourly, generate hourly data points (24 hours)
        trendData = Array.from({ length: 24 }, (_, i) => {
            const date = new Date();
            date.setHours(date.getHours() - (23 - i));
            const formattedDate = date.toISOString().split('T')[0] + 'T' + date.getHours().toString().padStart(2, '0') + ':00:00';

            const isNight = date.getHours() < 6 || date.getHours() > 22;
            const baseValue = isNight ? 30 : 60;
            const randomVariation = Math.floor(Math.random() * 20);

            return {
                date: formattedDate,
                value: baseValue + randomVariation,
                client: Math.floor((baseValue + randomVariation) * 0.7),
                server: Math.floor((baseValue + randomVariation) * 0.3)
            };
        });
    } else if (timeFilter === 'weekly') {
        // For weekly, generate daily data points (14 days)
        trendData = Array.from({ length: 14 }, (_, i) => {
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
    } else {
        // For monthly, generate daily data points (30 days)
        trendData = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
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
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Error Trends</CardTitle>
                <CardDescription>
                    Error patterns over {timeFilter === 'realtime' ? 'the past 24 hours' :
                        timeFilter === 'hourly' ? 'the past day' :
                            timeFilter === 'weekly' ? 'the past two weeks' :
                                'the past month'}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-64">
                <ErrorTrendsChart data={trendData} />
            </CardContent>
        </Card>
    );
};