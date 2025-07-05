import { auth } from "@better-analytics/auth";
import { db, user as userSchema } from "@better-analytics/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { TokenForm } from "./token-form.client";
import { randomBytes } from "node:crypto";
import { getStats } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@better-analytics/ui/components/card";

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

    const user = await db.query.user.findFirst({
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

    const stats = await getStats();

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

            {stats.success && stats.data && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Error Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-0">Error Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">Environment</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">Total Occurrences</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">Last 24h</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">Last 7d</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">Last 30d</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">First Seen</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {(stats.data as any[]).map((row) => (
                                        <tr key={`${row.error_name}-${row.environment}-${row.source}`}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-0">{row.error_name}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{row.environment}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{row.total_occurrences}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{row.last_24h_count}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{row.last_7d_count}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{row.last_30d_count}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{new Date(row.first_seen).toLocaleString()}</td>
                                            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-sm text-muted-foreground sm:pr-0">{new Date(row.last_seen).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
