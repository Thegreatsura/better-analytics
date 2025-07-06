'use client';

import { Button } from '@better-analytics/ui/components/button';
import { Input } from '@better-analytics/ui/components/input';
import { PaperPlaneTilt, Robot, User, Copy, ThumbsUp, ThumbsDown, StopCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useRef, useEffect, useState, useCallback } from 'react';
import { ChartRenderer } from './components/chart-renderer';

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

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Message copied to clipboard');
    };

    const handleVote = (messageId: string, vote: 'up' | 'down') => {
        toast.success(`Feedback recorded: ${vote === 'up' ? 'Helpful' : 'Not helpful'}`);
    };

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
                            } else if (data.type === 'complete') {
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === assistantMessage.id) {
                                        return {
                                            ...msg,
                                            content: data.content,
                                            chartData: data.data?.chartData,
                                            toolCalls: [],
                                            isStreaming: false,
                                        };
                                    }
                                    return msg;
                                }));
                                setIsLoading(false);
                                break;
                            } else if (data.type === 'error') {
                                setMessages(prev => prev.map(msg => {
                                    if (msg.id === assistantMessage.id) {
                                        return {
                                            ...msg,
                                            content: data.content,
                                            toolCalls: [],
                                            isStreaming: false,
                                        };
                                    }
                                    return msg;
                                }));
                                setIsLoading(false);
                                break;
                            }
                        } catch (parseError) {
                            console.error('Error parsing SSE data:', parseError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
            setIsLoading(false);

            // Remove the failed assistant message
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
            toast.error('Failed to get AI response. Please try again.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const reload = () => {
        // Remove the last assistant message and retry
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            setMessages(prev => prev.filter(m => m.timestamp <= lastUserMessage.timestamp));
            setInput(lastUserMessage.content);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height)-3rem)] max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Chat with AI about your analytics data and get insights with beautiful visualizations.
                    </p>
                </div>

                {isLoading && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span>AI is analyzing...</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={stopStreaming}
                            className="flex items-center gap-2"
                        >
                            <StopCircle className="h-4 w-4" />
                            Stop
                        </Button>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-6" ref={scrollAreaRef}>
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
                                            className={`rounded-lg px-4 py-3 ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                                }`}
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
                                        <div className="flex items-center gap-1 pl-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyMessage(message.content)}
                                                className="h-7 px-2 text-xs hover:bg-muted"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleVote(message.id, 'up')}
                                                className="h-7 px-2 text-xs hover:bg-muted"
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleVote(message.id, 'down')}
                                                className="h-7 px-2 text-xs hover:bg-muted"
                                            >
                                                <ThumbsDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {message.role === 'user' && (
                                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {error && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                                    <Robot className="h-4 w-4 text-destructive" />
                                </div>
                                <div className="flex-1 bg-destructive/10 rounded-lg px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-destructive">
                                            {error}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={reload}
                                            className="h-7 px-2 text-xs flex-shrink-0"
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t bg-background px-6 py-4">
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-3">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask me about your analytics data and I'll create charts..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            size="sm"
                            className="px-4"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <PaperPlaneTilt className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 