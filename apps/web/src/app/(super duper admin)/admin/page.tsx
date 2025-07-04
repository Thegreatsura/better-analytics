import { auth } from "@better-analytics/auth";
import { db, user as userSchema } from "@better-analytics/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { TokenForm } from "./token-form.client";
import { randomBytes } from "crypto";

export default async function AdminAccessTokenPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userId = session?.user?.id;

    if (!userId) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <p>You must be logged in to view this page.</p>
            </div>
        );
    }

    let user = await db.query.user.findFirst({
        where: eq(userSchema.id, userId),
        columns: {
            accessToken: true,
        },
    });

    if (user && !user.accessToken) {
        const newAccessToken = randomBytes(32).toString("hex");
        await db
            .update(userSchema)
            .set({ accessToken: newAccessToken })
            .where(eq(userSchema.id, userId));
        user.accessToken = newAccessToken;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your personal settings and access tokens.
                </p>
            </header>
            <div className="max-w-2xl">
                <TokenForm user={user ?? null} />
            </div>
        </div>
    );
}
