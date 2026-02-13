import request from 'supertest';
import { app } from '../server.js';
import db from '../db/index.js';

describe('Admin API', () => {
    let adminToken, userToken;
    const adminUser = { email: `admin_${Date.now()}@example.com`, password: 'password123', role: 'admin' };
    const normalUser = { email: `user_${Date.now()}@example.com`, password: 'password123', role: 'coach' };

    beforeAll(async () => {
        // Register and verify admin
        await request(app).post('/api/auth/register').send({ email: adminUser.email, password: adminUser.password });
        await db.query("UPDATE users SET is_verified = true, role = 'admin' WHERE email = $1", [adminUser.email]);
        const adminLogin = await request(app).post('/api/auth/login').send({ email: adminUser.email, password: adminUser.password });
        adminToken = adminLogin.body.token;

        // Register and verify normal user
        await request(app).post('/api/auth/register').send({ email: normalUser.email, password: normalUser.password });
        await db.query("UPDATE users SET is_verified = true WHERE email = $1", [normalUser.email]);
        const userLogin = await request(app).post('/api/auth/login').send({ email: normalUser.email, password: normalUser.password });
        userToken = userLogin.body.token;
    }, 20000);

    afterAll(async () => {
        await db.query("DELETE FROM users WHERE email LIKE 'admin_%@example.com' OR email LIKE 'user_%@example.com'");
        await db.pool.end();
    });

    describe('Security', () => {
        test('Normal user should be denied access to stats', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.statusCode).toBe(403);
        });

        test('Admin should be granted access to stats', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('totalUsers');
        });
    });

    describe('User Management', () => {
        test('Admin should be able to update user track limit', async () => {
            const usersRes = await request(app)
                .get('/api/admin/users')
                .query({ search: normalUser.email })
                .set('Authorization', `Bearer ${adminToken}`);
            
            const targetUser = usersRes.body[0];
            expect(targetUser).toBeDefined();

            const updateRes = await request(app)
                .patch(`/api/admin/users/${targetUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ trackLimit: 50, subscriptionTier: 'pro' });
            
            expect(updateRes.statusCode).toBe(200);
            expect(updateRes.body.track_limit).toBe(50);
            expect(updateRes.body.subscription_tier).toBe('pro');
        });
    });
}, 30000);
