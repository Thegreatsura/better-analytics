'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@better-analytics/ui/components/button';
import { Input } from '@better-analytics/ui/components/input';
import { Card, CardContent, CardHeader } from '@better-analytics/ui/components/card';
import { Switch } from '@better-analytics/ui/components/switch';
import { Label } from '@better-analytics/ui/components/label';
import { Separator } from '@better-analytics/ui/components/separator';
import { DownloadSimple, MagnifyingGlass, Play, Pause, ArrowCounterClockwise, Warning, BugBeetle, Lightning, Shield, WifiHigh, WifiSlash, ArrowClockwise } from '@phosphor-icons/react';
import { cn } from '@better-analytics/ui';
import { ErrorLine } from './error-line';
import { ErrorFilters } from './error-filters';
import { useRealtime, type ErrorEvent } from '@/hooks/use-realtime';
import { getRecentErrors } from '@/app/dashboard/actions';

const severityLevels = [
    { label: "Critical", value: "critical", icon: Lightning, color: "text-red-500" },
    { label: "High", value: "high", icon: Warning, color: "text-orange-500" },
    { label: "Medium", value: "medium", icon: BugBeetle, color: "text-yellow-500" },
    { label: "Low", value: "low", icon: Shield, color: "text-blue-500" },
];

const errorTypes = [
    { label: "Client", value: "client" },
    { label: "Server", value: "server" },
    { label: "Network", value: "network" },
    { label: "Database", value: "database" },
    { label: "Validation", value: "validation" },
    { label: "Auth", value: "auth" },
    { label: "Business", value: "business" },
    { label: "Unknown", value: "unknown" },
];

export interface ErrorData {
    id: string;
    error_name: string;
    message: string;
    severity: string;
    error_type: string;
    source: string;
    environment: string;
    browser_name: string;
    os_name: string;
    browser_version?: string;
    os_version?: string;
    country: string;
    url: string;
    endpoint: string;
    http_status_code: number;
    created_at: string;
    occurrence_count: number;
    status: string;
    stack_trace?: string;
    user_id?: string;
    session_id?: string;
    custom_data?: string;
}

