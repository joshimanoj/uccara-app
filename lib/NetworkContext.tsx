import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkContextType {
    isOnline: boolean;
    isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function useNetwork() {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
}

// Check every 3 seconds for better responsiveness
const CHECK_INTERVAL = 3000;

export function NetworkProvider({ children }: { children: ReactNode }) {
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        async function checkNetwork() {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                await fetch('https://www.google.com/generate_204', {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal,
                    cache: 'no-store'
                });

                clearTimeout(timeoutId);
                if (!isOnline) {
                    console.log('Network Status: ONLINE');
                    setIsOnline(true);
                }
            } catch (error) {
                if (isOnline) {
                    console.log('Network Status: OFFLINE');
                    setIsOnline(false);
                }
            }
        }

        // Initial check on mount
        checkNetwork();

        // Periodic check
        const interval = setInterval(checkNetwork, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [isOnline]);

    return (
        <NetworkContext.Provider value={{ isOnline, isOffline: !isOnline }}>
            {children}
        </NetworkContext.Provider>
    );
}
