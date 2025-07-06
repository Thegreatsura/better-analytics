import React, { Suspense } from 'react';
import { LogsConsole } from './components/logs-console';

export default function ConsolePage() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
                <Suspense fallback={<div className="flex justify-center items-center h-full">Loading...</div>}>
                    <LogsConsole />
                </Suspense>
            </div>
        </div>
    );
} 