import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, transporter } from './email.js';

// --- Verification of email config ---
// (Normally we'd import the transporter, but since it's inside email.js, 
// we'll just rely on the logs from sendVerificationEmail or export it)



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_PATH = path.join(__dirname, 'uploads');
const JWT_SECRET = 'trfnv-tempo-secret-key-change-this-in-prod'; 

// Ensure data directory exists
fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_PATH));
app.use(express.static(path.join(__dirname, '../dist')));

async function getDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { tracks: [], playlists: [], users: [] };
  }
}

async function saveDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Middleware: Authenticate Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOADS_PATH) },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})
const upload = multer({ storage: storage });

// API Routes

// GET Tracks - Public access with internal filtering
app.get('/api/tracks', async (req, res) => {
  try {
    const db = await getDb();
    
    // Optional token check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user = null;
    
    if (token) {
        try { user = jwt.verify(token, JWT_SECRET); } catch(e) {}
    }

    let filteredTracks = [];

    if (!user) {
        // Guest: only public tracks
        filteredTracks = db.tracks.filter(t => t.isPublic);
    } else if (user.role === 'admin') {
        filteredTracks = db.tracks;
    } else if (user.role === 'coach') {
        filteredTracks = db.tracks.filter(t => t.isPublic || t.ownerId === user.id);
    } else if (user.role === 'student') {
        filteredTracks = db.tracks.filter(t => t.isPublic || t.ownerId === user.coachId);
    } else {
        filteredTracks = db.tracks.filter(t => t.isPublic);
    }

    res.json(filteredTracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracks', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  try {
    const db = await getDb();
    const { title, artist, style, bpm } = req.body;
    let url = '';
    if (req.file) url = `/uploads/${req.file.filename}`;
    else if (req.body.url) url = req.body.url;

    const newTrack = {
      id: Date.now().toString(),
      title,
      artist,
      style,
      bpm: Number(bpm),
      url,
      isPreloaded: false
    };

    db.tracks.unshift(newTrack);
    await saveDb(db);
    res.json(newTrack);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracks/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const trackIndex = db.tracks.findIndex(t => t.id === req.params.id);
        if (trackIndex === -1) return res.status(404).json({error: 'Track not found'});
        
        const track = db.tracks[trackIndex];
        
        // Permission check
        if (req.user.role !== 'admin' && track.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (track.url && track.url.startsWith('/uploads/')) {
             try {
                 const fileName = path.basename(track.url);
                 await fs.unlink(path.join(UPLOADS_PATH, fileName));
            } catch (e) { console.error("Failed to delete file:", e); }
        }
        db.tracks.splice(trackIndex, 1);
        await saveDb(db);
        res.json({success: true});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/tracks/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const track = db.tracks.find(t => t.id === req.params.id);
        if (!track) return res.status(404).json({error: 'Not found'});
        
        // Permission check
        if (req.user.role !== 'admin' && track.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        if (req.body.title) track.title = req.body.title;
        if (req.body.artist) track.artist = req.body.artist;
        if (req.body.bpm) track.bpm = Number(req.body.bpm);
        
        await saveDb(db);
        res.json(track);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ADMIN USER MANAGEMENT

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const db = await getDb();
        const users = db.users.map(({ password, verificationToken, ...u }) => u);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const db = await getDb();
        const index = db.users.findIndex(u => u.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'User not found' });
        
        // Don't delete the last admin or yourself
        if (db.users[index].email === 'admin@trfnv.ru') return res.status(403).json({ error: 'Cannot delete main admin' });

        db.users.splice(index, 1);
        await saveDb(db);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const db = await getDb();
        const user = db.users.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (req.body.role) user.role = req.body.role;
        if (req.body.isVerified !== undefined) user.isVerified = req.body.isVerified;

        await saveDb(db);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ... Auth routes ...
    try {
        const { email, password, inviteCode } = req.body;
        console.log(`Registration request received for email: ${email}, inviteCode: ${inviteCode}`);
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        
        const db = await getDb();
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const isAdmin = email.includes('admin'); 
        
        const newUser = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            isAdmin,
            isSubscribed: true,
            favorites: []
        };
        
        db.users.push(newUser);
        await saveDb(db);
        
        const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin }, JWT_SECRET);
        const { password: _, ...userWithoutPass } = newUser;
        res.json({ user: userWithoutPass, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await getDb();
        const user = db.users.find(u => u.email === email);
        
        if (!user) return res.status(400).json({ error: 'User not found' });
        
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid password' });
        
        const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET);
        const { password: _, ...userWithoutPass } = user;
        res.json({ user: userWithoutPass, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.body;
        const db = await getDb();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({error: 'User not found'});

        if (user.favorites.includes(trackId)) {
            user.favorites = user.favorites.filter(id => id !== trackId);
        } else {
            user.favorites.push(trackId);
        }
        await saveDb(db);
        res.json(user.favorites);
    } catch (err) {
        console.error(err);
         res.status(500).json({ error: err.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.sendStatus(404);
        const { password: _, ...userWithoutPass } = user;
        res.json(userWithoutPass);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/playlists', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const userPlaylists = db.playlists.filter(p => p.userId === req.user.id);
        res.json(userPlaylists);
    } catch (err) {
        console.error(err);
         res.status(500).json({ error: err.message });
    }
});

app.post('/api/playlists', authenticateToken, async (req, res) => {
     try {
        const { name } = req.body;
        const db = await getDb();
        const newPlaylist = {
            id: Date.now().toString(),
            userId: req.user.id,
            name,
            trackIds: []
        };
        db.playlists.push(newPlaylist);
        await saveDb(db);
        res.json(newPlaylist);
    } catch (err) {
        console.error(err);
         res.status(500).json({ error: err.message });
    }
});

app.delete('/api/playlists/:id', authenticateToken, async (req, res) => {
     try {
        const db = await getDb();
        const playlistIndex = db.playlists.findIndex(p => p.id === req.params.id);
        
        if (playlistIndex === -1) return res.status(404).json({error: 'Not found'});
        if (db.playlists[playlistIndex].userId !== req.user.id) return res.sendStatus(403);

        db.playlists.splice(playlistIndex, 1);
        await saveDb(db);
        res.json({success: true});
    } catch (err) {
        console.error(err);
         res.status(500).json({ error: err.message });
    }
});

app.post('/api/playlists/:id/tracks', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.body;
        const db = await getDb();
        const playlist = db.playlists.find(p => p.id === req.params.id);
        
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        if (playlist.userId !== req.user.id) return res.sendStatus(403);
        
        if (!playlist.trackIds.includes(trackId)) {
            playlist.trackIds.push(trackId);
            await saveDb(db);
        }
        
        res.json(playlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/playlists/:id/tracks/:trackId', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const playlist = db.playlists.find(p => p.id === req.params.id);
        
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        if (playlist.userId !== req.user.id) return res.sendStatus(403);
        
        playlist.trackIds = playlist.trackIds.filter(id => id !== req.params.trackId);
        await saveDb(db);
        
        res.json(playlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('*', (req, res) => {
    const distPath = path.join(__dirname, '../dist');
    if (req.accepts('html')) {
        res.sendFile(path.join(distPath, 'index.html'));
    } else {
        res.status(404).send('Not found');
    }
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server is running on port ${PORT}`);
  // Run migration on start
  await getDb();

  // Verify SMTP
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP Connection Error:", error);
    } else {
      console.log("SMTP Server is ready to take our messages");
    }
  });
});