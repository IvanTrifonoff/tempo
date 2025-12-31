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

// Routes
import authRoutes from './routes/auth.js';
import trackRoutes from './routes/tracks.js';
import playlistRoutes from './routes/playlists.js';
import userRoutes from './routes/users.js';
import { verifyEmail } from './controllers/authController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_PATH = path.join(__dirname, 'uploads');

app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_PATH));

// Serve static files with aggressive caching (hashed files)
app.use(express.static(path.join(__dirname, '../dist'), {
  maxAge: '1y',
  etag: false
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/user', userRoutes);

// Standalone endpoints
app.get('/verify', verifyEmail);

app.get('/api/changelog/latest', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT * FROM changelogs ORDER BY release_date DESC LIMIT 1');
        if (rows.length > 0) res.json(rows[0]);
        else res.json(null);
    } catch (err) { next(err); }
});

// SPA Fallback (No cache for index.html to allow updates)
app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error Handler (MUST be last)
app.use(errorHandler);

// Export for testing
export { app };

// Only listen if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', async () => {
      logger.info(`Server is running on port ${PORT}`);
      transporter.verify((error) => {
        if (error) logger.error("SMTP Error: " + error.message);
        else logger.info("SMTP Ready");
      });
    });
}