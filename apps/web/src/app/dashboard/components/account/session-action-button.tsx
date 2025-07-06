'use client';

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@better-analytics/ui/components/button";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { authClient } from "@better-analytics/auth/client";

interface SessionActionButtonProps {
    sessionId: string;
    sessionToken: string;
    isCurrentSession: boolean;
}

export const SessionActionButton = (props: SessionActionButtonProps) => {
    const [isTerminating, setIsTerminating] = useState<string | undefined>(undefined);
    const router = useRouter();

    const handleTerminateSession = async () => {
        setIsTerminating(props.sessionId);
        const res = await authClient.revokeSession({
            token: props.sessionToken,
        });

        if (res.error) {
            toast.error(res.error.message);
        } else {
            toast.success("Session terminated successfully");
            router.refresh()
        }

        setIsTerminating(undefined);
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            className="text-xs font-normal h-8 px-3 flex-shrink-0"
            onClick={handleTerminateSession}
            disabled={isTerminating !== undefined}
        >
            {isTerminating === props.sessionId ? (
                <CircleNotchIcon size={16} className="mr-1.5 animate-spin" />
            ) : null}
            {props.isCurrentSession ? "Sign Out" : "Terminate"}
        </Button>
    );
};