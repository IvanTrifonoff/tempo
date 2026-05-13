import db from '../db/index.js';

class TrackService {
    async getVisibleTracksForUser(user) {
        let query = 'SELECT * FROM tracks WHERE is_public = true';
        let params = [];

        if (user) {
            if (user.role === 'admin') {
                query = 'SELECT * FROM tracks ORDER BY created_at DESC';
            } else if (user.role === 'coach') {
                query = 'SELECT * FROM tracks WHERE is_public = true OR owner_id = $1 ORDER BY created_at DESC';
                params = [user.id];
            } else if (user.role === 'student') {
                const coachId = user.coachId; 
                if (coachId) {
                    query = 'SELECT * FROM tracks WHERE is_public = true OR owner_id = $1 ORDER BY created_at DESC';
                    params = [coachId];
                } else {
                    query = 'SELECT * FROM tracks WHERE is_public = true ORDER BY created_at DESC';
                }
            }
        }

        const { rows } = await db.query(query, params);
        return rows.map(row => ({
            id: row.id,
            title: row.title,
            artist: row.artist,
            style: row.style,
            bpm: row.bpm,
            url: row.url,
            ownerId: row.owner_id,
            isPublic: row.is_public,
            isPreloaded: row.is_preloaded,
            fileSize: row.file_size
        }));
    }
}

export default new TrackService();
