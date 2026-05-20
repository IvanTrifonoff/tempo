const CACHE_NAME = 'tempo-tracks-v1';

export const offlineStorage = {
    async downloadTrack(trackId: string, url: string): Promise<void> {
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch track for offline');
        await cache.put(url, response);
    },

    async isTrackDownloaded(url: string): Promise<boolean> {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(url);
        return !!response;
    },

    async getTrackUrl(url: string): Promise<string> {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(url);
        if (response) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
        return url;
    },

    async deleteTrack(url: string): Promise<void> {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(url);
    },

    async clearAll(): Promise<void> {
        await caches.delete(CACHE_NAME);
    }
};
