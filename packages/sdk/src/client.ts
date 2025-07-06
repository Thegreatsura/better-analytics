'use client';

import { UAParser } from 'ua-parser-js';
import type { ApiResponse } from './types';

export interface ErrorData {
    message: string;
    stack?: string;
    url?: string;
    line?: number;
    column?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    customData?: Record<string, any>;
}

export interface ErrorTrackerConfig {
    apiUrl: string;
    clientId: string;
    accessToken?: string;
    environment?: string;
    debug?: boolean;
    autoCapture?: boolean;
    userId?: string;
}

export interface ErrorTracker {
    track(message: string, customData?: Record<string, any>): Promise<void>;
    captureException(error: Error, customData?: Record<string, any>): Promise<void>;
    setUser(userId: string): void;
    addTags(tags: string[]): void;
}

class ClientErrorTracker implements ErrorTracker {
    private config: Required<Omit<ErrorTrackerConfig, 'userId' | 'accessToken'>> & {
        userId?: string;
        accessToken?: string;
    };
    private parser: UAParser;
    private sessionId: string;
    private userId?: string;
    private globalTags: string[] = [];

    constructor(config: ErrorTrackerConfig) {
        this.config = {
            environment: 'production',
            debug: false,
            autoCapture: false,
            ...config,
        };

        this.parser = new UAParser();
        this.sessionId = this.generateSessionId();
        this.userId = config.userId;

        if (this.config.autoCapture) {
            this.setupAutoCapture();
        }

        this.log('ErrorTracker initialized', {
            clientId: this.config.clientId,
            environment: this.config.environment,
            autoCapture: this.config.autoCapture,
        });
    }

    private log(message: string, data?: any): void {
        if (this.config.debug) {
            console.log(`[ErrorTracker] ${message}`, data);
        }
    }

    private generateSessionId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private setupAutoCapture(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('error', (event) => {
            this.captureException(event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript-error',
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error
                ? event.reason
                : new Error(String(event.reason));

            this.captureException(error, {
                type: 'unhandled-promise-rejection',
            });
        });
    }

    private enrichErrorData(data: Partial<ErrorData>): ErrorData {
        const uaResult = this.parser.getResult();
        const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;

        return {
            message: data.message || 'Unknown error',
            stack: data.stack,
            url: data.url || currentUrl,
            line: data.line,
            column: data.column,
            severity: data.severity || 'medium',
            tags: [...this.globalTags, ...(data.tags || [])],
            customData: {
                browserName: uaResult.browser.name,
                browserVersion: uaResult.browser.version,
                osName: uaResult.os.name,
                osVersion: uaResult.os.version,
                deviceType: uaResult.device.type || 'desktop',

                viewportWidth: window?.innerWidth,
                viewportHeight: window?.innerHeight,
                pageTitle: document?.title,
                referrer: document?.referrer,

                userId: this.userId,
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                environment: this.config.environment,

                ...data.customData,
            },
        };
    }

    private async sendToApi(data: ErrorData): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.config.apiUrl}/ingest`, {
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
            this.log('Failed to send error', error);
            return { success: false, error: String(error) };
        }
    }

    async track(message: string, customData?: Record<string, any>): Promise<void> {
        try {
            const errorData = this.enrichErrorData({
                message,
                customData,
            });

            const response = await this.sendToApi(errorData);
            this.log('Error tracked', { message, success: response.success });
        } catch (error) {
            this.log('Failed to track error', error);
        }
    }

    async captureException(error: Error, customData?: Record<string, any>): Promise<void> {
        try {
            const errorData = this.enrichErrorData({
                message: error.message,
                stack: error.stack,
                customData,
            });

            const response = await this.sendToApi(errorData);
            this.log('Exception captured', { error: error.message, success: response.success });
        } catch (err) {
            this.log('Failed to capture exception', err);
        }
    }

    setUser(userId: string): void {
        this.userId = userId;
        this.log('User set', { userId });
    }

    addTags(tags: string[]): void {
        this.globalTags.push(...tags);
        this.log('Tags added', { tags, totalTags: this.globalTags.length });
    }
}

export function createErrorTracker(config: ErrorTrackerConfig): ErrorTracker {
    return new ClientErrorTracker(config);
} 