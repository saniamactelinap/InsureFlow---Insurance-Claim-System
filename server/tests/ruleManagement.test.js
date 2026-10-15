import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { ConfigurableRule } from '../src/models/ConfigurableRule.js';
import { Claim } from '../src/models/Claim.js';
import { CustomerPolicy } from '../src/models/CustomerPolicy.js';
import { ruleEngineService } from '../src/services/ruleEngineService.js';
import { seedDatabaseIfEmpty } from '../src/seed/seedData.js';

let app;

beforeAll(async () => {
  await connectDB();
  await seedDatabaseIfEmpty();
  app = createApp();
});

afterAll(async () => {
  await closeDB();
});

describe('Automated Underwriting Rule Management API & Engine Integration', () => {
  let adminToken = '';
  let customerToken = '';
  let officerToken = '';
  let sampleRule;

  beforeAll(async () => {
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin Test User',
        email: `admin_${Date.now()}@insureflow.com`,
        password: 'Password@123',
        role: 'ADMIN',
      });
    }

    let customerUser = await User.findOne({ role: 'CUSTOMER' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Customer Test User',
        email: `cust_${Date.now()}@insureflow.com`,
        password: 'Password@123',
        role: 'CUSTOMER',
      });
    }

    let officerUser = await User.findOne({ role: 'OFFICER' });
    if (!officerUser) {
      officerUser = await User.create({
        name: 'Officer Test User',
        email: `officer_${Date.now()}@insureflow.com`,
        password: 'Password@123',
        role: 'OFFICER',
      });
    }

    const secret = process.env.JWT_SECRET || 'insureflow_super_secret_jwt_key_2026';
    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1h' });
    customerToken = jwt.sign({ id: customerUser._id, role: customerUser.role }, secret, { expiresIn: '1h' });
    officerToken = jwt.sign({ id: officerUser._id, role: officerUser.role }, secret, { expiresIn: '1h' });

    sampleRule = await ConfigurableRule.findOne({ ruleId: 'RULE_COVERAGE_LIMIT' });
    expect(sampleRule).toBeDefined();
  });

  it('should block unauthenticated access to /api/rules with 401', async () => {
    const res = await request(app).get('/api/rules');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should forbid customer access to /api/rules with 403', async () => {
    const res = await request(app)
      .get('/api/rules')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should forbid officer access to /api/rules with 403', async () => {
    const res = await request(app)
      .get('/api/rules')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to list rules with backward-compatible fields', async () => {
    const res = await request(app)
      .get('/api/rules')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const first = res.body.data[0];
    expect(first.ruleId).toBeDefined();
    expect(first.ruleCode).toBe(first.ruleId);
    expect(first.isEnabled).toBeDefined();
    expect(first.isActive).toBe(first.isEnabled);
  });

  it('should allow admin to fetch a specific rule by ID', async () => {
    const res = await request(app)
      .get(`/api/rules/${sampleRule._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ruleId).toBe(sampleRule.ruleId);
    expect(res.body.data.isActive).toBe(res.body.data.isEnabled);
  });

  it('should allow admin to toggle a rule state to inactive via PATCH /toggle', async () => {
    const res = await request(app)
      .patch(`/api/rules/${sampleRule._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isEnabled).toBe(false);
    expect(res.body.data.isActive).toBe(false);

    // Verify database persistence directly
    const persisted = await ConfigurableRule.findById(sampleRule._id);
    expect(persisted.isEnabled).toBe(false);
  });

  it('should allow admin to toggle a rule state back to active via PATCH /toggle with isEnabled: true', async () => {
    const res = await request(app)
      .patch(`/api/rules/${sampleRule._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isEnabled: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isEnabled).toBe(true);
    expect(res.body.data.isActive).toBe(true);

    const persisted = await ConfigurableRule.findById(sampleRule._id);
    expect(persisted.isEnabled).toBe(true);
  });

  it('should return 404 when toggling a nonexistent rule', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .patch(`/api/rules/${fakeId}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isEnabled: false });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  it('should return active rule counts in /api/dashboard/admin', async () => {
    const activeRulesCount = await ConfigurableRule.countDocuments({ isEnabled: true });
    const res = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counts.rules).toBe(activeRulesCount);
  });

  it('should respect disabled rules during claim evaluation without executing them as active', async () => {
    const policy = await CustomerPolicy.findOne({ policySource: 'PLATFORM' });
    expect(policy).toBeDefined();

    // Temporarily disable the active date rule
    await ConfigurableRule.updateOne(
      { ruleId: 'RULE_ACTIVE_POLICY_ON_INCIDENT' },
      { $set: { isEnabled: false } }
    );

    // Create a claim that would normally FAIL RULE_ACTIVE_POLICY_ON_INCIDENT
    const pastIncident = new Date();
    pastIncident.setFullYear(pastIncident.getFullYear() - 10);

    const testClaim = await Claim.create({
      claimReference: `CLM-DISABLED-TEST-${Date.now()}`,
      customer: policy.customer,
      customerPolicy: policy._id,
      policySource: policy.policySource,
      category: policy.category,
      incidentDate: pastIncident,
      incidentDescription: 'Test claim with disabled date rule.',
      requestedAmount: 500,
      status: 'SUBMITTED',
    });

    const result = await ruleEngineService.evaluateClaim(testClaim._id);

    // The disabled rule must NOT be in the active evaluation list
    const evaluatedIds = result.rules.map(r => r.ruleId);
    expect(evaluatedIds).not.toContain('RULE_ACTIVE_POLICY_ON_INCIDENT');

    // Re-enable the rule
    await ConfigurableRule.updateOne(
      { ruleId: 'RULE_ACTIVE_POLICY_ON_INCIDENT' },
      { $set: { isEnabled: true } }
    );

    // Re-evaluate: now it must be evaluated and FAIL
    const reResult = await ruleEngineService.evaluateClaim(testClaim._id);
    const reEvaluatedIds = reResult.rules.map(r => r.ruleId);
    expect(reEvaluatedIds).toContain('RULE_ACTIVE_POLICY_ON_INCIDENT');
    const dateRule = reResult.rules.find(r => r.ruleId === 'RULE_ACTIVE_POLICY_ON_INCIDENT');
    expect(dateRule.status).toBe('FAIL');
  });
});
