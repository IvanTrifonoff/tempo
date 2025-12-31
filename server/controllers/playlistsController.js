import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getPlaylists = asyncHandler(async (req, res) => {
    const { id, role, coachId } = req.user;
    const targetUserId = role === 'student' ? coachId : id;
    
    if (!targetUserId) return res.json([]);

    const { rows } = await db.query(`
        SELECT 
            p.id, 
            p.user_id as "userId", 
            p.name, 
            COALESCE(json_agg(pt.track_id) FILTER (WHERE pt.track_id IS NOT NULL), '[]') as "trackIds"
        FROM playlists p
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE p.user_id = $1
        GROUP BY p.id
        ORDER BY p.created_at DESC;
    `, [targetUserId]);

    res.json(rows);
});

export const createPlaylist = asyncHandler(async (req, res) => {
     if (req.user.role === 'student') return res.status(403).json({ error: 'Denied' });
    const { name } = req.body;
    const newId = Date.now().toString();
    await db.query(
        'INSERT INTO playlists (id, user_id, name) VALUES ($1, $2, $3)',
        [newId, req.user.id, name]
    );
    res.json({ id: newId, userId: req.user.id, name, trackIds: [] });
});

export const deletePlaylist = asyncHandler(async (req, res) => {
    const { rowCount } = await db.query(
        'DELETE FROM playlists WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({error: 'Not found'});
    res.json({success: true});
});

export const addTrackToPlaylist = asyncHandler(async (req, res) => {
    const { trackId } = req.body;
    const plCheck = await db.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (plCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    await db.query(
        'INSERT INTO playlist_tracks (playlist_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.params.id, trackId]
    );
    
    const { rows } = await db.query(`
        SELECT 
            p.id, 
            p.user_id as "userId", 
            p.name, 
            COALESCE(json_agg(pt.track_id) FILTER (WHERE pt.track_id IS NOT NULL), '[]') as "trackIds"
        FROM playlists p
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE p.id = $1
        GROUP BY p.id;
    `, [req.params.id]);
    
    res.json(rows[0]);
});

export const removeTrackFromPlaylist = asyncHandler(async (req, res) => {
    const plCheck = await db.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (plCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    await db.query(
        'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
        [req.params.id, req.params.trackId]
    );

    const { rows } = await db.query(`
        SELECT 
            p.id, 
            p.user_id as "userId", 
            p.name, 
            COALESCE(json_agg(pt.track_id) FILTER (WHERE pt.track_id IS NOT NULL), '[]') as "trackIds"
        FROM playlists p
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE p.id = $1
        GROUP BY p.id;
    `, [req.params.id]);
    
    res.json(rows[0]);
});

