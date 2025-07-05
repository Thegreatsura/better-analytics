"use server";

import { analytics } from "@/lib/analytics";

export async function triggerServerActionError() {
    try {
        throw new Error("This is a test error from a Server Action.");
    } catch (e: any) {
        await analytics.track(e, {
            tags: ["server-action", "test-error"],
            error_type: "server",
            environment: "production",
            custom_data: {
                action: "triggerServerActionError",
                runtime: "server",
                userAgent: "Server Action",
            },
        });
        return { success: false, message: e.message };
    }
}

export async function triggerHttpError() {
    // Simulate an HTTP error scenario
    const mockRequest = {
        method: "POST",
        url: "/api/users",
        headers: { "content-type": "application/json" },
        body: { userId: "123" },
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
    };

    const mockResponse = {
        statusCode: 500,
        headers: { "content-type": "application/json" },
    };

    try {
        // Simulate a database connection error
        throw new Error("Database connection timeout");
    } catch (e: any) {
        await analytics.track(e, {
            tags: ["server-action", "http-error", "database"],
            error_type: "server",
            environment: "production",
            custom_data: {
                action: "triggerHttpError",
                runtime: "server",
                simulatedError: true,
            },
        });
        return { success: false, message: e.message };
    }
}

export async function triggerExceptionError() {
    try {
        // Simulate a complex exception with additional context
        const error = new Error("Validation failed for user input");
        (error as any).code = "VALIDATION_ERROR";
        (error as any).field = "email";
        (error as any).value = "invalid-email";

        throw error;
    } catch (e: any) {
        await analytics.track(e, {
            tags: ["server-action", "validation-error"],
            error_type: "server",
            error_code: e.code,
            severity: "medium",
            environment: "production",
            custom_data: {
                action: "triggerExceptionError",
                runtime: "server",
                field: e.field,
                value: e.value,
                simulatedError: true,
            },
        });
        return {
            success: false,
            message: e.message,
            code: e.code,
            field: e.field,
            value: e.value
        };
    }
} 