"use client";

import React from "react";
import {
    Area,
    AreaChart as RechartsAreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { format } from '@better-analytics/ui';

type ToolTipContentProps = {
    payload?: Array<{
        value: number;
        payload: {
            date: string;
            value: number;
            currency?: string;
            [key: string]: any;
        };
        [key: string]: any;
    }>;
    active?: boolean;
};

const ToolTipContent = ({ payload, active }: ToolTipContentProps) => {
    if (!active || !payload || !payload.length) return null;

    const { value = 0, date, currency } = payload[0]?.payload ?? {};
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'EUR',
        minimumFractionDigits: 2,
    }).format(value);

    return (
        <div className="w-[240px] border shadow-sm bg-background">
            <div className="py-2 px-3">
                <div className="flex items-center justify-between">
                    <p className="font-medium text-[13px]">
                        {formattedValue}
                    </p>
                    <p className="text-xs text-muted-foreground text-right">
                        {date && format(new Date(date), "MMM d, yyyy")}
                    </p>
                </div>
            </div>
        </div>
    );
};

type AreaChartProps = {
    data: Array<{
        value: number;
        date: string;
        currency?: string;
    }>;
    height?: number;
    valueKey?: string;
    dateKey?: string;
    stroke?: string;
    fill?: string;
};

export function AreaChart({
    data,
    height = 300,
    valueKey = "value",
    dateKey = "date",
    stroke = "white",
    fill = "url(#raster)"
}: AreaChartProps) {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                    <defs>
                        <pattern
                            id="raster"
                            patternUnits="userSpaceOnUse"
                            width={8}
                            height={8}
                        >
                            <path d="M0 8 L8 0" stroke="#282828" strokeWidth={1} />
                        </pattern>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        horizontal={true}
                        className="stroke-[#DCDAD2] dark:stroke-[#2C2C2C]"
                    />

                    <XAxis
                        dataKey={dateKey}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={true}
                        tickMargin={10}
                        tickFormatter={(value) => format(new Date(value), "MMM")}
                        tick={{
                            fill: "#606060",
                            fontSize: 12,
                            fontFamily: "var(--font-sans)",
                            dy: 10,
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

                    <Tooltip
                        content={(props) => <ToolTipContent {...props} />}
                        cursor={false}
                    />

                    <Area
                        type="monotone"
                        dataKey={valueKey}
                        stroke={stroke}
                        strokeWidth={3}
                        fill={fill}
                        activeDot={(props) => {
                            const { cx, cy } = props;
                            return (
                                <g>
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={6}
                                        fill="#121212"
                                        stroke="none"
                                    />
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={6}
                                        fill="none"
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                </g>
                            );
                        }}
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
}