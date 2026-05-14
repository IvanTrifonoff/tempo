import db from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getLatestChangelog = asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM changelogs ORDER BY release_date DESC LIMIT 1');
    if (rows.length > 0) res.json(rows[0]);
    else res.json(null);
});
