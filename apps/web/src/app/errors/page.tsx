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

    const handleCustomMessage = () => {
        analytics.track("This is a custom error message", {
            context: "user-action",
            severity: "medium",
        });
        toast.success("Tracked custom error message");
    };

    const handleComplexError = () => {
        analytics.track("Payment processing failed", {
            userPlan: "premium",
            transactionId: "txn_12345",
            amount: 99.99,
            currency: "USD",
        });
        toast.success("Tracked error with complex data");
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
            analytics.captureException(error as Error, {
                field: "email",
                operation: "user-registration",
                userId: "123",
            });
            toast.success("Captured exception with captureException()");
        }
    };

    const handleSetUser = () => {
        analytics.setUser("user-12345");
        toast.success("Set user ID to user-12345");
    };

    const handleAddTags = () => {
        analytics.addTags(["test", "frontend", "critical"]);
        toast.success("Added tags: test, frontend, critical");
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Error Tracker Testing
                </h1>
                <p className="text-muted-foreground mt-1">
                    Test the new simplified error tracking SDK.
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
                        <CardTitle>Custom Error Tracking</CardTitle>
                        <CardDescription>
                            Track custom messages and exceptions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Custom Message</p>
                            <Button onClick={handleCustomMessage}>
                                Track Message
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Complex Data</p>
                            <Button onClick={handleComplexError}>
                                Track Complex
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Exception Capture</p>
                            <Button onClick={handleNaturalException}>
                                Capture Exception
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Server Actions</CardTitle>
                        <CardDescription>
                            Trigger server-side errors through actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Server Action Error</p>
                            <Button variant="destructive" onClick={handleServerActionError}>
                                Trigger
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>HTTP Error</p>
                            <Button variant="destructive" onClick={handleHttpError}>
                                Trigger
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Exception Error</p>
                            <Button variant="destructive" onClick={handleExceptionError}>
                                Trigger
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>SDK Configuration</CardTitle>
                        <CardDescription>
                            Configure the error tracker settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p>Set User ID</p>
                            <Button onClick={handleSetUser}>
                                Set User
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <p>Add Tags</p>
                            <Button onClick={handleAddTags}>
                                Add Tags
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Usage Examples</CardTitle>
                    <CardDescription>
                        Code examples for using the error tracker.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Track Custom Messages</h4>
                            <code className="block bg-muted p-2 rounded text-sm">
                                analytics.track("Payment failed", {`{ amount: 100, currency: "USD" }`});
                            </code>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Capture Exceptions</h4>
                            <code className="block bg-muted p-2 rounded text-sm">
                                analytics.captureException(error, {`{ userId: "123", feature: "checkout" }`});
                            </code>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Set User Context</h4>
                            <code className="block bg-muted p-2 rounded text-sm">
                                analytics.setUser("user-12345");
                            </code>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Add Global Tags</h4>
                            <code className="block bg-muted p-2 rounded text-sm">
                                analytics.addTags(["frontend", "critical"]);
                            </code>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 