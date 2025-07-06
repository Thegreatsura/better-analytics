'use client';

import { useState } from "react";
import { regenerateAccessToken } from "../../account/actions";
import { Label } from "@better-analytics/ui/components/label";
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
} from "@better-analytics/ui/components/alert-dialog";
import {
    CheckCircleIcon,
    CopyIcon,
    CircleNotchIcon
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
                toast.success("Access token regenerated successfully");
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
            setTimeout(() => setClientIdCopied(false), 2000);
            toast.success("Client ID copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy to clipboard");
        }
    };

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(token || '');
            setTokenCopied(true);
            setTimeout(() => setTokenCopied(false), 2000);
            toast.success("Access token copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy to clipboard");
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div>
                    <Label htmlFor="clientId" className="text-sm">Client ID</Label>
                    <p className="text-xs text-muted-foreground">
                        Use this Client ID to identify your application when making API requests
                    </p>
                </div>
                <div className="relative max-w-md">
                    <div className="font-mono text-sm pr-8 py-1">
                        {userId}
                    </div>
                    <button
                        type="button"
                        onClick={copyClientId}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
                        aria-label="Copy client ID"
                    >
                        {clientIdCopied ? <CheckCircleIcon size={18} /> : <CopyIcon size={18} />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div>
                    <Label htmlFor="accessToken" className="text-sm">Access Token</Label>
                    <p className="text-xs text-muted-foreground">
                        Keep your token secret and secure, as it authenticates your API requests.
                    </p>
                </div>

                {showNewToken && token ? (
                    <div className="relative max-w-md">
                        <div className="font-mono text-sm pr-8 py-1">
                            {token}
                        </div>
                        <button
                            type="button"
                            onClick={copyToken}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
                            aria-label="Copy access token"
                        >
                            {tokenCopied ? <CheckCircleIcon size={18} /> : <CopyIcon size={18} />}
                        </button>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Cannot be displayed after initial onboarding. If you have lost your access token, <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <span
                                onClick={() => setIsDialogOpen(true)}
                                className="text-destructive hover:underline cursor-pointer ml-1"
                            >
                                reset it
                            </span>.

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-lg">Reset service access token</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm">
                                        You're resetting the access token for this service. Make sure to update the settings of any clients that use these credentials.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleRegenerateToken}
                                        disabled={isRegenerating}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isRegenerating ? (
                                            <CircleNotchIcon size={18} className="mr-2 animate-spin" />
                                        ) : null}
                                        Reset token
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        </div>
    );
};