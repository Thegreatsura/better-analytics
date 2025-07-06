import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from "ai";
import { chQuery } from "@better-analytics/db/clickhouse";
import { z } from "zod";
import { auth } from '@better-analytics/auth';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingUpdate {
    type: 'thinking' | 'progress' | 'complete' | 'error';
    content: string;
    data?: {
        hasVisualization?: boolean;
        chartType?: string;
        data?: any[];
        responseType?: 'chart' | 'text' | 'metric';
        metricValue?: string | number;
        metricLabel?: string;
        chartData?: any;
    };
    debugInfo?: Record<string, unknown>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = 'google/gemini-2.0-flash-001';

const openrouterClient = createOpenRouter({
    apiKey: OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const FORBIDDEN_SQL_KEYWORDS = [
    'INSERT INTO', 'UPDATE SET', 'DELETE FROM', 'DROP TABLE', 'DROP DATABASE',
    'CREATE TABLE', 'CREATE DATABASE', 'ALTER TABLE', 'EXEC ', 'EXECUTE ',
    'TRUNCATE', 'MERGE', 'BULK', 'RESTORE', 'BACKUP'
] as const;

// Database schema information based on init-db.ts
const ErrorsSchema = {
    table: 'errors',
    columns: [
        { name: 'id', type: 'UUID', description: 'Unique error identifier' },
        { name: 'error_type', type: 'Enum8', description: 'Type of error (client, server, network, database, validation, auth, business, unknown)' },
        { name: 'severity', type: 'Enum8', description: 'Error severity level (low, medium, high, critical)' },
        { name: 'error_code', type: 'LowCardinality(String)', description: 'Error code identifier' },
        { name: 'error_name', type: 'LowCardinality(String)', description: 'Error name/type' },
        { name: 'message', type: 'String', description: 'Error message' },
        { name: 'stack_trace', type: 'String', description: 'Error stack trace' },
        { name: 'source', type: 'LowCardinality(String)', description: 'Source of the error' },
        { name: 'environment', type: 'LowCardinality(String)', description: 'Environment where error occurred' },
        { name: 'user_agent', type: 'String', description: 'User agent string' },
        { name: 'browser_name', type: 'LowCardinality(String)', description: 'Browser name' },
        { name: 'browser_version', type: 'LowCardinality(String)', description: 'Browser version' },
        { name: 'os_name', type: 'LowCardinality(String)', description: 'Operating system name' },
        { name: 'os_version', type: 'LowCardinality(String)', description: 'Operating system version' },
        { name: 'device_type', type: 'LowCardinality(String)', description: 'Device type (desktop, mobile, tablet)' },
        { name: 'viewport_width', type: 'UInt16', description: 'Viewport width in pixels' },
        { name: 'viewport_height', type: 'UInt16', description: 'Viewport height in pixels' },
        { name: 'connection_type', type: 'LowCardinality(String)', description: 'Connection type' },
        { name: 'connection_effective_type', type: 'LowCardinality(String)', description: 'Effective connection type' },
        { name: 'connection_downlink', type: 'Float32', description: 'Connection downlink speed' },
        { name: 'connection_rtt', type: 'UInt32', description: 'Connection round-trip time' },
        { name: 'device_memory', type: 'UInt8', description: 'Device memory in GB' },
        { name: 'device_cpu_cores', type: 'UInt8', description: 'Device CPU cores' },
        { name: 'url', type: 'String', description: 'URL where error occurred' },
        { name: 'page_title', type: 'String', description: 'Page title' },
        { name: 'referrer', type: 'String', description: 'Referrer URL' },
        { name: 'server_name', type: 'LowCardinality(String)', description: 'Server name' },
        { name: 'service_name', type: 'LowCardinality(String)', description: 'Service name' },
        { name: 'service_version', type: 'LowCardinality(String)', description: 'Service version' },
        { name: 'endpoint', type: 'String', description: 'API endpoint' },
        { name: 'http_method', type: 'LowCardinality(String)', description: 'HTTP method' },
        { name: 'http_status_code', type: 'UInt16', description: 'HTTP status code' },
        { name: 'request_id', type: 'String', description: 'Request identifier' },
        { name: 'user_id', type: 'String', description: 'User identifier' },
        { name: 'session_id', type: 'String', description: 'Session identifier' },
        { name: 'ip_address', type: 'String', description: 'IP address' },
        { name: 'country', type: 'LowCardinality(String)', description: 'Country code' },
        { name: 'region', type: 'LowCardinality(String)', description: 'Geographic region' },
        { name: 'city', type: 'LowCardinality(String)', description: 'City name' },
        { name: 'org', type: 'LowCardinality(String)', description: 'Organization' },
        { name: 'postal', type: 'LowCardinality(String)', description: 'Postal code' },
        { name: 'loc', type: 'LowCardinality(String)', description: 'Location coordinates' },
        { name: 'response_time_ms', type: 'UInt32', description: 'Response time in milliseconds' },
        { name: 'memory_usage_mb', type: 'Float32', description: 'Memory usage in MB' },
        { name: 'cpu_usage_percent', type: 'Float32', description: 'CPU usage percentage' },
        { name: 'first_occurrence', type: 'DateTime64(3)', description: 'First occurrence timestamp' },
        { name: 'last_occurrence', type: 'DateTime64(3)', description: 'Last occurrence timestamp' },
        { name: 'occurrence_count', type: 'UInt32', description: 'Number of occurrences' },
        { name: 'status', type: 'Enum8', description: 'Error status (new, investigating, resolved, ignored, recurring)' },
        { name: 'resolved_at', type: 'DateTime64(3)', description: 'Resolution timestamp' },
        { name: 'resolved_by', type: 'String', description: 'Who resolved the error' },
        { name: 'resolution_notes', type: 'String', description: 'Resolution notes' },
        { name: 'custom_data', type: 'String', description: 'Custom data JSON' },
        { name: 'tags', type: 'Array(String)', description: 'Error tags' },
        { name: 'created_at', type: 'DateTime64(3)', description: 'Creation timestamp' },
        { name: 'updated_at', type: 'DateTime64(3)', description: 'Last update timestamp' },
        { name: 'client_id', type: 'LowCardinality(String)', description: 'Client identifier' }
    ]
};

const LogsSchema = {
    table: 'logs',
    columns: [
        { name: 'id', type: 'UUID', description: 'Unique log identifier' },
        { name: 'client_id', type: 'LowCardinality(String)', description: 'Client identifier' },
        { name: 'level', type: 'Enum8', description: 'Log level (log, info, warn, error, debug, trace)' },
        { name: 'message', type: 'String', description: 'Log message' },
        { name: 'context', type: 'String', description: 'Log context' },
        { name: 'source', type: 'LowCardinality(String)', description: 'Log source' },
        { name: 'environment', type: 'LowCardinality(String)', description: 'Environment' },
        { name: 'user_id', type: 'String', description: 'User identifier' },
        { name: 'session_id', type: 'String', description: 'Session identifier' },
        { name: 'tags', type: 'Array(String)', description: 'Log tags' },
        { name: 'created_at', type: 'DateTime64(3)', description: 'Creation timestamp' }
    ]
};

// Enhanced system prompt for direct response generation
const createSystemPrompt = (clientId: string) => `
You are Nova - a specialized AI analytics assistant for Better Analytics. You analyze error tracking, logging, and application monitoring data.

🎯 **YOUR MISSION**: 
Analyze user queries about analytics data and provide helpful responses. You can execute SQL queries and create visualizations when appropriate.

EXECUTION CONTEXT:
- Client ID: ${clientId}
- Current Date (UTC): ${new Date().toISOString().split('T')[0]}
- Current Year: ${new Date().getFullYear()}
- Current Month: ${new Date().getMonth() + 1}
- Current Timestamp: ${new Date().toISOString()}

DATABASE SCHEMA:
The 'errors' table contains all error tracking data. The 'logs' table contains application logs.

ERRORS TABLE COLUMNS:
${JSON.stringify(ErrorsSchema.columns.map(col => ({ name: col.name, type: col.type, description: col.description })), null, 2)}

LOGS TABLE COLUMNS:
${JSON.stringify(LogsSchema.columns.map(col => ({ name: col.name, type: col.type, description: col.description })), null, 2)}

QUERY RULES:
- ALWAYS include WHERE client_id = '${clientId}' in all queries
- Use proper ClickHouse date functions: today(), yesterday(), toDate(), date_trunc()
- For time ranges: created_at >= today() - INTERVAL X DAY
- Filter empty values when appropriate: AND column != ''

RESPONSE GUIDELINES:
1. For simple questions (like "how many errors today?"), provide a direct answer with the number
2. For trend questions, explain what the data shows
3. For comparison questions, highlight key insights
4. Always be conversational and helpful
5. DO NOT mention "checking the database", "executing queries", or technical details
6. Focus on the insights and results, not the process

Remember: You're a helpful analytics assistant. Provide clear, actionable insights from the data without mentioning technical implementation details.
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateSQL(sql: string): boolean {
    const upperSQL = sql.toUpperCase();
    const trimmed = upperSQL.trim();

    // Check for dangerous keyword patterns
    for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
        if (upperSQL.includes(keyword)) return false;
    }

    // Must start with SELECT or WITH (for CTEs)
    return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
}

function debugLog(step: string, data: unknown): void {
    console.log(`🔍 [AI-Assistant] ${step}`, { step, data });
}

function createThinkingStep(step: string): string {
    return `🧠 ${step}`;
}

async function executeQuery(sql: string, clientId: string): Promise<unknown[]> {
    const queryStart = Date.now();
    const result = await chQuery(sql, { clientId });
    const queryTime = Date.now() - queryStart;

    debugLog("Query execution completed", { timeTaken: `${queryTime}ms`, resultCount: result.length });

    return result;
}

// Function to analyze user query and determine if SQL is needed
function analyzeQuery(query: string, clientId: string): { needsSQL: boolean, chartType?: string, sqlQuery?: string } {
    const lowerQuery = query.toLowerCase();

    // Simple patterns for different types of queries
    if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('total')) {
        if (lowerQuery.includes('error')) {
            return {
                needsSQL: true,
                sqlQuery: `SELECT COUNT(*) as count FROM errors WHERE client_id = '${clientId}' AND toDate(created_at) = today()`
            };
        }
        if (lowerQuery.includes('log')) {
            return {
                needsSQL: true,
                sqlQuery: `SELECT COUNT(*) as count FROM logs WHERE client_id = '${clientId}' AND toDate(created_at) = today()`
            };
        }
    }

    if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('daily')) {
        return {
            needsSQL: true,
            chartType: 'line',
            sqlQuery: `SELECT toDate(created_at) as date, COUNT(*) as count FROM errors WHERE client_id = '${clientId}' AND created_at >= today() - INTERVAL 7 DAY GROUP BY date ORDER BY date`
        };
    }

    if (lowerQuery.includes('top') || lowerQuery.includes('most')) {
        return {
            needsSQL: true,
            chartType: 'bar',
            sqlQuery: `SELECT error_type, COUNT(*) as count FROM errors WHERE client_id = '${clientId}' AND error_type != '' GROUP BY error_type ORDER BY count DESC LIMIT 10`
        };
    }

    return { needsSQL: false };
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!OPENROUTER_API_KEY) {
            throw new Error("OpenRouter API key is not configured");
        }

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        const clientId = session?.user?.id;

        if (!clientId) {
            return new Response(
                `data: ${JSON.stringify({
                    type: 'error',
                    content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                })}\n\n`,
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                    },
                }
            );
        }

        // Get the latest user message
        const userMessage = messages[messages.length - 1];
        const userQuery = userMessage?.content || '';

        // Build conversation messages
        const conversationMessages = [
            {
                role: "system" as const,
                content: createSystemPrompt(clientId || ''),
            },
            ...messages.map((msg: any) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
        ];

        // Create a readable stream for Server-Sent Events
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                // Send SSE-formatted updates
                const sendUpdate = (update: StreamingUpdate) => {
                    const data = `data: ${JSON.stringify(update)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                };

                try {
                    debugLog("✅ Input validated", { messages: messages.length });

                    // Send initial thinking step
                    sendUpdate({
                        type: 'thinking',
                        content: createThinkingStep('Analyzing your question...')
                    });

                    // Analyze the query to see if we need to execute SQL
                    const analysis = analyzeQuery(userQuery, clientId);

                    let queryResult: any = null;
                    let chartData: any = null;

                    if (analysis.needsSQL && analysis.sqlQuery) {
                        sendUpdate({
                            type: 'thinking',
                            content: createThinkingStep('Querying the database...')
                        });

                        try {
                            queryResult = await executeQuery(analysis.sqlQuery, clientId);

                            // If we have chart type and data, prepare chart data
                            if (analysis.chartType && queryResult.length > 0) {
                                const firstRow = queryResult[0];
                                const keys = Object.keys(firstRow);
                                const xAxisKey = keys.find(k => k.includes('date') || k.includes('type') || k.includes('name')) || keys[0];
                                const yAxisKey = keys.find(k => k.includes('count') || k.includes('total')) || keys[1];

                                chartData = {
                                    title: "Analytics Chart",
                                    description: "Data visualization from your query",
                                    type: analysis.chartType,
                                    data: queryResult,
                                    xAxisKey,
                                    yAxisKey,
                                    config: {
                                        [yAxisKey]: {
                                            label: yAxisKey.charAt(0).toUpperCase() + yAxisKey.slice(1),
                                            color: "#3b82f6"
                                        }
                                    }
                                };
                            }
                        } catch (error) {
                            console.error('Query execution error:', error);
                        }
                    }

                    // Prepare enhanced conversation messages with query results
                    let enhancedMessages = [...conversationMessages];

                    // If we have query results, add them as context for the AI
                    if (queryResult && queryResult.length > 0) {
                        const result = queryResult[0];
                        const countValue = result.count || result.COUNT || Object.values(result)[0];

                        enhancedMessages.push({
                            role: "system" as const,
                            content: `Query result: ${countValue}. Provide a natural response about this number without mentioning the query execution process.`
                        });
                    }

                    // Generate AI response
                    const result = await streamText({
                        model: openrouterClient(AI_MODEL),
                        messages: enhancedMessages,
                        maxTokens: 1000,
                        temperature: 0.3,
                    });

                    let content = '';

                    // Process the AI stream
                    for await (const delta of result.fullStream) {
                        if (delta.type === 'text-delta') {
                            content += delta.textDelta;
                            sendUpdate({
                                type: 'progress',
                                content,
                                data: {
                                    hasVisualization: !!chartData,
                                    chartData
                                }
                            });
                        }
                    }

                    // Send final complete message
                    sendUpdate({
                        type: 'complete',
                        content: content || 'Analysis completed.',
                        data: {
                            hasVisualization: !!chartData,
                            responseType: chartData ? 'chart' : 'text',
                            chartType: chartData?.type,
                            data: chartData?.data,
                            chartData
                        }
                    });

                } catch (error) {
                    console.error('Streaming error:', error);
                    sendUpdate({
                        type: 'error',
                        content: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
                    });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error("Chat stream API error:", error);

        return new Response(
            `data: ${JSON.stringify({
                type: 'error',
                content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
            })}\n\n`,
            {
                status: 500,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                },
            }
        );
    }
} 