"use server";

import { analytics } from "@/lib/analytics";
import { initLogger } from "@better-analytics/sdk";
import { headers } from "next/headers";

const logger = initLogger({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID || "",
    accessToken: process.env.NEXT_PUBLIC_ACCESS_TOKEN || "",
    serviceName: 'better-analytics-web',
});

// ============================================================================
// DYNAMIC ERROR GENERATION UTILITIES
// ============================================================================

const ERROR_SCENARIOS = [
    { type: 'server', severity: 'critical', weight: 5 },
    { type: 'server', severity: 'high', weight: 15 },
    { type: 'server', severity: 'medium', weight: 30 },
    { type: 'server', severity: 'low', weight: 50 },
    { type: 'client', severity: 'critical', weight: 2 },
    { type: 'client', severity: 'high', weight: 10 },
    { type: 'client', severity: 'medium', weight: 40 },
    { type: 'client', severity: 'low', weight: 60 },
    { type: 'network', severity: 'critical', weight: 3 },
    { type: 'network', severity: 'high', weight: 12 },
    { type: 'network', severity: 'medium', weight: 25 },
    { type: 'network', severity: 'low', weight: 35 },
    { type: 'database', severity: 'critical', weight: 8 },
    { type: 'database', severity: 'high', weight: 20 },
    { type: 'database', severity: 'medium', weight: 35 },
    { type: 'database', severity: 'low', weight: 25 },
    { type: 'validation', severity: 'critical', weight: 1 },
    { type: 'validation', severity: 'high', weight: 5 },
    { type: 'validation', severity: 'medium', weight: 45 },
    { type: 'validation', severity: 'low', weight: 70 },
    { type: 'auth', severity: 'critical', weight: 10 },
    { type: 'auth', severity: 'high', weight: 25 },
    { type: 'auth', severity: 'medium', weight: 30 },
    { type: 'auth', severity: 'low', weight: 15 },
    { type: 'business', severity: 'critical', weight: 4 },
    { type: 'business', severity: 'high', weight: 18 },
    { type: 'business', severity: 'medium', weight: 40 },
    { type: 'business', severity: 'low', weight: 55 },
];

function getRandomErrorScenario() {
    const totalWeight = ERROR_SCENARIOS.reduce((sum, scenario) => sum + scenario.weight, 0);
    let random = Math.random() * totalWeight;

    for (const scenario of ERROR_SCENARIOS) {
        random -= scenario.weight;
        if (random <= 0) {
            return scenario;
        }
    }

    return ERROR_SCENARIOS[ERROR_SCENARIOS.length - 1];
}

function generateDynamicErrorDetails() {
    const scenario = getRandomErrorScenario();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);

    const errorMessages: Record<string, string[]> = {
        critical: [
            "System memory exhausted - immediate intervention required",
            "Database connection pool completely depleted",
            "Authentication service completely unavailable",
            "Payment processing gateway down",
            "Critical security breach detected",
        ],
        high: [
            "Database query timeout exceeded",
            "External API rate limit exceeded",
            "User session validation failed",
            "File upload service degraded",
            "Cache invalidation failed",
        ],
        medium: [
            "Form validation failed for user input",
            "Image processing took longer than expected",
            "Email delivery delayed",
            "Search indexing behind schedule",
            "User preference sync failed",
        ],
        low: [
            "Non-critical warning logged",
            "Debug information collected",
            "Performance metric below threshold",
            "Optional feature temporarily disabled",
            "Informational system status update",
        ],
    };

    const errorCodes: Record<string, string[]> = {
        server: [`SRV_${timestamp}_${randomId.toUpperCase()}`, `SERVER_ERROR_${Math.floor(Math.random() * 1000)}`],
        client: [`CLI_${timestamp}_${randomId.toUpperCase()}`, `CLIENT_ERROR_${Math.floor(Math.random() * 1000)}`],
        network: [`NET_${timestamp}_${randomId.toUpperCase()}`, `NETWORK_ERROR_${Math.floor(Math.random() * 1000)}`],
        database: [`DB_${timestamp}_${randomId.toUpperCase()}`, `DATABASE_ERROR_${Math.floor(Math.random() * 1000)}`],
        validation: [`VAL_${timestamp}_${randomId.toUpperCase()}`, `VALIDATION_ERROR_${Math.floor(Math.random() * 1000)}`],
        auth: [`AUTH_${timestamp}_${randomId.toUpperCase()}`, `AUTH_ERROR_${Math.floor(Math.random() * 1000)}`],
        business: [`BIZ_${timestamp}_${randomId.toUpperCase()}`, `BUSINESS_ERROR_${Math.floor(Math.random() * 1000)}`],
    };

    return {
        type: scenario.type,
        severity: scenario.severity,
        message: errorMessages[scenario.severity][Math.floor(Math.random() * errorMessages[scenario.severity].length)],
        code: errorCodes[scenario.type][Math.floor(Math.random() * errorCodes[scenario.type].length)],
        timestamp: new Date().toISOString(),
        requestId: `req_${timestamp}_${randomId}`,
    };
}

