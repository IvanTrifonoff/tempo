import db from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { UPLOADS_PATH } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { TrackVisibility } from '../services/trackService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const getTracks = asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user = null;
    if (token) {
        try { user = jwt.verify(token, JWT_SECRET); } catch(e) {}
    }

    const { filter, params } = TrackVisibility.getFilter(user);
    const { rows } = await db.query(`SELECT * FROM tracks WHERE ${filter} ORDER BY created_at DESC`, params);
    
    res.json(rows.map(row => ({
        id: row.id,
        title: row.title,
        artist: row.artist,
        style: row.style,
        bpm: row.bpm,
        url: row.url,
        ownerId: row.owner_id,
        isPublic: row.is_public,
        isPreloaded: row.is_preloaded
    })));
});

export const createTrack = asyncHandler(async (req, res) => {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Denied' });
    const { title, artist, style, bpm, isPublic } = req.body;
    const url = req.file ? `/uploads/${req.file.filename}` : (req.body.url || '');
    const newId = Date.now().toString();
    const finalIsPublic = req.user.role === 'admin' ? (isPublic === 'true' || isPublic === true) : false;

    await db.query(
        `INSERT INTO tracks (id, title, artist, style, bpm, url, owner_id, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newId, title, artist, style, Number(bpm), url, req.user.id, finalIsPublic]
    );
    res.json({ id: newId, title, artist, style, bpm: Number(bpm), url, isPublic: finalIsPublic });
});

export const updateTrack = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({error: 'Not found'});
    const track = rows[0];
    if (req.user.role !== 'admin' && track.owner_id !== req.user.id) return res.status(403).json({ error: 'Denied' });

    const updates = [];
    const values = [];
    let idx = 1;
    const allowed = ['title', 'artist', 'bpm', 'style'];
    if (req.user.role === 'admin') allowed.push('isPublic');

    for (let key of allowed) {
        if (req.body[key] !== undefined) {
            const dbKey = key === 'isPublic' ? 'is_public' : key;
            updates.push(`${dbKey} = $${idx++}`);
            values.push(req.body[key]);
        }
    }
    if (updates.length > 0) {
        values.push(req.params.id);
        const { rows: updatedRows } = await db.query(`UPDATE tracks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
        const u = updatedRows[0];
        res.json({ id: u.id, title: u.title, artist: u.artist, bpm: u.bpm, style: u.style, isPublic: u.is_public });
    } else res.json(track);
});

export const deleteTrack = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({error: 'Not found'});
    if (req.user.role !== 'admin' && rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Denied' });
    if (rows[0].url.startsWith('/uploads/')) {
        try { fs.unlinkSync(path.join(UPLOADS_PATH, path.basename(rows[0].url))); } catch(e) {}
    }
    await db.query('DELETE FROM tracks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

export const toggleFavorite = asyncHandler(async (req, res) => {
    const { trackId } = req.body;
    const check = await db.query('SELECT 1 FROM user_favorites WHERE user_id = $1 AND track_id = $2', [req.user.id, trackId]);
    if (check.rows.length > 0) await db.query('DELETE FROM user_favorites WHERE user_id = $1 AND track_id = $2', [req.user.id, trackId]);
    else await db.query('INSERT INTO user_favorites (user_id, track_id) VALUES ($1, $2)', [req.user.id, trackId]);
    const favs = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [req.user.id]);
    res.json(favs.rows.map(r => r.track_id));
});
