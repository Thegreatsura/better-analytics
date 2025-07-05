"use client";

import { useActionState, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@better-analytics/ui/components/card";
import { Input } from "@better-analytics/ui/components/input";
import { Button } from "@better-analytics/ui/components/button";
import { updateAccessToken, regenerateAccessToken } from "./actions";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { Toaster, toast } from "sonner";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@better-analytics/ui/components/tooltip";
import { Separator } from "@better-analytics/ui/components/separator";

const initialState = {
    message: "",
    success: true,
};

function SubmitButton() {
    return (
        <Button
            type="submit"
        >
            Save Changes
        </Button>
    );
}

function RegenerateButton() {

    const handleRegenerate = async () => {
        if (
            !window.confirm(
                "Are you sure you want to regenerate your access token? Your old token will stop working immediately.",
            )
        ) {
            return;
        }

        const result = await regenerateAccessToken();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Button type="button" variant="destructive" onClick={handleRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Token
        </Button>
    );
}

export function TokenForm({
    user,
}: {
    user: { accessToken: string | null } | null;
}) {
    const [state, formAction] = useActionState(updateAccessToken, initialState);
    const [showToken, setShowToken] = useState(false);

    const handleCopy = () => {
        if (user?.accessToken) {
            navigator.clipboard.writeText(user.accessToken);
            toast.success("Access token copied to clipboard!");
        }
    };

    if (state.message) {
        if (state.success) {
            toast.success(state.message);
        } else {
            toast.error(state.message);
        }
        initialState.message = "";
    }

    return (
        <>
            <Toaster richColors />
            <form action={formAction}>
                <Card>
                    <CardHeader>
                        <CardTitle>API Access Token</CardTitle>
                        <CardDescription>
                            Use this token to authenticate with the Better Analytics API. Treat
                            it like a password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Input
                                id="accessToken"
                                name="accessToken"
                                type={showToken ? "text" : "password"}
                                defaultValue={user?.accessToken ?? ""}
                                placeholder="Generate or enter a new token"
                                className="pr-24"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="p-1 text-muted-foreground hover:text-foreground"
                                                aria-label={showToken ? "Hide token" : "Show token"}
                                            >
                                                {showToken ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{showToken ? "Hide" : "Show"} token</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={handleCopy}
                                                className="p-1 text-muted-foreground hover:text-foreground"
                                                aria-label="Copy token"
                                            >
                                                <Copy className="h-5 w-5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Copy to clipboard</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 bg-muted/50 p-4">
                        <RegenerateButton />
                        <SubmitButton />
                    </CardFooter>
                </Card>
            </form>
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>How to Use</CardTitle>
                    <CardDescription>
                        Include your access token in the Authorization header of your API
                        requests.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-2 font-mono text-sm">
                        Authorization: Bearer YOUR_ACCESS_TOKEN
                    </p>
                    <Separator className="my-4" />
                    <h4 className="font-semibold mb-2">Example cURL Request:</h4>
                    <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                        <code>
                            {`curl -X POST \\
  https://your-api-endpoint.com/ingest \\
  -H "Authorization: Bearer ${user?.accessToken ? user.accessToken.substring(0, 12) + "..." : "YOUR_TOKEN"
                                }" \\
  -H "Content-Type: application/json" \\
  -d '{ "client_id": "your_client_id", "message": "Hello, World!" }'`}
                        </code>
                    </pre>
                </CardContent>
            </Card>
        </>
    );
} 