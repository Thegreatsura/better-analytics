"use client";

import { analytics } from "@/lib/analytics";
import { Button } from "@better-analytics/ui/components/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@better-analytics/ui/components/card";
import { Separator } from "@better-analytics/ui/components/separator";
import { toast } from "sonner";
import { triggerServerActionError } from "./actions";

export default function ErrorsPage() {


    const handleClientError = () => {
        throw new Error("This is a test client-side error from a button click.");
    };

    const handleUnhandledRejection = () => {
        Promise.reject("This is an unhandled promise rejection.");
    };

    const handleServerActionError = async () => {
        const result = await triggerServerActionError();
        if (result.success === false) {
            toast.error(result.message);
        }
    };

    const handleLog = (level: "info" | "warn" | "error") => {
        const message = `This is a test ${level} log.`;
        analytics?.log(message, { level });
        toast.success(`Logged a test "${level}" message.`);
    };

    const handleComplexError = () => {
        analytics?.captureError({
            error_name: "ComplexDataError",
            message: "This error contains complex custom data.",
            severity: "medium",
            custom_data: {
                userPlan: "premium",
                transactionId: "txn_12345",
                details: {
                    items: ["item1", "item2"],
                    total: 99.99,
                },
            },
        });
        toast.success("Captured an error with complex custom data.");
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    SDK Error Testing
                </h1>
                <p className="text-muted-foreground mt-1">
                    Use these controls to test the Better Analytics SDK error capturing.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Client-Side Errors</CardTitle>
                        <CardDescription>
                            Trigger errors that originate in the browser.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Standard Error</p>
                            <Button variant="destructive" onClick={handleClientError}>
                                Throw Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Unhandled Promise Rejection</p>
                            <Button variant="destructive" onClick={handleUnhandledRejection}>
                                Reject Promise
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Logging</CardTitle>
                        <CardDescription>
                            Send custom log messages to the API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Informational Log</p>
                            <Button variant="secondary" onClick={() => handleLog("info")}>
                                Send Info Log
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Warning Log</p>
                            <Button variant="secondary" onClick={() => handleLog("warn")}>
                                Send Warn Log
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Error Log</p>
                            <Button variant="secondary" onClick={() => handleLog("error")}>
                                Send Error Log
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Server-Side Errors</CardTitle>
                        <CardDescription>
                            Trigger errors from Next.js Server Actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <p>Server Action Error</p>
                        <Button variant="destructive" onClick={handleServerActionError}>
                            Trigger Action
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Complex Data</CardTitle>
                        <CardDescription>
                            Capture errors with rich, structured metadata.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <p>Custom Error with Metadata</p>
                        <Button variant="secondary" onClick={handleComplexError}>
                            Capture Complex Error
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 