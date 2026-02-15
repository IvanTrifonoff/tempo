import db from '../db/index.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UPLOADS_PATH } from '../middleware/upload.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import limitService from '../services/limitService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const getTracks = asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user = null;
    
    if (token) {
        try { user = jwt.verify(token, JWT_SECRET); } catch(e) {}
    }

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
    
    const tracks = rows.map(row => ({
        id: row.id,
        title: row.title,
        artist: row.artist,
        style: row.style,
        bpm: row.bpm,
        url: row.url,
        ownerId: row.owner_id,
        isPublic: row.is_public,
        isPreloaded: row.is_preloaded
    }));
    
    res.json(tracks);
});

export const createTrack = asyncHandler(async (req, res) => {
    console.log(`[${new Date().toISOString()}] DEBUG: Track upload request from user ${req.user.id}`);
    
    if (req.user.role === 'student') {
        console.warn(`[${new Date().toISOString()}] DEBUG: Student ${req.user.id} tried to upload`);
        return res.status(403).json({ error: 'Students cannot upload' });
    }
    
    const { title, artist, style, bpm } = req.body;
    console.log(`[${new Date().toISOString()}] DEBUG: Request body:`, req.body);
    console.log(`[${new Date().toISOString()}] DEBUG: Request file:`, req.file ? req.file.filename : 'none');

    // 1. Проверка лимитов через сервис
    try {
        const { canUpload, current, limit } = await limitService.checkUploadLimit(req.user.id);
        if (!canUpload) {
            console.warn(`[${new Date().toISOString()}] DEBUG: Limit reached: ${current}/${limit}`);
            return res.status(402).json({ 
                error: 'Track limit reached', 
                limit,
                current,
                message: 'Please upgrade your plan to upload more tracks.' 
            });
        }
    } catch (limitErr) {
        console.error(`[${new Date().toISOString()}] DEBUG: Limit service error:`, limitErr.message);
        return res.status(500).json({ error: 'Internal limit check error' });
    }

    // Basic validation
    if (!title || !style || !bpm) {
      console.warn(`[${new Date().toISOString()}] DEBUG: Validation failed: title=${title}, style=${style}, bpm=${bpm}`);
      return res.status(400).json({ error: 'Missing required fields (title, style, bpm)' });
    }

    let url = '';
    if (req.file) {
      url = `/uploads/${req.file.filename}`;
    } else if (req.body.url) {
      url = req.body.url;
    }

    if (!url) {
      console.warn(`[${new Date().toISOString()}] DEBUG: No audio file or URL`);
      return res.status(400).json({ error: 'Audio file or URL is required' });
    }

    const newTrackId = crypto.randomUUID();
    const ownerId = req.user.id;
    const isPublic = req.user.role === 'admin';

    try {
        await db.query(
            `INSERT INTO tracks (id, title, artist, style, bpm, url, owner_id, is_public)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [newTrackId, title, artist || 'Unknown Artist', style, Number(bpm), url, ownerId, isPublic]
        );
        console.log(`[${new Date().toISOString()}] DEBUG: Successfully saved track ${newTrackId} to DB`);
    } catch (dbErr) {
        console.error(`[${new Date().toISOString()}] DEBUG: Database error:`, dbErr.message);
        return res.status(500).json({ error: 'Failed to save track to database' });
    }

    res.json({
        id: newTrackId,
        title,
        artist: artist || 'Unknown Artist',
        style,
        bpm: Number(bpm),
        url,
        ownerId,
        isPublic,
        isPreloaded: false
    });
});

export const deleteTrack = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({error: 'Track not found'});
    const track = rows[0];

    if (req.user.role !== 'admin' && track.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Denied' });
    }

    if (track.url && track.url.startsWith('/uploads/')) {
         try {
             const fileName = path.basename(track.url);
             fs.unlinkSync(path.join(UPLOADS_PATH, fileName));
        } catch (e) {}
    }
    
    await db.query('DELETE FROM tracks WHERE id = $1', [req.params.id]);
    res.json({success: true});
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

    if (req.body.title) { updates.push(`title = $${idx++}`); values.push(req.body.title); }
    if (req.body.artist) { updates.push(`artist = $${idx++}`); values.push(req.body.artist); }
    if (req.body.bpm) { updates.push(`bpm = $${idx++}`); values.push(Number(req.body.bpm)); }
    if (req.body.style) { updates.push(`style = $${idx++}`); values.push(req.body.style); }
    
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
        res.json({
            id: track.id,
            title: track.title,
            artist: track.artist,
            style: track.style,
            bpm: track.bpm,
            url: track.url,
            ownerId: track.owner_id,
            isPublic: track.is_public
        });
    }
});

export const toggleFavorite = asyncHandler(async (req, res) => {
    const { trackId } = req.body;
    const userId = req.user.id;
    
    const check = await db.query('SELECT 1 FROM user_favorites WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
    
    if (check.rows.length > 0) {
        await db.query('DELETE FROM user_favorites WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
    } else {
        await db.query('INSERT INTO user_favorites (user_id, track_id) VALUES ($1, $2)', [userId, trackId]);
    }

    const favsRes = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [userId]);
    res.json(favsRes.rows.map(r => r.track_id));
});
