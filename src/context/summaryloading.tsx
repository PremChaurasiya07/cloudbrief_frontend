import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SummaryLoadingContextType {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

const SummaryLoadingContext = createContext<SummaryLoadingContextType | undefined>(undefined);

export const SummaryLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    const setLoading = (loading: boolean) => {
        setIsLoading(loading);
    };

    return (
        <SummaryLoadingContext.Provider value={{ isLoading, setLoading }}>
            {children}
        </SummaryLoadingContext.Provider>
    );
};

const useSummaryLoading = (): SummaryLoadingContextType => {
    const context = useContext(SummaryLoadingContext);
    if (!context) {
        throw new Error('useSummaryLoading must be used within a SummaryLoadingProvider');
    }
    return context;
};

export { useSummaryLoading };