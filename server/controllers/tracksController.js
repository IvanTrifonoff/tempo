import db from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { UPLOADS_PATH } from '../middleware/upload.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import { TrackVisibility } from '../services/trackService.js';

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
    if (req.user.role === 'student') return res.status(403).json({ error: 'Students cannot upload' });
    
    const { title, artist, style, bpm, isPublic } = req.body;
    const url = req.file ? `/uploads/${req.file.filename}` : (req.body.url || '');

    const newTrackId = Date.now().toString();
    const ownerId = req.user.id;
    
    // Только админ может делать трек публичным при создании (опционально)
    const finalIsPublic = req.user.role === 'admin' ? (isPublic === 'true' || isPublic === true) : false;

    await db.query(
        `INSERT INTO tracks (id, title, artist, style, bpm, url, owner_id, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newTrackId, title, artist, style, Number(bpm), url, ownerId, finalIsPublic]
    );

    res.json({
        id: newTrackId,
        title, artist, style, url, ownerId, 
        isPublic: finalIsPublic,
        bpm: Number(bpm),
        isPreloaded: false
    });
});

export const updateTrack = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({error: 'Not found'});
    const track = rows[0];
    
    if (req.user.role !== 'admin' && track.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Denied' });
    }

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
        const { rows: updatedRows } = await db.query(
            `UPDATE tracks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        const updated = updatedRows[0];
        res.json({
            id: updated.id,
            title: updated.title,
            artist: updated.artist,
            style: updated.style,
            bpm: updated.bpm,
            url: updated.url,
            ownerId: updated.owner_id,
            isPublic: updated.is_public
        });
    } else {
        res.json(track);
    }
});

export const deleteTrack = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({error: 'Track not found'});
    const track = rows[0];

    if (req.user.role !== 'admin' && track.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Denied' });
    }

    if (track.url && track.url.startsWith('/uploads/')) {
         try { fs.unlinkSync(path.join(UPLOADS_PATH, path.basename(track.url))); } catch (e) {}
    }
    
    await db.query('DELETE FROM tracks WHERE id = $1', [req.params.id]);
    res.json({success: true});
});

export const toggleFavorite = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { trackId } = req.body;
    const check = await db.query('SELECT 1 FROM user_favorites WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
    if (check.rows.length > 0) {
        await db.query('DELETE FROM user_favorites WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
    } else {
        await db.query('INSERT INTO user_favorites (user_id, track_id) VALUES ($1, $2)', [userId, trackId]);
    }
    const favsRes = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [userId]);
    res.json(favsRes.rows.map(r => r.track_id));
});
