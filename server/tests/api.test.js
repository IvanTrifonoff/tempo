import { jest } from '@jest/globals';
import request from 'supertest';
import { app, pool } from '../server.js';

describe('Tempo API', () => {
  let token;
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'password123'
  };

  // Increase timeout for DB operations
  jest.setTimeout(10000);

  beforeAll(async () => {
      await pool.query("INSERT INTO changelogs (version, description_ru, description_en) VALUES ('0.0.0-test', 'Test', 'Test') ON CONFLICT DO NOTHING");
  });

  afterAll(async () => {
    // Cleanup
    await pool.query("DELETE FROM users WHERE email LIKE 'test_%@example.com'");
    await pool.end();
  });

  test('POST /api/auth/register - should register a new coach', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Email sent');
    
    // Manually verify user in DB for testing login
    await pool.query("UPDATE users SET is_verified = true WHERE email = $1", [testUser.email]);
  });

  test('POST /api/auth/login - should login and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    token = res.body.token;
  });

  test('GET /api/tracks - should return tracks list', async () => {
    const res = await request(app)
      .get('/api/tracks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  
  test('GET /api/changelog/latest - should return latest version', async () => {
      const res = await request(app).get('/api/changelog/latest');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('version');
  });
});
