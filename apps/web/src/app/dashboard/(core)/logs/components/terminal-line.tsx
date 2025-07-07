'use client';

import { Badge } from '@better-analytics/ui/components/badge';
import { Button } from '@better-analytics/ui/components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@better-analytics/ui/components/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@better-analytics/ui/components/collapsible';
import { CaretRight, Clock, HardDrives, User, Globe, Copy, Robot, Check } from '@phosphor-icons/react';
import { cn } from '@better-analytics/ui';
import { type LogLine, getLogType } from './utils';
import { useState } from 'react';

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
    const { timestamp, message, rawTimestamp, source, level, context, environment, user_id, session_id, tags } = log;
    const { type, variant, color } = getLogType(message);
    const [copied, setCopied] = useState(false);

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
                        <span key={part} className="bg-amber-200/80 dark:bg-amber-900/80 font-bold">
                            {part}
                        </span>
                    ) : (
                        <span key={part}>{part}</span>
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
    const hasDetails = source || rawTimestamp || level || context || environment || user_id || session_id || tags?.length || message.length > 80;

    const handleCopy = async () => {
        const logText = `${formattedFullTime} [${(level || type).toUpperCase()}] ${message}${source ? ` (${source})` : ''}`;
        try {
            await navigator.clipboard.writeText(logText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy log:', err);
        }
    };

    const handleAskAI = () => {
        const logContext = `Please analyze this log entry and explain what it means, potential issues, and any recommendations:

**Log Entry:**
- Timestamp: ${formattedFullTime}
- Level: ${(level || type).toUpperCase()}
- Message: ${message}
${source ? `- Source: ${source}` : ''}
${rawTimestamp ? `- Raw Timestamp: ${rawTimestamp}` : ''}

What does this log entry indicate? Are there any potential issues or patterns I should be aware of?`;

        // Navigate to AI page with pre-filled message
        const encodedMessage = encodeURIComponent(logContext);
        window.open(`/dashboard/ai?message=${encodedMessage}`, '_self');
    };

    return (
        <Collapsible
            open={isExpanded}
            onOpenChange={onToggleExpand}
            className={cn(
                "group rounded-lg border transition-all duration-300 ease-out",
                "hover:shadow-sm hover:border-border/30",
                isExpanded
                    ? "border-border/30 bg-muted/[0.05] shadow-sm"
                    : "border-border/[0.08] hover:bg-muted/[0.03]"
            )}
        >
            <CollapsibleTrigger asChild>
                <div
                    className="flex w-full items-center p-4 cursor-pointer transition-all duration-200 text-left"
                >
                    <div className="flex flex-1 items-center gap-4" onClick={hasDetails ? onToggleExpand : undefined}>
                        {/* Level Badge */}
                        <Badge
                            variant="outline"
                            className={cn(
                                "min-w-[60px] justify-center font-medium rounded transition-all duration-200",
                                "group-hover:shadow-sm group-hover:scale-[1.02]",
                                getLevelColor(level || type)
                            )}
                        >
                            {(level || type).toUpperCase()}
                        </Badge>

                        {/* Timestamp */}
                        {!noTimestamp && (
                            <div className="flex items-center gap-2 min-w-[90px] transition-all duration-200 group-hover:text-foreground/80">
                                <Clock className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground/60" />
                                <time className="text-sm text-muted-foreground font-mono transition-colors duration-200 group-hover:text-foreground/70">
                                    {formattedTime}
                                </time>
                            </div>
                        )}

                        {/* Source */}
                        {source && (
                            <div className="flex items-center gap-2">
                                <HardDrives className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground/60" />
                                <span className="text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
                                    {source}
                                </span>
                            </div>
                        )}

                        {/* Message */}
                        <div className="flex-1 min-w-0">
                            <span className="text-sm text-foreground font-mono truncate block transition-colors duration-200">
                                {highlightMessage(message, searchTerm || "")}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="toolbar"
                            aria-label="Log line actions"
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopy}
                                            className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-150"
                                        >
                                            {copied ? (
                                                <Check className="h-3 w-3 text-emerald-400" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{copied ? 'Copied!' : 'Copy log entry'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAskAI}
                                            className="h-7 w-7 p-0 hover:bg-purple-500/10 hover:text-purple-400 transition-all duration-150"
                                        >
                                            <Robot className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ask AI about this log</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Expand Icon */}
                        {hasDetails && (
                            <div className="flex items-center justify-center w-8 h-8 hover:bg-muted/50 rounded transition-colors duration-150">
                                <CaretRight
                                    className={cn(
                                        "h-4 w-4 text-muted-foreground transition-all duration-200 flex-shrink-0",
                                        isExpanded && "rotate-90"
                                    )}
                                />
                            </div>
                        )}
                    </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {rawTimestamp && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Timestamp</p>
                                        <p className="text-xs font-mono">{formattedFullTime}</p>
                                    </div>
                                </div>
                            )}
                            {environment && (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Environment</p>
                                        <p className="text-xs font-mono">{environment}</p>
                                    </div>
                                </div>
                            )}
                            {user_id && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">User ID</p>
                                        <p className="text-xs font-mono">{user_id}</p>
                                    </div>
                                </div>
                            )}
                            {session_id && (
                                <div className="flex items-center gap-2">
                                    <HardDrives className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Session ID</p>
                                        <p className="text-xs font-mono">{session_id}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Tags</span>
                                <div className="flex flex-wrap gap-1">
                                    {tags.map((tag, index) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Context Data */}
                        {context && (
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Context</span>
                                <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-muted/50 p-3 text-foreground border border-border/[0.08] max-h-96 overflow-y-auto">
                                    {(() => {
                                        try {
                                            return JSON.stringify(JSON.parse(context), null, 2);
                                        } catch {
                                            return context;
                                        }
                                    })()}
                                </pre>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
} 