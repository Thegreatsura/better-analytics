'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@better-analytics/ui';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                // Disable the problematic paragraph wrapping for block elements
                unwrapDisallowed={true}
                components={{
                    // Custom pre styling to handle code blocks properly
                    pre: ({ children, ...props }) => {
                        // Extract language from the code element if present
                        const codeElement = Array.isArray(children) ? children[0] : children;
                        const className = codeElement?.props?.className || '';
                        const match = /language-(\w+)/.exec(className);
                        const language = match ? match[1] : '';

                        return (
                            <div className="relative my-4">
                                {language && (
                                    <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded z-10">
                                        {language}
                                    </div>
                                )}
                                <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto" {...props}>
                                    {children}
                                </pre>
                            </div>
                        );
                    },
                    // Custom code styling
                    code: ({ inline, className, children, ...props }: any) => {
                        if (inline) {
                            return (
                                <code
                                    className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-foreground"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        // For block code, just return the code element - pre wrapper handles styling
                        return (
                            <code className={cn("font-mono text-sm", className)} {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Custom table styling
                    table: ({ children, ...props }) => (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-border rounded-lg" {...props}>
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children, ...props }) => (
                        <th className="bg-muted border border-border px-3 py-2 text-left font-semibold" {...props}>
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td className="border border-border px-3 py-2" {...props}>
                            {children}
                        </td>
                    ),
                    // Custom blockquote styling
                    blockquote: ({ children, ...props }) => (
                        <blockquote
                            className="border-l-4 border-l-primary bg-muted/50 py-2 px-4 rounded-r-lg my-4"
                            {...props}
                        >
                            {children}
                        </blockquote>
                    ),
                    // Custom list styling
                    ul: ({ children, ...props }) => (
                        <ul className="list-disc list-inside space-y-1 text-foreground" {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol className="list-decimal list-inside space-y-1 text-foreground" {...props}>
                            {children}
                        </ol>
                    ),
                    // Custom link styling
                    a: ({ children, href, ...props }) => (
                        <a
                            href={href}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
} 