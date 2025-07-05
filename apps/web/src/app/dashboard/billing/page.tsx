"use server"

import { AutumnProvider, PricingTable } from "autumn-js/react";

import { auth } from "@better-analytics/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@better-analytics/ui/components/card";
import { Badge } from "@better-analytics/ui/components/badge";
import { Autumn as autumn } from 'autumn-js';
import { redirect } from "next/navigation";

export default async function BillingPage() {

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const customer = await autumn.customers.get(session.user.id);

    if (!customer.data) {
        redirect("/login");
    }

    const product = customer.data.products.find((product) => product.status === "active");

    const billingInfo = {
        currentPlan: product?.name || "Free",
        status: product?.status || "active",
        nextBilling: product?.current_period_end || "N/A",
        usage: {
            errors: customer.data?.features?.error?.usage || 0,
            logs: customer.data?.features?.log?.usage || 0,
            errorLimit: customer.data?.features?.error?.included_usage || 0,
            logLimit: customer.data?.features?.log?.included_usage || 0,
        }
    };

    const getUsagePercentage = (used: number, limit: number) => {
        return Math.min((used / limit) * 100, 100);
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
                <p className="text-muted-foreground">
                    Manage your subscription, monitor usage, and upgrade your plan.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>Your active subscription</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="text-2xl font-bold">{billingInfo.currentPlan}</div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{billingInfo.status}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Error Tracking</CardTitle>
                        <CardDescription>This month's usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-600">
                                    {billingInfo.usage.errors.toLocaleString()}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {billingInfo.usage.errorLimit.toLocaleString()}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${getUsagePercentage(billingInfo.usage.errors, billingInfo.usage.errorLimit)}%` }}
                                    />
                                </div>
                                <div className="text-sm text-blue-600 font-medium">
                                    {getUsagePercentage(billingInfo.usage.errors, billingInfo.usage.errorLimit).toFixed(1)}% used
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Log Analytics</CardTitle>
                        <CardDescription>This month's usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-green-600">
                                    {billingInfo.usage.logs.toLocaleString()}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {billingInfo.usage.logLimit.toLocaleString()}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full"
                                        style={{ width: `${getUsagePercentage(billingInfo.usage.logs, billingInfo.usage.logLimit)}%` }}
                                    />
                                </div>
                                <div className="text-sm text-green-600 font-medium">
                                    {getUsagePercentage(billingInfo.usage.logs, billingInfo.usage.logLimit).toFixed(1)}% used
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>Choose the perfect plan for your needs</CardDescription>
                </CardHeader>
                <CardContent>
                    <AutumnProvider
                        backendUrl="http://localhost:3000"
                        customerData={{
                            name: session?.user.name,
                            email: session?.user.email,
                        }}
                    >
                        <PricingTable />
                    </AutumnProvider>
                </CardContent>
            </Card>
        </div>
    );
}