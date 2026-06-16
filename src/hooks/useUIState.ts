import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Track } from '../types';
import { APP_VERSION } from '../constants';
import { useAuth } from '../context/AuthContext';

export const useUIState = () => {
    const { t } = useTranslation();
    const { token } = useAuth();

    // --- UI Модалки ---
    const [showAdmin, setShowAdmin] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
    const [showTrainingPanel, setShowTrainingPanel] = useState(false);
    const [showReview, setShowReview] = useState(false);

    const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
    const [existingReview, setExistingReview] = useState<{ rating: number, comment: string } | null>(null);

    const [trackToEdit, setTrackToEdit] = useState<Track | null>(null);
    const [playlistModalTrackId, setPlaylistModalTrackId] = useState<string | null>(null);

    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'default'
    );

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- WakeLock ---
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                }
            } catch (err) { console.error(err); }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') requestWakeLock();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        requestWakeLock();

        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
            if (wakeLock) wakeLock.release();
        };
    }, []);

    // --- Review status ---
    useEffect(() => {
        if (token) {
            fetch(`/api/reviews/status?version=${APP_VERSION}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    setHasReviewed(data.hasReviewed);
                    setExistingReview(data.existingReview);
                })
                .catch(() => {
                    setHasReviewed(null);
                    setExistingReview(null);
                });
        } else {
            setHasReviewed(null);
            setExistingReview(null);
        }
    }, [token]);

    const handleRequestNotification = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!token) return;
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment, version: APP_VERSION })
        });
        if (res.ok) {
            setHasReviewed(true);
            setExistingReview({ rating, comment });
        } else {
            throw new Error('Failed to submit review');
        }
    };

    return {
        // UI модалки
        showAdmin, setShowAdmin,
        showAuth, setShowAuth,
        showSettings, setShowSettings,
        showUserManagement, setShowUserManagement,
        showPlaylistCreator, setShowPlaylistCreator,
        showTrainingPanel, setShowTrainingPanel,
        showReview, setShowReview,
        // Редактирование трека
        trackToEdit, setTrackToEdit,
        playlistModalTrackId, setPlaylistModalTrackId,
        // Уведомления
        notificationPermission, setNotificationPermission,
        handleRequestNotification,
        // Отзывы
        hasReviewed, existingReview,
        handleReviewSubmit,
        // Сеть
        isOnline,
    };
};
