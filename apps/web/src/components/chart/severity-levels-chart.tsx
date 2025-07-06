'use client';

import React, { JSX } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@better-analytics/ui/components/skeleton';
import { ErrorTypeItem } from './types';

export type SeverityLevelsChartProps = {
    data: ErrorTypeItem[];
    loading?: boolean;
}

export type PieChartLabelProps = {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    index?: number;
    name?: string;
    value?: number;
}

export type CustomTooltipProps = {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        color?: string;
        dataKey?: string;
        payload?: any;
    }>;
    label?: string;
}

export function SeverityLevelsChartSkeleton() {
    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex justify-end w-full pt-3">
                <Skeleton className="h-3 w-55 mr-2" />
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
                <Skeleton className="size-40 rounded-full" />
            </div>
        </div>
    );
}

const CustomTooltip = (props: CustomTooltipProps): JSX.Element | null => {
    if (!props.active || !props.payload || !props.payload.length) return null;

    return (
        <div className="border shadow-sm bg-background px-3 py-2 min-w-[7.5rem]">
            {props.payload.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload.color }} />
                        <span className="text-xs capitalize">{entry.payload.name}</span>
                    </div>
                    <span className="text-xs font-medium">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const renderPieChartLabel = (props: PieChartLabelProps): string => {
    const percentage = props.percent ? `${(props.percent * 100).toFixed(0)}%` : '';
    return `${props.name || ''}: ${percentage}`;
};

export function SeverityLevelsChart(props: SeverityLevelsChartProps) {
    if (props.loading) {
        return <SeverityLevelsChartSkeleton />;
    }

    return (
        <ResponsiveContainer>
            <PieChart>
                <defs>
                    {props.data.map((entry, index) => (
                        <pattern
                            key={`pattern-${index}`}
                            id={`pattern-${entry.name}`}
                            patternUnits="userSpaceOnUse"
                            width={8}
                            height={8}
                        >
                            <rect width={8} height={8} fill={entry.color} fillOpacity={0.3} />
                            <path d="M0 8 L8 0" stroke={entry.color} strokeWidth={1} />
                        </pattern>
                    ))}
                </defs>
                <Pie
                    data={props.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={renderPieChartLabel}
                >
                    {props.data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={`url(#pattern-${entry.name})`}
                            stroke={entry.color}
                            strokeWidth={1}
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                    iconSize={8}
                    layout="horizontal"
                    verticalAlign="top"
                    align="right"
                />
            </PieChart>
        </ResponsiveContainer>
    );
}