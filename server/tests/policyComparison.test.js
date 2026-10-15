import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { PolicyProduct } from '../src/models/PolicyProduct.js';
import { seedPolicyProducts } from '../src/seed/seedData.js';

let app;

beforeAll(async () => {
  await connectDB();
  app = createApp();
  await seedPolicyProducts();
});

afterAll(async () => {
  await closeDB();
});

describe('Policy Comparison Integration Tests', () => {
  let productA;
  let productB;
  let productC;
  let unpublishedProduct;

  beforeAll(async () => {
    // Retrieve published seeded products
    const products = await PolicyProduct.find({ isPublished: true }).limit(3);
    productA = products[0];
    productB = products[1];
    productC = products[2];

    // Create a temporary unpublished product to test access control and exclusion
    unpublishedProduct = await PolicyProduct.create({
      productName: 'Secret Draft Policy',
      insurer: 'Confidential Underwriters',
      category: 'HEALTH',
      planCode: 'HLTH-SECRET-99',
      description: 'Unpublished draft policy for internal testing.',
      coverageLimit: 5000000,
      deductible: 5000,
      annualPremium: 50000,
      durationMonths: 12,
      isPublished: false,
      keyBenefits: ['Confidential Benefit'],
      exclusions: ['All Public Access'],
    });
  });

  afterAll(async () => {
    if (unpublishedProduct && unpublishedProduct._id) {
      await PolicyProduct.deleteOne({ _id: unpublishedProduct._id });
    }
  });

  describe('Validation & Edge Cases', () => {
    it('1. should return 400 when no ids query parameter is provided', async () => {
      const res = await request(app).get('/api/policy-products/compare');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/policy (?:ids|identifiers) required/i);
    });

    it('2. should return 400 when ids query parameter is empty string or only whitespace', async () => {
      const res = await request(app).get('/api/policy-products/compare?ids=%20%20');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/policy (?:ids|identifiers) required/i);
    });

    it('3. should return 400 when more than four policy ids are provided', async () => {
      const res = await request(app).get('/api/policy-products/compare?ids=ID1,ID2,ID3,ID4,ID5');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/maximum of 4 policies/i);
    });

    it('4. should return 404 when requested policies do not exist in the catalog', async () => {
      const fakeId1 = '507f1f77bcf86cd799439011';
      const fakeId2 = '507f1f77bcf86cd799439012';
      const res = await request(app).get(`/api/policy-products/compare?ids=${fakeId1},${fakeId2}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/could not be found or have been unpublished/i);
    });

    it('5. should return 404 when only unpublished policies are requested', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${unpublishedProduct._id}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/could not be found or have been unpublished/i);
    });

    it('6. should exclude unpublished policies and report missingCount when mixed with published policies', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productA._id},${unpublishedProduct._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.requestedCount).toBe(2);
      expect(res.body.missingCount).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(productA._id.toString());
      // Ensure unpublished product data is NOT leaked
      const hasUnpublished = res.body.data.some((p) => p.planCode === 'HLTH-SECRET-99');
      expect(hasUnpublished).toBe(false);
    });
  });

  describe('Successful Comparison & Identifier Resolution', () => {
    it('7. should compare two products by MongoDB ObjectIds and preserve requested order', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productA._id},${productB._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);

      // Verify order matches requested: productA first, then productB
      expect(res.body.data[0]._id.toString()).toBe(productA._id.toString());
      expect(res.body.data[1]._id.toString()).toBe(productB._id.toString());
      expect(res.body.data[0].planCode).toBe(productA.planCode);
      expect(res.body.data[1].planCode).toBe(productB.planCode);
    });

    it('8. should preserve reverse order when requested in reverse', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productB._id},${productA._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0]._id.toString()).toBe(productB._id.toString());
      expect(res.body.data[1]._id.toString()).toBe(productA._id.toString());
    });

    it('9. should compare two products by custom planCode identifiers', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productA.planCode},${productB.planCode}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0].planCode).toBe(productA.planCode);
      expect(res.body.data[1].planCode).toBe(productB.planCode);
    });

    it('10. should compare products using mixed identifiers (ObjectId + planCode)', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productA._id},${productB.planCode}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data[0]._id.toString()).toBe(productA._id.toString());
      expect(res.body.data[1].planCode).toBe(productB.planCode);
    });

    it('11. should return complete schema comparison fields for each product', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productA._id},${productB._id}`);
      expect(res.status).toBe(200);
      const plan = res.body.data[0];

      expect(plan).toHaveProperty('productName');
      expect(plan).toHaveProperty('insurer');
      expect(plan).toHaveProperty('category');
      expect(plan).toHaveProperty('planCode');
      expect(plan).toHaveProperty('coverageLimit');
      expect(plan).toHaveProperty('annualPremium');
      expect(plan).toHaveProperty('deductible');
      expect(plan).toHaveProperty('keyBenefits');
      expect(Array.isArray(plan.keyBenefits)).toBe(true);
      expect(plan).toHaveProperty('eligibilityCriteria');
      expect(Array.isArray(plan.eligibilityCriteria)).toBe(true);
      expect(plan).toHaveProperty('exclusions');
      expect(Array.isArray(plan.exclusions)).toBe(true);
      expect(plan.isPublished).toBe(true);
    });

    it('12. should support comparing 3 or 4 products simultaneously', async () => {
      const res = await request(app).get(`/api/policy-products/compare?ids=${productA._id},${productB._id},${productC._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].planCode).toBe(productA.planCode);
      expect(res.body.data[1].planCode).toBe(productB.planCode);
      expect(res.body.data[2].planCode).toBe(productC.planCode);
    });
  });

  describe('Single Product Route Compatibility', () => {
    it('13. should resolve single product by MongoDB ObjectId', async () => {
      const res = await request(app).get(`/api/policy-products/${productA._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.planCode).toBe(productA.planCode);
    });

    it('14. should resolve single product by planCode', async () => {
      const res = await request(app).get(`/api/policy-products/${productA.planCode}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(productA._id.toString());
    });

    it('15. should return 404 for non-existent product identifier in single-product route', async () => {
      const res = await request(app).get('/api/policy-products/NONEXISTENT-CODE');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
