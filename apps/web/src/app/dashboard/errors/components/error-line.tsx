'use client';

import { Badge } from '@better-analytics/ui/components/badge';
import { Button } from '@better-analytics/ui/components/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@better-analytics/ui/components/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@better-analytics/ui/components/collapsible';
import { ChevronRight, Clock, Server, User, Globe, Copy, Bot, Check, AlertTriangle, Zap, Bug, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@better-analytics/ui';
import { useState } from 'react';
import { ErrorData } from './errors-console';

// Simple regex escape function
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface ErrorLineProps {
    error: ErrorData;
    noTimestamp?: boolean;
    searchTerm?: string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export function ErrorLine({ error, noTimestamp, searchTerm, isExpanded, onToggleExpand }: ErrorLineProps) {
    const [copied, setCopied] = useState(false);

    const formattedTime = new Date(error.created_at).toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const formattedFullTime = new Date(error.created_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

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

    const getSeverityConfig = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return {
                    icon: Zap,
                    color: 'text-red-500 border-red-500/20 bg-red-500/10',
                    bgColor: 'bg-red-500/5 border-red-500/10'
                };
            case 'high':
                return {
                    icon: AlertTriangle,
                    color: 'text-orange-500 border-orange-500/20 bg-orange-500/10',
                    bgColor: 'bg-orange-500/5 border-orange-500/10'
                };
            case 'medium':
                return {
                    icon: Bug,
                    color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10',
                    bgColor: 'bg-yellow-500/5 border-yellow-500/10'
                };
            case 'low':
                return {
                    icon: Shield,
                    color: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
                    bgColor: 'bg-blue-500/5 border-blue-500/10'
                };
            default:
                return {
                    icon: Bug,
                    color: 'text-gray-500 border-gray-500/20 bg-gray-500/10',
                    bgColor: 'bg-gray-500/5 border-gray-500/10'
                };
        }
    };

    const severityConfig = getSeverityConfig(error.severity);
    const SeverityIcon = severityConfig.icon;

    // Check if we have additional details to show
    const hasDetails = error.stack_trace || error.url || error.endpoint || error.browser_name ||
        error.os_name || error.country || error.user_id || error.session_id ||
        error.custom_data || error.message.length > 100;

    const handleCopy = async () => {
        const errorText = `${formattedFullTime} [${error.severity.toUpperCase()}] ${error.error_name}: ${error.message}
Source: ${error.source || 'Unknown'}
URL: ${error.url || 'N/A'}
Browser: ${error.browser_name || 'Unknown'} on ${error.os_name || 'Unknown'}
Stack Trace: ${error.stack_trace || 'Not available'}`;

        try {
            await navigator.clipboard.writeText(errorText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy error:', err);
        }
    };

    const handleAskAI = () => {
        const errorContext = `Please analyze this error and provide insights on potential causes and solutions:

**Error Details:**
- Error Name: ${error.error_name}
- Message: ${error.message}
- Severity: ${error.severity}
- Type: ${error.error_type}
- Source: ${error.source || 'Unknown'}
- URL: ${error.url || 'N/A'}
- Browser: ${error.browser_name || 'Unknown'} on ${error.os_name || 'Unknown'}
- Endpoint: ${error.endpoint || 'N/A'}
- HTTP Status: ${error.http_status_code || 'N/A'}
- Occurrence Count: ${error.occurrence_count}
- Stack Trace: ${error.stack_trace || 'Not available'}

What could be causing this error and how can it be resolved?`;

        const encodedMessage = encodeURIComponent(errorContext);
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
                    ? "border-border/30 shadow-sm"
                    : "border-border/[0.08] hover:bg-muted/[0.03]",
                severityConfig.bgColor
            )}
        >
            <div
                className="flex w-full items-center p-4 cursor-pointer transition-all duration-200"
                onClick={hasDetails ? onToggleExpand : undefined}
            >
                <div className="flex flex-1 items-center gap-4">
                    {/* Severity Badge */}
                    <Badge
                        variant="outline"
                        className={cn(
                            "min-w-[80px] justify-center font-medium rounded transition-all duration-200",
                            "group-hover:shadow-sm group-hover:scale-[1.02] flex items-center gap-1",
                            severityConfig.color
                        )}
                    >
                        <SeverityIcon className="h-3 w-3" />
                        {error.severity.toUpperCase()}
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

                    {/* Error Type */}
                    <Badge variant="secondary" className="text-xs">
                        {error.error_type}
                    </Badge>

                    {/* Occurrence Count */}
                    {error.occurrence_count > 1 && (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {error.occurrence_count}x
                        </Badge>
                    )}

                    {/* Error Name and Message */}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                            {highlightMessage(error.error_name, searchTerm || "")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                            {highlightMessage(error.message, searchTerm || "")}
                        </div>
                    </div>

                    {/* Source */}
                    {error.source && (
                        <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground/60" />
                            <span className="text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
                                {error.source}
                            </span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
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
                                    <p>{copied ? 'Copied!' : 'Copy error details'}</p>
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
                                        <Bot className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Ask AI about this error</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {error.url && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(error.url, '_blank')}
                                            className="h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-400 transition-all duration-150"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Open URL</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    {/* Expand Icon */}
                    {hasDetails && (
                        <div className="flex items-center justify-center w-8 h-8 hover:bg-muted/50 rounded transition-colors duration-150">
                            <ChevronRight
                                className={cn(
                                    "h-4 w-4 text-muted-foreground transition-all duration-200 flex-shrink-0",
                                    isExpanded && "rotate-90"
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>

            {hasDetails && (
                <CollapsibleContent>
                    <div className="border-t border-border/[0.08] p-4 space-y-4">
                        {/* Full message if truncated */}
                        {error.message.length > 100 && (
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Full Message</span>
                                <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-muted/50 p-3 text-foreground border border-border/[0.08]">
                                    {highlightMessage(error.message, searchTerm || "")}
                                </pre>
                            </div>
                        )}

                        {/* Stack Trace */}
                        {error.stack_trace && (
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Stack Trace</span>
                                <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-red-500/5 p-3 text-foreground border border-red-500/20 max-h-64 overflow-y-auto">
                                    {error.stack_trace}
                                </pre>
                            </div>
                        )}

                        {/* Error Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Technical Details */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-foreground">Technical Details</h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Error Type:</span>
                                        <Badge variant="outline" className="text-xs">{error.error_type}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant="outline" className="text-xs">{error.status}</Badge>
                                    </div>
                                    {error.http_status_code && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">HTTP Status:</span>
                                            <Badge variant="outline" className="text-xs">{error.http_status_code}</Badge>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Occurrences:</span>
                                        <Badge variant="outline" className="text-xs">{error.occurrence_count}</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Environment Details */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-foreground">Environment</h4>
                                <div className="space-y-1 text-xs">
                                    {error.environment && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Environment:</span>
                                            <Badge variant="outline" className="text-xs">{error.environment}</Badge>
                                        </div>
                                    )}
                                    {error.browser_name && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Browser:</span>
                                            <Badge variant="outline" className="text-xs">{error.browser_name}</Badge>
                                        </div>
                                    )}
                                    {error.os_name && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">OS:</span>
                                            <Badge variant="outline" className="text-xs">{error.os_name}</Badge>
                                        </div>
                                    )}
                                    {error.country && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Country:</span>
                                            <Badge variant="outline" className="text-xs">{error.country}</Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* URLs and Endpoints */}
                        {(error.url || error.endpoint) && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-foreground">Location</h4>
                                <div className="space-y-1 text-xs">
                                    {error.url && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground">URL:</span>
                                            <code className="font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all">{error.url}</code>
                                        </div>
                                    )}
                                    {error.endpoint && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground">Endpoint:</span>
                                            <code className="font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all">{error.endpoint}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* User Context */}
                        {(error.user_id || error.session_id) && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-foreground">User Context</h4>
                                <div className="space-y-1 text-xs">
                                    {error.user_id && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground">User ID:</span>
                                            <code className="font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all">{error.user_id}</code>
                                        </div>
                                    )}
                                    {error.session_id && (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-muted-foreground">Session ID:</span>
                                            <code className="font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all">{error.session_id}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Custom Data */}
                        {error.custom_data && (
                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground">Custom Data</span>
                                <pre className="text-xs font-mono whitespace-pre-wrap rounded bg-muted/50 p-3 text-foreground border border-border/[0.08] max-h-32 overflow-y-auto">
                                    {(() => {
                                        try {
                                            return JSON.stringify(JSON.parse(error.custom_data), null, 2);
                                        } catch {
                                            return error.custom_data;
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