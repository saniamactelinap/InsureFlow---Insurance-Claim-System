import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { CustomerPolicy } from '../src/models/CustomerPolicy.js';
import { Claim } from '../src/models/Claim.js';
import { seedDatabaseIfEmpty } from '../src/seed/seedData.js';

let app;
let customerToken = '';
let officerToken = '';
let managerToken = '';
let testPolicy = null;
let createdClaimId = null;

beforeAll(async () => {
  await connectDB();
  await seedDatabaseIfEmpty();
  app = createApp();

  // Login customer
  const custRes = await request(app).post('/api/auth/login').send({
    email: 'customer@insureflow.com',
    password: 'Customer@123',
  });
  customerToken = custRes.body.token;

  // Login officer
  const offRes = await request(app).post('/api/auth/login').send({
    email: 'officer@insureflow.com',
    password: 'Officer@123',
  });
  officerToken = offRes.body.token;

  // Login manager
  const mgrRes = await request(app).post('/api/auth/login').send({
    email: 'manager@insureflow.com',
    password: 'Manager@123',
  });
  managerToken = mgrRes.body.token;

  // Fetch customer policy
  const polRes = await request(app)
    .get('/api/customer-policies/my')
    .set('Authorization', `Bearer ${customerToken}`);
  testPolicy = polRes.body.data[0];
});

afterAll(async () => {
  await closeDB();
});

describe('End-to-End Claim Processing & Approval Workflow', () => {
  it('should allow customer to submit a new claim', async () => {
    expect(testPolicy).toBeDefined();

    const incidentDate = new Date();
    incidentDate.setDate(incidentDate.getDate() - 5);

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerPolicyId: testPolicy._id,
        claimType: 'REIMBURSEMENT',
        incidentDate: incidentDate.toISOString(),
        incidentDescription: 'Emergency room treatment for acute abdominal pain with diagnostic imaging.',
        incidentLocation: 'Metro General Hospital Emergency Care',
        requestedAmount: 2400,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.claimReference).toMatch(/^CLM-\d{8}-\d{4}$/);
    expect(res.body.data.status).toBe('SUBMITTED');
    expect(res.body.data.automatedValidation).toBeDefined();
    createdClaimId = res.body.data._id;
  });

  it('should allow officer to view claim queue and claim details', async () => {
    const listRes = await request(app)
      .get('/api/claims')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);

    const detailRes = await request(app)
      .get(`/api/claims/${createdClaimId}`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.claim._id).toBe(createdClaimId);
    expect(detailRes.body.data.timelineEvents.length).toBeGreaterThan(0);
  });

  it('should allow officer to recommend claim and escalate to manager', async () => {
    const res = await request(app)
      .post(`/api/claims/${createdClaimId}/recommend`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        recommendation: 'APPROVE',
        officerNotes: 'Medical emergency verified. Policy coverage is active and within limit.',
        recommendedAmount: 2400,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('MANAGER_REVIEW');
  });

  it('should allow manager to approve claim and generate settlement record', async () => {
    const res = await request(app)
      .post(`/api/manager/claims/${createdClaimId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        approvedAmount: 2400,
        managerNotes: 'Approved full reimbursement per policy terms.',
        paymentMethod: 'BANK_TRANSFER',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.settlement).toBeDefined();
    expect(res.body.data.settlement.settlementReference).toMatch(/^SET-\d{8}-\d{4}$/);
    expect(res.body.data.settlement.approvedAmount).toBe(2400);
    expect(res.body.data.settlement.status).toBe('PENDING');
  });

  it('should allow customer to track approved status and settlement reference', async () => {
    const res = await request(app)
      .get(`/api/claims/${createdClaimId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.claim.status).toBe('SETTLEMENT_PENDING');
    expect(res.body.data.settlement).toBeDefined();
    expect(res.body.data.settlement.approvedAmount).toBe(2400);
  });
});
