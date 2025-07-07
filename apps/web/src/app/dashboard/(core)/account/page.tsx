import { auth } from "@better-analytics/auth"
import { headers } from "next/headers"
import { UserCard } from "../../components/account/user-card"
import { ActiveSessions } from "../../components/account/active-sessions"
import { ApiConfig } from "../../components/account/api-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@better-analytics/ui/components/card"
import { Button } from "@better-analytics/ui/components/button"
import { User, Key, ShieldCheck } from "@phosphor-icons/react/ssr"
import { getOrCreateAccessToken } from "./actions"

export default async function DashboardAccount() {
    const [session, activeSessions, tokenResult] = await Promise.all([
        auth.api.getSession({
            headers: await headers(),
        }),
        auth.api.listSessions({
            headers: await headers(),
        }),
        getOrCreateAccessToken(),
    ])

    const parsedSession = JSON.parse(JSON.stringify(session));
    const parsedActiveSessions = JSON.parse(JSON.stringify(activeSessions));

    return (
        <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account details, view active sessions, and update your API credentials
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        Export Data
                    </Button>
                    <Button size="sm">
                        Update Profile
                    </Button>
                </div>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader className="flex flex-row items-center space-y-0">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                        <CardTitle className="font-medium">Profile Information</CardTitle>
                        <CardDescription>Your account details and profile information</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <UserCard session={parsedSession} />
                </CardContent>
            </Card>

            {/* API Configuration Card */}
            <Card>
                <CardHeader className="flex flex-row items-center space-y-0">
                    <Key className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                        <CardTitle className="font-medium">API Configuration</CardTitle>
                        <CardDescription>Manage your API credentials and access tokens</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ApiConfig
                        userId={parsedSession?.user?.id}
                        accessToken={tokenResult.success ? tokenResult.accessToken : undefined}
                    />
                </CardContent>
            </Card>

            {/* Active Sessions Card */}
            <Card>
                <CardHeader className="flex flex-row items-center space-y-0">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground mr-2" />
                    <div>
                        <CardTitle className="font-medium">Active Sessions</CardTitle>
                        <CardDescription>Monitor and manage your active login sessions</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ActiveSessions
                        activeSessions={parsedActiveSessions}
                        currentSessionId={parsedSession?.session?.id}
                    />
                </CardContent>
            </Card>
        </div>
    );
}