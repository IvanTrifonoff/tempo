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
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) return res.status(400).json({ error: 'User exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    let role = 'coach', coachId = null, isVerified = false, vToken = crypto.randomBytes(32).toString('hex');
    if (email === 'admin@trfnv.ru') { role = 'admin'; isVerified = true; }
    else if (inviteCode) {
        const coach = await db.query("SELECT id FROM users WHERE id = $1 AND role = 'coach'", [inviteCode]);
        if (coach.rows.length > 0) { role = 'student'; coachId = inviteCode; isVerified = true; }
        else return res.status(400).json({ error: 'Invalid invite' });
    }
    const newId = Date.now().toString();
    const newUser = await db.query("INSERT INTO users (id, email, password, role, coach_id, is_verified, verification_token) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [newId, email, hashedPassword, role, coachId, isVerified, isVerified ? null : vToken]);
    if (!isVerified) { await sendVerificationEmail(email, vToken); return res.json({ message: 'Email sent' }); }
    const token = jwt.sign({ id: newId, email, role, coachId }, JWT_SECRET);
    res.json({ user: mapUser(newUser.rows[0], []), token });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.is_verified) return res.status(403).json({ error: 'Verify email' });
    const favs = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, coachId: user.coach_id }, JWT_SECRET);
    res.json({ user: mapUser(user, favs.rows.map(r => r.track_id)), token });
});

export const getMe = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.sendStatus(404);
    const favs = await db.query('SELECT track_id FROM user_favorites WHERE user_id = $1', [req.user.id]);
    res.json(mapUser(rows[0], favs.rows.map(r => r.track_id)));
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { rows } = await db.query("UPDATE users SET is_verified = true, verification_token = null WHERE verification_token = $1 RETURNING *", [token]);
    if (rows.length === 0) return res.status(400).send('<h1>Invalid token</h1>');
    res.send('<div style="background:#0a0a0a;color:white;height:100vh;text-align:center;padding:50px"><h1>Verified!</h1><a href="/" style="color:#eab308">Go to Tempo</a></div>');
});
