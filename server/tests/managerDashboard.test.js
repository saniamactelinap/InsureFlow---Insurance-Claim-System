import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Claim } from '../src/models/Claim.js';
import { Settlement } from '../src/models/Settlement.js';

let app;

beforeAll(async () => {
  await connectDB();
  app = createApp();
});

afterAll(async () => {
  await closeDB();
});

describe('Manager Dashboard API & Authorization', () => {
  let managerToken = '';
  let customerToken = '';
  let officerToken = '';
  let managerUser;

  beforeAll(async () => {
    // Look up or create seeded manager and customer
    managerUser = await User.findOne({ role: 'MANAGER' });
    if (!managerUser) {
      managerUser = await User.create({
        name: 'Test Manager',
        email: `manager_${Date.now()}@insureflow.com`,
        password: 'Password@123',
        role: 'MANAGER',
      });
    }

    let customerUser = await User.findOne({ role: 'CUSTOMER' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Test Customer',
        email: `customer_${Date.now()}@insureflow.com`,
        password: 'Password@123',
        role: 'CUSTOMER',
      });
    }

    let officerUser = await User.findOne({ role: 'OFFICER' });
    if (!officerUser) {
      officerUser = await User.create({
        name: 'Test Officer',
        email: `officer_${Date.now()}@insureflow.com`,
        password: 'Password@123',
        role: 'OFFICER',
      });
    }

    const secret = process.env.JWT_SECRET || 'insureflow_super_secret_jwt_key_2026';
    managerToken = jwt.sign({ id: managerUser._id, role: managerUser.role }, secret, { expiresIn: '1h' });
    customerToken = jwt.sign({ id: customerUser._id, role: customerUser.role }, secret, { expiresIn: '1h' });
    officerToken = jwt.sign({ id: officerUser._id, role: officerUser.role }, secret, { expiresIn: '1h' });
  });

  it('should block unauthenticated access to /api/dashboard/manager with 401', async () => {
    const res = await request(app).get('/api/dashboard/manager');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should forbid customer access to /api/dashboard/manager with 403', async () => {
    const res = await request(app)
      .get('/api/dashboard/manager')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should forbid officer access to /api/dashboard/manager with 403', async () => {
    const res = await request(app)
      .get('/api/dashboard/manager')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return manager dashboard data with status 200 for authorized manager', async () => {
    const res = await request(app)
      .get('/api/dashboard/manager')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    expect(data.counts).toBeDefined();
    expect(typeof data.counts.pendingReview).toBe('number');
    expect(typeof data.counts.approved).toBe('number');
    expect(typeof data.counts.pendingSettlements).toBe('number');
    expect(typeof data.counts.rejected).toBe('number');
    expect(typeof data.counts.total).toBe('number');

    expect(data.exposure).toBeDefined();
    expect(typeof data.exposure.totalApprovedAmount).toBe('number');

    expect(Array.isArray(data.categoryBreakdown)).toBe(true);
    expect(Array.isArray(data.pendingClaims)).toBe(true);
  });

  it('should return valid manager dashboard data via generic /api/dashboard/stats for manager', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counts).toBeDefined();
  });
});
