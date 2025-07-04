"use client";

import React from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Chart } from "@better-analytics/ui/components/chart";
import { format } from '@better-analytics/ui';

type ToolTipContentProps = {
    payload: any[];
    active?: boolean;
};

const ToolTipContent = ({ payload = [], active }: ToolTipContentProps) => {
    if (!active || !payload.length) return null;

    const current = payload[0]?.payload;

    if (!current) return null;

    return (
        <div className="w-[240px] border shadow-sm bg-background">
            <div className="border-b px-4 py-2 flex justify-between items-center">
                <p className="text-sm">{current.meta?.type || "Expense"}</p>
            </div>

            <div className="p-4">
                <div className="flex justify-between mb-2">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-[8px] h-[8px] bg-muted" />
                        <p className="font-medium text-[13px]">
                            {current.currency} {current.total.toLocaleString()}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-right">Total</p>
                </div>

                <div className="flex justify-between">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-[8px] h-[8px] bg-muted/50" />
                        <p className="font-medium text-[13px]">
                            {current.currency} {current.recurring.toLocaleString()}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-right">Recurring</p>
                </div>
            </div>
        </div>
    );
};

type StackedBarChartProps = {
    data: {
        summary: {
            currency: string;
            averageExpense: number;
        };
        meta: {
            type: string;
            period: string;
            currency: string;
        };
        result: Array<{
            date: string;
            value: number;
            recurring: number;
            total: number;
            recurring_value: number;
            currency: string;
        }>;
    };
    height?: number;
};

export function StackedBarChart({ data, height = 290 }: StackedBarChartProps) {
    const formattedData = data.result.map((item) => ({
        ...item,
        meta: data.meta,
        date: format(new Date(item.date), "MMM"),
    }));

    return (
        <div className="relative h-full w-full">
            <div className="absolute right-0 -top-10 hidden md:flex space-x-6">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-muted" />
                    <span className="text-sm text-muted-foreground">Total expenses</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-muted/50" />
                    <span className="text-sm text-muted-foreground">Recurring</span>
                </div>
            </div>

            <div className="w-full h-full">
                <Chart config={{}} className="w-full h-full">
                    <ComposedChart data={formattedData} barGap={15}>
                        <defs>
                            <pattern
                                id="raster"
                                patternUnits="userSpaceOnUse"
                                width="64"
                                height="64"
                            >
                                <rect
                                    width="64"
                                    height="64"
                                    className="fill-muted/50"
                                />
                                <path
                                    d="M-106 110L22 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-98 110L30 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-90 110L38 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-82 110L46 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-74 110L54 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-66 110L62 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-58 110L70 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-50 110L78 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-42 110L86 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-34 110L94 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-26 110L102 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-18 110L110 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-10 110L118 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M-2 110L126 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M6 110L134 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M14 110L142 -18"
                                    className="stroke-foreground/10"
                                />
                                <path
                                    d="M22 110L150 -18"
                                    className="stroke-foreground/10"
                                />
                            </pattern>
                        </defs>

                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={true}
                            tickMargin={10}
                            tick={{
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 12,
                                fontFamily: "var(--font-sans)",
                                dy: 10,
                            }}
                        />

                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickMargin={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 12,
                                fontFamily: "var(--font-sans)",
                            }}
                        />

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border"
                        />

                        <Tooltip content={ToolTipContent} cursor={false} />

                        <Bar
                            barSize={16}
                            dataKey="recurring"
                            stackId="a"
                            fill="url(#raster)"
                        />

                        <Bar
                            barSize={16}
                            dataKey="value"
                            stackId="a"
                            className="fill-muted"
                        />

                        <Line
                            type="monotone"
                            dataKey="recurring"
                            strokeWidth={2.5}
                            stroke="hsl(var(--border))"
                            dot={false}
                        />
                    </ComposedChart>
                </Chart>
            </div>
        </div>
    );
}