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
import { triggerServerActionError, triggerHttpError, triggerExceptionError } from "./actions";

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

    const handleHttpError = async () => {
        const result = await triggerHttpError();
        if (result.success === false) {
            toast.error(result.message);
        }
    };

    const handleExceptionError = async () => {
        const result = await triggerExceptionError();
        if (result.success === false) {
            toast.error(result.message);
        }
    };

    const handleLog = (level: "info" | "warn" | "error") => {
        const message = `This is a test ${level} log.`;

        if (level === "info") {
            analytics?.info(message);
        } else if (level === "warn") {
            analytics?.warn(message);
        } else if (level === "error") {
            analytics?.error(message);
        }

        toast.success(`Logged a test "${level}" message.`);
    };

    const handleComplexError = () => {
        analytics?.reportError({
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

    const handleErrorWithOccurrence = () => {
        analytics?.reportError({
            error_name: "RecurringError",
            message: "This error has occurrence tracking.",
            severity: "high",
            occurrence_count: 5,
            first_occurrence: new Date(Date.now() - 24 * 60 * 60 * 1000),
            last_occurrence: new Date(),
            status: "recurring",
            tags: ["recurring", "high-priority"],
        });
        toast.success("Captured an error with occurrence tracking.");
    };

    const handleResolvedError = () => {
        analytics?.reportError({
            error_name: "ResolvedError",
            message: "This error has been resolved.",
            severity: "medium",
            status: "resolved",
            resolved_at: new Date(),
            resolved_by: "admin@example.com",
            resolution_notes: "Fixed by updating the database schema",
        });
        toast.success("Captured a resolved error.");
    };

    const handleErrorWithRequestContext = () => {
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

        analytics?.captureHttpError(
            new Error("Database connection failed"),
            mockRequest,
            mockResponse,
            {
                error_name: "DatabaseError",
                severity: "critical",
                tags: ["database", "connection"],
                custom_data: {
                    database: "postgres",
                    connectionPool: "main",
                },
            }
        );
        toast.success("Captured an HTTP error with request context.");
    };

    const handleNaturalException = () => {
        try {
            const userData = { email: "invalid-email", age: -5 };

            if (!userData.email.includes("@")) {
                throw new Error("Invalid email format");
            }

            if (userData.age < 0) {
                throw new Error("Age cannot be negative");
            }
        } catch (error) {
            analytics?.captureException(error as Error, {
                error_name: "ValidationError",
                severity: "medium",
                tags: ["validation", "user-input"],
                custom_data: {
                    field: "email",
                    operation: "user-registration",
                },
            });
            toast.success("Captured exception naturally using captureException()");
        }
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
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Debug Log</p>
                            <Button variant="outline" onClick={() => {
                                analytics?.debug("This is a debug message", {
                                    component: "ErrorsPage",
                                    action: "debug-test"
                                });
                                toast.success("Sent debug log");
                            }}>
                                Send Debug Log
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Trace Log</p>
                            <Button variant="outline" onClick={() => {
                                analytics?.trace("This is a trace message", {
                                    function: "handleTraceLog",
                                    timestamp: new Date().toISOString()
                                });
                                toast.success("Sent trace log");
                            }}>
                                Send Trace Log
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>General Log</p>
                            <Button variant="outline" onClick={() => {
                                analytics?.log("This is a general log message", {
                                    type: "general",
                                    source: "user-action"
                                });
                                toast.success("Sent general log");
                            }}>
                                Send General Log
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
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Server Action Error</p>
                            <Button variant="destructive" onClick={handleServerActionError}>
                                Trigger Action
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>HTTP Error with Context</p>
                            <Button variant="destructive" onClick={handleHttpError}>
                                Trigger HTTP Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Exception Error</p>
                            <Button variant="destructive" onClick={handleExceptionError}>
                                Trigger Exception
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Advanced Error Features</CardTitle>
                        <CardDescription>
                            Test advanced SDK and API features.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Complex Data Error</p>
                            <Button variant="secondary" onClick={handleComplexError}>
                                Capture Complex Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Error with Occurrence</p>
                            <Button variant="secondary" onClick={handleErrorWithOccurrence}>
                                Track Occurrences
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Resolved Error</p>
                            <Button variant="secondary" onClick={handleResolvedError}>
                                Mark as Resolved
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>HTTP Error Context</p>
                            <Button variant="secondary" onClick={handleErrorWithRequestContext}>
                                Capture HTTP Error
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Natural Exception Handling</p>
                            <Button variant="secondary" onClick={handleNaturalException}>
                                Capture Exception
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 