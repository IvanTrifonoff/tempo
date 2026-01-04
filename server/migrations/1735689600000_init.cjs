exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('users', {
    id: { type: 'text', primaryKey: true },
    email: { type: 'text', unique: true, notNull: true },
    password: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true, default: 'student' },
    coach_id: { type: 'text' },
    is_verified: { type: 'boolean', default: false },
    verification_token: { type: 'text' },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true });

  pgm.createTable('tracks', {
    id: { type: 'text', primaryKey: true },
    title: { type: 'text', notNull: true },
    artist: { type: 'text', notNull: true },
    style: { type: 'text' },
    bpm: { type: 'integer' },
    url: { type: 'text', notNull: true },
    owner_id: { type: 'text', notNull: true },
    is_public: { type: 'boolean', default: false },
    is_preloaded: { type: 'boolean', default: false },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true });

  pgm.createTable('playlists', {
    id: { type: 'text', primaryKey: true },
    user_id: { type: 'text', notNull: true, references: 'users', onDelete: 'CASCADE' },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true });

  pgm.createTable('playlist_tracks', {
    playlist_id: { type: 'text', references: 'playlists', onDelete: 'CASCADE' },
    track_id: { type: 'text', references: 'tracks', onDelete: 'CASCADE' },
    added_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
  }, { ifNotExists: true });
  
  // Constraints might fail if table exists but constraint doesn't, so we wrap in try/catch block logic implicitly via migration runners usually, 
  // but node-pg-migrate handles createTable constraints well. For existing tables, addConstraint is safer.
  // Since we use ifNotExists, we assume a fresh start or existing compatible schema.
  // However, specifically for PKs on existing tables, we should be careful. 
  // For 'init' migration on existing DB, it's often better to check existence or just skip creation.
  
  // Since we are "retrofitting" migrations to an existing DB, the `ifNotExists: true` is crucial.
  
  // Adding PKs separately if they don't exist is hard in one go. 
  // Let's assume for the INIT migration that if table exists, it's correct.
  
  // Actually, let's explicitely add PKs if we just created the table.
  // But node-pg-migrate createTable with constraints does it atomically.
  // If table exists, createTable is skipped.
};

exports.down = pgm => {
  // Down migration is dangerous on prod, but useful for dev.
  // pgm.dropTable('changelogs');
  // ...
};
