import type { ApiResponse } from './types';

export interface LogData {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    context?: Record<string, any>;
    tags?: string[];
}

export interface LoggerConfig {
    apiUrl: string;
    clientId: string;
    accessToken?: string;
    environment?: string;
    serviceName?: string;
    serviceVersion?: string;
    debug?: boolean;
    minLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface Logger {
    debug(message: string, context?: Record<string, any>): Promise<void>;
    info(message: string, context?: Record<string, any>): Promise<void>;
    warn(message: string, context?: Record<string, any>): Promise<void>;
    error(message: string, context?: Record<string, any>): Promise<void>;
    error(error: Error, context?: Record<string, any>): Promise<void>;
    setUser(userId: string): void;
    setRequestId(requestId: string): void;
    addTags(tags: string[]): void;
}

class ServerLogger implements Logger {
    private config: Required<Omit<LoggerConfig, 'accessToken'>> & { accessToken?: string };
    private userId?: string;
    private requestId?: string;
    private globalTags: string[] = [];
    private readonly levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };

    constructor(config: LoggerConfig) {
        this.config = {
            environment: 'production',
            serviceName: 'unknown-service',
            serviceVersion: '1.0.0',
            debug: false,
            minLevel: 'info',
            ...config,
        };

        this.log('Logger initialized', {
            clientId: this.config.clientId,
            environment: this.config.environment,
            serviceName: this.config.serviceName,
            minLevel: this.config.minLevel,
        });
    }

    private log(message: string, data?: any): void {
        if (this.config.debug) {
            console.log(`[Logger] ${message}`, data);
        }
    }

    private shouldLog(level: LogData['level']): boolean {
        return this.levelPriority[level] >= this.levelPriority[this.config.minLevel];
    }

    private enrichLogData(data: Partial<LogData>): LogData {
        return {
            level: data.level || 'info',
            message: data.message || 'No message provided',
            tags: [...this.globalTags, ...(data.tags || [])],
            context: {
                timestamp: new Date().toISOString(),
                environment: this.config.environment,
                serviceName: this.config.serviceName,
                serviceVersion: this.config.serviceVersion,
                userId: this.userId,
                requestId: this.requestId,
                ...this.getServerInfo(),
                ...data.context,
            },
        };
    }

    private getServerInfo(): Record<string, any> {
        if (typeof process === 'undefined') return {};

        try {
            const memUsage = process.memoryUsage();
            return {
                nodeVersion: process.version,
                processId: process.pid,
                platform: process.platform,
                arch: process.arch,
                memoryUsage: {
                    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                },
            };
        } catch {
            return {};
        }
    }

    private async sendToApi(data: LogData): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.config.apiUrl}/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.accessToken && {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                    }),
                },
                body: JSON.stringify({
                    client_id: this.config.clientId,
                    ...data,
                }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return { success: true, ...result };
        } catch (error) {
            this.log('Failed to send log', error);
            return { success: false, error: String(error) };
        }
    }

    private async logMessage(level: LogData['level'], messageOrError: string | Error, context?: Record<string, any>): Promise<void> {
        if (!this.shouldLog(level)) return;

        try {
            let logData: Partial<LogData>;

            if (messageOrError instanceof Error) {
                logData = {
                    level,
                    message: messageOrError.message,
                    context: {
                        ...context,
                        error: {
                            name: messageOrError.name,
                            stack: messageOrError.stack,
                        },
                    },
                };
            } else {
                logData = {
                    level,
                    message: messageOrError,
                    context,
                };
            }

            const enrichedData = this.enrichLogData(logData);
            const response = await this.sendToApi(enrichedData);

            this.log(`${level.toUpperCase()}: ${enrichedData.message}`, { success: response.success });
        } catch (error) {
            this.log('Failed to log message', error);
        }
    }

    async debug(message: string, context?: Record<string, any>): Promise<void> {
        await this.logMessage('debug', message, context);
    }

    async info(message: string, context?: Record<string, any>): Promise<void> {
        await this.logMessage('info', message, context);
    }

    async warn(message: string, context?: Record<string, any>): Promise<void> {
        await this.logMessage('warn', message, context);
    }

    async error(messageOrError: string | Error, context?: Record<string, any>): Promise<void> {
        await this.logMessage('error', messageOrError, context);
    }

    setUser(userId: string): void {
        this.userId = userId;
        this.log('User set', { userId });
    }

    setRequestId(requestId: string): void {
        this.requestId = requestId;
        this.log('Request ID set', { requestId });
    }

    addTags(tags: string[]): void {
        this.globalTags.push(...tags);
        this.log('Tags added', { tags, totalTags: this.globalTags.length });
    }
}

export function createLogger(config: LoggerConfig): Logger {
    return new ServerLogger(config);
} 