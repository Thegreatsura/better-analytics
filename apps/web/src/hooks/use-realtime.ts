'use client';

import { useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authClient } from '@better-analytics/auth/client';

export interface ErrorEvent {
    id: string;
    message: string;
    severity?: string;
    error_type?: string;
    source?: string;
    client_id: string;
    created_at: string;
    url?: string;
    browser_name?: string;
    os_name?: string;
    device_type?: string;
    country?: string;
    city?: string;
}

export interface LogEvent {
    id: string;
    message: string;
    level?: string;
    source?: string;
    client_id: string;
    created_at: string;
    context?: string;
    environment?: string;
    session_id?: string;
    user_id?: string;
}

export interface UseRealtimeOptions {
    onError?: (error: ErrorEvent) => void;
    onLog?: (log: LogEvent) => void;
    enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
    const { onError, onLog, enabled = true } = options;
    const { data: session } = authClient.useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [lastError, setLastError] = useState<ErrorEvent | null>(null);
    const [lastLog, setLastLog] = useState<LogEvent | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!enabled || !session?.user?.id) {
            return;
        }

        const userId = session.user.id;
        const channel = supabase.channel(`user:${userId}`);

        // Subscribe to error events
        channel.on('broadcast', { event: 'error_ingested' }, (payload) => {
            const errorEvent = payload.payload as ErrorEvent;
            setLastError(errorEvent);
            onError?.(errorEvent);
        });

        // Subscribe to log events
        channel.on('broadcast', { event: 'log_ingested' }, (payload) => {
            const logEvent = payload.payload as LogEvent;
            setLastLog(logEvent);
            onLog?.(logEvent);
        });

        // Handle connection status
        channel.on('system', {}, (payload) => {
            if (payload.event === 'JOIN_SUCCESS') {
                setIsConnected(true);
            } else if (payload.event === 'LEAVE') {
                setIsConnected(false);
            }
        });

        // Subscribe to the channel
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsConnected(true);
            } else if (status === 'CLOSED') {
                setIsConnected(false);
            }
        });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            setIsConnected(false);
            channelRef.current = null;
        };
    }, [session?.user?.id, enabled, onError, onLog]);

    return {
        isConnected,
        lastError,
        lastLog,
        userId: session?.user?.id,
    };
} 