// ============================================================================
// BULK ERROR GENERATION FOR TESTING
// ============================================================================

export async function generateMultipleRandomErrors(count: number = 10) {
    const results = [];

    for (let i = 0; i < count; i++) {
        try {
            // Add small delay to spread out timestamps
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

            const dynamicError = generateDynamicErrorDetails();

            // Create error with dynamic details
            const error = new Error(dynamicError.message);
            (error as any).errorCode = dynamicError.code;
            (error as any).errorCategory = 'bulk-generated';
            (error as any).severity = dynamicError.severity;
            (error as any).error_type = dynamicError.type;
            (error as any).timestamp = dynamicError.timestamp;
            (error as any).requestId = dynamicError.requestId;

            // Log to errors table
            await analytics.track(dynamicError.message, {
                tags: ["bulk-generated", "testing", dynamicError.type, dynamicError.severity],
                error_type: dynamicError.type,
                error_code: dynamicError.code,
                severity: dynamicError.severity,
                environment: process.env.NODE_ENV || 'development',
                custom_data: {
                    bulkGeneration: {
                        batchId: `batch_${Date.now()}`,
                        errorIndex: i + 1,
                        totalErrors: count,
                        generatedAt: new Date().toISOString(),
                    },
                    errorDetails: {
                        dynamicMessage: dynamicError.message,
                        dynamicCode: dynamicError.code,
                        dynamicType: dynamicError.type,
                        dynamicSeverity: dynamicError.severity,
                    },
                },
            });

            results.push({
                success: true,
                index: i + 1,
                error: {
                    message: dynamicError.message,
                    code: dynamicError.code,
                    type: dynamicError.type,
                    severity: dynamicError.severity,
                    timestamp: dynamicError.timestamp,
                },
            });

        } catch (e: any) {
            results.push({
                success: false,
                index: i + 1,
                error: e.message,
            });
        }
    }

    return {
        success: true,
        message: `Generated ${count} random errors`,
        results,
        summary: {
            total: count,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
        },
    };
}

// ============================================================================
// LOGGING ACTIONS (goes to logs table)
// ============================================================================

export async function logUserInteraction(action: string, context?: Record<string, any>) {
    try {
        await logger.info(`User interaction: ${action}`, {
            interactionType: 'user-action',
            action,
            ...context,
        });
        return { success: true, message: 'Interaction logged successfully' };
    } catch (error) {
        console.error('Failed to log user interaction:', error);
        return { success: false, message: 'Failed to log interaction' };
    }
}

export async function logPerformanceMetrics(metrics: Record<string, any>) {
    try {
        await logger.info('Performance metrics collected', {
            metricsType: 'performance',
            ...metrics,
        });
        return { success: true, message: 'Performance metrics logged' };
    } catch (error) {
        console.error('Failed to log performance metrics:', error);
        return { success: false, message: 'Failed to log metrics' };
    }
}

export async function logBusinessEvent(event: string, data: Record<string, any>) {
    try {
        await logger.info(`Business event: ${event}`, {
            eventType: 'business-logic',
            event,
            ...data,
        });
        return { success: true, message: 'Business event logged' };
    } catch (error) {
        console.error('Failed to log business event:', error);
        return { success: false, message: 'Failed to log event' };
    }
}

export async function logDebugInfo(message: string, debugData: Record<string, any>) {
    try {
        await logger.debug(message, {
            debugType: 'debug-info',
            ...debugData,
        });
        return { success: true, message: 'Debug info logged' };
    } catch (error) {
        console.error('Failed to log debug info:', error);
        return { success: false, message: 'Failed to log debug info' };
    }
}

