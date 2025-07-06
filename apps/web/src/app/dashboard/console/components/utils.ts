export interface LogLine {
    timestamp: Date | null;
    message: string;
    rawTimestamp: string | null;
    source?: string;
    level?: string;
    context?: string;
    environment?: string;
    user_id?: string;
    session_id?: string;
    tags?: string[];
}

export interface LogType {
    type: 'info' | 'warning' | 'error' | 'debug';
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color: string;
}

export function getLogType(message: string): LogType {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('error') || lowerMessage.includes('[error]') || lowerMessage.includes('failed') || lowerMessage.includes('exception')) {
        return {
            type: 'error',
            variant: 'destructive',
            color: 'bg-red-500'
        };
    }

    if (lowerMessage.includes('warn') || lowerMessage.includes('[warn]') || lowerMessage.includes('warning') || lowerMessage.includes('[warning]')) {
        return {
            type: 'warning',
            variant: 'secondary',
            color: 'bg-yellow-500'
        };
    }

    if (lowerMessage.includes('debug') || lowerMessage.includes('[debug]')) {
        return {
            type: 'debug',
            variant: 'outline',
            color: 'bg-orange-500'
        };
    }

    return {
        type: 'info',
        variant: 'default',
        color: 'bg-blue-500'
    };
}

export function parseLogs(rawLogs: string): LogLine[] {
    if (!rawLogs.trim()) return [];

    const lines = rawLogs.trim().split('\n');
    return lines.map(line => {
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?)/);

        let timestamp: Date | null = null;
        let message = line;
        let rawTimestamp: string | null = null;

        if (timestampMatch) {
            rawTimestamp = timestampMatch[1];
            timestamp = new Date(rawTimestamp);
            message = line.substring(timestampMatch[0].length).trim();
        }

        return {
            timestamp,
            message,
            rawTimestamp
        };
    });
} 