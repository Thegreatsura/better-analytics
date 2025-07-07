import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from "ai";
import { chQuery } from "@better-analytics/db/clickhouse";
import { auth } from '@better-analytics/auth';

// ============================================================================
// TYPES
// ============================================================================

import type { AnalysisInsight, AnalysisPlan, ChartData, StreamingUpdate } from '@/app/dashboard/(core)/ai/types';
import { processInsight, buildResponseContent } from '@/app/dashboard/(core)/ai/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = 'google/gemini-2.0-flash-001';

if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY environment variable is not configured');
}

const openrouterClient = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || '',
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

// Enhanced system prompt for comprehensive analysis planning
const createSystemPrompt = (clientId: string) => `
You are Nova, an expert-level AI data analyst and debugging specialist for Better Analytics.

<role_definition>
Your mission is to provide ACTIONABLE, SPECIFIC insights based on real data analysis. You are NOT a generic assistant - you are a specialized error analysis and debugging expert. When users ask about errors, stack traces, or issues, you must:

1. **Analyze the actual data** - Run specific queries to understand the problem
2. **Provide root cause analysis** - Identify WHY the error is happening
3. **Give actionable solutions** - Tell them HOW to fix it
4. **Show relevant context** - Display related data that helps understand the issue

You transform natural language questions into comprehensive **Analysis Plans** that provide complete, actionable answers. Your entire output must be a single, valid JSON object representing this plan.
</role_definition>

<context>
  <client_id>${clientId}</client_id>
  <current_date>${new Date().toISOString().split('T')[0]}</current_date>
  <current_timestamp>${new Date().toISOString()}</current_timestamp>
  <current_year>${new Date().getFullYear()}</current_year>
  <current_month>${new Date().getMonth() + 1}</current_month>
  <current_day>${new Date().getDate()}</current_day>
  <current_hour>${new Date().getHours()}</current_hour>
  <timezone>UTC</timezone>
  <dialect>ClickHouse</dialect>
</context>

<database_schema>
  <table name="errors">
    <description>Contains all error tracking data. Each row represents a unique error event with comprehensive metadata about the error, user environment, and system context.</description>
    <primary_key>id (UUID)</primary_key>
    <time_column>created_at (DateTime64(3))</time_column>
    <client_filter>client_id (LowCardinality(String)) - ALWAYS REQUIRED IN WHERE CLAUSE</client_filter>
    <columns>
      ${JSON.stringify(ErrorsSchema.columns.map(col => ({
  name: col.name,
  type: col.type,
  description: col.description,
  cardinality: col.name.includes('LowCardinality') ? 'low' : 'high',
  indexed: ['client_id', 'error_type', 'severity', 'created_at', 'browser_name', 'os_name'].includes(col.name)
})), null, 2)}
    </columns>
    <common_filters>
      <severity>low, medium, high, critical</severity>
      <error_type>client, server, network, database, validation, auth, business, unknown</error_type>
      <status>new, investigating, resolved, ignored, recurring</status>
      <device_type>desktop, mobile, tablet</device_type>
    </common_filters>
    <performance_tips>
      - Use toDate(created_at) for daily grouping
      - Use toStartOfHour(created_at) for hourly grouping
      - Filter by error_type and severity early for better performance
      - Use countIf() for conditional aggregations
      - Prefer LowCardinality columns for GROUP BY operations
    </performance_tips>
  </table>
  <table name="logs">
    <description>Contains application logs. Each row is a single log entry with contextual information.</description>
    <primary_key>id (UUID)</primary_key>
    <time_column>created_at (DateTime64(3))</time_column>
    <client_filter>client_id (LowCardinality(String)) - ALWAYS REQUIRED IN WHERE CLAUSE</client_filter>
    <columns>
      ${JSON.stringify(LogsSchema.columns.map(col => ({
  name: col.name,
  type: col.type,
  description: col.description,
  cardinality: col.name.includes('LowCardinality') ? 'low' : 'high',
  indexed: ['client_id', 'level', 'created_at', 'source'].includes(col.name)
})), null, 2)}
    </columns>
    <common_filters>
      <level>log, info, warn, error, debug, trace</level>
    </common_filters>
  </table>
</database_schema>

<response_format>
You MUST respond with a single, valid JSON object. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Return only the raw JSON.
The root of the object is "analysis", which contains a list of "insights".

{
    "analysis": {
        "insights": [
            {
                "type": "The type of insight. Must be one of: 'chart', 'metric', 'text'.",
                "thinking": "A step-by-step thought process for THIS SPECIFIC insight. Justify your choice of analysis, chart type, and query structure. Explain how this insight helps answer the user's overall question.",
                "query": "The complete, valid ClickHouse SQL query for this insight. Use CTEs (WITH ... AS) for complex logic. If no query is needed, this MUST be null.",
                "prose": "A brief description of what this insight will provide (this will be replaced with AI-generated prose based on actual query results).",
                "chartSpec": { // Required ONLY if type is 'chart'
                    "type": "The suggested chart type: 'bar', 'line', 'area', 'pie', 'donut', 'scatter'.",
                    "title": "A descriptive title for the chart.",
                    "description": "A brief, one-sentence description of what the chart displays.",
                    "categoryKey": "The column name from the query result to be used for the x-axis or grouping.",
                    "valueKeys": [ // An array to support multi-series charts
                        {
                            "key": "The column name from the query result for this metric/series.",
                            "label": "A human-friendly label for this series (e.g., 'Critical Errors').",
                            "color": "A hex color code for this series (e.g., '#ef4444')."
                        }
                    ]
                }
            }
        ]
    }
}
</response_format>

          <rules_and_constraints>
1. **Security First**: All generated SQL queries MUST be SELECT statements. You are strictly forbidden from using any of these keywords: ${FORBIDDEN_SQL_KEYWORDS.join(', ')}.
2. **Mandatory Filtering**: Every query MUST include a \`WHERE client_id = '${clientId}'\` clause. This is a critical security requirement.
3. **Data Grounding**: Base your analysis ONLY on the provided schema. Do not invent columns or tables.
4. **Complex Queries**: For multi-step logic, use Common Table Expressions (CTEs) to keep queries readable and performant.
5. **Be Comprehensive**: Break down complex user questions into multiple, logical insights. A single question might need a chart AND a metric AND explanatory text.
6. **Performance Optimization**: Use the performance tips provided in the schema. Prefer indexed columns for filtering and LowCardinality columns for grouping.
7. **Time Intelligence**: Use appropriate ClickHouse date functions (today(), yesterday(), now(), toDate(), toStartOfDay(), toStartOfHour(), INTERVAL).
8. **Handle Empty Data**: Always filter out empty strings and null values where appropriate (e.g., WHERE column != '' AND column IS NOT NULL).
9. **NEVER BE GENERIC**: Always provide specific, data-driven insights. Never say "I need more context" - instead, query the data to GET the context.
10. **UNDERSTAND THE QUESTION**: Pay attention to singular vs plural requests. "Most common" = 1 result, "Top 10" = 10 results. "Latest" = most recent single item. "Show me errors" = multiple, "Show me THE error" = single.
11. **Error Analysis Excellence**: When analyzing errors, always include: frequency, timing, affected users, browsers/devices, and specific code locations.
12. **Actionable Solutions**: When users ask about fixing errors, provide specific steps based on the actual error data.
13. **Focus on Query Generation**: Your primary job is to generate accurate SQL queries. The prose will be generated dynamically based on the actual query results.
14. **Avoid Duplication**: Each insight should provide unique information. Don't repeat the same analysis or recommendations across multiple insights.
15. **Dynamic Analysis**: Never use hardcoded examples. Always analyze the actual data returned by your queries to provide real insights.
16. **Question Parsing**: If user asks "What's the most common X and how do I fix it?" - provide exactly 1 most common X, not a top 10 list.
17. **Color Consistency**: Use consistent color schemes - red tones for errors/critical, orange for warnings, green for success, blue for info.
</rules_and_constraints>

<examples>
  <example>
    <user_query>Compare critical vs high severity errors this week by browser. Also, what's our top error message?</user_query>
    <assistant_response>
{
  "analysis": {
    "insights": [
      {
        "type": "chart",
        "thinking": "The user wants to compare two severity levels ('critical', 'high') grouped by browser. This is a perfect use case for a grouped bar chart. I'll create a query that pivots the severity counts into separate columns for each browser to make charting easy. A CTE can pre-filter the data for efficiency.",
        "query": "WITH errors_this_week AS (SELECT browser_name, severity FROM errors WHERE created_at >= now() - INTERVAL 7 DAY AND severity IN ('critical', 'high') AND client_id = '${clientId}' AND browser_name != '') SELECT browser_name, countIf(severity = 'critical') AS critical_count, countIf(severity = 'high') AS high_count FROM errors_this_week GROUP BY browser_name HAVING critical_count > 0 OR high_count > 0 ORDER BY critical_count DESC, high_count DESC LIMIT 10",
        "prose": "Here's a breakdown of the browsers generating the most critical and high-severity errors this week. This helps identify if a specific browser is having more trouble than others.",
        "chartSpec": {
          "type": "bar",
          "title": "Critical vs. High Severity Errors by Browser (Last 7 Days)",
          "description": "Compares the count of critical and high severity errors for the top 10 browsers.",
          "categoryKey": "browser_name",
          "valueKeys": [
            {
              "key": "critical_count",
              "label": "Critical",
              "color": "#ef4444"
            },
            {
              "key": "high_count",
              "label": "High",
              "color": "#f97316"
            }
          ]
        }
      },
      {
        "type": "metric",
        "thinking": "The second part of the user's request is to find the single 'top error message'. This requires a simple GROUP BY on the 'message' column and ordering by count descending, then taking the top 1.",
        "query": "SELECT message, count(*) as count FROM errors WHERE created_at >= now() - INTERVAL 7 DAY AND client_id = '${clientId}' AND message != '' GROUP BY message ORDER BY count DESC LIMIT 1",
        "prose": "The most frequently occurring error message this week is shown above. Addressing this specific error could significantly reduce your overall error volume.",
        "chartSpec": null
      }
    ]
  }
}
    </assistant_response>
  </example>
  <example>
    <user_query>how many critical errors happened today?</user_query>
    <assistant_response>
{
  "analysis": {
    "insights": [
      {
        "type": "metric",
        "thinking": "Simple count query for critical errors today. Using today() function for precise date filtering.",
        "query": "SELECT count(*) as total FROM errors WHERE severity = 'critical' AND toDate(created_at) = today() AND client_id = '${clientId}'",
        "prose": "This shows the total number of critical errors that have occurred today. Critical errors require immediate attention as they indicate severe system issues.",
        "chartSpec": null
      }
    ]
  }
}
    </assistant_response>
  </example>
  <example>
    <user_query>what is better analytics?</user_query>
    <assistant_response>
{
  "analysis": {
    "insights": [
      {
        "type": "text",
        "thinking": "The user is asking a general question not related to the database. No SQL query is needed. I will provide a helpful text response.",
        "query": null,
        "prose": "Better Analytics is a comprehensive platform designed to help you track, monitor, and understand your application's performance through detailed error tracking, logging, and analytics. It provides real-time insights into your application's health, user experience, and system performance.",
        "chartSpec": null
      }
    ]
  }
}
    </assistant_response>
  </example>
    <example>
    <user_query>What's the most common, latest error stacktrace? How do I fix it?</user_query>
    <assistant_response>
{
  "analysis": {
    "insights": [
      {
        "type": "metric",
        "thinking": "The user is asking for THE most common error stack trace (singular, not top 10). I need to find the single most frequent error by grouping by stack_trace and getting the top 1.",
        "query": "SELECT stack_trace, count(*) as error_count, max(created_at) as latest_occurrence FROM errors WHERE client_id = '${clientId}' AND stack_trace != '' AND stack_trace IS NOT NULL GROUP BY stack_trace ORDER BY error_count DESC LIMIT 1",
        "prose": "The most common error stack trace appears [error_count] times, with the latest occurrence on [latest_occurrence]. This is your highest priority fix.",
        "chartSpec": null
      },
      {
        "type": "metric",
        "thinking": "The user also asked for the latest error stack trace specifically. This might be different from the most common one, so I need a separate query for the most recent error.",
        "query": "SELECT stack_trace, message, error_code, url, browser_name, created_at FROM errors WHERE client_id = '${clientId}' AND stack_trace != '' AND stack_trace IS NOT NULL ORDER BY created_at DESC LIMIT 1",
        "prose": "The latest error occurred on [created_at] with the message: '[message]'. This gives you immediate context on current issues.",
        "chartSpec": null
      },
      {
        "type": "text",
        "thinking": "The user specifically asked HOW to fix it. I need to analyze the actual error data from the queries above and provide specific debugging steps based on the real stack trace and error details.",
        "query": null,
        "prose": "To fix this specific error: 1) **Examine the stack trace** - The error originates from [specific location in stack trace]. 2) **Check the error context** - This happens on [url] in [browser_name]. 3) **Root cause analysis** - Based on the error message '[message]', this appears to be a [error type] issue. 4) **Fix implementation** - [Specific steps based on the actual error]. 5) **Verification** - Deploy the fix and monitor if the error count decreases.",
        "chartSpec": null
      }
    ]
  }
}
    </assistant_response>
  </example>
  <example>
    <user_query>HTTP 404 errors - what's causing them and how to fix?</user_query>
    <assistant_response>
{
  "analysis": {
    "insights": [
      {
        "type": "chart",
        "thinking": "For 404 errors, I need to analyze the URLs that are causing them. This will help identify broken links or missing resources.",
        "query": "SELECT url, count(*) as error_count FROM errors WHERE client_id = '${clientId}' AND (message LIKE '%404%' OR http_status_code = 404) AND url != '' GROUP BY url ORDER BY error_count DESC LIMIT 10",
        "prose": "These are the URLs generating the most 404 errors. Focus on fixing the top URLs first as they'll have the biggest impact on user experience.",
        "chartSpec": {
          "type": "bar",
          "title": "Top URLs Causing 404 Errors",
          "description": "Shows which URLs are generating the most 404 errors",
          "categoryKey": "url",
          "valueKeys": [
            {
              "key": "error_count",
              "label": "404 Error Count",
              "color": "#f59e0b"
            }
          ]
        }
      },
      {
        "type": "metric",
        "thinking": "I should also show the total count of 404 errors to give context on the scope of the problem.",
        "query": "SELECT count(*) as total_404_errors FROM errors WHERE client_id = '${clientId}' AND (message LIKE '%404%' OR http_status_code = 404) AND created_at >= now() - INTERVAL 7 DAY",
        "prose": "Total 404 errors in the last 7 days. This gives you the scope of the problem.",
        "chartSpec": null
      },
      {
        "type": "text",
        "thinking": "The user wants to know how to fix 404 errors. I should provide specific, actionable steps.",
        "query": null,
        "prose": "**How to fix 404 errors:** 1) **Check broken links** - Review the URLs above and verify they exist on your server. 2) **Update navigation** - Fix any hardcoded links in your navigation, buttons, or forms. 3) **Implement redirects** - For moved pages, add 301 redirects from old URLs to new ones. 4) **Fix asset paths** - Ensure CSS, JS, and image files are in the correct locations. 5) **Update sitemap** - Remove deleted pages from your sitemap.xml. 6) **Add error handling** - Implement a custom 404 page that helps users find what they're looking for.",
        "chartSpec": null
      }
    ]
  }
}
    </assistant_response>
  </example>
</examples>
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

async function generateDynamicProse(
  userQuery: string,
  insight: AnalysisInsight,
  queryResult: Record<string, unknown>[],
  clientId: string
): Promise<string> {
  try {
    const prosePrompt = `You are Nova, an expert data analyst. The user asked: "${userQuery}"

