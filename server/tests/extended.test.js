import request from 'supertest';
import { app } from '../server.js';
import db from '../db/index.js';

describe('Tempo Extended API', () => {
  let coachToken, studentToken;
  let testTrackId;
  let testPlaylistId;

  const coachUser = { email: `coach_${Date.now()}@example.com`, password: 'password123' };
  const studentUser = { email: `student_${Date.now()}@example.com`, password: 'password123' };

  beforeAll(async () => {
    // Register and verify coach
    await request(app).post('/api/auth/register').send(coachUser);
    await db.query("UPDATE users SET is_verified = true WHERE email = $1", [coachUser.email]);
    const coachLogin = await request(app).post('/api/auth/login').send(coachUser);
    coachToken = coachLogin.body.token;

    // Register and verify student
    await request(app).post('/api/auth/register').send(studentUser);
    await db.query("UPDATE users SET is_verified = true WHERE email = $1", [studentUser.email]);
    const studentLogin = await request(app).post('/api/auth/login').send(studentUser);
    studentToken = studentLogin.body.token;

    // Create a track for testing
    const trackRes = await request(app)
      .post('/api/tracks')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        title: 'Test Track',
        artist: 'Test Artist',
        style: 'Cha Cha',
        bpm: 120,
        url: 'https://example.com/test.mp3'
      });
    testTrackId = trackRes.body.id;
  }, 20000);

  afterAll(async () => {
    await db.query("DELETE FROM users WHERE email LIKE 'coach_%@example.com' OR email LIKE 'student_%@example.com'");
    await db.pool.end();
  });

  describe('Access Control', () => {
    test('Student should NOT access admin users list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Playlist Operations', () => {
    test('Should create a playlist', async () => {
      const res = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ name: 'Test Workout' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
      testPlaylistId = res.body.id;
    });

    test('Should add track to playlist', async () => {
      const res = await request(app)
        .post(`/api/playlists/${testPlaylistId}/tracks`)
        .set('Authorization', `Bearer ${coachToken}`)
        .send({ trackId: testTrackId });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.trackIds).toContain(testTrackId);
    });

    test('Should delete own playlist', async () => {
      const res = await request(app)
        .delete(`/api/playlists/${testPlaylistId}`)
        .set('Authorization', `Bearer ${coachToken}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Favorites', () => {
      test('Should toggle favorite (add)', async () => {
          const res = await request(app)
            .post('/api/tracks/favorite')
            .set('Authorization', `Bearer ${coachToken}`)
            .send({ trackId: testTrackId });
          expect(res.statusCode).toBe(200);
          expect(res.body).toContain(testTrackId);
      });

      test('Should toggle favorite (remove)', async () => {
          const res = await request(app)
            .post('/api/tracks/favorite')
            .set('Authorization', `Bearer ${coachToken}`)
            .send({ trackId: testTrackId });
          expect(res.statusCode).toBe(200);
          expect(res.body).not.toContain(testTrackId);
      });
  });
}, 30000);
