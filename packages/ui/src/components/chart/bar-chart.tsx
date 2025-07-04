"use client";

import React from "react";
import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Cell,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceLine,
} from "recharts";
import { cn } from "@better-analytics/ui";
import { Chart } from "@better-analytics/ui/components/chart";
import { format } from '@better-analytics/ui';

type ToolTipContentProps = {
    payload: any[];
    active?: boolean;
};

const ToolTipContent = ({ payload = [], active }: ToolTipContentProps) => {
    if (!active || !payload.length) return null;

    const [current, previous] = payload;

    return (
        <div className="w-[240px] border shadow-sm bg-background">
            <div className="border-b px-4 py-2 flex justify-between items-center">
                <p className="text-sm">
                    {current?.payload?.meta?.type || "Data"}
                </p>
                <div>
                    {current?.payload.percentage?.value > 0 && (
                        <div className={cn(
                            "flex space-x-1 text-destructive items-center",
                            current?.payload.percentage?.status === "positive" && "text-green-500",
                        )}>
                            {current?.payload.percentage?.status === "positive" ? (
                                <span>↑</span>
                            ) : (
                                <span>↓</span>
                            )}
                            <p className="text-[12px] font-medium">{current?.payload.percentage.value}%</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between mb-2">
                    <div className="flex items-center justify-center space-x-2">
                        <div className={cn(
                            "w-[8px] h-[8px]",
                            (current?.payload?.current?.value < 0) ? "bg-destructive" : "bg-foreground"
                        )} />
                        <p className="font-medium text-[13px]">
                            {current?.payload?.meta?.currency} {current?.payload?.current?.value?.toLocaleString() || 0}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-right">
                        {current?.payload?.meta?.period === "weekly"
                            ? current?.payload?.current?.date &&
                            `Week ${format(new Date(current.payload.current.date), "ww, y")}`
                            : current?.payload?.current?.date &&
                            format(new Date(current.payload.current.date), "MMM, y")}
                    </p>
                </div>

                <div className="flex justify-between">
                    <div className="flex items-center justify-center space-x-2">
                        <div className={cn(
                            "w-[8px] h-[8px]",
                            (previous?.payload?.previous?.value < 0) ? "bg-destructive/70" : "bg-muted"
                        )} />
                        <p className="font-medium text-[13px]">
                            {current?.payload?.meta?.currency} {previous?.payload?.previous?.value?.toLocaleString() || 0}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-right">
                        {previous?.payload?.meta?.period === "weekly"
                            ? previous?.payload?.previous?.date &&
                            `Week ${format(new Date(previous.payload.previous.date), "ww, y")}`
                            : previous?.payload?.previous?.date &&
                            format(new Date(previous.payload.previous.date), "MMM, y")}
                    </p>
                </div>
            </div>
        </div>
    );
};

type BarChartProps = {
    data: {
        summary: {
            currency: string;
            currentTotal: number;
            prevTotal: number;
        };
        meta: {
            type: string;
            period: string;
            currency: string;
        };
        result: Array<{
            date: string;
            previous: {
                date: string;
                currency: string;
                value: number;
            };
            current: {
                date: string;
                currency: string;
                value: number;
            };
            percentage: {
                value: number;
                status: string;
            };
        }>;
    };
    height?: number;
};

export function BarChart({ data, height = 290 }: BarChartProps) {
    const formattedData = data?.result?.map((item) => ({
        ...item,
        meta: data.meta,
        date: format(new Date(item.date), data.meta.period === "weekly" ? "w" : "MMM"),
    }));

    const hasNegativeValues = React.useMemo(() => {
        return data?.result?.some(item =>
            item.current.value < 0 || item.previous.value < 0
        );
    }, [data?.result]);

    return (
        <div className="relative h-full w-full">
            <div className="absolute right-0 -top-10 hidden md:flex space-x-6">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-foreground" />
                    <span className="text-sm text-muted-foreground">Current Period</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-muted" />
                    <span className="text-sm text-muted-foreground">Last Period</span>
                </div>
            </div>

            <div className="w-full h-full">
                <Chart config={{}} className="w-full h-full">
                    <RechartsBarChart
                        data={formattedData}
                        barGap={15}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
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
                            domain={hasNegativeValues ? ['auto', 'auto'] : [0, 'auto']}
                            allowDecimals={false}
                        />

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border"
                        />

                        {hasNegativeValues && (
                            <ReferenceLine y={0} stroke="hsl(var(--border))" />
                        )}

                        <Tooltip content={ToolTipContent} cursor={false} />

                        <Bar dataKey="previous.value" barSize={16}>
                            {data?.result?.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    className={cn(
                                        entry.previous.value < 0 && "fill-destructive/70",
                                        entry.previous.value > 0 && "fill-muted",
                                        entry.previous.value === 0 && "fill-muted/50"
                                    )}
                                />
                            ))}
                        </Bar>

                        <Bar dataKey="current.value" barSize={16}>
                            {data?.result?.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}-current`}
                                    className={cn(
                                        entry.current.value < 0 && "fill-destructive",
                                        entry.current.value > 0 && "fill-foreground",
                                        entry.current.value === 0 && "fill-muted/30"
                                    )}
                                />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </Chart>
            </div>
        </div>
    );
}