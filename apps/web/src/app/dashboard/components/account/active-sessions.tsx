import { Session } from "@better-analytics/auth";
import { DeviceMobileCameraIcon, LaptopIcon } from "@phosphor-icons/react/dist/ssr";
import { UAParser } from "ua-parser-js";
import { SessionActionButton } from "./session-action-button";

type ActiveSessionsProps = {
    activeSessions: Session["session"][];
    currentSessionId?: string;
}

export const ActiveSessions = (props: ActiveSessionsProps) => {
    return (
        <div className="grid gap-3 max-w-3xl">
            {props.activeSessions
                .filter((session) => session.userAgent)
                .map((session) => {
                    const isCurrentSession = session.id === props.currentSessionId;
                    const parser = new UAParser(session.userAgent || "");
                    const deviceType = parser.getDevice().type;
                    const osName = parser.getOS().name;
                    const browserName = parser.getBrowser().name;

                    return (
                        <div
                            key={session.id}
                            className="flex items-center py-3 border-b last:border-b-0 border-border/40"
                        >
                            <div className="bg-primary/10 p-2 rounded-md text-primary mr-4">
                                {deviceType === "mobile" ? (
                                    <DeviceMobileCameraIcon size={20} weight="fill" />
                                ) : (
                                    <LaptopIcon size={20} weight="fill" />
                                )}
                            </div>
                            <div className="mr-4">
                                <div className="text-sm font-medium flex items-center">
                                    {osName || "Unknown OS"}
                                    {isCurrentSession && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {browserName || "Unknown Browser"}
                                </div>
                            </div>
                            <SessionActionButton
                                sessionId={session.id}
                                sessionToken={session.token}
                                isCurrentSession={isCurrentSession}
                            />
                        </div>
                    );
                })}
        </div>
    );
};