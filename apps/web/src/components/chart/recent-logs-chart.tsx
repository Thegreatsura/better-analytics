'use client';

import React from 'react';
import { formatDistanceToNow } from '@better-analytics/ui';
import { Skeleton } from '@better-analytics/ui/components/skeleton';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export type RecentLogItem = {
    id: string;
    message: string;
    level: LogLevel;
    timestamp: string;
    source: string;
}

export type RecentLogsChartProps = {
    data: RecentLogItem[];
    loading?: boolean;
}

const getLevelColor = (level: LogLevel): string => {
    switch (level) {
        case 'error': return '#EF4444';
        case 'warning': return '#F59E0B';
        case 'info': return '#3B82F6';
        case 'debug': return '#10B981';
        default: return '#6B7280';
    }
};

export function RecentLogsChartSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-2">
                    <Skeleton className="h-2 w-2 rounded-full mr-2" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                    </div>
                    <Skeleton className="h-2 w-16 ml-2" />
                </div>
            ))}
        </div>
    );
}

export function RecentLogsChart(props: RecentLogsChartProps) {
    if (props.loading) {
        return <RecentLogsChartSkeleton />;
    }

    if (!props.data || props.data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[12rem]">
                <p className="text-xs text-muted-foreground">No recent logs</p>
            </div>
        );
    }

    // Sort data by timestamp (newest first)
    const sortedData = [...props.data].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5); // Only show latest 5

    return (
        <div className="space-y-2">
            {sortedData.map((log) => (
                <div key={log.id} className="flex items-start p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0" style={{ backgroundColor: getLevelColor(log.level) }} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                            <p className="text-xs font-medium line-clamp-1">{log.message}</p>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <span
                                className="inline-block px-1.5 py-0.5 rounded-sm text-[10px] uppercase mr-2"
                                style={{
                                    backgroundColor: `${getLevelColor(log.level)}20`,
                                    color: getLevelColor(log.level)
                                }}
                            >
                                {log.level}
                            </span>
                            <p className="line-clamp-1">{log.source}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}