'use client';

import { ChartRenderer } from './chart-renderer';
import type { AnalysisInsight } from '../types';

interface InsightRendererProps {
    insights: AnalysisInsight[];
}

export function InsightRenderer({ insights }: InsightRendererProps) {
    if (!insights || insights.length === 0) return null;

    return (
        <div className="mt-3 space-y-4">
            {insights.map((insight, index) => (
                <div key={`insight-${index}-${insight.type}`} className="space-y-2">
                    {/* Chart Insight */}
                    {insight.type === 'chart' && insight.chartData && (
                        <div className="bg-muted/30 border border-border/50 rounded-lg p-2">
                            <ChartRenderer chartData={insight.chartData} />
                        </div>
                    )}

                    {/* Metric Insight */}
                    {insight.type === 'metric' && insight.data && insight.data.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {String(insight.data[0]?.count || insight.data[0]?.total || Object.values(insight.data[0] || {})[0] || 'N/A')}
                                </div>
                                <div className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                                    {String(insight.data[0]?.message || 'Metric')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Text Insight - Skip rendering as it's already shown in the main message content */}
                </div>
            ))}
        </div>
    );
} 