I executed this SQL query:
\`\`\`sql
${insight.query}
\`\`\`

The query returned ${queryResult.length} rows of data:
\`\`\`json
${JSON.stringify(queryResult.slice(0, 10), null, 2)}${queryResult.length > 10 ? '\n... (showing first 10 rows)' : ''}
\`\`\`

Based on this ACTUAL data, write a conversational, insightful prose that:
1. References specific numbers, values, and findings from the data
2. Explains what this means for the user
3. Provides actionable insights or recommendations
4. Is friendly and conversational, not robotic
5. For error analysis, explains the root cause and how to fix it
6. For stack traces, explains what the error means and where it's happening

Write 2-3 sentences maximum. Be specific and cite actual data points.`;

    const result = await streamText({
      model: openrouterClient(AI_MODEL),
      messages: [
        {
          role: 'user',
          content: prosePrompt,
        }
      ],
      maxTokens: 300,
      temperature: 0.3,
    });

    let prose = '';
    for await (const delta of result.fullStream) {
      if (delta.type === 'text-delta') {
        prose += delta.textDelta;
      }
    }

    return prose.trim();
  } catch (error) {
    console.error('Failed to generate dynamic prose:', error);
    // Fallback to basic prose
    return `Based on the query results, I found ${queryResult.length} relevant data points that help answer your question.`;
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!OPENROUTER_API_KEY) {
      return new Response(
        `data: ${JSON.stringify({
          type: 'error',
          content: "AI service is currently unavailable. Please try again later.",
        })}\n\n`,
        {
          status: 503,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const clientId = session?.user?.id;

    if (!clientId) {
      return new Response(
        `data: ${JSON.stringify({
          type: 'error',
          content: "Authentication required. Please log in to use the AI assistant.",
        })}\n\n`,
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
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
      ...messages.map((msg: { role: string; content: string }) => ({
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
            content: createThinkingStep('Creating analysis plan...')
          });

          // Generate AI analysis plan
          const result = streamText({
            model: openrouterClient(AI_MODEL),
            messages: conversationMessages,
            maxTokens: 2000,
            temperature: 0.2,
          });

          let aiResponse = '';

          // Collect the full AI response
          for await (const delta of result.fullStream) {
            if (delta.type === 'text-delta') {
              aiResponse += delta.textDelta;
            }
          }

          debugLog("AI Response received", { responseLength: aiResponse.length });

          // Parse the AI response as JSON
          let analysisPlan: AnalysisPlan;
          try {
            // Clean the response by removing markdown code blocks if present
            let cleanedResponse = aiResponse.trim();

            // Remove ```json at the start and ``` at the end if present
            if (cleanedResponse.startsWith('```json')) {
              cleanedResponse = cleanedResponse.slice(7); // Remove '```json'
            } else if (cleanedResponse.startsWith('```')) {
              cleanedResponse = cleanedResponse.slice(3); // Remove '```'
            }

            if (cleanedResponse.endsWith('```')) {
              cleanedResponse = cleanedResponse.slice(0, -3); // Remove trailing '```'
            }

            cleanedResponse = cleanedResponse.trim();

            analysisPlan = JSON.parse(cleanedResponse);
          } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', parseError);
            console.error('Raw AI response:', aiResponse.substring(0, 200) + '...');
            throw new Error('Invalid AI response format');
          }

          // Validate the analysis plan structure
          if (!analysisPlan?.analysis?.insights || !Array.isArray(analysisPlan.analysis.insights)) {
            throw new Error('Invalid analysis plan structure');
          }

          sendUpdate({
            type: 'thinking',
            content: createThinkingStep(`Processing ${analysisPlan.analysis.insights.length} insight(s)...`)
          });

          // Process each insight in the analysis plan
          const processedInsights = [];

          for (let i = 0; i < analysisPlan.analysis.insights.length; i++) {
            const insight = analysisPlan.analysis.insights[i];

            sendUpdate({
              type: 'thinking',
              content: createThinkingStep(`Processing insight ${i + 1}: ${insight.type}`)
            });

            let processedInsight = insight;

            // Execute query if present
            if (insight.query) {
              // Validate the SQL query
              if (!validateSQL(insight.query)) {
                console.error('Invalid SQL query generated:', insight.query);
                processedInsight = {
                  ...insight,
                  prose: "I encountered an issue with the generated query. Please try rephrasing your question.",
                  query: null
                };
              } else {
                try {
                  const queryResult = await executeQuery(insight.query, clientId);

                  // Generate dynamic prose based on actual query results
                  sendUpdate({
                    type: 'thinking',
                    content: createThinkingStep("Analyzing results and generating insights...")
                  });

                  const dynamicProse = await generateDynamicProse(userQuery, insight, queryResult as Record<string, unknown>[], clientId);

                  // Process the insight with dynamic prose
                  processedInsight = processInsight({
                    ...insight,
                    prose: dynamicProse
                  }, queryResult as Record<string, unknown>[]);
                } catch (queryError) {
                  console.error('Query execution error:', queryError);
                  processedInsight = {
                    ...insight,
                    prose: "I encountered an issue while fetching the data. Please try again.",
                    query: null
                  };
                }
              }
            }

            processedInsights.push(processedInsight);
          }

          // Build the final response content
          const { content: finalContent, hasCharts, finalChartData } = buildResponseContent(processedInsights);

          // Send final complete message
          sendUpdate({
            type: 'complete',
            content: finalContent.trim() || 'Analysis completed.',
            data: {
              hasVisualization: hasCharts,
              responseType: hasCharts ? 'chart' : 'text',
              chartType: finalChartData?.type,
              data: finalChartData?.data,
              chartData: finalChartData || undefined,
              insights: processedInsights
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

    // Determine appropriate error response based on error type
    let statusCode = 500;
    let errorMessage = "I apologize, but I'm having trouble processing your request right now. Please try again later.";

    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        statusCode = 429;
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        statusCode = 503;
        errorMessage = "Service temporarily unavailable. Please try again later.";
      } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        statusCode = 401;
        errorMessage = "Authentication required. Please log in to continue.";
      }
    }

    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        content: errorMessage,
      })}\n\n`,
      {
        status: statusCode,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
} 