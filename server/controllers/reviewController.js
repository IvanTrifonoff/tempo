import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const submitReview = asyncHandler(async (req, res) => {
    const { rating, comment, version } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating' });
    }

    if (!version) {
        return res.status(400).json({ error: 'Version is required' });
    }

    const { rows } = await db.query(
        `INSERT INTO reviews (user_id, rating, comment, version) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (user_id, version) 
         DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, rating, comment, version]
    );

    res.status(201).json(rows[0]);
});

export const getReviewStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { version } = req.query;

    const { rows } = await db.query(
        'SELECT * FROM reviews WHERE user_id = $1 AND version = $2',
        [userId, version]
    );

    if (rows.length > 0) {
        res.json({ hasReviewed: true, existingReview: rows[0] });
    } else {
        res.json({ hasReviewed: false, existingReview: null });
    }
});
export const getAllReviews = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { rows } = await db.query(
        `SELECT r.*, u.email, u.role 
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         ORDER BY r.created_at DESC`
    );

    res.json(rows);
});
