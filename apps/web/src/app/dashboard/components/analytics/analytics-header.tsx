"use client"

import { Button } from "@better-analytics/ui/components/button";
import { useTimeFilter } from "./time-filter-context";
import { Tabs, TabsList, TabsTrigger } from "@better-analytics/ui/components/tabs";
import { cn } from "@better-analytics/ui";
import { CircleNotch } from "@phosphor-icons/react";

export const AnalyticsHeader = () => {
    const { timeFilter, setTimeFilter, isLoading } = useTimeFilter();

    const handleTimeFilterChange = (value: string) => {
        if (isLoading) return; // Block all changes while loading
        setTimeFilter(value as 'realtime' | 'hourly' | 'weekly' | 'monthly');
    };

    const Loader = () => (
        <CircleNotch size={32} className="mr-1.5 animate-spin" />
    );

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Monitor your application's health and performance
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Tabs
                    defaultValue="realtime"
                    value={timeFilter}
                    onValueChange={handleTimeFilterChange}
                    className="mr-4"
                >
                    <TabsList>
                        <TabsTrigger
                            value="realtime"
                            disabled={isLoading && timeFilter !== 'realtime'}
                            className="relative cursor-pointer"
                        >
                            {isLoading && timeFilter === 'realtime' && <Loader />}
                            Real-time
                        </TabsTrigger>
                        <TabsTrigger
                            value="hourly"
                            disabled={isLoading && timeFilter !== 'hourly'}
                            className="relative cursor-pointer"
                        >
                            {isLoading && timeFilter === 'hourly' && <Loader />}
                            Hourly
                        </TabsTrigger>
                        <TabsTrigger
                            value="weekly"
                            disabled={isLoading && timeFilter !== 'weekly'}
                            className="relative cursor-pointer"
                        >
                            {isLoading && timeFilter === 'weekly' && <Loader />}
                            Weekly
                        </TabsTrigger>
                        <TabsTrigger
                            value="monthly"
                            disabled={isLoading && timeFilter !== 'monthly'}
                            className="relative cursor-pointer"
                        >
                            {isLoading && timeFilter === 'monthly' && <Loader />}
                            Monthly
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className={cn(
                            isLoading && "!cursor-not-allowed"
                        )}
                    >
                        Export Data
                    </Button>
                    <Button
                        size="sm"
                        disabled={isLoading}
                        className={cn(
                            isLoading && "!cursor-not-allowed"
                        )}
                    >
                        Generate Report
                    </Button>
                </div>
            </div>
        </div>
    );
};