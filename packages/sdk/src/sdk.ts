import { UAParser } from 'ua-parser-js';
import { parse as parseDomain } from 'tldts';
import type {
    ErrorData,
    SDKConfig,
    InternalSDKConfig,
    SDKResponse,
    ServerErrorContext,
    RequestContext,
    ResponseContext,
    LogData,
    LogLevel
} from './types';

/**
 * Better Analytics SDK for error tracking
 * Supports both client-side and server-side environments
 */
export class BetterAnalyticsSDK {
    private readonly config: InternalSDKConfig;
    private readonly parser!: UAParser;
    private readonly isServer: boolean;
    private readonly isClient: boolean;
    private isDisabled = false;

    constructor(config: SDKConfig) {
        // Auto-detect environment
        this.isServer = config.isServer ?? (typeof window === 'undefined' && typeof process !== 'undefined');
        this.isClient = !this.isServer;

        // Create internal config with defaults
        this.config = {
            environment: 'production',
            debug: false,
            autoCapture: false,
            autoLog: false,
            logLevel: 'info',
            maxRetries: 3,
            retryDelay: 1000,
            isServer: this.isServer,
            ...config,
        };

        // Add server-specific properties after the main config is set
        if (this.isServer) {
            this.config.serverName = config.serverName || this.getServerHostname();
            this.config.serviceName = config.serviceName;
            this.config.serviceVersion = config.serviceVersion;
        }

        if (!this.config.clientId) {
            this.isDisabled = true;
            console.warn('[BetterAnalyticsSDK] Warning: `clientId` is not provided. The SDK will be disabled.');
            return;
        }

        this.parser = new UAParser();

        if (this.config.autoCapture) {
            this.setupAutoCapture();
        }

        if (this.config.autoLog) {
            this.setupAutoLogging();
        }

        this.logDebug('SDK initialized', {
            runtime: this.isServer ? 'server' : 'client',
            config: {
                apiUrl: this.config.apiUrl,
                clientId: this.config.clientId,
                environment: this.config.environment,
                autoCapture: this.config.autoCapture,
                autoLog: this.config.autoLog,
                logLevel: this.config.logLevel,
            }
        });
    }

    private getServerHostname(): string | undefined {
        if (!this.isServer) return undefined;

        try {
            // Dynamic import to avoid issues in client environments
            const os = require('os');
            return os.hostname();
        } catch {
            return undefined;
        }
    }

    private logDebug(message: string, data?: unknown): void {
        if (this.config.debug) {
            const prefix = this.isServer ? `[BetterAnalytics:${this.isServer ? 'Server' : 'Client'}]` : '[BetterAnalytics]';
            console.log(`${prefix} ${message}`, data);
        }
    }

    private setupAutoCapture(): void {
        if (this.isClient) {
            this.setupClientAutoCapture();
        } else {
            this.setupServerAutoCapture();
        }
    }

    private setupAutoLogging(): void {
        if (this.isDisabled) return;

        const logLevels: LogLevel[] = ['trace', 'debug', 'info', 'log', 'warn', 'error'];
        const configuredLogLevelIndex = logLevels.indexOf(this.config.logLevel);

        logLevels.forEach((level, index) => {
            if (index >= configuredLogLevelIndex) {
                const originalConsoleMethod = console[level];
                console[level] = (...args: any[]) => {
                    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                    this.reportLog(message, { level });
                    originalConsoleMethod.apply(console, args);
                };
            }
        });

        this.logDebug(`Console auto-logging enabled for levels: ${logLevels.slice(configuredLogLevelIndex).join(', ')}`);
    }

