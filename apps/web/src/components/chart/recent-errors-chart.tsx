'use client';

import React, { type JSX } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@better-analytics/ui/components/card';

interface RecentErrorsChartProps {
    data: {
        hour: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    }[];
}

const EmptyState = () => (
    <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No error data for the last 24 hours.</p>
    </div>
);

type CustomTooltipProps = {
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

const CustomTooltip = (props: CustomTooltipProps): JSX.Element | null => {
    if (!props.active || !props.payload || !props.payload.length) return null;

    const data = props.payload[0]?.payload;
    if (!data) return null;

    const formatHour = (hour: number) => {
        const time = new Date();
        time.setHours(hour, 0, 0, 0);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="border shadow-sm bg-background px-3 py-2 min-w-[10rem]">
            <p className="text-sm font-medium mb-2">{formatHour(data.hour)}</p>
            <div className="space-y-1">
                {data.critical > 0 && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span className="text-xs">Critical</span>
                        </div>
                        <span className="text-xs font-medium">{data.critical}</span>
                    </div>
                )}
                {data.high > 0 && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                            <span className="text-xs">High</span>
                        </div>
                        <span className="text-xs font-medium">{data.high}</span>
                    </div>
                )}
                {data.medium > 0 && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span className="text-xs">Medium</span>
                        </div>
                        <span className="text-xs font-medium">{data.medium}</span>
                    </div>
                )}
                {data.low > 0 && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="text-xs">Low</span>
                        </div>
                        <span className="text-xs font-medium">{data.low}</span>
                    </div>
                )}
                <div className="border-t pt-1 mt-2">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium">Total</span>
                        <span className="text-xs font-medium">{data.total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function RecentErrorsChart({ data }: RecentErrorsChartProps) {
    const hasData = data && data.some(d => d.total > 0);

    if (!hasData) {
        return <EmptyState />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <defs>
                    <pattern
                        id="pattern-critical"
                        patternUnits="userSpaceOnUse"
                        width={8}
                        height={8}
                    >
                        <rect width={8} height={8} fill="#EF4444" fillOpacity={0.3} />
                        <path d="M0 8 L8 0" stroke="#EF4444" strokeWidth={1} />
                    </pattern>
                    <pattern
                        id="pattern-high"
                        patternUnits="userSpaceOnUse"
                        width={8}
                        height={8}
                    >
                        <rect width={8} height={8} fill="#F59E0B" fillOpacity={0.3} />
                        <path d="M0 8 L8 0" stroke="#F59E0B" strokeWidth={1} />
                    </pattern>
                    <pattern
                        id="pattern-medium"
                        patternUnits="userSpaceOnUse"
                        width={8}
                        height={8}
                    >
                        <rect width={8} height={8} fill="#3B82F6" fillOpacity={0.3} />
                        <path d="M0 8 L8 0" stroke="#3B82F6" strokeWidth={1} />
                    </pattern>
                    <pattern
                        id="pattern-low"
                        patternUnits="userSpaceOnUse"
                        width={8}
                        height={8}
                    >
                        <rect width={8} height={8} fill="#10B981" fillOpacity={0.3} />
                        <path d="M0 8 L8 0" stroke="#10B981" strokeWidth={1} />
                    </pattern>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-[#DCDAD2] dark:stroke-[#2C2C2C]"
                />
                <XAxis
                    dataKey="hour"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={true}
                    tickMargin={10}
                    tick={{
                        fill: "#606060",
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                    }}
                    tickFormatter={(hour) => `${hour}:00`}
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
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => {
                        // Determine the most severe error type for coloring
                        let fill = "url(#pattern-low)";
                        let stroke = "#10B981";

                        if (entry.critical > 0) {
                            fill = "url(#pattern-critical)";
                            stroke = "#EF4444";
                        } else if (entry.high > 0) {
                            fill = "url(#pattern-high)";
                            stroke = "#F59E0B";
                        } else if (entry.medium > 0) {
                            fill = "url(#pattern-medium)";
                            stroke = "#3B82F6";
                        }

                        return (
                            <Cell
                                key={`cell-${entry.hour}`}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={1}
                            />
                        );
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}