export function ErrorsConsole() {
    const [errors, setErrors] = useState<ErrorData[]>([]);
    const [filteredErrors, setFilteredErrors] = useState<ErrorData[]>([]);
    const [isStreaming, setIsStreaming] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const [lines, setLines] = useState<number>(50);
    const [search, setSearch] = useState<string>("");
    const [showTimestamp, setShowTimestamp] = useState(true);
    const [severityFilter, setSeverityFilter] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Real-time subscription
    const handleNewError = useCallback((errorEvent: ErrorEvent) => {
        const newError: ErrorData = {
            id: errorEvent.id,
            error_name: errorEvent.message.split(':')[0] || 'Unknown Error',
            message: errorEvent.message,
            severity: errorEvent.severity || 'medium',
            error_type: errorEvent.error_type || 'unknown',
            source: errorEvent.source || 'Unknown',
            environment: 'production',
            browser_name: errorEvent.browser_name || 'Unknown',
            os_name: errorEvent.os_name || 'Unknown',
            country: errorEvent.country || 'Unknown',
            url: errorEvent.url || '',
            endpoint: '',
            http_status_code: 0,
            created_at: errorEvent.created_at,
            occurrence_count: 1,
            status: 'new',
            stack_trace: undefined,
            user_id: undefined,
            session_id: undefined,
            custom_data: undefined
        };

        setErrors(prevErrors => [...prevErrors, newError]);
    }, []);

    const { isConnected } = useRealtime({
        onError: handleNewError,
        enabled: isStreaming
    });

    const scrollToBottom = () => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
        setAutoScroll(isAtBottom);
    };

    const fetchErrors = async () => {
        try {
            const result = await getRecentErrors();
            if (result.success && result.data) {
                setErrors(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch errors:', error);
        }
    };

    const handleDownload = () => {
        const errorContent = filteredErrors
            .map(error =>
                `${error.created_at} [${error.severity.toUpperCase()}] ${error.error_name}: ${error.message}\n` +
                `Source: ${error.source || 'Unknown'}\n` +
                `URL: ${error.url || 'N/A'}\n` +
                `Browser: ${error.browser_name || 'Unknown'} on ${error.os_name || 'Unknown'}\n` +
                `Stack Trace: ${error.stack_trace || 'Not available'}\n` +
                "---\n"
            )
            .join("\n");

        const blob = new Blob([errorContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const isoDate = new Date().toISOString();
        a.href = url;
        a.download = `errors-${isoDate.slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleErrorToggle = (errorId: string) => {
        setExpandedErrorId(expandedErrorId === errorId ? null : errorId);
    };

    const handleFilter = (errors: ErrorData[]) => {
        return errors.filter((error) => {
            if (search && !error.message.toLowerCase().includes(search.toLowerCase()) &&
                !error.error_name.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }

            if (severityFilter.length > 0 && !severityFilter.includes(error.severity)) {
                return false;
            }

            if (typeFilter.length > 0 && !typeFilter.includes(error.error_type)) {
                return false;
            }

            if (statusFilter.length > 0 && !statusFilter.includes(error.status)) {
                return false;
            }

            return true;
        });
    };

    useEffect(() => {
        fetchErrors();
    }, []);

    useEffect(() => {
        const filtered = handleFilter(errors);
        setFilteredErrors(filtered.slice(-lines));
    }, [errors, search, lines, severityFilter, typeFilter, statusFilter]);

    useEffect(() => {
        scrollToBottom();
    }, [filteredErrors, autoScroll]);

    const errorStats = {
        total: filteredErrors.length,
        critical: filteredErrors.filter(e => e.severity === 'critical').length,
        high: filteredErrors.filter(e => e.severity === 'high').length,
        medium: filteredErrors.filter(e => e.severity === 'medium').length,
        low: filteredErrors.filter(e => e.severity === 'low').length,
    };

    return (
        <Card className="h-full flex flex-col pb-2 mb-2 gap-0">
            <CardHeader className="pb-4">
                <div className="space-y-3">
                    {/* Enhanced Filter Bar */}
                    <div className="backdrop-blur-xl bg-muted/30 border border-border/20 shadow-lg p-4 rounded-lg">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Left Section: Filters */}
                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filters</span>
                                    <Separator orientation="vertical" className="h-4" />
                                </div>

                                <ErrorFilters
                                    severityFilter={severityFilter}
                                    setSeverityFilter={setSeverityFilter}
                                    typeFilter={typeFilter}
                                    setTypeFilter={setTypeFilter}
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    lines={lines}
                                    setLines={setLines}
                                    severityOptions={severityLevels}
                                    typeOptions={errorTypes}
                                />
                            </div>

                            {/* Right Section: Actions */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</span>
                                    <Separator orientation="vertical" className="h-4" />
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsStreaming(!isStreaming)}
                                    className={cn(
                                        "gap-2 transition-all duration-200",
                                        isStreaming
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                            : "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                                    )}
                                    title={isStreaming ? "Pause real-time updates" : "Resume real-time updates"}
                                >
                                    {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    {isStreaming ? 'Real-time' : 'Paused'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchErrors}
                                    className="gap-2 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all duration-200"
                                    title="Refresh errors manually"
                                >
                                    <ArrowClockwise className="h-4 w-4" />
                                    Refresh
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setErrors([])}
                                    className="gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-200"
                                >
                                    <ArrowCounterClockwise className="h-4 w-4" />
                                    Clear
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    disabled={filteredErrors.length === 0}
                                    className="gap-2 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all duration-200 disabled:opacity-50"
                                >
                                    <DownloadSimple className="h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Status Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by error name, message..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-background/50 border-border/50 focus:bg-background focus:border-border transition-all duration-200"
                                />
                            </div>

                            {search && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    <span className="text-sm text-blue-400 font-medium">
                                        {filteredErrors.length} result{filteredErrors.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Error Stats */}
                            <div className="flex items-center gap-2">
                                {errorStats.critical > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
                                        <Lightning className="h-3 w-3 text-red-500" />
                                        <span className="text-xs text-red-500 font-medium">{errorStats.critical}</span>
                                    </div>
                                )}
                                {errorStats.high > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md">
                                        <Warning className="h-3 w-3 text-orange-500" />
                                        <span className="text-xs text-orange-500 font-medium">{errorStats.high}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border/20 rounded-md">
                                <Switch
                                    id={`autoscroll-${Math.random().toString(36).substring(2, 15)}`}
                                    checked={autoScroll}
                                    onCheckedChange={setAutoScroll}
                                />
                                <Label htmlFor="autoscroll" className="text-sm font-medium">Auto-scroll</Label>
                            </div>

                            {/* Real-time connection indicator */}
                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1 border rounded-md transition-all duration-200",
                                isConnected
                                    ? "bg-emerald-500/10 border-emerald-500/20"
                                    : "bg-red-500/10 border-red-500/20"
                            )}>
                                {isConnected ? (
                                    <WifiHigh className="h-3 w-3 text-emerald-400" />
                                ) : (
                                    <WifiSlash className="h-3 w-3 text-red-400" />
                                )}
                                <span className={cn(
                                    "text-sm font-medium",
                                    isConnected ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {isConnected ? 'Real-time' : 'Disconnected'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border/20 rounded-md">
                                <div className="w-2 h-2 bg-red-400 rounded-full" />
                                <span className="text-sm text-muted-foreground font-mono">
                                    {filteredErrors.length} / {errors.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-border/20">
                        <div className="relative">
                            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by error name, message..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
                        {filteredErrors.length > 0 ? (
                            <div className="divide-y divide-border/20">
                                {filteredErrors.map((error) => (
                                    <ErrorLine
                                        key={error.id}
                                        error={error}
                                        noTimestamp={!showTimestamp}
                                        searchTerm={search}
                                        isExpanded={expandedErrorId === error.id}
                                        onToggleExpand={() => handleErrorToggle(error.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <BugBeetle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold text-foreground">No errors found</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    It looks like everything is running smoothly. If you were expecting to see errors, please check your filters.
                                </p>
                            </div>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="p-2 border-t border-border/20 text-xs text-muted-foreground flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-400" : "bg-red-400")} />
                            {isConnected ? 'Real-time connection active' : 'Disconnected from real-time updates'}
                        </div>
                        <span>Showing {filteredErrors.length} of {errors.length} errors</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 