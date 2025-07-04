"use client";

import React from "react";
import { AreaChart } from "@better-analytics/ui/components/chart/area-chart";
import { BarChart } from "@better-analytics/ui/components/chart/bar-chart";
import { StackedBarChart } from "@better-analytics/ui/components/chart/stacked-bar-chart";
import { HorizontalBarChart } from "@better-analytics/ui/components/chart/horizontal-bar-chart";

const areaChartData = [
    { value: 1000, date: "2025-06-04", currency: "USD" },
    { value: 4000, date: "2025-06-10", currency: "USD" },
    { value: 3000, date: "2025-06-15", currency: "USD" },
    { value: 12000, date: "2025-06-20", currency: "USD" },
    { value: 5000, date: "2025-06-25", currency: "USD" },
    { value: 6000, date: "2025-06-30", currency: "USD" },
    { value: 4500, date: "2025-07-04", currency: "USD" },
];

const barChartData = {
    summary: {
        currency: "USD",
        currentTotal: 50000,
        prevTotal: 30000,
    },
    meta: {
        type: "revenue",
        period: "weekly",
        currency: "USD",
    },
    result: [
        {
            date: "2025-06-04",
            previous: { date: "2025-05-28", currency: "USD", value: 10000 },
            current: { date: "2025-06-04", currency: "USD", value: 20300 },
            percentage: { value: 103, status: "positive" },
        },
        {
            date: "2025-06-11",
            previous: { date: "2025-06-04", currency: "USD", value: 20300 },
            current: { date: "2025-06-11", currency: "USD", value: 28000 },
            percentage: { value: 37.9, status: "positive" },
        },
        {
            date: "2025-06-18",
            previous: { date: "2025-06-11", currency: "USD", value: 28000 },
            current: { date: "2025-06-18", currency: "USD", value: -5000 },
            percentage: { value: -10.7, status: "negative" },
        },
        {
            date: "2025-06-25",
            previous: { date: "2025-06-18", currency: "USD", value: -5000 },
            current: { date: "2025-06-25", currency: "USD", value: 31000 },
            percentage: { value: 24, status: "positive" },
        },
        {
            date: "2025-07-02",
            previous: { date: "2025-06-25", currency: "USD", value: 31000 },
            current: { date: "2025-07-02", currency: "USD", value: 50000 },
            percentage: { value: 61.3, status: "positive" },
        },
    ],
};

const stackedBarChartData = {
    summary: {
        currency: "USD",
        averageExpense: 800000,
    },
    meta: {
        type: "expense",
        period: "weekly",
        currency: "USD",
    },
    result: [
        {
            date: "2025-06-04",
            value: 19300,
            recurring: 1000,
            total: 20300,
            recurring_value: 1000,
            currency: "USD",
        },
        {
            date: "2025-06-11",
            value: 27000,
            recurring: 1000,
            total: 28000,
            recurring_value: 1000,
            currency: "USD",
        },
        {
            date: "2025-06-18",
            value: 24000,
            recurring: 1000,
            total: 25000,
            recurring_value: 1000,
            currency: "USD",
        },
        {
            date: "2025-06-25",
            value: 30000,
            recurring: 1000,
            total: 31000,
            recurring_value: 1000,
            currency: "USD",
        },
        {
            date: "2025-07-02",
            value: 49000,
            recurring: 1000,
            total: 50000,
            recurring_value: 1000,
            currency: "USD",
        },
    ],
};

const errorCategoriesData = [
    { name: "Validation", value: 352, percentage: 35, color: "#FFA500" }, // warning orange
    { name: "Database", value: 240, percentage: 24, color: "#FF4136" },   // destructive red
    { name: "Network", value: 220, percentage: 22, color: "#0074D9" },    // blue
    { name: "Auth", value: 200, percentage: 20, color: "#2ECC40" },       // green
    { name: "API", value: 150, percentage: 15, color: "#B10DC9" },        // purple
    { name: "UI", value: 40, percentage: 4, color: "#39CCCC" },           // teal
    { name: "Other", value: 20, percentage: 2, color: "#AAAAAA" },        // gray
];

export default function SandboxPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="space-y-32">
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Area Chart</h2>
                    <div className="h-96 w-full border border-border p-4">
                        <AreaChart data={areaChartData} />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Bar Chart</h2>
                    <div className="h-96 w-full border border-border p-4">
                        <BarChart data={barChartData} />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Stacked Bar Chart</h2>
                    <div className="h-96 w-full border border-border p-4">
                        <StackedBarChart data={stackedBarChartData} />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">Horizontal Bar Chart</h2>
                    <div className="h-96 max-w-xl border border-border p-4">
                        <HorizontalBarChart
                            data={errorCategoriesData}
                            title="Error Distribution"
                            period="This month"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}