import type { AnalysisInsight, ChartData } from './types';

/**
 * Processes an analysis insight and creates chart data if applicable
 */
export function processInsight(insight: AnalysisInsight, queryResult: Record<string, unknown>[]): AnalysisInsight {
    const processedInsight = { ...insight, data: queryResult };

    // Create chart data for chart insights
    if (insight.type === 'chart' && insight.chartSpec && queryResult.length > 0) {
        const valueKeys = insight.chartSpec.valueKeys || [];
        const primaryValueKey = valueKeys[0]?.key || 'value';

        processedInsight.chartData = {
            title: insight.chartSpec.title,
            description: insight.chartSpec.description || '',
            type: insight.chartSpec.type as ChartData['type'],
            data: queryResult,
            xAxisKey: insight.chartSpec.categoryKey,
            yAxisKey: primaryValueKey,
            colorScheme: valueKeys.map((v: any) => v.color),
            config: valueKeys.reduce((acc: any, vk: any) => ({
                ...acc,
                [vk.key]: {
                    label: vk.label,
                    color: vk.color
                }
            }), {})
        };
    }

    return processedInsight;
}



/**
 * Builds final response content from processed insights
 */
export function buildResponseContent(insights: AnalysisInsight[]): {
    content: string;
    hasCharts: boolean;
    finalChartData: ChartData | null;
} {
    let content = '';
    let hasCharts = false;
    let finalChartData: ChartData | null = null;
    const processedTexts = new Set<string>();

    for (const insight of insights) {
        if (insight.prose) {
            const normalizedProse = insight.prose.trim();

            if (!processedTexts.has(normalizedProse)) {
                processedTexts.add(normalizedProse);
                content += normalizedProse + '\n\n';
            }
        }

        if (insight.chartData) {
            hasCharts = true;
            finalChartData = insight.chartData;
        }
    }

    return {
        content: content.trim(),
        hasCharts,
        finalChartData
    };
}

/**
 * Generates welcome message with examples
 */
export function generateWelcomeMessage(): string {
    const examples = [
        "What's the most common error stack trace and how do I fix it?",
        "Show me 404 errors - what's causing them?",
        "Analyze critical errors by browser",
        "What errors happened in the last hour?",
        "Show me error trends over the last 7 days",
        "Which pages have the most errors?",
    ];

    return `Hello! I'm your Better Analytics AI assistant and debugging specialist. I can help you analyze your data, understand error patterns, and provide **actionable solutions** to fix issues in your application.

I'm especially good at:
🔍 **Error Analysis** - Finding root causes and providing specific fix steps
📊 **Data Visualization** - Creating charts and graphs from your data
🛠️ **Debugging Help** - Giving you concrete steps to resolve issues
📈 **Performance Insights** - Understanding trends and patterns

Try asking me questions like:

${examples.map((prompt: string) => `• "${prompt}"`).join("\n")}

I'll analyze your actual data and give you specific, actionable advice - not generic responses!`;
} 