export async function logWarning(message: string, warningData: Record<string, any>) {
    try {
        await logger.warn(message, {
            warningType: 'application-warning',
            ...warningData,
        });
        return { success: true, message: 'Warning logged' };
    } catch (error) {
        console.error('Failed to log warning:', error);
        return { success: false, message: 'Failed to log warning' };
    }
}

// ============================================================================
// ERROR TRACKING ACTIONS (goes to errors table) - EXISTING ENHANCED FUNCTIONS
// ============================================================================

// Enhanced server-side error generation with comprehensive metadata
export async function triggerServerActionError() {
    try {
        // Generate dynamic error details
        const dynamicError = generateDynamicErrorDetails();

        // Collect comprehensive server context
        const headersList = await headers();
        const serverContext = {
            timestamp: dynamicError.timestamp,
            requestId: dynamicError.requestId,
            action: 'triggerServerActionError',
            runtime: 'server',
            environment: process.env.NODE_ENV || 'development',

            // Request context
            requestContext: {
                userAgent: headersList.get('user-agent') || 'unknown',
                acceptLanguage: headersList.get('accept-language') || 'unknown',
                acceptEncoding: headersList.get('accept-encoding') || 'unknown',
                connection: headersList.get('connection') || 'unknown',
                host: headersList.get('host') || 'unknown',
                referer: headersList.get('referer') || 'unknown',
                origin: headersList.get('origin') || 'unknown',
                xForwardedFor: headersList.get('x-forwarded-for') || 'unknown',
                xRealIp: headersList.get('x-real-ip') || 'unknown',
                contentType: headersList.get('content-type') || 'unknown',
                contentLength: headersList.get('content-length') || 'unknown',
                cacheControl: headersList.get('cache-control') || 'unknown',
                pragma: headersList.get('pragma') || 'unknown',
                upgradeInsecureRequests: headersList.get('upgrade-insecure-requests') || 'unknown',
                dnt: headersList.get('dnt') || 'unknown',
                secFetchSite: headersList.get('sec-fetch-site') || 'unknown',
                secFetchMode: headersList.get('sec-fetch-mode') || 'unknown',
                secFetchDest: headersList.get('sec-fetch-dest') || 'unknown',
                secFetchUser: headersList.get('sec-fetch-user') || 'unknown',
            },

            // Server environment context
            serverEnvironment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                processId: process.pid,
                processTitle: process.title,
                execPath: process.execPath,
                argv: process.argv,
                cwd: process.cwd(),
                uptime: process.uptime(),

                // Environment variables (filtered for security)
                environmentVariables: {
                    NODE_ENV: process.env.NODE_ENV,
                    PORT: process.env.PORT,
                    HOST: process.env.HOST,
                    // Add other safe environment variables
                },

                // Memory usage
                memoryUsage: {
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
                    external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
                    arrayBuffers: Math.round((process.memoryUsage() as any).arrayBuffers / 1024 / 1024), // MB
                },

                // CPU usage
                cpuUsage: process.cpuUsage(),

                // Resource usage
                resourceUsage: process.resourceUsage ? {
                    userCPUTime: process.resourceUsage().userCPUTime,
                    systemCPUTime: process.resourceUsage().systemCPUTime,
                    maxRSS: process.resourceUsage().maxRSS,
                    sharedMemorySize: process.resourceUsage().sharedMemorySize,
                    unsharedDataSize: process.resourceUsage().unsharedDataSize,
                    unsharedStackSize: process.resourceUsage().unsharedStackSize,
                    minorPageFault: process.resourceUsage().minorPageFault,
                    majorPageFault: process.resourceUsage().majorPageFault,
                    swappedOut: process.resourceUsage().swappedOut,
                    fsRead: process.resourceUsage().fsRead,
                    fsWrite: process.resourceUsage().fsWrite,
                    ipcSent: process.resourceUsage().ipcSent,
                    ipcReceived: process.resourceUsage().ipcReceived,
                    signalsCount: process.resourceUsage().signalsCount,
                    voluntaryContextSwitches: process.resourceUsage().voluntaryContextSwitches,
                    involuntaryContextSwitches: process.resourceUsage().involuntaryContextSwitches,
                } : null,
            },

            // Performance timing
            performanceContext: {
                startTime: Date.now(),
                hrTimeStart: process.hrtime(),
            },
        };

        // Create enhanced error with dynamic details
        const error = new Error(dynamicError.message);
        (error as any).errorCode = dynamicError.code;
        (error as any).errorCategory = 'server-action';
        (error as any).severity = dynamicError.severity;
        (error as any).error_type = dynamicError.type;
        (error as any).serverContext = serverContext;

        // Add stack trace enhancement
        const originalStack = error.stack;
        const enhancedStack = originalStack + '\n\n--- Enhanced Context ---\n' +
            JSON.stringify(serverContext, null, 2);
        (error as any).enhancedStack = enhancedStack;

        throw error;

    } catch (e: any) {
        // Calculate performance metrics
        const endTime = Date.now();
        const hrTimeEnd = process.hrtime();
        const performanceMetrics = {
            executionTime: endTime - (e.serverContext?.performanceContext?.startTime || endTime),
            hrExecutionTime: hrTimeEnd,
            memoryUsageAtError: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024),
            },
            cpuUsageAtError: process.cpuUsage(),
        };

        // Log to errors table (error tracking)
        await analytics.track(e, {
            tags: ["server-action", "enhanced-error", "comprehensive-context"],
            error_type: "server",
            error_code: e.errorCode,
            severity: e.severity,
            environment: process.env.NODE_ENV || 'development',

            // Enhanced custom data
            custom_data: {
                ...e.serverContext,
                performanceMetrics,
                errorEnhancement: {
                    originalStack: e.stack,
                    enhancedStack: e.enhancedStack,
                    errorName: e.name,
                    errorMessage: e.message,
                    errorCode: e.errorCode,
                    errorCategory: e.errorCategory,
                },

                // Diagnostic information
                diagnostics: {
                    nodeModulesPresent: require('fs').existsSync('node_modules'),
                    packageJsonPresent: require('fs').existsSync('package.json'),
                    nextConfigPresent: require('fs').existsSync('next.config.ts'),

                    // Process information
                    processInfo: {
                        pid: process.pid,
                        ppid: process.ppid,
                        uid: process.getuid ? process.getuid() : null,
                        gid: process.getgid ? process.getgid() : null,
                        groups: process.getgroups ? process.getgroups() : null,
                    },

                    // System information
                    systemInfo: {
                        loadAverage: require('os').loadavg(),
                        freeMemory: Math.round(require('os').freemem() / 1024 / 1024),
                        totalMemory: Math.round(require('os').totalmem() / 1024 / 1024),
                        cpuCount: require('os').cpus().length,
                        osType: require('os').type(),
                        osRelease: require('os').release(),
                        osVersion: require('os').version(),
                        hostname: require('os').hostname(),
                        homedir: require('os').homedir(),
                        tmpdir: require('os').tmpdir(),
                        networkInterfaces: Object.keys(require('os').networkInterfaces()),
                    },
                },
            },
        });

        // Also log to logs table (general logging)
        await logger.error(e, {
            errorCategory: e.errorCategory,
            errorCode: e.errorCode,
            requestId: e.serverContext?.requestId,
            performanceMetrics,
        });

        return {
            success: false,
            message: e.message,
            errorCode: e.errorCode,
            errorCategory: e.errorCategory,
            requestId: e.serverContext?.requestId,
            timestamp: e.serverContext?.timestamp,
        };
    }
}

