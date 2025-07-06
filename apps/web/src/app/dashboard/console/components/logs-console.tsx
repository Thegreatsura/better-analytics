'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@better-analytics/ui/components/button';
import { Input } from '@better-analytics/ui/components/input';
import { Card, CardContent, CardHeader } from '@better-analytics/ui/components/card';
import { Switch } from '@better-analytics/ui/components/switch';
import { Label } from '@better-analytics/ui/components/label';
import { Separator } from '@better-analytics/ui/components/separator';
import { Download, Search, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@better-analytics/ui';
import { TerminalLine } from './terminal-line';
import { LineCountFilter } from './line-count-filter';
import { SinceLogsFilter, type TimeFilter } from './since-logs-filter';
import { StatusLogsFilter } from './status-logs-filter';
import { type LogLine, getLogType } from './utils';
import { getRecentLogs } from '../../../test/actions';

const priorities = [
    { label: "Info", value: "info" },
    { label: "Warning", value: "warning" },
    { label: "Error", value: "error" },
    { label: "Debug", value: "debug" },
];



export function LogsConsole() {
    const [logs, setLogs] = useState<LogLine[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
    const [isStreaming, setIsStreaming] = useState(true);
    const [autoScroll, setAutoScroll] = useState(true);
    const [lines, setLines] = useState<number>(100);
    const [search, setSearch] = useState<string>("");
    const [showTimestamp, setShowTimestamp] = useState(true);
    const [since, setSince] = useState<TimeFilter>("all");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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

    const fetchLogs = async () => {
        try {
            const result = await getRecentLogs();
            if (result.success && result.data) {
                const transformedLogs: LogLine[] = result.data.map(log => ({
                    timestamp: new Date(log.created_at),
                    message: log.message,
                    rawTimestamp: log.created_at,
                    source: log.source || 'Unknown',
                    level: log.level || 'info'
                }));
                setLogs(transformedLogs);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    };

    const handleDownload = () => {
        const logContent = filteredLogs
            .map(({ timestamp, message }) =>
                `${timestamp?.toISOString() || "No timestamp"} ${message}`
            )
            .join("\n");

        const blob = new Blob([logContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const isoDate = new Date().toISOString();
        a.href = url;
        a.download = `logs-${isoDate.slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLogToggle = (logId: string) => {
        setExpandedLogId(expandedLogId === logId ? null : logId);
    };

    const handleFilter = (logs: LogLine[]) => {
        return logs.filter((log) => {
            const logType = getLogType(log.message).type;

            if (search && !log.message.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }

            if (typeFilter.length > 0 && !typeFilter.includes(logType)) {
                return false;
            }

            if (since !== "all" && log.timestamp) {
                const now = new Date();
                const logTime = log.timestamp;
                const diffHours = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60);

                switch (since) {
                    case "1h": return diffHours <= 1;
                    case "6h": return diffHours <= 6;
                    case "24h": return diffHours <= 24;
                    case "168h": return diffHours <= 168;
                    case "720h": return diffHours <= 720;
                    default: return true;
                }
            }

            return true;
        });
    };

    useEffect(() => {
        fetchLogs();
        let interval: NodeJS.Timeout;
        if (isStreaming) {
            interval = setInterval(fetchLogs, 5000);
        }
        return () => clearInterval(interval);
    }, [isStreaming]);

    useEffect(() => {
        const filtered = handleFilter(logs);
        setFilteredLogs(filtered.slice(-lines));
    }, [logs, search, lines, since, typeFilter]);

    useEffect(() => {
        scrollToBottom();
    }, [filteredLogs, autoScroll]);

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

                                <StatusLogsFilter
                                    value={typeFilter}
                                    setValue={setTypeFilter}
                                    title="Level"
                                    options={priorities}
                                />
                                <SinceLogsFilter
                                    value={since}
                                    onValueChange={setSince}
                                    showTimestamp={showTimestamp}
                                    onTimestampChange={setShowTimestamp}
                                />
                                <LineCountFilter value={lines} onValueChange={setLines} />
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
                                >
                                    {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    {isStreaming ? 'Live' : 'Paused'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setLogs([])}
                                    className="gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-200"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Clear
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    disabled={filteredLogs.length === 0}
                                    className="gap-2 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all duration-200 disabled:opacity-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Status Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 bg-background/50 border-border/50 focus:bg-background focus:border-border transition-all duration-200"
                                />
                            </div>

                            {search && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    <span className="text-sm text-blue-400 font-medium">
                                        {filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border/20 rounded-md">
                                <Switch
                                    id="autoscroll"
                                    checked={autoScroll}
                                    onCheckedChange={setAutoScroll}
                                />
                                <Label htmlFor="autoscroll" className="text-sm font-medium">Auto-scroll</Label>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border/20 rounded-md">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                                <span className="text-sm text-muted-foreground font-mono">
                                    {filteredLogs.length} / {logs.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 min-h-0">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-auto bg-muted/20 border-t custom-scrollbar"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'hsl(var(--border) / 0.3) transparent'
                    }}
                >
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                                <div className="text-lg font-medium mb-2">No logs found</div>
                                <div className="text-sm">
                                    {search ? 'Try adjusting your search terms or filters' : 'Logs will appear here when available'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {filteredLogs.map((log, index) => {
                                const logId = `${log.timestamp?.getTime()}-${index}`;
                                return (
                                    <TerminalLine
                                        key={logId}
                                        log={log}
                                        searchTerm={search}
                                        noTimestamp={!showTimestamp}
                                        isExpanded={expandedLogId === logId}
                                        onToggleExpand={() => handleLogToggle(logId)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>


        </Card>
    );
} 