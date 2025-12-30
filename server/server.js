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
    const db = JSON.parse(data);
    
    // Migration: Assign roles to legacy users
    let changed = false;
    if (db.users) {
        db.users = db.users.map(u => {
            if (!u.role) {
                u.role = u.isAdmin ? 'admin' : 'coach';
                u.isVerified = true;
                changed = true;
            }
            return u;
        });
    }
    
    // Migration: Assign ownerId/isPublic to legacy tracks
    if (db.tracks) {
        const adminUser = db.users?.find(u => u.role === 'admin');
        db.tracks = db.tracks.map(t => {
            if (!t.ownerId && adminUser) {
                t.ownerId = adminUser.id;
                t.isPublic = true;
                changed = true;
            }
            return t;
        });
    }

    if (changed) await saveDb(db);
    return db;
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

app.get('/api/tracks', async (req, res) => {
  try {
    const db = await getDb();
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user = null;
    
    if (token) {
        try { user = jwt.verify(token, JWT_SECRET); } catch(e) {}
    }

    let filteredTracks = [];
    if (!user) {
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
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tracks', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ error: 'Students cannot upload' });
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
      isPreloaded: false,
      ownerId: req.user.id,
      isPublic: req.user.role === 'admin'
    };

    db.tracks.unshift(newTrack);
    await saveDb(db);
    res.json(newTrack);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tracks/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const trackIndex = db.tracks.findIndex(t => t.id === req.params.id);
        if (trackIndex === -1) return res.status(404).json({error: 'Track not found'});
        const track = db.tracks[trackIndex];
        
        if (req.user.role !== 'admin' && track.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Denied' });
        }

        if (track.url && track.url.startsWith('/uploads/')) {
             try {
                 const fileName = path.basename(track.url);
                 await fs.unlink(path.join(UPLOADS_PATH, fileName));
            } catch (e) {}
        }
        db.tracks.splice(trackIndex, 1);
        await saveDb(db);
        res.json({success: true});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/tracks/:id', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const track = db.tracks.find(t => t.id === req.params.id);
        if (!track) return res.status(404).json({error: 'Not found'});
        
        if (req.user.role !== 'admin' && track.ownerId !== req.user.id) {
            return res.status(403).json({ error: 'Denied' });
        }
        
        if (req.body.title) track.title = req.body.title;
        if (req.body.artist) track.artist = req.body.artist;
        if (req.body.bpm) track.bpm = Number(req.body.bpm);
        
        await saveDb(db);
        res.json(track);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN USER MANAGEMENT
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    try {
        const db = await getDb();
        res.json(db.users.map(({ password, verificationToken, ...u }) => u));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    try {
        const db = await getDb();
        const index = db.users.findIndex(u => u.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Not found' });
        if (db.users[index].email === 'admin@trfnv.ru') return res.status(403).json({ error: 'Denied' });
        db.users.splice(index, 1);
        await saveDb(db);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Denied' });
    try {
        const db = await getDb();
        const user = db.users.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ error: 'Not found' });
        if (req.body.role) user.role = req.body.role;
        if (req.body.isVerified !== undefined) user.isVerified = req.body.isVerified;
        await saveDb(db);
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AUTH
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, inviteCode } = req.body;
        console.log(`Registration: ${email}, invite: ${inviteCode}`);
        if (!email || !password) return res.status(400).json({ error: 'Required fields missing' });
        
        const db = await getDb();
        if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'User exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        let role = 'coach';
        let coachId = null;
        let isVerified = false;
        let verificationToken = crypto.randomBytes(32).toString('hex');

        if (email === 'admin@trfnv.ru') {
             role = 'admin';
             isVerified = true;
        } else if (inviteCode) {
            const coach = db.users.find(u => u.id === inviteCode && u.role === 'coach');
            if (coach) {
                role = 'student';
                coachId = coach.id;
                isVerified = true;
            } else return res.status(400).json({ error: 'Invalid invite' });
        }

        const newUser = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            role,
            coachId,
            isVerified,
            verificationToken: isVerified ? null : verificationToken,
            favorites: []
        };
        
        db.users.push(newUser);
        await saveDb(db);
        
        if (!isVerified) {
            await sendVerificationEmail(email, verificationToken);
            return res.json({ message: 'Email sent' });
        }
        
        const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, coachId: newUser.coachId }, JWT_SECRET);
        const { password: _, verificationToken: __, ...u } = newUser;
        res.json({ user: u, token });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await getDb();
        const user = db.users.find(u => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        if (!user.isVerified) return res.status(403).json({ error: 'Verify email' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, coachId: user.coachId }, JWT_SECRET);
        const { password: _, verificationToken: __, ...u } = user;
        res.json({ user: u, token });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).send('Token is required');
        
        const db = await getDb();
        const user = db.users.find(u => u.verificationToken === token);
        
        if (!user) {
            console.log(`Verification failed for token: ${token}`);
            return res.status(400).send('<h1>Invalid or expired token.</h1><p>Please try registering again or contact support.</p>');
        }
        
        user.isVerified = true;
        user.verificationToken = null;
        await saveDb(db);
        
        console.log(`User verified: ${user.email}`);
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: white; height: 100vh;">
                <h1 style="color: #eab308;">Email Verified!</h1>
                <p>Your account has been activated successfully.</p>
                <br>
                <a href="/" style="background: #eab308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Tempo</a>
            </div>
        `);
    } catch (err) { 
        console.error("Verify error:", err);
        res.status(500).send(err.message); 
    }
});

// User API
app.post('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.body;
        const db = await getDb();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({error: 'User not found'});
        if (user.favorites.includes(trackId)) user.favorites = user.favorites.filter(id => id !== trackId);
        else user.favorites.push(trackId);
        await saveDb(db);
        res.json(user.favorites);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.sendStatus(404);
        const { password: _, verificationToken: __, ...u } = user;
        res.json(u);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/playlists', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const { id, role, coachId } = req.user;
        const list = db.playlists.filter(p => p.userId === (role === 'student' ? coachId : id));
        res.json(list);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/playlists', authenticateToken, async (req, res) => {
     if (req.user.role === 'student') return res.status(403).json({ error: 'Denied' });
     try {
        const { name } = req.body;
        const db = await getDb();
        const pl = { id: Date.now().toString(), userId: req.user.id, name, trackIds: [] };
        db.playlists.push(pl);
        await saveDb(db);
        res.json(pl);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/playlists/:id', authenticateToken, async (req, res) => {
     try {
        const db = await getDb();
        const idx = db.playlists.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
        if (idx === -1) return res.status(404).json({error: 'Not found'});
        db.playlists.splice(idx, 1);
        await saveDb(db);
        res.json({success: true});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/playlists/:id/tracks', authenticateToken, async (req, res) => {
    try {
        const { trackId } = req.body;
        const db = await getDb();
        const pl = db.playlists.find(p => p.id === req.params.id && p.userId === req.user.id);
        if (!pl) return res.status(404).json({ error: 'Not found' });
        if (!pl.trackIds.includes(trackId)) {
            pl.trackIds.push(trackId);
            await saveDb(db);
        }
        res.json(pl);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/playlists/:id/tracks/:trackId', authenticateToken, async (req, res) => {
    try {
        const db = await getDb();
        const pl = db.playlists.find(p => p.id === req.params.id && p.userId === req.user.id);
        if (!pl) return res.status(404).json({ error: 'Not found' });
        pl.trackIds = pl.trackIds.filter(id => id !== req.params.trackId);
        await saveDb(db);
        res.json(pl);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server is running on port ${PORT}`);
  await getDb();
  transporter.verify((error) => {
    if (error) console.error("SMTP Error:", error);
    else console.log("SMTP Ready");
  });
});
