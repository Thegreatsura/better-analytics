'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@better-analytics/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@better-analytics/ui/components/card';
import { Input } from '@better-analytics/ui/components/input';
import { Separator } from '@better-analytics/ui/components/separator';
import { PaperPlaneTilt, Robot, User, Copy, ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateAIResponse } from './actions';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I\'m your Better Analytics AI assistant. I can help you analyze your data, understand error patterns, and provide insights about your application\'s performance. What would you like to know?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Get conversation history for context
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // Call the server action
            const result = await generateAIResponse({
                message: content.trim(),
                conversationHistory,
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Show error toast if the AI request failed but still got a response
            if (!result.success && result.error) {
                toast.error(`AI Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to get AI response:', error);
            toast.error('Failed to get AI response. Please try again.');

            // Add error message to chat
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Message copied to clipboard');
    };

    const handleVote = (messageId: string, vote: 'up' | 'down') => {
        toast.success(`Feedback recorded: ${vote === 'up' ? 'Helpful' : 'Not helpful'}`);
        // TODO: In a real app, you would send this feedback to your analytics or feedback system
    };

    const quickPrompts = [
        {
            label: 'Recent Errors',
            prompt: 'Show me recent error patterns and help me understand what might be causing them',
        },
        {
            label: 'Performance',
            prompt: 'How is my application performing? Are there any bottlenecks I should be aware of?',
        },
        {
            label: 'User Trends',
            prompt: 'What are the current user trends and engagement patterns in my analytics?',
        },
        {
            label: 'Optimization',
            prompt: 'What optimization recommendations do you have based on my analytics data?',
        },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
                <p className="text-muted-foreground mt-1">
                    Chat with AI about your analytics data and get insights about your application's performance.
                </p>
            </div>

            <Card className="h-[calc(100vh-var(--header-height)-12rem)]">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Robot className="h-5 w-5" />
                        Better Analytics AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-full p-0">
                    <div className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto px-6" ref={scrollAreaRef}>
                            <div className="space-y-4 pb-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Robot className="h-4 w-4 text-primary" />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                                                ? 'bg-primary text-primary-foreground ml-auto'
                                                : 'bg-muted'
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {message.content}
                                            </div>

                                            {message.role === 'assistant' && (
                                                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyMessage(message.content)}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleVote(message.id, 'up')}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <ThumbsUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleVote(message.id, 'down')}
                                                        className="h-7 px-2 text-xs"
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

                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Robot className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="bg-muted rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                </div>
                                                <span className="text-sm text-muted-foreground">AI is thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="p-6 pt-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage(input);
                            }}
                            className="space-y-4"
                        >
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me about your analytics data..."
                                    disabled={isLoading}
                                    className="flex-1"
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    size="sm"
                                >
                                    <PaperPlaneTilt className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {quickPrompts.map((prompt) => (
                                    <Button
                                        key={prompt.label}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => sendMessage(prompt.prompt)}
                                        disabled={isLoading}
                                        className="text-xs"
                                    >
                                        {prompt.label}
                                    </Button>
                                ))}
                            </div>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 