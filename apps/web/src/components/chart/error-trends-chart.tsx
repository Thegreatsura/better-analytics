'use client';

import React, { JSX } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@better-analytics/ui/components/skeleton';
import { format } from '@better-analytics/ui';
import { ErrorTrendItem } from './types';

export type ErrorTrendsChartProps = {
    data: ErrorTrendItem[];
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

export function ErrorTrendsChartSkeleton() {
    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex justify-end w-full mb-2">
                <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex-1 w-full">
                <Skeleton className="w-full h-full rounded-md" />
            </div>
        </div>
    );
}

const CustomTooltip = (props: CustomTooltipProps): JSX.Element | null => {
    if (!props.active || !props.payload || !props.payload.length) return null;

    const date = props.payload[0]?.payload?.date;

    return (
        <div className="border shadow-sm bg-background px-3 py-2 min-w-[7.5rem]">
            <p className="text-xs font-medium mb-1.5">
                {date && format(new Date(date), "MMM d, yyyy")}
            </p>
            {props.payload.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs capitalize">{entry.name}</span>
                    </div>
                    <span className="text-xs font-medium">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export function ErrorTrendsChart(props: ErrorTrendsChartProps) {
    if (props.loading) {
        return <ErrorTrendsChartSkeleton />;
    }

    return (
        <ResponsiveContainer>
            <AreaChart
                data={props.data}
                margin={{ bottom: 20 }}
            >
                <defs>
                    <pattern id="patternClient" patternUnits="userSpaceOnUse" width={8} height={8}>
                        <rect width={8} height={8} fill="#3B82F6" fillOpacity={0.3} />
                        <path d="M0 8 L8 0" stroke="#3B82F6" strokeWidth={1} />
                    </pattern>
                    <pattern id="patternServer" patternUnits="userSpaceOnUse" width={8} height={8}>
                        <rect width={8} height={8} fill="#EF4444" fillOpacity={0.3} />
                        <path d="M0 8 L8 0" stroke="#EF4444" strokeWidth={1} />
                    </pattern>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-[#DCDAD2] dark:stroke-[#2C2C2C]"
                />
                <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={true}
                    tickMargin={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickFormatter={(date: string) => {
                        if (typeof date !== 'string') return '';
                        return format(new Date(date), "MMM d");
                    }}
                    tick={{
                        fill: "#606060",
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                    }}
                />
                <YAxis
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
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Legend
                    formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                    iconSize={8}
                    layout="horizontal"
                    verticalAlign="top"
                    align="right"
                />
                <Area
                    type="monotone"
                    dataKey="client"
                    stackId="1"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    fill="url(#patternClient)"
                    name="Client Errors"
                    activeDot={(props) => {
                        const { cx, cy } = props;
                        return (
                            <g>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill="#121212"
                                    stroke="none"
                                />
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth={1.5}
                                />
                            </g>
                        );
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="server"
                    stackId="1"
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    fill="url(#patternServer)"
                    name="Server Errors"
                    activeDot={(props) => {
                        const { cx, cy } = props;
                        return (
                            <g>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill="#121212"
                                    stroke="none"
                                />
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill="none"
                                    stroke="#EF4444"
                                    strokeWidth={1.5}
                                />
                            </g>
                        );
                    }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}