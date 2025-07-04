import { UAParser } from 'ua-parser-js';
import { parse as parseDomain } from 'tldts';
import type {
    ErrorData,
    SDKConfig,
    InternalSDKConfig,
    SDKResponse,
    ServerErrorContext,
    RequestContext,
    ResponseContext
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

        this.log('SDK initialized', {
            runtime: this.isServer ? 'server' : 'client',
            config: {
                apiUrl: this.config.apiUrl,
                clientId: this.config.clientId,
                environment: this.config.environment,
                autoCapture: this.config.autoCapture,
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

    private log(message: string, data?: unknown): void {
        if (this.config.debug) {
            const prefix = this.isServer ? '[BetterAnalytics:Server]' : '[BetterAnalytics:Client]';
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

    private setupClientAutoCapture(): void {
        if (typeof window === 'undefined') return;

        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            void this.captureError({
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
            void this.captureError({
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
            void this.captureError({
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
        const baseData: ErrorData = {
            client_id: this.config.clientId,
            error_type: this.isServer ? 'server' : 'client',
            severity: 'medium',
            environment: this.config.environment,
            session_id: data.session_id || this.generateSessionId(),
            ...data,
        };

        if (this.isClient) {
            return this.enrichClientErrorData(baseData);
        }

        return this.enrichServerErrorData(baseData, serverContext);
    }

    private enrichClientErrorData(data: ErrorData): ErrorData {
        const uaResult = this.parser.getResult();
        const currentUrl = typeof window !== 'undefined' ? window.location.href : data.url;
        const domainInfo = currentUrl ? parseDomain(currentUrl) : null;

        return {
            ...data,

            // Auto-detect browser/device info
            browser_name: data.browser_name || uaResult.browser.name || undefined,
            browser_version: data.browser_version || uaResult.browser.version || undefined,
            os_name: data.os_name || uaResult.os.name || undefined,
            os_version: data.os_version || uaResult.os.version || undefined,
            device_type: data.device_type || uaResult.device.type || 'desktop',

            // Auto-detect viewport
            viewport_width: data.viewport_width || (typeof window !== 'undefined' ? window.innerWidth : undefined),
            viewport_height: data.viewport_height || (typeof window !== 'undefined' ? window.innerHeight : undefined),

            // Auto-detect page info
            url: data.url || currentUrl,
            page_title: data.page_title || (typeof document !== 'undefined' ? document.title : undefined),
            referrer: data.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
            source: data.source || domainInfo?.domain || undefined,
        };
    }

    private enrichServerErrorData(data: ErrorData, serverContext?: ServerErrorContext): ErrorData {
        const enriched: ErrorData = {
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
            enriched.http_method = enriched.http_method || serverContext.req?.method;
            enriched.url = enriched.url || serverContext.req?.url;
            enriched.http_status_code = enriched.http_status_code || serverContext.res?.statusCode;
            enriched.request_id = enriched.request_id || serverContext.requestId;
            enriched.user_id = enriched.user_id || serverContext.userId;

            // Extract user agent from request headers
            if (serverContext.req?.userAgent) {
                const uaResult = this.parser.setUA(serverContext.req.userAgent).getResult();
                enriched.user_agent = enriched.user_agent || serverContext.req.userAgent;
                enriched.browser_name = enriched.browser_name || uaResult.browser.name || undefined;
                enriched.browser_version = enriched.browser_version || uaResult.browser.version || undefined;
                enriched.os_name = enriched.os_name || uaResult.os.name || undefined;
                enriched.os_version = enriched.os_version || uaResult.os.version || undefined;
                enriched.device_type = enriched.device_type || uaResult.device.type || 'desktop';
            }
        }

        return enriched;
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
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async sendError(errorData: ErrorData, retryCount = 0): Promise<SDKResponse> {
        try {
            const response = await fetch(`${this.config.apiUrl}/ingest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json() as SDKResponse;
            this.log('Error sent successfully', { id: result.id });
            return result;
        } catch (error) {
            this.log('Failed to send error', { error, retryCount });

            if (retryCount < this.config.maxRetries) {
                await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
                return this.sendError(errorData, retryCount + 1);
            }

            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Capture a custom error
     */
    async captureError(data: Partial<ErrorData>, serverContext?: ServerErrorContext): Promise<SDKResponse> {
        if (this.isDisabled) {
            return {
                status: 'error',
                message: 'SDK is disabled.',
            };
        }
        try {
            const enrichedData = this.enrichErrorData(data, serverContext);
            return await this.sendError(enrichedData);
        } catch (error) {
            this.log('Failed to capture error', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Capture an exception with optional context
     */
    async captureException(error: Error, context?: Partial<ErrorData>, serverContext?: ServerErrorContext): Promise<SDKResponse> {
        if (this.isDisabled) {
            return {
                status: 'error',
                message: 'SDK is disabled.',
            };
        }
        return this.captureError({
            error_type: this.isServer ? 'server' : 'client',
            severity: 'high',
            error_name: error.name,
            message: error.message,
            stack_trace: error.stack,
            ...context,
        }, serverContext);
    }

    /**
     * Server-specific method for capturing HTTP errors
     * Works with Express.js and similar frameworks
     */
    async captureHttpError(
        error: Error,
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        context?: Partial<ErrorData>
    ): Promise<SDKResponse> {
        if (this.isDisabled) {
            return {
                status: 'error',
                message: 'SDK is disabled.',
            };
        }
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
            body: req.body,
            ip: this.extractStringValue(req, ['ip', 'connection.remoteAddress']),
            userAgent: this.extractStringValue(req, ['headers.user-agent']) ||
                this.extractStringValue(req, ['get']) &&
                typeof req.get === 'function' ?
                (req.get as (header: string) => string | undefined)('User-Agent') :
                undefined,
        };
    }

    private extractResponseContext(res: Record<string, unknown>): ResponseContext {
        return {
            statusCode: this.extractNumberValue(res, ['statusCode']),
            headers: this.extractObjectValue(res, ['getHeaders']) &&
                typeof res.getHeaders === 'function' ?
                (res.getHeaders as () => Record<string, string>)() :
                this.extractObjectValue(res, ['headers']),
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
            if (value && typeof value === 'object') {
                return value as Record<string, string>;
            }
        }
        return undefined;
    }

    private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce<unknown>((current, key) => {
            return current && typeof current === 'object' && key in current
                ? (current as Record<string, unknown>)[key]
                : undefined;
        }, obj);
    }

    /**
     * Set user ID for future error reports
     */
    setUser(userId: string): void {
        if (this.isDisabled) return;
        if (this.isClient && typeof window !== 'undefined') {
            (window as unknown as Record<string, unknown>).__betterAnalyticsUserId = userId;
        }
        // For server-side, store in instance
        (this as Record<string, unknown>).__userId = userId;
    }

    /**
     * Set context data for future error reports
     */
    setContext(context: Partial<ErrorData>): void {
        if (this.isDisabled) return;
        if (this.isClient && typeof window !== 'undefined') {
            const win = window as unknown as Record<string, unknown>;
            win.__betterAnalyticsContext = {
                ...(win.__betterAnalyticsContext as Record<string, unknown> || {}),
                ...context,
            };
        }
        // For server-side, store in instance
        const self = this as unknown as Record<string, unknown>;
        self.__context = {
            ...(self.__context as Record<string, unknown> || {}),
            ...context,
        };
    }

    /**
     * Check if running in server environment
     */
    isServerSide(): boolean {
        return this.isServer;
    }

    /**
     * Check if running in client environment
     */
    isClientSide(): boolean {
        return this.isClient;
    }
} 