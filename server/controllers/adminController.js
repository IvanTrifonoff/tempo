import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getStats = asyncHandler(async (req, res) => {
    const [userCount, trackCount, recentUsers] = await Promise.all([
        db.query('SELECT count(*) FROM users'),
        db.query('SELECT count(*) FROM tracks'),
        db.query('SELECT count(*) FROM users WHERE created_at > NOW() - INTERVAL \'24 hours\'')
    ]);
    
    res.json({
        totalUsers: parseInt(userCount.rows[0].count),
        totalTracks: parseInt(trackCount.rows[0].count),
        newUsers24h: parseInt(recentUsers.rows[0].count)
    });
});

export const getUsers = asyncHandler(async (req, res) => {
    const { search, role, tier } = req.query;
    
    let query = `
        SELECT id, email, role, is_verified as "isVerified", 
               track_limit as "trackLimit", subscription_tier as "subscriptionTier", 
               is_banned as "isBanned", created_at as "createdAt", last_login as "lastLogin"
        FROM users WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (search) {
        query += ` AND email ILIKE $${paramIdx++}`;
        params.push(`%${search}%`);
    }
    if (role) {
        query += ` AND role = $${paramIdx++}`;
        params.push(role);
    }
    if (tier) {
        query += ` AND subscription_tier = $${paramIdx++}`;
        params.push(tier);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await db.query(query, params);
    res.json(rows);
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { trackLimit, subscriptionTier, isBanned, role } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (trackLimit !== undefined) { fields.push(`track_limit = $${idx++}`); values.push(trackLimit); }
    if (subscriptionTier) { fields.push(`subscription_tier = $${idx++}`); values.push(subscriptionTier); }
    if (isBanned !== undefined) { fields.push(`is_banned = $${idx++}`); values.push(isBanned); }
    if (role) { fields.push(`role = $${idx++}`); values.push(role); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const updateQuery = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await db.query(updateQuery, values);

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Логируем действие админа
    await db.query(
        'INSERT INTO audit_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'UPDATE_USER', id, JSON.stringify(req.body)]
    );

    res.json(rows[0]);
});
