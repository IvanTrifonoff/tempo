import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getStats = asyncHandler(async (req, res) => {
    const [userCount, trackCount, recentUsers, onlineCount, popularTracks] = await Promise.all([
        db.query('SELECT count(*) FROM users'),
        db.query('SELECT count(*) FROM tracks'),
        db.query('SELECT count(*) FROM users WHERE created_at > NOW() - INTERVAL \'24 hours\''),
        // Online за последние 5 минут (уникальные IP-адреса из логов)
        db.query(`
            SELECT count(DISTINCT ip_address) 
            FROM activity_logs 
            WHERE created_at > NOW() - INTERVAL '5 minutes'
        `),
        // Популярные треки за 24 часа
        db.query(`
            SELECT t.id, t.title, count(al.id) as plays
            FROM activity_logs al
            JOIN tracks t ON al.target_id = t.id
            WHERE al.action = 'PLAY_TRACK' AND al.created_at > NOW() - INTERVAL '24 hours'
            GROUP BY t.id, t.title
            ORDER BY plays DESC
            LIMIT 5
        `)
    ]);

    res.json({
        totalUsers: parseInt(userCount.rows[0].count),
        totalTracks: parseInt(trackCount.rows[0].count),
        newUsers24h: parseInt(recentUsers.rows[0].count),
        onlineUsers: parseInt(onlineCount.rows[0].count),
        popularTracks: popularTracks.rows.map(r => ({ ...r, plays: parseInt(r.plays) }))
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

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Protection for root admin
    const { rows: userRows } = await db.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (userRows[0].email === 'admin@trfnv.ru') return res.status(403).json({ error: 'Cannot delete root admin' });

    await db.query('DELETE FROM users WHERE id = $1', [id]);

    // Логируем действие админа
    await db.query(
        'INSERT INTO audit_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'DELETE_USER', id, JSON.stringify({ email: userRows[0].email })]
    );

    res.json({ success: true });
});

export const getActivityLogs = asyncHandler(async (req, res) => {
    const { user: filterUser, action: filterAction, startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    // Safety: enforce max limit to prevent DoS
    const safeLimit = Math.min(parseInt(limit) || 50, 100);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    let query = `
        SELECT al.*, u.email as user_email, t.title as track_title
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN tracks t ON al.target_id = t.id
        WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filterUser) {
        query += ` AND (u.email ILIKE $${idx} OR al.user_id = $${idx})`;
        params.push(`%${filterUser}%`);
        idx++;
    }
    if (filterAction) {
        query += ` AND al.action = $${idx}`;
        params.push(filterAction);
        idx++;
    }
    if (startDate) {
        query += ` AND al.created_at >= $${idx}`;
        params.push(startDate);
        idx++;
    }
    if (endDate) {
        query += ` AND al.created_at <= $${idx}`;
        params.push(endDate);
        idx++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(safeLimit, safeOffset);

    const { rows } = await db.query(query, params);
    res.json(rows);
});
