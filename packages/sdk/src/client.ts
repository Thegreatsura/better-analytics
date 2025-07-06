"use client";

import { UAParser } from "ua-parser-js";
import type { ApiResponse } from "./types";

export interface ErrorData {
	message: string;
	stack?: string;
	url?: string;
	line?: number;
	column?: number;
	severity?: "low" | "medium" | "high" | "critical";
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
	captureException(
		error: Error,
		customData?: Record<string, any>,
	): Promise<void>;
	setUser(userId: string): void;
	addTags(tags: string[]): void;
	localize(key: string, language?: string): Promise<string>;
	localizeObject<T extends Record<string, string>>(
		obj: T,
		language?: string,
	): Promise<T>;
}

class ClientErrorTracker implements ErrorTracker {
	private config: Required<
		Omit<ErrorTrackerConfig, "userId" | "accessToken">
	> & {
		userId?: string;
		accessToken?: string;
	};
	private parser: UAParser;
	private sessionId: string;
	private userId?: string;
	private globalTags: string[] = [];

	constructor(config: ErrorTrackerConfig) {
		this.config = {
			environment: "production",
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

		this.log("ErrorTracker initialized", {
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
		if (typeof window === "undefined") return;

		window.addEventListener("error", (event) => {
			this.captureException(event.error || new Error(event.message), {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				type: "javascript-error",
			});
		});

		window.addEventListener("unhandledrejection", (event) => {
			const error =
				event.reason instanceof Error
					? event.reason
					: new Error(String(event.reason));

			this.captureException(error, {
				type: "unhandled-promise-rejection",
			});
		});
	}

	private enrichErrorData(data: Partial<ErrorData>): ErrorData {
		const uaResult = this.parser.getResult();
		const currentUrl =
			typeof window !== "undefined" ? window.location.href : undefined;

		// Extract error name from message or stack trace
		const errorName = this.extractErrorName(data.message, data.stack);

		// Determine error type based on context
		const errorType = this.determineErrorType(data.customData);

		return {
			message: data.message || "Unknown error",
			stack: data.stack,
			url: data.url || currentUrl,
			line: data.line,
			column: data.column,
			severity: data.severity || "medium",
			tags: [...this.globalTags, ...(data.tags || [])],
			customData: {
				// Browser and device info
				browserName: uaResult.browser.name || "Unknown",
				browserVersion: uaResult.browser.version || "Unknown",
				osName: uaResult.os.name || "Unknown",
				osVersion: uaResult.os.version || "Unknown",
				deviceType: uaResult.device.type || "desktop",

				// Page context
				viewportWidth:
					typeof window !== "undefined" ? window.innerWidth : undefined,
				viewportHeight:
					typeof window !== "undefined" ? window.innerHeight : undefined,
				pageTitle: typeof document !== "undefined" ? document.title : undefined,
				referrer:
					typeof document !== "undefined" ? document.referrer : undefined,

				// User context
				userId: this.userId,
				sessionId: this.sessionId,
				timestamp: new Date().toISOString(),
				environment: this.config.environment,

				// Error classification
				errorName: errorName,
				errorType: errorType,

				// Connection info (if available)
				connectionType: (navigator as any)?.connection?.effectiveType,
				connectionDownlink: (navigator as any)?.connection?.downlink,
				connectionRtt: (navigator as any)?.connection?.rtt,

				// Performance info
				memoryUsage: (performance as any)?.memory?.usedJSHeapSize,
				memoryLimit: (performance as any)?.memory?.jsHeapSizeLimit,

				...data.customData,
			},
		};
	}

	private extractErrorName(message?: string, stack?: string): string {
		if (!message && !stack) return "Unknown Error";

		// Try to extract error name from stack trace first
		if (stack) {
			const stackLines = stack.split("\n");
			const firstLine = stackLines[0]?.trim();
			if (firstLine) {
				// Extract error name from patterns like "TypeError: Cannot read property"
				const errorNameMatch = firstLine.match(/^(\w+Error|\w+Exception|\w+):/);
				if (errorNameMatch) {
					return errorNameMatch[1] || "Unknown Error";
				}
			}
		}

		// Fall back to extracting from message
		if (message) {
			const errorNameMatch = message.match(/^(\w+Error|\w+Exception|\w+):/);
			if (errorNameMatch) {
				return errorNameMatch[1] || "Unknown Error";
			}

			// If no colon pattern, use first word or first few words
			const words = message.split(" ");
			if (words.length >= 2) {
				return words.slice(0, 2).join(" ");
			}
			return words[0] || "Unknown Error";
		}

		return "Unknown Error";
	}

	private determineErrorType(customData?: Record<string, any>): string {
		if (customData?.type) {
			return customData.type;
		}

		// Determine based on context
		if (customData?.filename || customData?.lineno) {
			return "client";
		}

		if (customData?.networkError || customData?.httpStatus) {
			return "network";
		}

		if (customData?.validationErrors || customData?.formData) {
			return "validation";
		}

		// Default to client-side error
		return "client";
	}

	private async sendToApi(data: ErrorData): Promise<ApiResponse> {
		try {
			const response = await fetch(`${this.config.apiUrl}/ingest`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(this.config.accessToken && {
						Authorization: `Bearer ${this.config.accessToken}`,
					}),
				},
				body: JSON.stringify({
					client_id: this.config.clientId,
					message: data.message,
					stack_trace: data.stack, // Map 'stack' to 'stack_trace'
					url: data.url,
					severity: data.severity,
					tags: data.tags,
					custom_data: data.customData
						? JSON.stringify(data.customData)
						: undefined,
					// Add other fields from customData
					browser_name: data.customData?.browserName,
					browser_version: data.customData?.browserVersion,
					os_name: data.customData?.osName,
					os_version: data.customData?.osVersion,
					device_type: data.customData?.deviceType,
					viewport_width: data.customData?.viewportWidth,
					viewport_height: data.customData?.viewportHeight,
					page_title: data.customData?.pageTitle,
					referrer: data.customData?.referrer,
					user_id: data.customData?.userId,
					session_id: data.customData?.sessionId,
					environment: data.customData?.environment,
					// Add error classification fields
					error_type: data.customData?.errorType || "client",
					error_name:
						data.customData?.errorName ||
						data.message.split(":")[0] ||
						"Unknown Error",
				}),
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			return { success: true, ...result };
		} catch (error) {
			this.log("Failed to send error", error);
			return { success: false, error: String(error) };
		}
	}

	async track(
		message: string,
		customData?: Record<string, any>,
	): Promise<void> {
		try {
			const errorData = this.enrichErrorData({
				message,
				customData,
			});

			const response = await this.sendToApi(errorData);
			this.log("Error tracked", { message, success: response.success });
		} catch (error) {
			this.log("Failed to track error", error);
		}
	}

	async captureException(
		error: Error,
		customData?: Record<string, any>,
	): Promise<void> {
		try {
			const errorData = this.enrichErrorData({
				message: error.message,
				stack: error.stack,
				customData,
			});

			const response = await this.sendToApi(errorData);
			this.log("Exception captured", {
				error: error.message,
				success: response.success,
			});
		} catch (err) {
			this.log("Failed to capture exception", err);
		}
	}

	setUser(userId: string): void {
		this.userId = userId;
		this.log("User set", { userId });
	}

	addTags(tags: string[]): void {
		this.globalTags.push(...tags);
		this.log("Tags added", { tags, totalTags: this.globalTags.length });
	}

	async localize(key: string, language?: string): Promise<string> {
		try {
			const response = await fetch(`${this.config.apiUrl}/api/localization`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					key,
					language:
						language ||
						(typeof navigator !== "undefined"
							? navigator.language.split("-")[0]
							: "en"),
				}),
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.status}`);
			}

			const data = await response.json();
			return data.result || key;
		} catch (error) {
			this.log("Translation failed", { key, language, error });
			return key;
		}
	}

	async localizeObject<T extends Record<string, string>>(
		obj: T,
		language?: string,
	): Promise<T> {
		try {
			const response = await fetch(
				`${this.config.apiUrl}/localization/object`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						content: obj,
						sourceLocale: "en",
						targetLocale:
							language ||
							(typeof navigator !== "undefined"
								? navigator.language.split("-")[0]
								: "en"),
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`API Error: ${response.status}`);
			}

			const data = await response.json();
			return data.result || obj;
		} catch (error) {
			this.log("Object translation failed", { obj, language, error });
			return obj;
		}
	}
}

export function createErrorTracker(config: ErrorTrackerConfig): ErrorTracker {
	return new ClientErrorTracker(config);
}
