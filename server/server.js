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
import webRoutes from './routes/web.js';
import authRoutes from './routes/auth.js';
import trackRoutes from './routes/tracks.js';
import playlistRoutes from './routes/playlists.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import changelogRoutes from './routes/changelog.js';
import reviewRoutes from './routes/reviews.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_PATH = path.join(__dirname, 'uploads');

app.use(compression());
app.use(cors());
app.use(express.json());

// Request Logger (From Dev)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Request: ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(UPLOADS_PATH));
app.use(express.static(path.join(__dirname, '../dist'), { 
    maxAge: '1y', 
    etag: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// API Routes
app.use('/', webRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/changelog', changelogRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        console.warn(`[${new Date().toISOString()}] Warning: API request matched catch-all: ${req.url}`);
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use(errorHandler);

export { app };

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', async () => {
      logger.info(`Server running on port ${PORT}`);
      transporter.verify((error) => {
        if (error) logger.error("SMTP Error: " + error.message);
        else logger.info("SMTP Ready");
      });
    });
}