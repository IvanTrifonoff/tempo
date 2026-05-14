import { useEffect, useRef } from 'react';

export const useHeartbeat = () => {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const sendHeartbeat = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            await fetch('/api/auth/heartbeat', {
                method: 'POST',
                headers
            });
        } catch (error) {
            // Silently fail heartbeats to not disturb UI
        }
    };

    useEffect(() => {
        // Initial heartbeat
        sendHeartbeat();

        // Every 4 minutes (Postgres INTERVAL is 5 minutes)
        timerRef.current = setInterval(sendHeartbeat, 4 * 60 * 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);
};
