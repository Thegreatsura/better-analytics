'use client';

import {
    Chart,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig
} from '@better-analytics/ui/components/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts';

import type { ChartData } from '../types';

interface ChartRendererProps {
    chartData: ChartData;
}

// Default color schemes for different chart types
const DEFAULT_COLORS = {
    primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'],
    error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
    warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    mixed: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
};

export function ChartRenderer({ chartData }: ChartRendererProps) {
    const { title, description, type, data, xAxisKey, yAxisKey, colorScheme, config } = chartData;

    // Use provided colors or default mixed palette
    const colors = colorScheme || DEFAULT_COLORS.mixed;

    // Get all value keys from config for multi-series support
    const valueKeys = Object.keys(config || {});
    const hasMultipleSeries = valueKeys.length > 1;

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {hasMultipleSeries ? (
                            // Multi-series bars
                            valueKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={config[key]?.color || colors[index % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))
                        ) : (
                            // Single series bar
                            <Bar
                                dataKey={yAxisKey}
                                fill={colors[0]}
                                radius={[4, 4, 0, 0]}
                            />
                        )}
                        {hasMultipleSeries && <ChartLegend content={<ChartLegendContent />} />}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {hasMultipleSeries ? (
                            // Multi-series lines
                            valueKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={config[key]?.color || colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))
                        ) : (
                            // Single series line
                            <Line
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={colors[0]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        )}
                        {hasMultipleSeries && <ChartLegend content={<ChartLegendContent />} />}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={xAxisKey}
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {hasMultipleSeries ? (
                            // Multi-series areas
                            valueKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={config[key]?.color || colors[index % colors.length]}
                                    fill={config[key]?.color || colors[index % colors.length]}
                                    fillOpacity={0.3}
                                />
                            ))
                        ) : (
                            // Single series area
                            <Area
                                type="monotone"
                                dataKey={yAxisKey}
                                stroke={colors[0]}
                                fill={colors[0]}
                                fillOpacity={0.3}
                            />
                        )}
                        {hasMultipleSeries && <ChartLegend content={<ChartLegendContent />} />}
                    </AreaChart>
                );

            case 'pie':
            case 'donut':
                return (
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={type === 'donut' ? 80 : 100}
                            innerRadius={type === 'donut' ? 40 : 0}
                            fill="#8884d8"
                            dataKey={yAxisKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                );

            case 'scatter':
                return (
                    <ScatterChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            dataKey={xAxisKey}
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <YAxis
                            type="number"
                            dataKey={yAxisKey}
                            tick={{ fontSize: 12 }}
                            tickMargin={8}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Scatter fill={colors[0]} />
                    </ScatterChart>
                );

            case 'radial':
                return (
                    <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="10%"
                        outerRadius="80%"
                        data={data}
                    >
                        <RadialBar
                            dataKey={yAxisKey}
                            cornerRadius={10}
                            fill={colors[0]}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                    </RadialBarChart>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <p>Unsupported chart type: {type}</p>
                    </div>
                );
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <Chart config={config} className="h-[400px] w-full">
                    {renderChart()}
                </Chart>
            </CardContent>
        </Card>
    );
} 