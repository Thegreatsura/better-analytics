import { ErrorTypeItem } from '@/components/chart/types';

export type DashboardProps = {
    errorTypeData: ErrorTypeItem[];
    severityData: ErrorTypeItem[];
    trendData: TrendItem[];
    recentErrors: RecentErrorItem[];
    recentLogs: RecentLogItem[];
    metrics: Metrics;
};

export type TrendItem = {
    date: string;
    value: number;
    client: number;
    server: number;
};

export type RecentErrorItem = {
    id: string;
    message: string;
    type: string;
    timestamp: string;
    status: number;
    path: string;
    color: string;
};

export type RecentLogItem = {
    id: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    timestamp: string;
    source: string;
};

export type Metrics = {
    totalErrors: number;
    errorRate: number;
    avgResolutionTime: number;
    systemHealth: number;
};