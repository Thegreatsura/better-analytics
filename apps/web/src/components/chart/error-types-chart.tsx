'use client';

import React, { type JSX } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@better-analytics/ui/components/skeleton';
import type { ErrorTypeItem } from './types';

export type ErrorTypesChartProps = {
    data: ErrorTypeItem[];
    loading?: boolean;
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

const EmptyState = () => (
    <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No error type data available.</p>
    </div>
);

export function ErrorTypesChartSkeleton() {
    return (
        <Skeleton className="h-full w-full rounded-md" />
    );
}

const CustomTooltip = (props: CustomTooltipProps): JSX.Element | null => {
    if (!props.active || !props.payload || !props.payload.length) return null;

    return (
        <div className="border shadow-sm bg-background px-3 py-2 min-w-[7.5rem]">
            {props.payload.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between gap-4">
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

const formatYAxisTick = (value: string | number): string => {
    if (typeof value !== 'string') {
        return String(value);
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
};

export function ErrorTypesChart(props: ErrorTypesChartProps) {
    if (props.loading) {
        return <ErrorTypesChartSkeleton />;
    }

    if (!props.data || props.data.length === 0) {
        return <EmptyState />;
    }

    return (
        <ResponsiveContainer>
            <BarChart
                layout="vertical"
                data={props.data}
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                barCategoryGap={8}
            >
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
                <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-[#DCDAD2] dark:stroke-[#2C2C2C]"
                />
                <XAxis
                    type="number"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={true}
                    tickMargin={10}
                    domain={[0, 'auto']}
                    tick={{
                        fill: "#606060",
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                        dy: 10,
                    }}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{
                        fill: "#606060",
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                    }}
                    tickFormatter={formatYAxisTick}
                    interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {props.data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={`url(#pattern-${entry.name})`}
                            stroke={entry.color}
                            strokeWidth={1}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}