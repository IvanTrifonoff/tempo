import db from '../db/index.js';

class LimitService {
    /**
     * Проверяет, может ли пользователь загрузить еще треков.
     * @param {string} userId 
     * @returns {Promise<{canUpload: boolean, current: number, limit: number}>}
     */
    async checkUploadLimit(userId) {
        const userRes = await db.query('SELECT track_limit, role FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        if (!user) {
            throw new Error('User not found');
        }

        // Админы не имеют лимитов
        if (user.role === 'admin') {
            return { canUpload: true, current: 0, limit: Infinity };
        }

        const trackLimit = user.track_limit || 10;
        const countRes = await db.query('SELECT count(*) FROM tracks WHERE owner_id = $1', [userId]);
        const currentTracks = parseInt(countRes.rows[0].count);

        return {
            canUpload: currentTracks < trackLimit,
            current: currentTracks,
            limit: trackLimit
        };
    }
}

export default new LimitService();
