import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/index.js';
import { sendVerificationEmail } from '../email.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const mapUser = (user, favorites = []) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    coachId: user.coach_id,
    isVerified: user.is_verified,
    isAdmin: user.role === 'admin',
    favorites
});

export const register = asyncHandler(async (req, res) => {
    const { email, password, inviteCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Required fields missing' });
    
    const lowerEmail = email.toLowerCase();
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (userCheck.rows.length > 0) return res.status(400).json({ error: 'User exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    let role = 'coach';
    let coachId = null;
    let isVerified = false;
    let verificationToken = crypto.randomBytes(32).toString('hex');

    if (lowerEmail === 'admin@trfnv.ru') {
         role = 'admin';
         isVerified = true;
    } else if (inviteCode) {
        const coachCheck = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'coach'", [inviteCode]);
        if (coachCheck.rows.length > 0) {
            role = 'student';
            coachId = inviteCode;
            isVerified = true;
        } else return res.status(400).json({ error: 'Invalid invite' });
    }

    const newId = crypto.randomUUID();
    const newUser = await db.query(
        `INSERT INTO users (id, email, password, role, coach_id, is_verified, verification_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [newId, lowerEmail, hashedPassword, role, coachId, isVerified, isVerified ? null : verificationToken]
    );
    
    const u = newUser.rows[0];

    if (!isVerified) {
        await sendVerificationEmail(lowerEmail, verificationToken, req.headers.host);
        return res.json({ message: 'Email sent' });
    }
    
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role, coachId: u.coach_id }, JWT_SECRET);
    res.json({ 
        user: mapUser(u, []), 
        token 
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }
    if (!user.is_verified) return res.status(403).json({ error: 'Verify email' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, coachId: user.coach_id }, JWT_SECRET);
    
    const favsRes = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [user.id]);
    const favorites = favsRes.rows.map(r => r.track_id);

    res.json({ 
        user: mapUser(user, favorites), 
        token 
    });
});

export const getMe = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.sendStatus(404);
    const user = rows[0];
    
    const favsRes = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [user.id]);
    const favorites = favsRes.rows.map(r => r.track_id);

    res.json(mapUser(user, favorites));
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token is required');
    
    const { rows } = await db.query(
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
});

export const heartbeat = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    await db.query(
        'INSERT INTO activity_logs (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
        [userId, 'HEARTBEAT', req.ip, req.headers['user-agent']]
    );
    res.json({ success: true });
});

