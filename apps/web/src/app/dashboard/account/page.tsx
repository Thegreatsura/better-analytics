import { auth } from "@better-analytics/auth"
import { headers } from "next/headers"
import { UserCard } from "../components/account/user-card"
import { ActiveSessions } from "../components/account/active-sessions"

export default async function DashboardAccount() {
    const [session, activeSessions] = await Promise.all([
        auth.api.getSession({
            headers: await headers(),
        }),
        auth.api.listSessions({
            headers: await headers(),
        }),
    ])

    console.log("session", session)
    console.log("account", activeSessions)

    const parsedSession = JSON.parse(JSON.stringify(session));
    const parsedActiveSessions = JSON.parse(JSON.stringify(activeSessions));

    return (
        <div className="flex gap-4 flex-col">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Account</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account details, view active sessions, and update your personal information.
                </p>
            </div>
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-lg font-medium">Profile</h2>
                    <UserCard session={parsedSession} />
                </div>

                <div>
                    <h2 className="text-lg font-medium">API Configuration</h2>
                    test
                </div>

                <div>
                    <h2 className="text-lg font-medium">Active Sessions</h2>
                    <ActiveSessions
                        activeSessions={parsedActiveSessions}
                        currentSessionId={parsedSession?.session?.id}
                    />
                </div>
            </div>
        </div>
    );
}