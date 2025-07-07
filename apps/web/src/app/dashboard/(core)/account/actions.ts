'use server'

import { db, user } from "@better-analytics/db";
import { auth } from "@better-analytics/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateId } from "@better-analytics/auth/auth";

/**
 * Generates or retrieves an access token for the current user
 * If no token exists, one will be generated
 */
export async function getOrCreateAccessToken() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        const userData = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
        });

        // If user already has a token, return it
        if (userData?.accessToken) {
            return { success: true, accessToken: userData.accessToken };
        }

        // Generate new token if none exists
        const newToken = `bta_${randomUUID().replace(/-/g, '')}`;

        await db.update(user)
            .set({ accessToken: newToken })
            .where(eq(user.id, session.user.id));

        return { success: true, accessToken: newToken };
    } catch (error) {
        console.error("Failed to get/create access token:", error);
        return { success: false, error: "Failed to get/create access token" };
    }
}

/**
 * Regenerates an access token for the current user
 */
export async function regenerateAccessToken() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        // Generate new token
        const newToken = `ba_${generateId()}`;

        await db.update(user)
            .set({ accessToken: newToken })
            .where(eq(user.id, session.user.id));

        return { success: true, accessToken: newToken };
    } catch (error) {
        console.error("Failed to regenerate access token:", error);
        return { success: false, error: "Failed to regenerate access token" };
    }
}