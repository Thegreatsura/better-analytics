'use client';

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@better-analytics/ui/components/button";
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
import { CircleNotchIcon, SignOutIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { authClient } from "@better-analytics/auth/client";

type SessionActionButtonProps = {
    sessionId: string;
    sessionToken: string;
    isCurrentSession: boolean;
}

export const SessionActionButton = ({ sessionId, sessionToken, isCurrentSession }: SessionActionButtonProps) => {
    const [isTerminating, setIsTerminating] = useState<string | undefined>(undefined);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const handleTerminateSession = async () => {
        setIsTerminating(sessionId);
        setIsDialogOpen(false);

        try {
            const res = await authClient.revokeSession({
                token: sessionToken,
            });

            if (res.error) {
                toast.error(res.error.message);
            } else {
                toast.success(isCurrentSession ? "You have been signed out" : "Session terminated successfully");
                if (isCurrentSession) {
                    // Redirect to login for current session
                    window.location.href = "/auth/login";
                } else {
                    router.refresh();
                }
            }
        } catch (error) {
            toast.error("An error occurred while terminating the session");
        } finally {
            setIsTerminating(undefined);
        }
    };

    return (
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    disabled={isTerminating !== undefined}
                >
                    {isTerminating === sessionId ? (
                        <CircleNotchIcon size={16} className="mr-1 animate-spin" />
                    ) : (
                        <SignOutIcon size={16} className="mr-1" />
                    )}
                    {isCurrentSession ? "Sign Out" : "Terminate"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isCurrentSession ? "Sign Out of Current Session" : "Terminate Session"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isCurrentSession
                            ? "Are you sure you want to sign out? You'll be redirected to the login page and will need to sign in again."
                            : "Are you sure you want to terminate this session? The user will be signed out of this device immediately."
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleTerminateSession}
                        disabled={isTerminating !== undefined}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isTerminating === sessionId ? (
                            <CircleNotchIcon size={16} className="mr-2 animate-spin" />
                        ) : (
                            <SignOutIcon size={16} className="mr-2" />
                        )}
                        {isTerminating === sessionId
                            ? (isCurrentSession ? 'Signing Out...' : 'Terminating...')
                            : (isCurrentSession ? 'Yes, Sign Out' : 'Yes, Terminate')
                        }
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};