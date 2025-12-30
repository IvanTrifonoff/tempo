import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pg from 'pg';
import { sendVerificationEmail, transporter } from './email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_PATH = path.join(__dirname, 'uploads');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// DB Pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_PATH));
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOADS_PATH) },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})
const upload = multer({ storage: storage });

// Routes

app.get('/api/tracks', async (req, res) => {
  try {
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

    const { rows } = await pool.query(query, params);
    
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracks', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ error: 'Students cannot upload' });
  try {
    const { title, artist, style, bpm } = req.body;
    let url = '';
    if (req.file) url = `/uploads/${req.file.filename}`;
    else if (req.body.url) url = req.body.url;

    const newTrackId = Date.now().toString();
    const ownerId = req.user.id;
    const isPublic = req.user.role === 'admin';

    await pool.query(
        `INSERT INTO tracks (id, title, artist, style, bpm, url, owner_id, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newTrackId, title, artist, style, Number(bpm), url, ownerId, isPublic]
    );

    res.json({
        id: newTrackId,
        title,
        artist,
        style,
        bpm: Number(bpm),
        url,
        ownerId,
        isPublic,
        isPreloaded: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracks/:id', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
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
        
        await pool.query('DELETE FROM tracks WHERE id = $1', [req.params.id]);
        res.json({success: true});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/tracks/:id', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
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
            const { rows: updatedRows } = await pool.query(
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN USER MANAGEMENT
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    try {
        const { rows } = await pool.query('SELECT * FROM users');
        res.json(rows.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            coachId: u.coach_id,
            isVerified: u.is_verified,
            isAdmin: u.role === 'admin'
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    try {
        const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        if (rows[0].email === 'admin@trfnv.ru') return res.status(403).json({ error: 'Denied' });
        
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    try {
        const updates = [];
        const values = [];
        let idx = 1;

        if (req.body.role) { updates.push(`role = $${idx++}`); values.push(req.body.role); }
        if (req.body.isVerified !== undefined) { updates.push(`is_verified = $${idx++}`); values.push(req.body.isVerified); }

        if (updates.length === 0) return res.json({});

        values.push(req.params.id);
        const { rows } = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );
        
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const u = rows[0];
        res.json({
            id: u.id,
            email: u.email,
            role: u.role,
            coachId: u.coach_id,
            isVerified: u.is_verified,
            isAdmin: u.role === 'admin'
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper to format user object for frontend
const mapUser = (user, favorites = []) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    coachId: user.coach_id,
    isVerified: user.is_verified,
    isAdmin: user.role === 'admin',
    favorites
});

// AUTH
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, inviteCode } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Required fields missing' });
        
        const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) return res.status(400).json({ error: 'User exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        let role = 'coach';
        let coachId = null;
        let isVerified = false;
        let verificationToken = crypto.randomBytes(32).toString('hex');

        if (email === 'admin@trfnv.ru') {
             role = 'admin';
             isVerified = true;
        } else if (inviteCode) {
            const coachCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'coach'", [inviteCode]);
            if (coachCheck.rows.length > 0) {
                role = 'student';
                coachId = inviteCode;
                isVerified = true;
            } else return res.status(400).json({ error: 'Invalid invite' });
        }

        const newId = Date.now().toString();
        const newUser = await pool.query(
            `INSERT INTO users (id, email, password, role, coach_id, is_verified, verification_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [newId, email, hashedPassword, role, coachId, isVerified, isVerified ? null : verificationToken]
        );
        
        const u = newUser.rows[0];

        if (!isVerified) {
            await sendVerificationEmail(email, verificationToken);
            return res.json({ message: 'Email sent' });
        }
        
        const token = jwt.sign({ id: u.id, email: u.email, role: u.role, coachId: u.coach_id }, JWT_SECRET);
        res.json({ 
            user: mapUser(u, []), 
            token 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        if (!user.is_verified) return res.status(403).json({ error: 'Verify email' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, coachId: user.coach_id }, JWT_SECRET);
        
        const favsRes = await pool.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [user.id]);
        const favorites = favsRes.rows.map(r => r.track_id);

        res.json({ 
            user: mapUser(user, favorites), 
            token 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).send('Token is required');
        
        const { rows } = await pool.query(
            `UPDATE users SET is_verified = true, verification_token = null 
             WHERE verification_token = $1 RETURNING *`,
            [token]
        );
        
        if (rows.length === 0) {
            return res.status(400).send('<h1>Invalid or expired token.</h1>');
        }
        
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: white; height: 100vh;">
                <h1 style="color: #eab308;">Email Verified!</h1>
                <p>Your account has been activated successfully.</p>
                <br>
                <a href="/" style="background: #eab308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Tempo</a>
            </div>
        `);
    } catch (err) { res.status(500).send(err.message); }
});

// CHANGELOG
app.get('/api/changelog/latest', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM changelogs ORDER BY release_date DESC LIMIT 1');
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json(null);
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// User API
app.post('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.body;
        const userId = req.user.id;
        
        const check = await pool.query('SELECT 1 FROM user_favorites WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
        
        if (check.rows.length > 0) {
            await pool.query('DELETE FROM user_favorites WHERE user_id = $1 AND track_id = $2', [userId, trackId]);
        } else {
            await pool.query('INSERT INTO user_favorites (user_id, track_id) VALUES ($1, $2)', [userId, trackId]);
        }

        const favsRes = await pool.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [userId]);
        res.json(favsRes.rows.map(r => r.track_id));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (rows.length === 0) return res.sendStatus(404);
        const user = rows[0];
        
        const favsRes = await pool.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [user.id]);
        const favorites = favsRes.rows.map(r => r.track_id);

        res.json(mapUser(user, favorites));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/playlists', authenticateToken, async (req, res) => {
    try {
        const { id, role, coachId } = req.user;
        const targetUserId = role === 'student' ? coachId : id;
        
        if (!targetUserId) return res.json([]);

        // Optimized single query to fetch playlists and their tracks
        const { rows } = await pool.query(`
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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/playlists', authenticateToken, async (req, res) => {
     if (req.user.role === 'student') return res.status(403).json({ error: 'Denied' });
     try {
        const { name } = req.body;
        const newId = Date.now().toString();
        await pool.query(
            'INSERT INTO playlists (id, user_id, name) VALUES ($1, $2, $3)',
            [newId, req.user.id, name]
        );
        res.json({ id: newId, userId: req.user.id, name, trackIds: [] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/playlists/:id', authenticateToken, async (req, res) => {
     try {
        const { rowCount } = await pool.query(
            'DELETE FROM playlists WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (rowCount === 0) return res.status(404).json({error: 'Not found'});
        res.json({success: true});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/playlists/:id/tracks', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.body;
        const plCheck = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (plCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        await pool.query(
            'INSERT INTO playlist_tracks (playlist_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.params.id, trackId]
        );
        
        const { rows } = await pool.query(`
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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/playlists/:id/tracks/:trackId', authenticateToken, async (req, res) => {
    try {
        const plCheck = await pool.query('SELECT * FROM playlists WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (plCheck.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        await pool.query(
            'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
            [req.params.id, req.params.trackId]
        );

        const { rows } = await pool.query(`
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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Export for testing
export { app, pool };

// Only listen if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server is running on port ${PORT}`);
      transporter.verify((error) => {
        if (error) console.error("SMTP Error:", error);
        else console.log("SMTP Ready");
      });
    });
}
