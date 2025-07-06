import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

import type { Message, StreamingUpdate, ToolCall } from '../types';
import { generateWelcomeMessage } from '../utils';

// ============================================================================
// HOOK
// ============================================================================



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
            // Clear timeout
            if (rateLimitTimeoutRef.current) {
                clearTimeout(rateLimitTimeoutRef.current);
                rateLimitTimeoutRef.current = null;
            }

            // Abort ongoing requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            // Reset loading state
            setIsLoading(false);
        };
    }, []);

    // Stop current streaming
    const stopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setError(null);
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
                                    const rawData = line.slice(6);
                                    if (!rawData || rawData.trim() === '') continue;

                                    const update: StreamingUpdate = JSON.parse(rawData);

                                    // Validate update structure
                                    if (!update || typeof update !== 'object' || !update.type || !update.content) {
                                        console.warn("Invalid SSE update structure:", update);
                                        continue;
                                    }

                                    // Use a single state update to avoid race conditions
                                    setMessages((prev) => {
                                        return prev.map((msg) => {
                                            if (msg.id !== assistantId) return msg;

                                            switch (update.type) {
                                                case "thinking":
                                                    currentThinkingSteps.push(update.content);
                                                    return {
                                                        ...msg,
                                                        toolCalls: [{
                                                            id: 'thinking',
                                                            name: 'thinking',
                                                            status: 'running' as const,
                                                            description: update.content,
                                                        }],
                                                    };
                                                case "progress":
                                                    return {
                                                        ...msg,
                                                        content: update.content,
                                                        chartData: update.data?.chartData,
                                                        insights: update.data?.insights,
                                                        isStreaming: true,
                                                    };
                                                case "complete":
                                                    // Set loading to false after state update
                                                    setTimeout(() => setIsLoading(false), 0);
                                                    return {
                                                        ...msg,
                                                        content: update.content,
                                                        chartData: update.data?.chartData,
                                                        insights: update.data?.insights,
                                                        toolCalls: [],
                                                        isStreaming: false,
                                                    };
                                                case "error":
                                                    // Set loading to false after state update
                                                    setTimeout(() => {
                                                        setIsLoading(false);
                                                        setError(update.content);
                                                    }, 0);
                                                    return {
                                                        ...msg,
                                                        content: update.content,
                                                        toolCalls: [],
                                                        isStreaming: false,
                                                    };
                                                default:
                                                    console.warn("Unknown update type:", update.type);
                                                    return msg;
                                            }
                                        });
                                    });

                                    // Handle completion/error actions
                                    if (update.type === "complete" || update.type === "error") {
                                        scrollToBottom();
                                        break;
                                    } else if (update.type === "progress") {
                                        scrollToBottom();
                                    }
                                } catch (parseError) {
                                    console.warn("Failed to parse SSE data:", {
                                        line: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
                                        error: parseError instanceof Error ? parseError.message : 'Unknown error'
                                    });
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }
            } catch (error: unknown) {
                // Handle aborted requests gracefully
                if (error instanceof Error && error.name === 'AbortError') {
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
                if (abortControllerRef.current) {
                    abortControllerRef.current = null;
                }
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