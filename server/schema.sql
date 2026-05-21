CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    coach_id TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    track_limit INTEGER DEFAULT 10 NOT NULL,
    subscription_tier TEXT DEFAULT 'free' NOT NULL,
    is_banned BOOLEAN DEFAULT false NOT NULL,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    style TEXT,
    bpm INTEGER,
    url TEXT NOT NULL,
    owner_id TEXT NOT NULL, 
    is_public BOOLEAN DEFAULT FALSE,
    is_preloaded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id TEXT REFERENCES playlists(id) ON DELETE CASCADE,
    track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE IF NOT EXISTS user_favorites (
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS changelogs (
    version TEXT PRIMARY KEY,
    release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description_ru TEXT,
    description_en TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    version TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
