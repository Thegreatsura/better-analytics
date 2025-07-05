"use server";

export async function triggerServerActionError() {
    try {
        throw new Error("This is a test error from a Server Action.");
    } catch (e: any) {
        // In a real app, you might want to log this error to your analytics
        // provider before returning a user-friendly message.
        console.error(e);
        return { success: false, message: e.message };
    }
}

export async function triggerHttpError() {
    try {
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

        // Simulate a database connection error
        throw new Error("Database connection timeout");
    } catch (e: any) {
        console.error(e);
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
        console.error(e);
        return {
            success: false,
            message: e.message,
            code: e.code,
            field: e.field,
            value: e.value
        };
    }
} 