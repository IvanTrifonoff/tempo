import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Reading db.json from', DB_PATH);
    let db;
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        console.log('File content preview:', data.substring(0, 500));
        db = JSON.parse(data);
        console.log('Keys:', Object.keys(db));
        if (db.users) console.log('Users count:', db.users.length);
    } catch (e) {
        console.log('No db.json found or empty, skipping migration.', e);
        return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Users
      console.log(`Migrating ${db.users?.length || 0} users...`);
      if (db.users) {
        for (const u of db.users) {
          console.log(`Processing user ${u.email}`);
          await client.query(
            `INSERT INTO users (id, email, password, role, coach_id, is_verified, verification_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               email = EXCLUDED.email,
               role = EXCLUDED.role,
               coach_id = EXCLUDED.coach_id,
               is_verified = EXCLUDED.is_verified`,
            [u.id, u.email, u.password, u.role, u.coachId, u.isVerified, u.verificationToken]
          );
        }
      }

      // Tracks
      console.log(`Migrating ${db.tracks?.length || 0} tracks...`);
      if (db.tracks) {
        for (const t of db.tracks) {
          try {
              await client.query(
                `INSERT INTO tracks (id, title, artist, style, bpm, url, owner_id, is_public, is_preloaded)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO NOTHING`,
                [t.id, t.title, t.artist, t.style, t.bpm, t.url, t.ownerId, t.isPublic, t.isPreloaded || false]
              );
          } catch (err) {
              console.warn(`Failed to migrate track ${t.id} (${t.title}): ${err.message}`);
          }
        }
      }

      // Playlists
      console.log(`Migrating ${db.playlists?.length || 0} playlists...`);
      if (db.playlists) {
        for (const p of db.playlists) {
            try {
                await client.query(
                    `INSERT INTO playlists (id, user_id, name)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (id) DO NOTHING`,
                    [p.id, p.userId, p.name]
                );

                if (p.trackIds) {
                    for (const trackId of p.trackIds) {
                        try {
                             await client.query(
                                `INSERT INTO playlist_tracks (playlist_id, track_id)
                                 VALUES ($1, $2)
                                 ON CONFLICT DO NOTHING`,
                                [p.id, trackId]
                            );
                        } catch (e) { }
                    }
                }
            } catch (err) {
                 console.warn(`Failed to migrate playlist ${p.id}: ${err.message}`);
            }
        }
      }

      // Favorites
      console.log('Migrating favorites...');
      if (db.users) {
        for (const u of db.users) {
            if (u.favorites) {
                for (const trackId of u.favorites) {
                    try {
                        await client.query(
                            `INSERT INTO user_favorites (user_id, track_id)
                             VALUES ($1, $2)
                             ON CONFLICT DO NOTHING`,
                            [u.id, trackId]
                        );
                    } catch (e) { }
                }
            }
        }
      }

      await client.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', e);
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

migrate();