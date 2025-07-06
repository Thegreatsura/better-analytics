'use client';

import { Button } from '@better-analytics/ui/components/button';
import { Input } from '@better-analytics/ui/components/input';
import { Card, CardContent, CardHeader } from '@better-analytics/ui/components/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@better-analytics/ui/components/tooltip';
import { PaperPlaneTilt, Robot, User, Copy, ThumbsUp, ThumbsDown, StopCircle, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useRef, useEffect, useState, useCallback } from 'react';
import { ChartRenderer } from './components/chart-renderer';
import { cn } from '@better-analytics/ui';

// Type for chart data from AI tool calls
interface ChartData {
    title: string;
    description: string;
    type: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radial';
    data: Array<Record<string, any>>;
    xAxisKey: string;
    yAxisKey: string;
    colorScheme?: string[];
    config: Record<string, { label: string; color: string }>;
}

// Message type for our custom chat system
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    chartData?: ChartData;
    toolCalls?: ToolCall[];
    isStreaming?: boolean;
    timestamp: number;
}

// Tool call type for tracking AI actions
interface ToolCall {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    description: string;
    result?: any;
}

export default function AIPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m your Better Analytics AI assistant. I can help you analyze your data, understand error patterns, and provide insights about your application\'s performance. I can also create beautiful charts and visualizations from your data. What would you like to know?',
            timestamp: Date.now(),
        },
    ]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentEventSource, setCurrentEventSource] = useState<EventSource | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const preFilledMessage = urlParams.get('message');
        if (preFilledMessage) {
            setInput(decodeURIComponent(preFilledMessage));
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // Clean up EventSource on unmount
    useEffect(() => {
        return () => {
            if (currentEventSource) {
                currentEventSource.close();
            }
        };
    }, [currentEventSource]);

    const copyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Message copied to clipboard');
    }, []);

    const handleVote = useCallback((messageId: string, vote: 'up' | 'down') => {
        toast.success(`Feedback recorded: ${vote === 'up' ? 'Helpful' : 'Not helpful'}`);
    }, []);

    const stopStreaming = useCallback(() => {
        if (currentEventSource) {
            currentEventSource.close();
            setCurrentEventSource(null);
        }
        setIsLoading(false);
    }, [currentEventSource]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        };

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            isStreaming: true,
            toolCalls: [],
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const eventSource = new EventSource('/api/chat/stream', {
                // Note: EventSource doesn't support POST, so we'll need to modify our approach
            });

            // Use fetch with Server-Sent Events streaming
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response stream available');
            }

            let buffer = '';
            let currentThinkingSteps: string[] = [];

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'thinking') {
                                currentThinkingSteps.push(data.content);
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === assistantMessage.id) {
                                        return {
                                            ...msg,
                                            toolCalls: [{
                                                id: 'thinking',
                                                name: 'thinking',
                                                status: 'running' as const,
                                                description: data.content,
                                            }],
                                        };
                                    }
                                    return msg;
                                }));
                            } else if (data.type === 'progress') {
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === assistantMessage.id) {
                                        return {
                                            ...msg,
                                            content: data.content,
                                            chartData: data.data?.chartData,
                                            isStreaming: true,
                                        };
                                    }
                                    return msg;
                                }));
                            } else if (data.type === 'done') {
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === assistantMessage.id) {
                                        return {
                                            ...msg,
                                            content: data.content,
                                            chartData: data.data?.chartData,
                                            isStreaming: false,
                                            toolCalls: [],
                                        };
                                    }
                                    return msg;
                                }));
                                setIsLoading(false);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in AI chat:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setError(null);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('input')?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const reload = () => {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            setMessages(prev => prev.filter(m => m.timestamp <= lastUserMessage.timestamp));
            setInput(lastUserMessage.content);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                        <Sparkle className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
                        <p className="text-muted-foreground">Chat with AI about your analytics data and get insights with visualizations</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isLoading && (
                        <>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                                <span className="text-sm text-emerald-400 font-medium">AI is analyzing...</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={stopStreaming}
                                className="gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-200"
                            >
                                <StopCircle className="h-4 w-4" />
                                Stop
                            </Button>
                        </>
                    )}

                    {!isLoading && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 border border-border/20 rounded-md">
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            <span className="text-sm text-muted-foreground font-mono">
                                {messages.length} message{messages.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Card */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full overflow-y-auto px-6 custom-scrollbar" ref={scrollAreaRef}>
                        <div className="space-y-6 py-6">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Robot className="h-4 w-4 text-primary" />
                                        </div>
                                    )}

                                    <div className="flex flex-col max-w-[85%] space-y-3">
                                        {/* Text Message */}
                                        {message.content && (
                                            <div
                                                className={cn(
                                                    "rounded-lg px-4 py-3 transition-all duration-200 border",
                                                    message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground border-primary/20 shadow-sm'
                                                        : 'bg-muted/50 border-border/20 hover:bg-muted/70 hover:border-border/30'
                                                )}
                                            >
                                                <div className="text-sm leading-relaxed break-words">
                                                    {message.content}
                                                    {message.isStreaming && (
                                                        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tool Calls Status */}
                                        {message.toolCalls && message.toolCalls.length > 0 && (
                                            <div className="space-y-2">
                                                {message.toolCalls.map((tool) => (
                                                    <div key={tool.id} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                                                        {tool.status === 'running' && (
                                                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                                        )}
                                                        {tool.status === 'completed' && (
                                                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                                                        )}
                                                        {tool.status === 'error' && (
                                                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                                                        )}
                                                        <span>{tool.description}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Chart Visualization */}
                                        {message.chartData && (
                                            <div className="mt-3">
                                                <ChartRenderer chartData={message.chartData} />
                                            </div>
                                        )}

                                        {/* Action Buttons for Assistant Messages */}
                                        {message.role === 'assistant' && message.content && !message.isStreaming && (
                                            <div className="flex items-center gap-1 pl-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => copyMessage(message.content)}
                                                                className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-150"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Copy message</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleVote(message.id, 'up')}
                                                                className="h-7 w-7 p-0 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-150"
                                                            >
                                                                <ThumbsUp className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Helpful response</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleVote(message.id, 'down')}
                                                                className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                                                            >
                                                                <ThumbsDown className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Not helpful</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        )}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {error && (
                                <div className="group flex gap-3 transition-all duration-300 ease-out hover:shadow-sm">
                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                                        <Robot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 transition-all duration-200 hover:bg-red-500/15 hover:border-red-500/30">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                                {error}
                                            </span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={reload}
                                                            className="h-7 w-7 p-0 flex-shrink-0 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
                                                        >
                                                            <PaperPlaneTilt className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Retry last message</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>

                {/* Input Area */}
                <div className="border-t bg-background/50 backdrop-blur-sm px-6 py-4">
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 relative">
                                <Input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Ask me about your analytics data and I'll create charts... (⌘K to focus)"
                                    disabled={isLoading}
                                    className="pr-16 bg-background/50 border-border/50 focus:bg-background focus:border-border transition-all duration-200 min-h-[44px]"
                                    maxLength={500}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                                    {input.length}/500
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                size="sm"
                                className={cn(
                                    "px-4 h-[44px] transition-all duration-200",
                                    isLoading
                                        ? "bg-emerald-500 hover:bg-emerald-600"
                                        : "bg-primary hover:bg-primary/90"
                                )}
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <PaperPlaneTilt className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Quick Actions */}
                        {!isLoading && (
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="text-xs text-muted-foreground font-medium">Quick actions:</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all duration-150"
                                    onClick={() => setInput("Show me error trends for the last 7 days")}
                                    disabled={isLoading}
                                >
                                    📈 Error trends
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-150"
                                    onClick={() => setInput("What are the most common errors in my app?")}
                                    disabled={isLoading}
                                >
                                    🔍 Top errors
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all duration-150"
                                    onClick={() => setInput("Create a performance dashboard")}
                                    disabled={isLoading}
                                >
                                    ⚡ Performance
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-400 transition-all duration-150"
                                    onClick={() => setInput("Analyze user behavior patterns")}
                                    disabled={isLoading}
                                >
                                    👥 User patterns
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </Card>
        </div>
    );
} 