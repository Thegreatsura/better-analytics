'use client';

import { useState } from "react";
import { regenerateAccessToken } from "../../(core)/account/actions";
import { Label } from "@better-analytics/ui/components/label";
import { Input } from "@better-analytics/ui/components/input";
import { Button } from "@better-analytics/ui/components/button";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@better-analytics/ui/components/alert-dialog";
import {
    CheckCircleIcon,
    CopyIcon,
    CircleNotchIcon,
    KeyIcon,
    ArrowClockwiseIcon,
    WarningIcon
} from "@phosphor-icons/react";

type ApiConfigProps = {
    userId: string;
    accessToken?: string;
}

export const ApiConfig = ({ userId, accessToken }: ApiConfigProps) => {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [clientIdCopied, setClientIdCopied] = useState(false);
    const [tokenCopied, setTokenCopied] = useState(false);
    const [token, setToken] = useState(accessToken);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showNewToken, setShowNewToken] = useState(false);

    const handleRegenerateToken = async () => {
        setIsRegenerating(true);
        try {
            const result = await regenerateAccessToken();
            if (result.success) {
                setToken(result.accessToken);
                setShowNewToken(true);
                setIsDialogOpen(false);
                toast.success("Access token regenerated successfully! Make sure to copy it now.");
            } else {
                toast.error(result.error || "Failed to regenerate access token");
            }
        } catch (error) {
            toast.error("An error occurred while regenerating the token");
        } finally {
            setIsRegenerating(false);
        }
    };

    const copyClientId = async () => {
        try {
            await navigator.clipboard.writeText(userId);
            setClientIdCopied(true);
            setTimeout(() => setClientIdCopied(false), 3000);
            toast.success("Client ID copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy to clipboard");
        }
    };

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(token || '');
            setTokenCopied(true);
            setTimeout(() => setTokenCopied(false), 3000);
            toast.success("Access token copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy to clipboard");
        }
    };

    return (
        <div className="space-y-6">
            {/* Client ID Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="clientId" className="text-sm font-medium">Client ID</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                    Use this Client ID to identify your application when making API requests
                </p>
                <div className="flex gap-2">
                    <Input
                        id="clientId"
                        value={userId}
                        readOnly
                        className="font-mono text-sm bg-muted/50"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyClientId}
                        className="flex-shrink-0 h-9"
                    >
                        {clientIdCopied ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
                        {clientIdCopied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>

            {/* Access Token Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="accessToken" className="text-sm font-medium">Access Token</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                    Keep your token secret and secure, as it authenticates your API requests
                </p>

                {showNewToken && token ? (
                    <div className="space-y-3">
                        {/* Critical Warning */}
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <WarningIcon size={16} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                        Copy your token now!
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        This token will only be shown once. If you leave this page without copying it, you'll need to regenerate it again.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                id="accessToken"
                                value={token}
                                readOnly
                                className="font-mono text-sm bg-muted/50"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyToken}
                                className="flex-shrink-0 h-9"
                            >
                                {tokenCopied ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
                                {tokenCopied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-3 bg-muted/50 border border-border rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                Your access token is hidden for security. If you need to view it again, you'll need to regenerate it.
                            </p>
                        </div>
                        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <ArrowClockwiseIcon size={16} />
                                    Regenerate Token
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Regenerate Token</AlertDialogTitle>

                                    <AlertDialogDescription className="text-sm mt-2">
                                        This will invalidate your current token. All connected applications will need to be updated.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleRegenerateToken}
                                        disabled={isRegenerating}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isRegenerating ? 'Regenerating...' : 'Regenerate Token'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            {/* Integration Instructions */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium">Integration Instructions</h4>
                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                        Use these credentials in your API requests:
                    </p>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                        {`curl -X GET "https://api.better-analytics.com/v1/analytics" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "X-Client-ID: ${userId}"`}
                    </pre>
                </div>
            </div>
        </div>
    );
};