    private setupClientAutoCapture(): void {
        if (typeof window === 'undefined') return;

        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            void this.reportError({
                error_type: 'client',
                severity: 'high',
                error_name: event.error?.name || 'Error',
                message: event.message,
                stack_trace: event.error?.stack,
                url: event.filename,
            });
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            void this.reportError({
                error_type: 'client',
                severity: 'high',
                error_name: 'UnhandledPromiseRejection',
                message: event.reason?.message || String(event.reason),
                stack_trace: event.reason?.stack,
            });
        });
    }

    private setupServerAutoCapture(): void {
        if (typeof process === 'undefined') return;

        process.on('uncaughtException', (error) => {
            void this.captureException(error, {
                error_type: 'server',
                severity: 'critical',
                tags: ['uncaught-exception'],
            });
        });

        process.on('unhandledRejection', (reason) => {
            void this.reportError({
                error_type: 'server',
                severity: 'critical',
                error_name: 'UnhandledPromiseRejection',
                message: reason instanceof Error ? reason.message : String(reason),
                stack_trace: reason instanceof Error ? reason.stack : undefined,
                tags: ['unhandled-rejection'],
            });
        });
    }

    private enrichErrorData(data: Partial<ErrorData>, serverContext?: ServerErrorContext): ErrorData {
        const baseData: Partial<ErrorData> = {
            client_id: this.config.clientId,
            error_type: this.isServer ? 'server' : 'client',
            severity: 'medium',
            environment: this.config.environment,
            session_id: data.session_id || this.generateSessionId(),
            ...data,
        };

        const enrichedData = this.isClient
            ? this.enrichClientErrorData(baseData)
            : this.enrichServerErrorData(baseData, serverContext);

        return enrichedData as ErrorData;
    }

    private enrichClientErrorData(data: Partial<ErrorData>): Partial<ErrorData> {
        const uaResult = this.parser.getResult();
        const currentUrl = typeof window !== 'undefined' ? window.location.href : data.url;
        const domainInfo = currentUrl ? parseDomain(currentUrl) : null;

        const connection = (navigator as any).connection;

        return {
            ...data,
            browser_name: data.browser_name || uaResult.browser.name,
            browser_version: data.browser_version || uaResult.browser.version,
            os_name: data.os_name || uaResult.os.name,
            os_version: data.os_version || uaResult.os.version,
            device_type: data.device_type || uaResult.device.type || 'desktop',
            viewport_width: data.viewport_width || (typeof window !== 'undefined' ? window.innerWidth : undefined),
            viewport_height: data.viewport_height || (typeof window !== 'undefined' ? window.innerHeight : undefined),
            url: data.url || currentUrl,
            page_title: data.page_title || (typeof document !== 'undefined' ? document.title : undefined),
            referrer: data.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
            source: data.source || domainInfo?.domain || undefined,

            // Network Information
            connection_type: connection?.type,
            connection_effective_type: connection?.effectiveType,
            connection_downlink: connection?.downlink,
            connection_rtt: connection?.rtt,

            // Hardware Information
            device_memory: (navigator as any).deviceMemory,
            device_cpu_cores: navigator.hardwareConcurrency,
        };
    }

    private enrichServerErrorData(data: Partial<ErrorData>, serverContext?: ServerErrorContext): Partial<ErrorData> {
        const enrichedData: Partial<ErrorData> = {
            ...data,

            // Server environment info
            server_name: data.server_name || this.config.serverName,
            service_name: data.service_name || this.config.serviceName,
            service_version: data.service_version || this.config.serviceVersion,
            node_version: data.node_version || (typeof process !== 'undefined' ? process.version : undefined),
            process_id: data.process_id || (typeof process !== 'undefined' ? process.pid : undefined),

            // Memory usage
            memory_usage_mb: data.memory_usage_mb ?? this.getMemoryUsage(),
        };

        // Enrich with server context if provided
        if (serverContext) {
            enrichedData.http_method = serverContext.req?.method;
            enrichedData.url = serverContext.req?.url;
            enrichedData.http_status_code = serverContext.res?.statusCode;
            enrichedData.request_id = serverContext.requestId;
            enrichedData.user_id = serverContext.userId;

            // Extract user agent from request headers
            if (serverContext.req?.userAgent) {
                const uaResult = this.parser.setUA(serverContext.req.userAgent).getResult();
                enrichedData.user_agent = serverContext.req.userAgent;
                enrichedData.browser_name = uaResult.browser.name;
                enrichedData.browser_version = uaResult.browser.version;
                enrichedData.os_name = uaResult.os.name;
                enrichedData.os_version = uaResult.os.version;
                enrichedData.device_type = uaResult.device.type || 'desktop';
            }
        }

        return enrichedData;
    }

    private getMemoryUsage(): number | undefined {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            try {
                const usage = process.memoryUsage();
                return Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100; // MB with 2 decimal places
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    private generateSessionId(): string {
        const prefix = this.isServer ? 'server' : 'client';
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    private async _sendToApi(
        endpoint: "ingest" | "log",
        data: Partial<ErrorData> | Partial<LogData>,
        retryCount = 0,
    ): Promise<SDKResponse> {
        if (this.isDisabled) {
            this.logDebug("SDK is disabled. Skipping send.");
            return { success: false, message: "SDK is disabled" };
        }

        const url = `${this.config.apiUrl}/${endpoint}`;
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (this.config.accessToken) {
            headers["Authorization"] = `Bearer ${this.config.accessToken}`;
        }

        this.logDebug(`Sending data to ${url}`, data);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json() as SDKResponse;
            this.logDebug(`${endpoint === 'ingest' ? 'Error' : 'Log'} sent successfully`, { id: result.id });
            return result;
        } catch (error) {
            this.logDebug(`Failed to send ${endpoint === 'ingest' ? 'error' : 'log'}`, { error, retryCount });

            if (retryCount < this.config.maxRetries) {
                await this.delay(this.config.retryDelay * 2 ** retryCount);
                return this._sendToApi(endpoint, data, retryCount + 1);
            }

            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reports a custom error. This is the core method for sending error data.
     * @param data - The error data to report.
     * @param serverContext - Optional server-side context.
     */
    async reportError(data: Partial<Omit<ErrorData, 'custom_data'>> & { custom_data?: Record<string, any> | string }, serverContext?: ServerErrorContext): Promise<SDKResponse> {
        if (this.isDisabled) return { success: false, message: 'SDK is disabled' };
        try {
            const { custom_data, ...otherData } = data;
            const processedData: Partial<ErrorData> = { ...otherData };
            if (custom_data) {
                processedData.custom_data = typeof custom_data === 'object' ? JSON.stringify(custom_data) : custom_data;
            }
            const enrichedData = this.enrichErrorData(processedData, serverContext);
            this.logDebug('Reporting error', { data: enrichedData });
            return this._sendToApi('ingest', enrichedData);
        } catch (error) {
            this.logDebug('Failed to report error', error);
            return { success: false, message: 'Failed to report error' };
        }
    }

    /**
     * Captures an exception.
     * @param error - The error to capture.
     * @param context - Optional context to add to the error.
     * @param serverContext - Optional server-side context.
     */
    async captureException(error: Error, context?: Partial<Omit<ErrorData, 'custom_data'>> & { custom_data?: Record<string, any> | string }, serverContext?: ServerErrorContext): Promise<SDKResponse> {
        if (this.isDisabled) return { success: false, message: 'SDK is disabled' };
        const errorData: Partial<Omit<ErrorData, 'custom_data'>> & { custom_data?: Record<string, any> | string } = {
            error_type: this.isServer ? 'server' : 'client',
            severity: 'high',
            error_name: error.name,
            message: error.message,
            stack_trace: error.stack,
            ...context,
        };
        return this.reportError(errorData, serverContext);
    }

    /**
     * Sends a log message.
     * @param message - The message to log.
     * @param context - Optional context to add to the log.
     */
    async reportLog(message: string, context?: Partial<Omit<LogData, 'message' | 'context'>> & { context?: Record<string, any> | string }): Promise<SDKResponse> {
        if (this.isDisabled) return { success: false, message: 'SDK is disabled' };

        const { context: rawContext, ...otherContext } = context || {};

        const logData: Partial<LogData> = {
            client_id: this.config.clientId,
            level: 'info',
            message,
            environment: this.config.environment,
            session_id: this.generateSessionId(),
            ...otherContext,
        };

        if (rawContext) {
            logData.context = typeof rawContext === 'object' ? JSON.stringify(rawContext) : rawContext;
        }

        this.logDebug('Capturing log', { data: logData });
        return this._sendToApi('log', logData);
    }

    /**
     * Captures an HTTP error.
     * @param error - The error to capture.
     * @param req - The HTTP request object.
     * @param res - The HTTP response object.
     * @param context - Optional context to add to the error.
     */
    async captureHttpError(
        error: Error,
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        context?: Partial<Omit<ErrorData, 'custom_data'>> & { custom_data?: Record<string, any> | string }
    ): Promise<SDKResponse> {
        if (this.isDisabled) return { success: false, message: 'SDK is disabled' };
        const serverContext: ServerErrorContext = {
            req: this.extractRequestContext(req),
            res: this.extractResponseContext(res),
            requestId: this.extractStringValue(req, ['id', 'requestId']),
            userId: this.extractStringValue(req, ['user.id', 'userId']),
        };

        const httpStatusCode = this.extractNumberValue(res, ['statusCode']) || 500;

        return this.captureException(error, {
            error_type: 'server',
            severity: httpStatusCode >= 500 ? 'high' : 'medium',
            http_method: serverContext.req?.method,
            endpoint: serverContext.req?.url,
            http_status_code: httpStatusCode,
            ...context,
        }, serverContext);
    }

    private extractRequestContext(req: Record<string, unknown>): RequestContext {
        return {
            method: this.extractStringValue(req, ['method']),
            url: this.extractStringValue(req, ['url', 'originalUrl']),
            headers: this.extractObjectValue(req, ['headers']),
            body: this.getNestedValue(req, 'body'),
            ip: this.extractStringValue(req, ['ip', 'connection.remoteAddress']),
            userAgent: this.extractStringValue(req, ['headers.user-agent']),
        };
    }

    private extractResponseContext(res: Record<string, unknown>): ResponseContext {
        return {
            statusCode: this.extractNumberValue(res, ['statusCode']),
            headers: this.extractObjectValue(res, ['headers', '_headers']),
        };
    }

    private extractStringValue(obj: Record<string, unknown>, paths: string[]): string | undefined {
        for (const path of paths) {
            const value = this.getNestedValue(obj, path);
            if (typeof value === 'string') return value;
        }
        return undefined;
    }

    private extractNumberValue(obj: Record<string, unknown>, paths: string[]): number | undefined {
        for (const path of paths) {
            const value = this.getNestedValue(obj, path);
            if (typeof value === 'number') return value;
        }
        return undefined;
    }

    private extractObjectValue(obj: Record<string, unknown>, paths: string[]): Record<string, string> | undefined {
        for (const path of paths) {
            const value = this.getNestedValue(obj, path);
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return value as Record<string, string>;
            }
        }
        return undefined;
    }

    private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce((acc, part) => acc && (acc as any)[part], obj);
    }

    isServerSide(): boolean {
        return this.isServer;
    }

    isClientSide(): boolean {
        return this.isClient;
    }
} 