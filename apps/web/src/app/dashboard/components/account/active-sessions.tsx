import type { Session } from "@better-analytics/auth";
import { DeviceMobileCameraIcon, LaptopIcon } from "@phosphor-icons/react/dist/ssr";
import { UAParser } from "ua-parser-js";
import { SessionActionButton } from "./session-action-button";
import { Badge } from "@better-analytics/ui/components/badge";
import { Card, CardContent } from "@better-analytics/ui/components/card";
import { MapPin, Clock, Wifi } from "lucide-react";

type ActiveSessionsProps = {
    activeSessions: Session["session"][];
    currentSessionId?: string;
};

export const ActiveSessions = ({ activeSessions, currentSessionId }: ActiveSessionsProps) => {
    const formatLastSeen = (dateString: string | Date, isCurrentSession: boolean) => {
        if (isCurrentSession) return "Active now";

        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getLocationInfo = (userAgent: string | null | undefined) => {
        if (!userAgent) return "Unknown Location";
        const parser = new UAParser(userAgent);
        const os = parser.getOS();
        return os.name || "Unknown Location";
    };

    if (!activeSessions?.length) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No active sessions found</p>
            </div>
        );
    }

    const singleSession = activeSessions.length === 1;

    return (
        <div className="space-y-4">
            {/* Active session count */}
            <div className="text-sm text-muted-foreground">
                {activeSessions.length} active session{!singleSession ? "s" : ""} total
            </div>

            {/* Session Cards in grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {activeSessions
                    .filter((session) => session.userAgent)
                    .map((session) => {
                        const isCurrentSession = session.id === currentSessionId;
                        const parser = new UAParser(session.userAgent || "");
                        const deviceType = parser.getDevice().type;
                        const osName = parser.getOS().name;
                        const browserName = parser.getBrowser().name;
                        const deviceModel = parser.getDevice().model;

                        return (
                            <Card
                                key={session.id}
                                className={`
                  ${isCurrentSession ? "ring-2 ring-primary/20 bg-primary/5" : ""}
                  ${singleSession ? "shadow-none border-none" : ""}
                `}
                            >
                                <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Device Icon */}
                                        <div
                                            className={`p-2 rounded-md ${isCurrentSession ? "bg-primary/20" : "bg-muted"
                                                }`}
                                        >
                                            {deviceType === "mobile" ? (
                                                <DeviceMobileCameraIcon
                                                    size={18}
                                                    weight="fill"
                                                    className={isCurrentSession ? "text-primary" : "text-muted-foreground"}
                                                />
                                            ) : (
                                                <LaptopIcon
                                                    size={18}
                                                    weight="fill"
                                                    className={isCurrentSession ? "text-primary" : "text-muted-foreground"}
                                                />
                                            )}
                                        </div>

                                        {/* Session Info */}
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-sm">
                                                        {osName || "Unknown OS"}
                                                        {deviceModel && ` • ${deviceModel}`}
                                                    </h4>
                                                    {isCurrentSession && (
                                                        <Badge variant="default" className="text-xs">
                                                            Current Session
                                                        </Badge>
                                                    )}
                                                </div>
                                                <SessionActionButton
                                                    sessionId={session.id}
                                                    sessionToken={session.token}
                                                    isCurrentSession={isCurrentSession}
                                                />
                                            </div>

                                            <p className="text-sm text-muted-foreground">{browserName || "Unknown Browser"}</p>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {getLocationInfo(session.userAgent)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {isCurrentSession ? (
                                                        <Wifi className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Clock className="h-3 w-3" />
                                                    )}
                                                    <span className={isCurrentSession ? "text-green-600 dark:text-green-400" : ""}>
                                                        {formatLastSeen(session.createdAt, isCurrentSession)}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground font-mono pt-1">
                                                Session ID: {session.id.slice(0, 8)}...
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
            </div>
        </div>
    );
};
