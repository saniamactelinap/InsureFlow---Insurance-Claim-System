import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Claim } from '../src/models/Claim.js';
import { seedDatabaseIfEmpty } from '../src/seed/seedData.js';

let app;
let officerToken = '';
let managerToken = '';
let customerToken = '';
let surveyorToken = '';
let surveyorUser = null;
let testClaim = null;

beforeAll(async () => {
  await connectDB();
  await seedDatabaseIfEmpty();
  app = createApp();

  // Login Officer
  const offRes = await request(app).post('/api/auth/login').send({
    email: 'officer@insureflow.com',
    password: 'Officer@123',
  });
  officerToken = offRes.body.token;

  // Login Manager
  const mgrRes = await request(app).post('/api/auth/login').send({
    email: 'manager@insureflow.com',
    password: 'Manager@123',
  });
  managerToken = mgrRes.body.token;

  // Login Customer
  const custRes = await request(app).post('/api/auth/login').send({
    email: 'customer@insureflow.com',
    password: 'Customer@123',
  });
  customerToken = custRes.body.token;

  // Login Surveyor
  const survRes = await request(app).post('/api/auth/login').send({
    email: 'surveyor@insureflow.com',
    password: 'Surveyor@123',
  });
  surveyorToken = survRes.body.token;
  surveyorUser = survRes.body.user;

  // Find or create a claim for assignment testing
  testClaim = await Claim.findOne({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } });
  if (!testClaim) {
    const polRes = await request(app)
      .get('/api/customer-policies/my')
      .set('Authorization', `Bearer ${customerToken}`);
    const policy = polRes.body.data[0];
    const incidentDate = new Date();
    incidentDate.setDate(incidentDate.getDate() - 3);

    const claimRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        customerPolicyId: policy._id,
        claimType: 'REIMBURSEMENT',
        incidentDate: incidentDate.toISOString(),
        incidentDescription: 'Front bumper and fender damage inspection required.',
        incidentLocation: 'City Center Intersection',
        requestedAmount: 25000,
      });
    testClaim = claimRes.body.data;
  }
});

afterAll(async () => {
  await closeDB();
});

describe('Surveyor Directory Retrieval and Assignment Workflow', () => {
  it('should allow Officer to query eligible surveyors via GET /api/users?role=SURVEYOR', async () => {
    const res = await request(app)
      .get('/api/users?role=SURVEYOR')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const devon = res.body.data.find((u) => u.email === 'surveyor@insureflow.com');
    expect(devon).toBeDefined();
    expect(devon.name).toBe('Devon Reed');
    expect(devon.role).toBe('SURVEYOR');
    expect(devon.isActive).toBe(true);
    // Security check: ensure no password hash is exposed
    expect(devon.password).toBeUndefined();
  });

  it('should allow Manager to query eligible surveyors', async () => {
    const res = await request(app)
      .get('/api/users?role=SURVEYOR')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should block Customers from listing users (RBAC check)', async () => {
    const res = await request(app)
      .get('/api/users?role=SURVEYOR')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should block unauthenticated requests from listing users', async () => {
    const res = await request(app).get('/api/users?role=SURVEYOR');

    expect(res.status).toBe(401);
  });

  it('should allow Officer to assign a surveyor to a claim', async () => {
    expect(testClaim).toBeDefined();
    expect(surveyorUser).toBeDefined();

    const survId = surveyorUser.id || surveyorUser._id;
    const res = await request(app)
      .post('/api/survey/assign')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        claimId: testClaim._id,
        surveyorId: survId,
        instructions: 'Perform physical inspection of damaged components and verify itemized invoice.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ASSIGNED');
    expect(res.body.data.surveyor.toString()).toBe(survId.toString());

    // Verify claim status updated in DB
    const updatedClaim = await Claim.findById(testClaim._id);
    expect(updatedClaim.assignedSurveyor.toString()).toBe(survId.toString());
    expect(updatedClaim.status).toBe('SURVEYOR_ASSIGNED');
  });

  it('should allow the assigned Surveyor to view the claim in their inspection list', async () => {
    const res = await request(app)
      .get('/api/survey/my-inspections')
      .set('Authorization', `Bearer ${surveyorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const match = res.body.data.find(
      (a) => a.claim?._id?.toString() === testClaim._id.toString()
    );
    expect(match).toBeDefined();
    expect(match.status).toBe('ASSIGNED');
  });
});
