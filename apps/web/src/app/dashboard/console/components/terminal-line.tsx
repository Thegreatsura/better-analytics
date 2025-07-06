'use client';

import { Badge } from '@better-analytics/ui/components/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@better-analytics/ui/components/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@better-analytics/ui/components/collapsible';
import { ChevronRight, Clock, Server, User, Globe } from 'lucide-react';
import { cn } from '@better-analytics/ui';
import { type LogLine, getLogType } from './utils';

// Simple regex escape function
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface LogLineProps {
    log: LogLine;
    noTimestamp?: boolean;
    searchTerm?: string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export function TerminalLine({ log, noTimestamp, searchTerm, isExpanded, onToggleExpand }: LogLineProps) {
    const { timestamp, message, rawTimestamp, source, level } = log;
    const { type, variant, color } = getLogType(message);

    const formattedTime = timestamp
        ? timestamp.toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        : "---";

    const formattedFullTime = timestamp
        ? timestamp.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
        : "--- No time found ---";

    const highlightMessage = (text: string, term: string) => {
        if (!term) {
            return <span className="transition-colors">{text}</span>;
        }

        const searchRegex = new RegExp(`(${escapeRegExp(term)})`, "gi");
        const parts = text.split(searchRegex);

        return (
            <span className="transition-colors">
                {parts.map((part, index) =>
                    searchRegex.test(part) ? (
                        <span key={index} className="bg-amber-200/80 dark:bg-amber-900/80 font-bold">
                            {part}
                        </span>
                    ) : (
                        <span key={index}>{part}</span>
                    )
                )}
            </span>
        );
    };

    const levelColors = {
        error: 'text-red-400 border-red-500/20 bg-red-500/10',
        warn: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
        warning: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
        info: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
        debug: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10',
        success: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
    } as const;

    const getLevelColor = (level: string) => {
        const normalizedLevel = level.toLowerCase() as keyof typeof levelColors;
        return levelColors[normalizedLevel] || levelColors.info;
    };

    // Check if we have additional details to show
    const hasDetails = source || rawTimestamp || level || message.length > 80;

    return (
        <Collapsible
            open={isExpanded}
            onOpenChange={onToggleExpand}
            className={cn(
                "group rounded-lg border transition-all duration-200",
                isExpanded ? "border-border/20 bg-muted/[0.03]" : "border-border/[0.08] hover:bg-muted/[0.02]"
            )}
        >
            <CollapsibleTrigger
                className="flex w-full items-center p-4 text-left"
                disabled={!hasDetails}
            >
                <div className="flex flex-1 items-center gap-4">
                    {/* Level Badge */}
                    <Badge
                        variant="outline"
                        className={cn(
                            "min-w-[60px] justify-center font-medium rounded",
                            getLevelColor(level || type)
                        )}
                    >
                        {(level || type).toUpperCase()}
                    </Badge>

                    {/* Timestamp */}
                    {!noTimestamp && (
                        <div className="flex items-center gap-2 min-w-[90px]">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <time className="text-sm text-muted-foreground font-mono">
                                {formattedTime}
                            </time>
                        </div>
                    )}

                    {/* Source */}
                    {source && (
                        <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {source}
                            </span>
                        </div>
                    )}

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                        <span className="text-sm text-foreground font-mono truncate block">
                            {highlightMessage(message, searchTerm || "")}
                        </span>
                    </div>

                    {/* Expand Icon */}
                    {hasDetails && (
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 text-muted-foreground transition-all duration-200 flex-shrink-0",
                                isExpanded && "rotate-90"
                            )}
                        />
                    )}
                </div>
            </CollapsibleTrigger>

            {hasDetails && (
                <CollapsibleContent>
                    <div className="border-t border-border/[0.08] p-4 space-y-4">
                        {/* Full message if truncated */}
                        {message.length > 80 && (
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Message</span>
                                <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-muted/50 p-3 text-foreground border border-border/[0.08]">
                                    {highlightMessage(message, searchTerm || "")}
                                </pre>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {/* Full Timestamp */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Created</span>
                                <span className="font-mono text-foreground">
                                    {formattedFullTime}
                                </span>
                            </div>

                            {/* Level */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Level</span>
                                <span className="font-mono text-foreground">{level || type}</span>
                            </div>

                            {/* Source */}
                            {source && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Source</span>
                                    <span className="font-mono text-foreground">{source}</span>
                                </div>
                            )}

                            {/* Raw Timestamp */}
                            {rawTimestamp && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Raw Timestamp</span>
                                    <span className="font-mono text-foreground text-xs">{rawTimestamp}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
} 