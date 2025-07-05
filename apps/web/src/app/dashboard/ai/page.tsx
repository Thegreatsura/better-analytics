'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@better-analytics/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Input } from '@better-analytics/ui/components/input';
import { Separator } from '@better-analytics/ui/components/separator';
import { PaperPlaneTilt, Robot, User, Copy, ThumbsUp, ThumbsDown, StopCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useRef, useEffect } from 'react';

export default function AIPage() {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        reload,
        stop,
    } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: '1',
                role: 'assistant',
                content: 'Hello! I\'m your Better Analytics AI assistant. I can help you analyze your data, understand error patterns, and provide insights about your application\'s performance. What would you like to know?',
            },
        ],
        onError: (error) => {
            console.error('Chat error:', error);
            toast.error('Failed to get AI response. Please try again.');
        },
        streamProtocol: 'text',
    });

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Message copied to clipboard');
    };

    const handleVote = (messageId: string, vote: 'up' | 'down') => {
        toast.success(`Feedback recorded: ${vote === 'up' ? 'Helpful' : 'Not helpful'}`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-var(--header-height)-3rem)] max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Chat with AI about your analytics data and get insights about your application's performance.
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
                            <span>AI is thinking...</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={stop}
                            className="flex items-center gap-2"
                        >
                            <StopCircle className="h-4 w-4" />
                            Stop
                        </Button>
                    </div>
                )}
            </div>

            {/* Messages Area - This is the only scrollable area */}
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

                                <div className="flex flex-col max-w-[80%]">
                                    <div
                                        className={`rounded-lg px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        <div className="text-sm leading-relaxed break-words">
                                            {message.content}
                                        </div>
                                    </div>

                                    {message.role === 'assistant' && (
                                        <div className="flex items-center gap-1 mt-2 pl-2">
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
                                            Something went wrong. Please try again.
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => reload()}
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

            {/* Input Area - Fixed at bottom, never scrolls */}
            <div className="border-t bg-background px-6 py-4">
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-3">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask me about your analytics data..."
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