import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { Claim } from '../src/models/Claim.js';
import { CustomerPolicy } from '../src/models/CustomerPolicy.js';
import { ruleEngineService } from '../src/services/ruleEngineService.js';
import { seedDatabaseIfEmpty } from '../src/seed/seedData.js';

beforeAll(async () => {
  await connectDB();
  await seedDatabaseIfEmpty();
});

afterAll(async () => {
  await closeDB();
});

describe('Deterministic Automated Rule Engine Service', () => {
  let policy;

  beforeAll(async () => {
    policy = await CustomerPolicy.findOne({ policySource: 'PLATFORM' });
  });

  it('should PASS rules for valid claim within active dates and coverage', async () => {
    const validClaim = await Claim.create({
      claimReference: `CLM-TEST-${Date.now()}`,
      customer: policy.customer,
      customerPolicy: policy._id,
      policySource: policy.policySource,
      category: policy.category,
      incidentDate: new Date(),
      incidentDescription: 'Valid outpatient consultation within dates.',
      requestedAmount: 1200,
      status: 'SUBMITTED',
    });

    const { ClaimDocument } = await import('../src/models/ClaimDocument.js');
    await ClaimDocument.create({
      claim: validClaim._id,
      uploadedBy: policy.customer,
      documentCategory: 'MEDICAL_BILL',
      fileName: 'medical_invoice.pdf',
      originalName: 'medical_invoice.pdf',
      filePath: 'uploads/medical_invoice.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      fileUrl: '/uploads/medical_invoice.pdf'
    });

    const result = await ruleEngineService.evaluateClaim(validClaim._id);

    expect(result.status).toBe('PASS');
    expect(result.score).toBeGreaterThanOrEqual(70);

    const activeRule = result.rules.find(r => r.ruleId === 'RULE_ACTIVE_POLICY_ON_INCIDENT');
    expect(activeRule.status).toBe('PASS');

    const catRule = result.rules.find(r => r.ruleId === 'RULE_CATEGORY_MATCH');
    expect(catRule.status).toBe('PASS');

    const limitRule = result.rules.find(r => r.ruleId === 'RULE_COVERAGE_LIMIT');
    expect(limitRule.status).toBe('PASS');
  });

  it('should FAIL RULE_ACTIVE_POLICY_ON_INCIDENT if incident is outside policy window', async () => {
    const pastIncidentDate = new Date();
    pastIncidentDate.setFullYear(pastIncidentDate.getFullYear() - 5); // 5 years ago

    const expiredClaim = await Claim.create({
      claimReference: `CLM-PAST-${Date.now()}`,
      customer: policy.customer,
      customerPolicy: policy._id,
      policySource: policy.policySource,
      category: policy.category,
      incidentDate: pastIncidentDate,
      incidentDescription: 'Claim from years before policy initiation.',
      requestedAmount: 1500,
      status: 'SUBMITTED',
    });

    const result = await ruleEngineService.evaluateClaim(expiredClaim._id);

    expect(result.status).toBe('FAIL');
    const dateRule = result.rules.find(r => r.ruleId === 'RULE_ACTIVE_POLICY_ON_INCIDENT');
    expect(dateRule.status).toBe('FAIL');
  });

  it('should FLAG RULE_COVERAGE_LIMIT when requested amount exceeds policy coverage', async () => {
    const excessiveAmount = policy.coverageAmount + 50000;

    const overLimitClaim = await Claim.create({
      claimReference: `CLM-OVER-${Date.now()}`,
      customer: policy.customer,
      customerPolicy: policy._id,
      policySource: policy.policySource,
      category: policy.category,
      incidentDate: new Date(),
      incidentDescription: 'Claim exceeding total coverage threshold.',
      requestedAmount: excessiveAmount,
      status: 'SUBMITTED',
    });

    const result = await ruleEngineService.evaluateClaim(overLimitClaim._id);

    const limitRule = result.rules.find(r => r.ruleId === 'RULE_COVERAGE_LIMIT');
    expect(limitRule.status).toBe('FLAGGED');
  });
});
