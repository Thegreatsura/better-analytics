"use client";

import React from "react";
import {
    Bar,
    BarChart as RechartsBarChart,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    LabelList,
} from "recharts";
import { Chart } from "@better-analytics/ui/components/chart";
import { cn } from "@better-analytics/ui";
import { Button } from "../button";

type ErrorCategoryData = {
    name: string;
    value: number;
    percentage: number;
    color: string;
};

type HorizontalBarChartProps = {
    data: ErrorCategoryData[];
    title?: string;
    height?: number;
    period?: string;
};

const CustomTooltip = ({ active, payload }: { active?: boolean, payload?: any[] }) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const data = payload[0].payload;

    return (
        <div className="border bg-background p-2 shadow-sm">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm text-muted-foreground">
                {data.value} errors ({data.percentage}%)
            </p>
        </div>
    );
};

const CustomizedAxisTick = (props: any) => {
    const { x, y, payload, data } = props;

    // Find the matching data item for this tick
    const dataItem = data.find((d: ErrorCategoryData) => d.name === payload.value);

    return (
        <g transform={`translate(${x},${y})`}>
            <circle
                cx={-90}
                cy={0}
                r={4}
                fill={dataItem?.color || "#999999"}
            />
            <text
                x={-80}
                y={0}
                dy={4}
                textAnchor="start"
                fill="#ffffff"
                fontSize={12}
                fontFamily="var(--font-sans)"
            >
                {payload.value}
            </text>
        </g>
    );
};

export function HorizontalBarChart({
    data,
    title = "Errors",
    height = 300,
    period = "This month"
}: HorizontalBarChartProps) {

    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="relative w-full h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Button variant="outline">
                    {period}
                </Button>
            </div>

            <Chart config={{}}>
                <RechartsBarChart
                    data={sortedData}
                    layout="vertical"
                    barSize={8}
                >
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                        hide={true}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        width={100}
                        tick={(props) => <CustomizedAxisTick {...props} data={sortedData} />}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="percentage"
                        radius={0}
                        background={{ fill: "#222222" }}
                        minPointSize={2}
                        isAnimationActive={true}
                    >
                        {sortedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </RechartsBarChart>
            </Chart>
        </div>
    );
}