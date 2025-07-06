import React, { Suspense } from 'react';
import { ErrorsConsole } from './components/errors-console';
import { ErrorsAnalytics } from './components/errors-analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@better-analytics/ui/components/tabs';

export default function ErrorsPage() {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Error Tracking</h1>
                    <p className="text-muted-foreground">Monitor, analyze, and resolve application errors</p>
                </div>
            </div>

            <Tabs defaultValue="console" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="console">Error Console</TabsTrigger>
                    <TabsTrigger value="analytics">Error Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="console" className="flex-1 mt-4">
                    <Suspense fallback={<div className="flex justify-center items-center h-full">Loading errors...</div>}>
                        <ErrorsConsole />
                    </Suspense>
                </TabsContent>

                <TabsContent value="analytics" className="flex-1 mt-4">
                    <Suspense fallback={<div className="flex justify-center items-center h-full">Loading analytics...</div>}>
                        <ErrorsAnalytics />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
} 