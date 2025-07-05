import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

// StreamingUpdate interface to match API
interface StreamingUpdate {
    type: "thinking" | "progress" | "complete" | "error";
    content: string;
    data?: {
        hasVisualization?: boolean;
        chartType?: string;
        data?: any[];
        responseType?: "chart" | "text" | "metric";
        metricValue?: string | number;
        metricLabel?: string;
        chartData?: any;
    };
    debugInfo?: Record<string, any>;
}

// Tool call type for tracking AI actions
interface ToolCall {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    description: string;
    result?: any;
}

// Chart data interface
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

// Message interface
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    chartData?: ChartData;
    toolCalls?: ToolCall[];
    isStreaming?: boolean;
    timestamp: number;
}

// ============================================================================
// HOOK
// ============================================================================

function generateWelcomeMessage(): string {
    const examples = [
        "Show me error trends over the last 7 days",
        "What are the most common error types?",
        "How many errors occurred yesterday?",
        "Show me browser breakdown for errors",
        "What's the error rate by page?",
        "Analyze performance metrics",
    ];

    return `Hello! I'm your Better Analytics AI assistant. I can help you analyze your data, understand error patterns, and provide insights about your application's performance. I can also create beautiful charts and visualizations from your data.

Try asking me questions like:

${examples.map((prompt: string) => `• "${prompt}"`).join("\n")}

I'll automatically choose the best way to present your data - whether it's a chart, a single number, or a detailed explanation.`;
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize chat with welcome message
    useEffect(() => {
        const welcomeMessage: Message = {
            id: "1",
            role: "assistant",
            content: generateWelcomeMessage(),
            timestamp: Date.now(),
        };

        setMessages([welcomeMessage]);
        setIsInitialized(true);
    }, []);

    // Auto-scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
        }, 50);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rateLimitTimeoutRef.current) {
                clearTimeout(rateLimitTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Stop current streaming
    const stopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
    }, []);

    // Send message function
    const sendMessage = useCallback(
        async (content?: string) => {
            const messageContent = content || inputValue.trim();
            if (!messageContent || isLoading || isRateLimited || !isInitialized) return;

            const userMessage: Message = {
                id: Date.now().toString(),
                role: "user",
                content: messageContent,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInputValue("");
            setIsLoading(true);
            setError(null);

            const assistantId = (Date.now() + 1).toString();
            const assistantMessage: Message = {
                id: assistantId,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
                toolCalls: [],
                isStreaming: true,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Create abort controller for this request
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            try {
                // Stream the AI response
                const response = await fetch('/api/chat/stream', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: [...messages, userMessage].map(m => ({
                            role: m.role,
                            content: m.content,
                        })),
                    }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    // Handle rate limit specifically
                    if (response.status === 429) {
                        const errorData = await response.json();
                        if (errorData.code === "RATE_LIMIT_EXCEEDED") {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantId
                                        ? {
                                            ...msg,
                                            content: "⏱️ You've reached the rate limit. Please wait 60 seconds before sending another message.",
                                            isStreaming: false,
                                        }
                                        : msg
                                )
                            );
                            setIsLoading(false);
                            setIsRateLimited(true);

                            // Clear any existing timeout
                            if (rateLimitTimeoutRef.current) {
                                clearTimeout(rateLimitTimeoutRef.current);
                            }

                            // Set a 60-second timeout to re-enable messaging
                            rateLimitTimeoutRef.current = setTimeout(() => {
                                setIsRateLimited(false);
                            }, 60_000);

                            return;
                        }
                    }
                    throw new Error("Failed to start stream");
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("No response stream available");
                }

                const decoder = new TextDecoder();
                let buffer = '';
                let currentThinkingSteps: string[] = [];

                try {
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
                                    const update: StreamingUpdate = JSON.parse(line.slice(6));

                                    if (update.type === "thinking") {
                                        currentThinkingSteps.push(update.content);
                                        setMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === assistantId
                                                    ? {
                                                        ...msg,
                                                        toolCalls: [{
                                                            id: 'thinking',
                                                            name: 'thinking',
                                                            status: 'running' as const,
                                                            description: update.content,
                                                        }],
                                                    }
                                                    : msg
                                            )
                                        );
                                    } else if (update.type === "progress") {
                                        setMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === assistantId
                                                    ? {
                                                        ...msg,
                                                        content: update.content,
                                                        chartData: update.data?.chartData,
                                                        isStreaming: true,
                                                    }
                                                    : msg
                                            )
                                        );
                                        scrollToBottom();
                                    } else if (update.type === "complete") {
                                        setMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === assistantId
                                                    ? {
                                                        ...msg,
                                                        content: update.content,
                                                        chartData: update.data?.chartData,
                                                        toolCalls: [],
                                                        isStreaming: false,
                                                    }
                                                    : msg
                                            )
                                        );
                                        scrollToBottom();
                                        setIsLoading(false);
                                        break;
                                    } else if (update.type === "error") {
                                        setMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === assistantId
                                                    ? {
                                                        ...msg,
                                                        content: update.content,
                                                        toolCalls: [],
                                                        isStreaming: false,
                                                    }
                                                    : msg
                                            )
                                        );
                                        setIsLoading(false);
                                        break;
                                    }
                                } catch (parseError) {
                                    console.warn("Failed to parse SSE data:", line);
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            } catch (error: any) {
                // Handle aborted requests gracefully
                if (error.name === 'AbortError') {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantId
                                ? {
                                    ...msg,
                                    content: "Request was stopped.",
                                    toolCalls: [],
                                    isStreaming: false,
                                }
                                : msg
                        )
                    );
                } else {
                    console.error("Failed to get AI response:", error);
                    setError(error instanceof Error ? error.message : 'An error occurred');
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantId
                                ? {
                                    ...msg,
                                    content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
                                    toolCalls: [],
                                    isStreaming: false,
                                }
                                : msg
                        )
                    );
                }
            } finally {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [inputValue, isLoading, isRateLimited, isInitialized, messages, scrollToBottom]
    );

    // Handle keyboard shortcuts
    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        },
        [sendMessage]
    );

    // Reset chat to initial state
    const resetChat = useCallback(() => {
        const welcomeMessage: Message = {
            id: "1",
            role: "assistant",
            content: generateWelcomeMessage(),
            timestamp: Date.now(),
        };

        setMessages([welcomeMessage]);
        setInputValue("");
        setIsRateLimited(false);
        setError(null);

        // Clear any existing timeout
        if (rateLimitTimeoutRef.current) {
            clearTimeout(rateLimitTimeoutRef.current);
        }

        // Stop any ongoing streaming
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setIsLoading(false);
    }, []);

    // Retry last message
    const retryLastMessage = useCallback(() => {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            // Remove failed assistant messages
            setMessages(prev => prev.filter(m => m.timestamp <= lastUserMessage.timestamp));
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage]);

    return {
        // State
        messages,
        inputValue,
        isLoading,
        isRateLimited,
        isInitialized,
        error,
        scrollAreaRef,

        // Actions
        setInputValue,
        sendMessage,
        handleKeyPress,
        resetChat,
        retryLastMessage,
        stopStreaming,
    };
} 