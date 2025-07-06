// ============================================================================
// SHARED AI TYPES
// ============================================================================

// Chart data interface
export interface ChartData {
    title: string;
    description: string;
    type: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radial';
    data: Array<Record<string, unknown>>;
    xAxisKey: string;
    yAxisKey: string;
    colorScheme?: string[];
    config: Record<string, { label: string; color: string }>;
}

// Analysis insight from AI
export interface AnalysisInsight {
    type: 'chart' | 'metric' | 'text';
    thinking: string;
    query: string | null;
    prose: string;
    chartSpec?: {
        type: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter';
        title: string;
        description: string;
        categoryKey: string;
        valueKeys: Array<{
            key: string;
            label: string;
            color: string;
        }>;
    };
    data?: Record<string, unknown>[] | null;
    chartData?: ChartData | null;
}

// Analysis plan from AI
export interface AnalysisPlan {
    analysis: {
        insights: AnalysisInsight[];
    };
}

// Tool call for UI feedback
export interface ToolCall {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    description: string;
    result?: unknown;
}

// Chat message
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    chartData?: ChartData;
    insights?: AnalysisInsight[];
    toolCalls?: ToolCall[];
    isStreaming?: boolean;
    timestamp: number;
}

// Streaming update from API
export interface StreamingUpdate {
    type: 'thinking' | 'progress' | 'complete' | 'error';
    content: string;
    data?: {
        hasVisualization?: boolean;
        chartType?: string;
        data?: Record<string, unknown>[];
        responseType?: 'chart' | 'text' | 'metric';
        metricValue?: string | number;
        metricLabel?: string;
        chartData?: ChartData;
        insights?: AnalysisInsight[];
    };
    debugInfo?: Record<string, unknown>;
} 