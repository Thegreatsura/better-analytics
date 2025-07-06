'use client';

import { createContext, useState, ReactNode, use } from 'react';

export type TimeFilter = 'realtime' | 'hourly' | 'weekly' | 'monthly';

interface TimeFilterContextType {
    timeFilter: TimeFilter;
    setTimeFilter: (filter: TimeFilter) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const TimeFilterContext = createContext<TimeFilterContextType | undefined>(undefined);

export const TimeFilterProvider = ({ children }: { children: ReactNode }) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('realtime');
    const [isLoading, setIsLoading] = useState(false);

    return (
        <TimeFilterContext.Provider value={{
            timeFilter,
            setTimeFilter,
            isLoading,
            setIsLoading
        }}>
            {children}
        </TimeFilterContext.Provider>
    );
};

export const useTimeFilter = () => {
    const context = use(TimeFilterContext);
    if (context === undefined) {
        throw new Error('useTimeFilter must be used within a TimeFilterProvider');
    }
    return context;
};