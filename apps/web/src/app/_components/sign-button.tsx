"use client"

import { Session, signIn, signOut } from "@better-analytics/auth/src/client";
import { Button } from "@better-analytics/ui/components/button";
import { useRouter } from "next/navigation";

export const SignButton = ({ session }: { session: Session | null }) => {
    const router = useRouter();

    const onClick = async () => {
        if (session) {
            await signOut();
            router.refresh();
        } else {
            await signIn.social({ provider: "github" });
        }
    };

    return (
        <div>
            {session?.user.id ? (
                <div className="flex flex-col items-center justify-center gap-2">
                    <p>Signed in as {session.user.name}</p>
                    <Button onClick={onClick}>
                        Sign out
                    </Button>
                </div>
            ) : (
                <Button onClick={onClick}>
                    Sign in
                </Button>
            )}
        </div>
    );
};