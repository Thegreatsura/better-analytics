"use server";

import { auth } from "@better-analytics/auth";
import { db, user as userSchema } from "@better-analytics/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomBytes } from "crypto";

type ActionState = {
    success: boolean;
    message: string;
};

export async function updateAccessToken(
    prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized: Please log in." };
    }

    const accessToken = formData.get("accessToken") as string;

    if (!accessToken || accessToken.length < 10) {
        return {
            success: false,
            message: "Access token must be at least 10 characters long.",
        };
    }

    try {
        await db
            .update(userSchema)
            .set({ accessToken })
            .where(eq(userSchema.id, session.user.id));
    } catch (e) {
        return {
            success: false,
            message: "Database error: Failed to update access token.",
        };
    }

    revalidatePath("/admin");
    return { success: true, message: "Access token updated successfully." };
}

export async function regenerateAccessToken(): Promise<ActionState> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized: Please log in." };
    }

    const newAccessToken = randomBytes(32).toString("hex");

    try {
        await db
            .update(userSchema)
            .set({ accessToken: newAccessToken })
            .where(eq(userSchema.id, session.user.id));
    } catch (e) {
        return {
            success: false,
            message: "Database error: Failed to regenerate access token.",
        };
    }

    revalidatePath("/admin");
    return { success: true, message: "A new access token has been generated." };
} 