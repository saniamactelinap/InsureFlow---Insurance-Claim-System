import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

let app;

beforeAll(async () => {
  await connectDB();
  app = createApp();
});

afterAll(async () => {
  await closeDB();
});

describe('Authentication & RBAC API', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  let authToken = '';

  it('should register a new customer and prevent privilege escalation to ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: testEmail,
        password: 'Password@123',
        role: 'ADMIN', // Attacker trying to register as ADMIN
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    // Verify user role is strictly CUSTOMER regardless of what was submitted
    expect(res.body.user.role).toBe('CUSTOMER');
    authToken = res.body.token;
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe Clone',
        email: testEmail,
        password: 'Password@123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should log in successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should fail login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should access /api/auth/me with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should reject access to admin routes for CUSTOMER role', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
