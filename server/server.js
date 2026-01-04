import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import { transporter } from './email.js';
import db from './db/index.js';
import logger from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import trackRoutes from './routes/tracks.js';
import adminRoutes from './routes/admin.js';
import { verifyEmail } from './controllers/authController.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../dist'), { maxAge: '1y', etag: false }));

app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/admin', adminRoutes);
app.get('/verify', verifyEmail);

app.get('/api/changelog/latest', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM changelogs ORDER BY release_date DESC LIMIT 1');
        res.json(rows[0] || null);
    } catch (err) { next(err); }
});

app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server running on port ${PORT}`);
        transporter.verify(err => err ? logger.error("SMTP Error: " + err.message) : logger.info("SMTP Ready"));
    });
}
export { app };