export async function triggerHttpError() {
    try {
        const headersList = await headers();
        const requestStartTime = Date.now();
        const requestId = `http_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Simulate comprehensive HTTP request context
        const httpContext = {
            request: {
                id: requestId,
                method: "POST",
                url: "/api/users",
                headers: {
                    "content-type": "application/json",
                    "user-agent": headersList.get('user-agent') || 'unknown',
                    "accept": headersList.get('accept') || 'unknown',
                    "accept-language": headersList.get('accept-language') || 'unknown',
                    "accept-encoding": headersList.get('accept-encoding') || 'unknown',
                    "connection": headersList.get('connection') || 'unknown',
                    "host": headersList.get('host') || 'unknown',
                    "referer": headersList.get('referer') || 'unknown',
                    "origin": headersList.get('origin') || 'unknown',
                    "x-forwarded-for": headersList.get('x-forwarded-for') || 'unknown',
                    "x-real-ip": headersList.get('x-real-ip') || 'unknown',
                },
                body: {
                    userId: "123",
                    operation: "create_user",
                    timestamp: new Date().toISOString(),
                    requestMetadata: {
                        clientVersion: "1.0.0",
                        apiVersion: "v1",
                        requestSource: "web-app",
                    },
                },
                queryParams: {},
                pathParams: {},
                cookies: headersList.get('cookie') || '',
                ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1',
                userAgent: headersList.get('user-agent') || 'unknown',
                contentLength: headersList.get('content-length') || '0',
                requestTime: requestStartTime,
            },

            response: {
                statusCode: 500,
                statusMessage: "Internal Server Error",
                headers: {
                    "content-type": "application/json",
                    "x-request-id": requestId,
                    "x-response-time": "0ms",
                    "server": "next.js",
                    "cache-control": "no-cache",
                },
                body: {
                    error: "Database connection timeout",
                    errorCode: "DB_CONNECTION_TIMEOUT",
                    requestId: requestId,
                    timestamp: new Date().toISOString(),
                },
                responseTime: 0, // Will be calculated
            },

            // Database context (simulated)
            databaseContext: {
                connectionPool: {
                    active: 5,
                    idle: 2,
                    waiting: 3,
                    max: 10,
                },
                query: {
                    sql: "SELECT * FROM users WHERE id = $1",
                    parameters: ["123"],
                    timeout: 30000,
                    retryCount: 2,
                    queryPlan: "Index Scan using users_pkey on users",
                },
                connectionDetails: {
                    host: "localhost",
                    port: 5432,
                    database: "analytics_db",
                    ssl: false,
                    connectionTimeout: 10000,
                    queryTimeout: 30000,
                },
                errorDetails: {
                    errorCode: "ECONNRESET",
                    sqlState: "08006",
                    severity: "FATAL",
                    message: "Connection terminated unexpectedly",
                    detail: "The connection to the server was lost",
                    hint: "Check network connectivity and server status",
                },
            },

            // System context at time of error
            systemContext: {
                timestamp: new Date().toISOString(),
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                processId: process.pid,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                loadAverage: require('os').loadavg(),
                freeMemory: require('os').freemem(),
                totalMemory: require('os').totalmem(),
                networkInterfaces: require('os').networkInterfaces(),
            },
        };

        // Simulate database connection timeout
        const dbError = new Error("Database connection timeout");
        (dbError as any).code = 'ECONNRESET';
        (dbError as any).errno = -4077;
        (dbError as any).syscall = 'connect';
        (dbError as any).address = '127.0.0.1';
        (dbError as any).port = 5432;
        (dbError as any).sqlState = '08006';
        (dbError as any).severity = 'FATAL';
        (dbError as any).httpContext = httpContext;

        throw dbError;

    } catch (e: any) {
        const requestEndTime = Date.now();
        const responseTime = requestEndTime - (e.httpContext?.request?.requestTime || requestEndTime);

        // Update response time in context
        if (e.httpContext?.response) {
            e.httpContext.response.responseTime = responseTime;
            e.httpContext.response.headers['x-response-time'] = `${responseTime}ms`;
        }

        // Log to errors table (error tracking)
        await analytics.track(e, {
            tags: ["server-action", "http-error", "database", "connection-timeout", "enhanced-context"],
            error_type: "server",
            error_code: e.code,
            severity: "critical",
            environment: process.env.NODE_ENV || 'development',

            custom_data: {
                ...e.httpContext,
                errorDetails: {
                    name: e.name,
                    message: e.message,
                    code: e.code,
                    errno: e.errno,
                    syscall: e.syscall,
                    address: e.address,
                    port: e.port,
                    sqlState: e.sqlState,
                    severity: e.severity,
                    stack: e.stack,
                },

                // Performance metrics
                performanceMetrics: {
                    responseTime,
                    memoryUsageAtError: process.memoryUsage(),
                    cpuUsageAtError: process.cpuUsage(),
                    systemLoadAtError: require('os').loadavg(),
                },

                // Troubleshooting information
                troubleshooting: {
                    likelyRootCause: "Database connection pool exhausted or network connectivity issue",
                    suggestedActions: [
                        "Check database server status",
                        "Verify network connectivity",
                        "Review connection pool configuration",
                        "Check for resource exhaustion",
                        "Monitor database performance metrics"
                    ],
                    relatedErrors: [
                        "ECONNRESET",
                        "ETIMEDOUT",
                        "ECONNREFUSED",
                        "Connection pool timeout"
                    ],
                    diagnosticQueries: [
                        "SELECT * FROM pg_stat_activity",
                        "SELECT * FROM pg_stat_database",
                        "SHOW max_connections",
                        "SHOW shared_buffers"
                    ],
                },
            },
        });

        // Also log to logs table (general logging)
        await logger.error(e, {
            httpContext: e.httpContext,
            errorCode: e.code,
            requestId: e.httpContext?.request?.id,
            responseTime,
        });

        return {
            success: false,
            message: e.message,
            errorCode: e.code,
            requestId: e.httpContext?.request?.id,
            responseTime,
            troubleshooting: {
                likelyRootCause: "Database connection issue",
                suggestedActions: ["Check database connectivity", "Review connection pool settings"]
            }
        };
    }
}

export async function triggerExceptionError() {
    try {
        const headersList = await headers();
        const validationStartTime = Date.now();
        const validationId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Simulate complex validation with comprehensive context
        const validationContext = {
            validationId,
            validationStartTime,
            validationRules: [
                {
                    rule: "email-format",
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    required: true,
                    errorMessage: "Invalid email format",
                },
                {
                    rule: "email-domain-whitelist",
                    allowedDomains: ["example.com", "test.com", "company.com"],
                    required: false,
                    errorMessage: "Email domain not in whitelist",
                },
                {
                    rule: "email-length",
                    minLength: 5,
                    maxLength: 100,
                    required: true,
                    errorMessage: "Email length must be between 5 and 100 characters",
                },
            ],

            inputData: {
                email: "invalid-email",
                submittedAt: new Date().toISOString(),
                submissionMethod: "form-post",
                userAgent: headersList.get('user-agent') || 'unknown',
                ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1',
                sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            },

            validationResults: {
                overallValid: false,
                fieldValidations: {},
                errorCount: 0,
                warningCount: 0,
                validationDuration: 0, // Will be calculated
            },

            businessRules: {
                userRegistrationEnabled: true,
                emailVerificationRequired: true,
                duplicateEmailCheck: true,
                rateLimitingEnabled: true,
                rateLimitWindow: 3600, // 1 hour
                rateLimitMaxAttempts: 5,
                currentAttempts: 1,
            },

            systemContext: {
                validationService: {
                    version: "1.0.0",
                    rules: 15,
                    customValidators: 3,
                    cacheEnabled: true,
                    cacheHitRate: 0.85,
                },
                performance: {
                    averageValidationTime: 25, // ms
                    maxValidationTime: 150, // ms
                    validationsPerSecond: 1200,
                    errorRate: 0.05,
                },
                dependencies: {
                    emailValidator: "^2.0.4",
                    joi: "^17.7.0",
                    zod: "^3.20.2",
                },
            },
        };

        // Perform validation
        const email = validationContext.inputData.email;
        const validationErrors = [];

        // Email format validation
        if (!validationContext.validationRules[0]?.pattern?.test(email)) {
            validationErrors.push({
                field: "email",
                rule: "email-format",
                value: email,
                message: "Invalid email format",
                severity: "error",
                code: "VALIDATION_ERROR_001",
            });
        }

        // Email length validation
        if (email.length < 5 || email.length > 100) {
            validationErrors.push({
                field: "email",
                rule: "email-length",
                value: email,
                message: "Email length must be between 5 and 100 characters",
                severity: "error",
                code: "VALIDATION_ERROR_002",
            });
        }

        // Email domain validation
        const emailDomain = email.split('@')[1];
        if (emailDomain && !validationContext.validationRules[1]?.allowedDomains?.includes(emailDomain)) {
            validationErrors.push({
                field: "email",
                rule: "email-domain-whitelist",
                value: emailDomain,
                message: "Email domain not in whitelist",
                severity: "warning",
                code: "VALIDATION_WARNING_001",
            });
        }

        // Calculate validation duration
        const validationEndTime = Date.now();
        const validationDuration = validationEndTime - validationStartTime;

        // Update validation results
        validationContext.validationResults = {
            overallValid: validationErrors.filter(e => e.severity === 'error').length === 0,
            fieldValidations: {
                email: {
                    valid: validationErrors.filter(e => e.field === 'email' && e.severity === 'error').length === 0,
                    errors: validationErrors.filter(e => e.field === 'email' && e.severity === 'error'),
                    warnings: validationErrors.filter(e => e.field === 'email' && e.severity === 'warning'),
                },
            },
            errorCount: validationErrors.filter(e => e.severity === 'error').length,
            warningCount: validationErrors.filter(e => e.severity === 'warning').length,
            validationDuration,
        };

        if (validationErrors.length > 0) {
            // Create comprehensive validation error
            const validationError = new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
            (validationError as any).code = 'VALIDATION_ERROR';
            (validationError as any).validationErrors = validationErrors;
            (validationError as any).validationContext = validationContext;
            (validationError as any).field = 'email';
            (validationError as any).value = email;
            (validationError as any).severity = 'medium';

            // Add enhanced stack trace with validation context
            const originalStack = validationError.stack;
            const validationStack = originalStack + '\n\n--- Validation Context ---\n' +
                JSON.stringify(validationContext, null, 2) + '\n\n--- Validation Errors ---\n' +
                JSON.stringify(validationErrors, null, 2);
            (validationError as any).enhancedStack = validationStack;

            throw validationError;
        }

    } catch (e: any) {
        const errorEndTime = Date.now();
        const totalProcessingTime = errorEndTime - (e.validationContext?.validationStartTime || errorEndTime);

        // Log to errors table (error tracking)
        await analytics.track(e, {
            tags: ["server-action", "validation-error", "comprehensive-validation", "business-rules"],
            error_type: "server",
            error_code: e.code,
            severity: e.severity,
            environment: process.env.NODE_ENV || 'development',

            custom_data: {
                ...e.validationContext,
                validationErrors: e.validationErrors,
                errorDetails: {
                    name: e.name,
                    message: e.message,
                    code: e.code,
                    field: e.field,
                    value: e.value,
                    severity: e.severity,
                    stack: e.stack,
                    enhancedStack: e.enhancedStack,
                },

                // Performance metrics
                performanceMetrics: {
                    totalProcessingTime,
                    validationDuration: e.validationContext?.validationResults?.validationDuration || 0,
                    memoryUsageAtError: process.memoryUsage(),
                    cpuUsageAtError: process.cpuUsage(),
                    systemLoadAtError: require('os').loadavg(),
                },

                // User experience impact
                userExperienceImpact: {
                    impactLevel: "medium",
                    userFacing: true,
                    requiresUserAction: true,
                    expectedUserResponse: "correct-input-and-resubmit",
                    alternativeActions: ["try-different-email", "contact-support"],
                },

                // Debugging information
                debugInfo: {
                    validationRulesApplied: e.validationContext?.validationRules?.length || 0,
                    validationErrorsFound: e.validationErrors?.length || 0,
                    criticalErrorsFound: e.validationErrors?.filter((err: any) => err.severity === 'error').length || 0,
                    warningsFound: e.validationErrors?.filter((err: any) => err.severity === 'warning').length || 0,
                    validationServiceHealth: "operational",
                    relatedComponents: ["email-validator", "business-rules-engine", "user-registration-service"],
                },

                // Monitoring and alerting
                monitoring: {
                    alertLevel: "info",
                    requiresImmedateAttention: false,
                    affectsUserExperience: true,
                    businessImpact: "low",
                    technicalImpact: "none",
                    recommendedActions: [
                        "Monitor validation error trends",
                        "Review user input patterns",
                        "Consider improving validation messaging"
                    ],
                },
            },
        });

        // Also log to logs table (general logging)
        await logger.warn('Validation failed for user input', {
            validationErrors: e.validationErrors,
            validationId: e.validationContext?.validationId,
            processingTime: totalProcessingTime,
            field: e.field,
            value: e.value,
        });

        return {
            success: false,
            message: e.message,
            code: e.code,
            field: e.field,
            value: e.value,
            validationErrors: e.validationErrors,
            validationId: e.validationContext?.validationId,
            processingTime: totalProcessingTime,
            userGuidance: {
                message: "Please check your input and try again",
                suggestedActions: ["Enter a valid email address", "Use a supported email domain"],
                helpLink: "/help/validation-errors",
            }
        };
    }
} 