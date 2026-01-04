import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    const { rows } = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        coachId: u.coach_id,
        isVerified: u.is_verified,
        isAdmin: u.role === 'admin'
    })));
});

export const deleteUser = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    const { rows } = await db.query('SELECT email FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (rows[0].email === 'admin@trfnv.ru') return res.status(403).json({ error: 'Cannot delete superadmin' });
    
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

export const updateUser = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    const updates = [];
    const values = [];
    let idx = 1;

    if (req.body.role) { updates.push(`role = $${idx++}`); values.push(req.body.role); }
    if (req.body.isVerified !== undefined) { updates.push(`is_verified = $${idx++}`); values.push(req.body.isVerified); }

    if (updates.length === 0) return res.json({});

    values.push(req.params.id);
    const { rows } = await db.query(
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
});
