import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool } from "ai";
import { chQuery } from "@better-analytics/db/clickhouse";
import { z } from "zod";
import { auth } from '@better-analytics/auth';

// Environment configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Configure OpenRouter client
const openrouterClient = createOpenRouter({
    apiKey: OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

// Chart types available for data visualization
const CHART_TYPES = {
    BAR: 'bar',
    LINE: 'line',
    AREA: 'area',
    PIE: 'pie',
    DONUT: 'donut',
    SCATTER: 'scatter',
    RADIAL: 'radial'
} as const;

type ChartType = typeof CHART_TYPES[keyof typeof CHART_TYPES];

// Database schema information for AI to understand
const DATABASE_SCHEMA = `
**ERRORS TABLE SCHEMA:**
\`\`\`sql
CREATE TABLE errors (
    -- Core Error Information
    id UUID PRIMARY KEY,
    error_type Enum8('client', 'server', 'network', 'database', 'validation', 'auth', 'business', 'unknown'),
    severity Enum8('low', 'medium', 'high', 'critical'),
    error_code LowCardinality(Nullable(String)),
    error_name LowCardinality(Nullable(String)),
    message Nullable(String),
    stack_trace Nullable(String),
    
    -- Environment & Source
    source LowCardinality(Nullable(String)),
    environment LowCardinality(Nullable(String)),
    
    -- Browser & Device Information
    user_agent Nullable(String),
    browser_name LowCardinality(Nullable(String)),
    browser_version LowCardinality(Nullable(String)),
    os_name LowCardinality(Nullable(String)),
    os_version LowCardinality(Nullable(String)),
    device_type LowCardinality(Nullable(String)),
    viewport_width Nullable(UInt16),
    viewport_height Nullable(UInt16),
    
    -- Network & Performance
    connection_type LowCardinality(Nullable(String)),
    connection_effective_type LowCardinality(Nullable(String)),
    connection_downlink Nullable(Float32),
    connection_rtt Nullable(UInt32),
    device_memory Nullable(UInt8),
    device_cpu_cores Nullable(UInt8),
    
    -- Page & Request Information
    url Nullable(String),
    page_title Nullable(String),
    referrer Nullable(String),
    
    -- Server Information
    server_name LowCardinality(Nullable(String)),
    service_name LowCardinality(Nullable(String)),
    service_version LowCardinality(Nullable(String)),
    endpoint Nullable(String),
    http_method LowCardinality(Nullable(String)),
    http_status_code Nullable(UInt16),
    request_id Nullable(String),
    
    -- User & Session
    user_id Nullable(String),
    session_id Nullable(String),
    ip_address Nullable(String),
    country LowCardinality(Nullable(String)),
    region LowCardinality(Nullable(String)),
    city LowCardinality(Nullable(String)),
    org LowCardinality(Nullable(String)),
    postal LowCardinality(Nullable(String)),
    loc LowCardinality(Nullable(String)),
    
    -- Performance Metrics
    response_time_ms Nullable(UInt32),
    memory_usage_mb Nullable(Float32),
    cpu_usage_percent Nullable(Float32),
    
    -- Occurrence Tracking
    first_occurrence DateTime64(3) DEFAULT now64(),
    last_occurrence DateTime64(3) DEFAULT now64(),
    occurrence_count UInt32 DEFAULT 1,
    
    -- Status & Resolution
    status Enum8('new', 'investigating', 'resolved', 'ignored', 'recurring'),
    resolved_at Nullable(DateTime64(3)),
    resolved_by Nullable(String),
    resolution_notes Nullable(String),
    
    -- Additional Data
    custom_data Nullable(String),
    tags Array(String),
    
    -- Timestamps
    created_at DateTime64(3) DEFAULT now64(),
    updated_at DateTime64(3) DEFAULT now64(),
    client_id LowCardinality(String)
)
\`\`\`

**LOGS TABLE SCHEMA:**
\`\`\`sql
CREATE TABLE logs (
    id UUID,
    client_id LowCardinality(String),
    level Enum8('log', 'info', 'warn', 'error', 'debug', 'trace'),
    message String,
    context Nullable(String),
    source LowCardinality(Nullable(String)),
    environment LowCardinality(Nullable(String)),
    user_id Nullable(String),
    session_id Nullable(String),
    tags Array(String),
    created_at DateTime64(3) DEFAULT now64()
)
\`\`\`

**IMPORTANT QUERY GUIDELINES:**
1. Always filter by client_id = {clientId:String} for security
2. Use parameterized queries with {paramName:Type} syntax
3. DateTime fields use DateTime64(3) format
4. Use ClickHouse functions: toDate(), toHour(), quantile(), countIf(), etc.
5. For time ranges, use: created_at >= now() - INTERVAL X DAY/HOUR
6. Group by relevant dimensions for aggregations
7. Use LIMIT to prevent large result sets
8. Prefer LowCardinality fields for grouping (browser_name, error_type, etc.)
`;

// Enhanced system prompt with SQL generation and chart visualization capabilities
const SYSTEM_PROMPT = `You are an intelligent AI assistant for Better Analytics with advanced SQL query generation and data visualization capabilities.

🧠 **YOUR CORE ABILITIES**: 
1. Generate custom SQL queries to answer ANY analytics question
2. Create beautiful charts and visualizations from data
3. Provide actionable insights and recommendations

${DATABASE_SCHEMA}

🎯 **ANALYSIS WORKFLOW**:
1. **Understand** the user's question deeply
2. **Plan** what data is needed and how to visualize it
3. **Generate** appropriate SQL using the schema above
4. **Execute** the query to get data
5. **Create charts** when data is suitable for visualization
6. **Interpret** results and provide insights

📊 **CHART GENERATION GUIDELINES**:
- **Bar Charts**: Great for comparing categories (error types, browsers, etc.)
- **Line Charts**: Perfect for trends over time (hourly/daily patterns)
- **Area Charts**: Show cumulative data or filled trends
- **Pie/Donut Charts**: Ideal for showing proportions (error distribution)
- **Scatter Plots**: Good for correlations (response time vs errors)
- **Radial Charts**: Unique way to show performance metrics

🔧 **WHEN TO CREATE CHARTS**:
- Data has clear categories or time series
- Results would benefit from visual representation
- User asks for trends, comparisons, or distributions
- Data has 2+ dimensions that can be visualized
- Results contain numerical data suitable for charting

💡 **CHART SELECTION LOGIC**:
- **Time-based data** → Line or Area chart
- **Category comparisons** → Bar chart
- **Proportions/percentages** → Pie or Donut chart
- **Performance metrics** → Radial or Bar chart
- **Correlations** → Scatter plot
- **Multiple metrics over time** → Multi-line chart

🎨 **CHART CONFIGURATION**:
- Use descriptive titles and labels
- Choose appropriate colors for data categories
- Include legends when needed
- Format numbers appropriately (K, M for large numbers)
- Add tooltips for detailed information

**EXAMPLE RESPONSES**:
1. **Text explanation** of what you found
2. **SQL query** that was executed
3. **Chart visualization** if data is suitable
4. **Key insights** and recommendations
5. **Follow-up questions** for deeper analysis

**Remember**: Always provide both textual insights AND visual charts when the data supports it. Charts make analytics much more accessible and actionable!`;

// Analytics query executor with enhanced error handling
async function executeAnalyticsQuery(clientId: string, query: string, description: string) {
    try {
        console.log(`🔍 Executing query: ${description}`);
        console.log(`📊 SQL: ${query}`);

        const result = await chQuery(query, { clientId });
        console.log(`✅ Query result: ${JSON.stringify(result, null, 2)}`);

        return {
            success: true,
            data: result,
            description,
            query: query.trim(),
            rowCount: Array.isArray(result) ? result.length : 0
        };
    } catch (error) {
        console.error(`❌ Error executing query (${description}):`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            description,
            query: query.trim()
        };
    }
}

// Define analytics tools for the AI
function createAnalyticsTools(clientId: string) {
    return {
        queryAnalytics: tool({
            description: 'Generate and execute SQL queries against the analytics database based on user questions. This tool can answer any analytics question by writing appropriate SQL.',
            parameters: z.object({
                question: z.string().describe('The user\'s question that needs to be answered'),
                sqlQuery: z.string().describe('The SQL query to execute that will answer the user\'s question. Must include client_id filter for security.'),
                reasoning: z.string().describe('Explanation of why this specific SQL query will answer the user\'s question'),
                expectedResult: z.string().describe('What kind of data/insights this query should return')
            }),
            execute: async ({ question, sqlQuery, reasoning, expectedResult }) => {
                console.log(`🤔 User Question: ${question}`);
                console.log(`🧠 AI Reasoning: ${reasoning}`);
                console.log(`🎯 Expected Result: ${expectedResult}`);

                return await executeAnalyticsQuery(clientId, sqlQuery, `Answer: ${question}`);
            }
        }),

        createChart: tool({
            description: 'Create a chart visualization from query results. Use this after getting data that would benefit from visual representation.',
            parameters: z.object({
                title: z.string().describe('Clear, descriptive title for the chart'),
                description: z.string().describe('Brief description of what the chart shows'),
                chartType: z.enum(['bar', 'line', 'area', 'pie', 'donut', 'scatter', 'radial']).describe('Type of chart that best represents the data'),
                data: z.array(z.record(z.any())).describe('Array of data objects from the query results'),
                xAxisKey: z.string().describe('Key for the x-axis data (e.g., "date", "error_type")'),
                yAxisKey: z.string().describe('Key for the y-axis data (e.g., "count", "avg_response_time")'),
                colorScheme: z.array(z.string()).optional().describe('Array of colors for the chart (optional)'),
                config: z.record(z.object({
                    label: z.string(),
                    color: z.string()
                })).describe('Chart configuration for each data series')
            }),
            execute: async ({ title, description, chartType, data, xAxisKey, yAxisKey, colorScheme, config }) => {
                console.log(`📈 Creating ${chartType} chart: ${title}`);
                console.log(`📊 Data points: ${data.length}`);

                return {
                    success: true,
                    chartData: {
                        title,
                        description,
                        type: chartType,
                        data,
                        xAxisKey,
                        yAxisKey,
                        colorScheme,
                        config
                    }
                };
            }
        }),

        exploreData: tool({
            description: 'Explore the database structure or run exploratory queries to understand what data is available',
            parameters: z.object({
                explorationGoal: z.string().describe('What aspect of the data you want to explore'),
                sqlQuery: z.string().describe('SQL query to explore the data structure or get sample data'),
                reasoning: z.string().describe('Why this exploration is needed')
            }),
            execute: async ({ explorationGoal, sqlQuery, reasoning }) => {
                console.log(`🔬 Exploration Goal: ${explorationGoal}`);
                console.log(`🧠 AI Reasoning: ${reasoning}`);

                return await executeAnalyticsQuery(clientId, sqlQuery, `Explore: ${explorationGoal}`);
            }
        }),

        validateQuery: tool({
            description: 'Test or validate a query approach before running the main analysis',
            parameters: z.object({
                purpose: z.string().describe('What you\'re trying to validate or test'),
                sqlQuery: z.string().describe('The validation SQL query'),
                reasoning: z.string().describe('Why this validation is necessary')
            }),
            execute: async ({ purpose, sqlQuery, reasoning }) => {
                console.log(`✅ Validation Purpose: ${purpose}`);
                console.log(`🧠 AI Reasoning: ${reasoning}`);

                return await executeAnalyticsQuery(clientId, sqlQuery, `Validate: ${purpose}`);
            }
        })
    };
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!OPENROUTER_API_KEY || !session?.user.id) {
            return new Response("OpenRouter API key is not configured", {
                status: 500,
            });
        }

        const clientId = session.user.id;

        const analyticsTools = createAnalyticsTools(clientId);

        const conversationMessages = [
            {
                role: "system" as const,
                content: SYSTEM_PROMPT,
            },
            ...messages.map((msg: any) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
        ];

        // Generate response with SQL generation and chart capabilities
        const result = await streamText({
            model: openrouterClient("openai/gpt-4o-mini"),
            messages: conversationMessages,
            tools: analyticsTools,
            maxTokens: 3000,
            temperature: 0.2, // Lower temperature for more precise SQL generation
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Chat API error:", error);

        return new Response(
            "I apologize, but I'm having trouble processing your request right now. Please try again later, or contact support if the issue persists.",
            {
                status: 500,
                headers: { 'Content-Type': 'text/plain' },
            }
        );
    }
} 