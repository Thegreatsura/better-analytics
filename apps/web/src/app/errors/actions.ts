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