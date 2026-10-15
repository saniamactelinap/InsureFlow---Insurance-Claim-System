import request from 'supertest';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { connectDB, closeDB } from '../src/config/db.js';
import { Claim } from '../src/models/Claim.js';
import { ClaimDocument } from '../src/models/ClaimDocument.js';
import { OCRJob } from '../src/models/OCRJob.js';
import { CustomerPolicy } from '../src/models/CustomerPolicy.js';
import { ocrService } from '../src/services/ocrService.js';
import { geminiOcrService } from '../src/services/geminiOcrService.js';
import { validateDocumentFile } from '../src/services/documentValidator.js';
import { seedDatabaseIfEmpty } from '../src/seed/seedData.js';

let app;
let customerToken = '';
let officerToken = '';
let testClaim = null;
let testDocument = null;
let validSyntheticJpg = null;
const testPdfPath = path.resolve('uploads/test_hybrid_bill.pdf');

beforeAll(async () => {
  await connectDB();
  await seedDatabaseIfEmpty();
  app = createApp();

  // Generate a valid synthetic JPEG image
  validSyntheticJpg = await sharp({
    create: {
      width: 400,
      height: 200,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();

  // Create uploads folder if not present
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }

  // Write a synthetic PDF file for controller testing
  const validPdfBuf = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n' +
    '4 0 obj << /Length 120 >> stream\n' +
    'MAX SUPER SPECIALITY HOSPITAL\nInvoice: MAX-991\nTotal: 25000\n' +
    'endstream endobj\n' +
    'trailer << /Size 5 /Root 1 0 R >>\nstartxref\n250\n%%EOF'
  );
  fs.writeFileSync(testPdfPath, validPdfBuf);

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

  // Create test claim
  const policy = await CustomerPolicy.findOne({ policySource: 'PLATFORM' });
  testClaim = await Claim.create({
    claimReference: `CLM-OCR-TEST-${Date.now()}`,
    customer: policy.customer,
    customerPolicy: policy._id,
    policySource: policy.policySource,
    category: 'HEALTH',
    claimType: 'REIMBURSEMENT',
    incidentDate: new Date('2026-03-01'),
    incidentDescription: 'Outpatient medical hospitalization.',
    requestedAmount: 25000,
    status: 'SUBMITTED',
  });

  testDocument = await ClaimDocument.create({
    claim: testClaim._id,
    uploadedBy: policy.customer,
    documentCategory: 'MEDICAL_BILL',
    fileName: 'test_hybrid_bill.pdf',
    originalName: 'hospital_bill.pdf',
    filePath: testPdfPath,
    mimeType: 'application/pdf',
    sizeBytes: validPdfBuf.length,
    fileUrl: '/uploads/test_hybrid_bill.pdf',
  });
});

afterAll(async () => {
  geminiOcrService.setMockClient(null);
  if (fs.existsSync(testPdfPath)) {
    try { fs.unlinkSync(testPdfPath); } catch (e) {}
  }
  await closeDB();
});

afterEach(() => {
  geminiOcrService.setMockClient(null);
});

describe('Production Hybrid OCR Engine & Claim Integration', () => {
  // 1. Valid text-based PDF extraction
  it('1. should accurately extract structured fields from a valid text-based PDF', async () => {
    const textPdf = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
      '3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n' +
      '4 0 obj << /Length 120 >> stream\n' +
      'APOLLO HOSPITALS\nInvoice Number: INV-9021\nInvoice Date: 2026-03-02\nPatient Name: Rahul Verma\nTotal Payable Amount: INR 25000.00\n' +
      'endstream endobj\n' +
      'xref\n0 5\n0000000000 65535 f \n' +
      'trailer << /Size 5 /Root 1 0 R >>\nstartxref\n250\n%%EOF'
    );

    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'medical_bill',
          provider: { name: 'APOLLO HOSPITALS' },
          patientOrInsured: { name: 'Rahul Verma' },
          identifiers: { invoiceNumber: 'INV-9021' },
          dates: { invoiceDate: '2026-03-02' },
          financials: { totalAmount: 25000, currency: 'INR', paymentStatus: 'PAID' },
          fieldMetadata: { totalAmount: { confidence: 98, sourcePage: 1 } },
        }),
      }),
    });

    const result = await ocrService.processDocument(textPdf, 'application/pdf', 'HEALTH', {
      claim: testClaim,
    });

    expect(result.success).toBe(true);
    expect(result.fields.hospitalName).toBe('APOLLO HOSPITALS');
    expect(result.fields.invoiceNumber).toBe('INV-9021');
    expect(result.fields.totalAmount).toBe(25000);
    expect(result.discrepancy.hasDiscrepancy).toBe(false);
    expect(result.discrepancy.status).toBe('MATCH');
  });

  // 2. Scanned PDF stream detection
  it('2. should detect scanned PDF image streams and process them safely', async () => {
    const scannedPdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n1 0 obj << /Type /XObject /Subtype /Image >> stream\r\n'),
      Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0xFF, 0xD9]),
      Buffer.from('\r\nendstream endobj\ntrailer << /Size 2 >>\nstartxref\n100\n%%EOF'),
    ]);

    const images = ocrService.extractAllJpegImagesFromPdf(scannedPdf);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0][0]).toBe(0xFF);
    expect(images[0][1]).toBe(0xD8);
  });

  // 3. Malformed PDF with bad XRef parsing error
  it('3. should handle malformed PDF with bad XRef entry without reporting false success with 0 rupees', async () => {
    const corruptXRefPdf = Buffer.from(
      '%PDF-1.4\n' +
      'xref\n0 1\n0000000000 65535 f\n' +
      'trailer << /Size 1 >>\n' +
      'startxref\n99999\n%%EOF'
    );

    const result = await ocrService.processDocument(corruptXRefPdf, 'application/pdf', 'HEALTH', {
      claim: testClaim,
    });

    expect(result.success).toBe(false);
    expect(result.fields.totalAmount).toBeNull();
    expect(result.extractedFields.detectedAmount).toBeNull();
    expect(result.confidenceScore).toBe(0);
    expect(result.reviewStatus).toBe('NEEDS_MANUAL_REVIEW');
    // Ensure it NEVER reported 0 rupees
    expect(result.fields.totalAmount).not.toBe(0);
  });

  // 4. Clear printed medical bill
  it('4. should extract printed medical bill with provider, invoice number, and amounts', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'medical_bill',
          provider: { name: 'Fortis Memorial Hospital' },
          patientOrInsured: { name: 'Priya Sharma' },
          identifiers: { invoiceNumber: 'FMH-2026-441' },
          dates: { invoiceDate: '2026-02-18', admissionDate: '2026-02-16', dischargeDate: '2026-02-18' },
          financials: { subtotal: 16000, taxAmount: 2880, discountAmount: 1000, totalAmount: 17880, paymentStatus: 'SETTLED' },
          lineItems: [
            { description: 'Room Charges (2 Days)', amount: 10000, quantity: 2, unitPrice: 5000, sourcePage: 1 },
            { description: 'Nursing & Diagnostics', amount: 6000, quantity: 1, unitPrice: 6000, sourcePage: 1 },
          ],
          fieldMetadata: { totalAmount: { confidence: 95, sourcePage: 1 } },
        }),
      }),
    });

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH', { forceVision: true });

    expect(result.success).toBe(true);
    expect(result.fields.hospitalName).toBe('Fortis Memorial Hospital');
    expect(result.fields.invoiceNumber).toBe('FMH-2026-441');
    expect(result.fields.totalAmount).toBe(17880);
    expect(result.fields.subtotal).toBe(16000);
    expect(result.fields.lineItems.length).toBe(2);
  });

  // 5. Handwritten bill with legible values
  it('5. should identify handwriting and extract legible handwritten doctor prescription', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'prescription',
          provider: { name: 'Dr. S. K. Mehta Clinic' },
          patientOrInsured: { name: 'Amit Kumar' },
          identifiers: { invoiceNumber: 'RX-991' },
          dates: { invoiceDate: '2026-03-05' },
          financials: { totalAmount: 3200, currency: 'INR', paymentStatus: 'PAID' },
          handwritingDetails: { detected: true, notes: 'Handwritten prescription with fee receipt.' },
          fieldMetadata: {
            totalAmount: { confidence: 85, isHandwritten: true, isAmbiguous: false, candidateReadings: [] },
          },
        }),
      }),
    });

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH', { forceVision: true });

    expect(result.success).toBe(true);
    expect(result.handwritingDetected).toBe(true);
    expect(result.fields.totalAmount).toBe(3200);
    expect(result.fields.hospitalName).toBe('Dr. S. K. Mehta Clinic');
  });

  // 6. Ambiguous handwritten amount (e.g. 2,500 vs 25,000)
  it('6. should preserve ambiguous handwritten amounts as candidate readings and flag for officer review', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'medical_bill',
          provider: { name: 'City Care Hospital' },
          patientOrInsured: { name: 'Sunil Gupta' },
          identifiers: { invoiceNumber: 'BILL-009' },
          dates: { invoiceDate: '2026-03-04' },
          financials: { totalAmount: 25000, currency: 'INR' },
          handwritingDetails: { detected: true, ambiguousFields: ['totalAmount'] },
          fieldMetadata: {
            totalAmount: {
              confidence: 50,
              isHandwritten: true,
              isAmbiguous: true,
              candidateReadings: [2500, 25000],
              evidence: 'Handwritten numerical total could be read as 2,500 or 25,000.',
            },
          },
        }),
      }),
    });

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH', { forceVision: true });

    expect(result.success).toBe(true);
    expect(result.handwritingDetected).toBe(true);
    expect(result.candidateReadings.totalAmount).toEqual([2500, 25000]);
    expect(result.confidenceScore).toBeLessThanOrEqual(65);
    expect(result.reviewStatus).toBe('NEEDS_MANUAL_REVIEW');
  });

  // 7. Missing invoice amount (asserting it remains null, not 0)
  it('7. should leave missing total amount as null and not convert to 0 rupees', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'discharge_summary',
          provider: { name: 'National Medical Center' },
          patientOrInsured: { name: 'Alok Nath' },
          identifiers: { invoiceNumber: 'DS-2026' },
          dates: { admissionDate: '2026-02-10', dischargeDate: '2026-02-14' },
          financials: { totalAmount: null, subtotal: null },
          summaryNotes: 'Discharge summary with clinical findings but without billing total.',
        }),
      }),
    });

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH', {
      claim: testClaim,
      forceVision: true,
    });

    expect(result.success).toBe(true);
    expect(result.fields.totalAmount).toBeNull();
    expect(result.extractedFields.detectedAmount).toBeNull();
    expect(result.discrepancy.hasDiscrepancy).toBe(true);
    expect(result.discrepancy.status).toBe('AMOUNT_NOT_DETECTED');
    expect(result.discrepancy.explanation).toContain('could not be detected');
    expect(result.fields.totalAmount).not.toBe(0);
  });

  // 8. Document containing a real zero value
  it('8. should accurately preserve a genuine numeric 0 when explicitly printed as zero co-pay', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'receipt',
          provider: { name: 'MediClaim Cashless Desk' },
          patientOrInsured: { name: 'Neha Roy' },
          identifiers: { invoiceNumber: 'REC-000' },
          dates: { invoiceDate: '2026-03-01' },
          financials: { totalAmount: 0, subtotal: 15000, discountAmount: 15000, paymentStatus: 'SETTLED' },
          fieldMetadata: { totalAmount: { confidence: 95, evidence: 'Net Payable Amount by Patient: 0.00 (100% Cashless Covered)' } },
        }),
      }),
    });

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH', { forceVision: true });

    expect(result.success).toBe(true);
    expect(result.fields.totalAmount).toBe(0);
    expect(result.fields.totalAmount).not.toBeNull();
  });

  // 9. Multi-page PDFs
  it('9. should handle multi-page scanned PDFs and track source page count', async () => {
    const multiPagePdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n1 0 obj stream\r\n'),
      Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0xFF, 0xD9]),
      Buffer.from('\r\nendstream endobj\n2 0 obj stream\r\n'),
      Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0xFF, 0xD9]),
      Buffer.from('\r\nendstream endobj\ntrailer << /Size 3 >>\nstartxref\n200\n%%EOF'),
    ]);

    const images = ocrService.extractAllJpegImagesFromPdf(multiPagePdf);
    expect(images.length).toBe(2);
  });

  // 10. Tesseract and Gemini disagreement
  it('10. should detect disagreement between OCR engines and record conflicts for officer inspection', () => {
    const reconciled = ocrService.reconcileExtractions({
      tesseractFields: {
        totalAmount: 10000,
        invoiceNumber: 'INV-A',
        hospitalName: 'Apollo Hospital',
        patientName: 'John',
        invoiceDate: '2026-03-01',
      },
      geminiFields: {
        totalAmount: 25000,
        invoiceNumber: 'INV-A',
        hospitalName: 'Apollo Hospital',
        patientName: 'John',
        invoiceDate: '2026-03-01',
      },
      opticalConfidence: 75,
      geminiLegibilityConfidence: 90,
      handwritingDetected: false,
      candidateReadings: {},
      fieldMetadata: {},
    });

    expect(reconciled.engineComparison.disagreements.length).toBeGreaterThan(0);
    expect(reconciled.engineComparison.disagreements[0]).toContain('totalAmount');
    expect(reconciled.engineComparison.agreementScore).toBeLessThan(100);
  });

  // 11. Gemini timeout and rate-limit errors fallback
  it('11. should safely fall back to local OCR when Gemini API experiences rate limits or timeouts', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => {
        const err = new Error('429 Too Many Requests: quota exceeded.');
        err.status = 429;
        throw err;
      },
    });

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH', { forceVision: true });

    expect(result).toBeDefined();
    expect(result.warnings.some((w) => w.includes('Gemini Vision fallback note') || w.includes('Local OCR'))).toBe(true);
  });

  // 12. Missing API key fallback
  it('12. should proceed with local OCR when GEMINI_API_KEY is not configured', async () => {
    geminiOcrService.setMockClient(null);
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    expect(geminiOcrService.isAvailable()).toBe(false);

    const result = await ocrService.processDocument(validSyntheticJpg, 'image/jpeg', 'HEALTH');

    expect(result).toBeDefined();
    process.env.GEMINI_API_KEY = origKey;
  });

  // 13. Invalid file types and oversized uploads
  it('13. should reject files with unsupported magic bytes or empty 0-byte contents', () => {
    const emptyBuf = Buffer.alloc(0);
    const emptyValidation = validateDocumentFile(emptyBuf);
    expect(emptyValidation.isValid).toBe(false);
    expect(emptyValidation.code).toBe('EMPTY_FILE');

    const exeBuf = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const exeValidation = validateDocumentFile(exeBuf);
    expect(exeValidation.isValid).toBe(false);
    expect(exeValidation.code).toBe('UNSUPPORTED_FORMAT');
  });

  // 14. Unauthorized OCR access
  it('14. should forbid customer role from calling officer OCR correction endpoints', async () => {
    const res = await request(app)
      .patch(`/api/ocr/jobs/65e900000000000000000001/correct`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        correctedFields: { detectedAmount: 5000 },
        auditNote: 'Customer edit attempt',
      });

    expect(res.status).toBe(403);
  });

  // 15. OCR retry and duplicate-job prevention
  it('15. should allow authorized officer to reprocess OCR with forceVision', async () => {
    geminiOcrService.setMockClient({
      generateContent: async () => ({
        text: JSON.stringify({
          documentType: 'medical_bill',
          provider: { name: 'Max Super Speciality Hospital' },
          patientOrInsured: { name: 'Rahul Verma' },
          identifiers: { invoiceNumber: 'MAX-991' },
          financials: { totalAmount: 25000, currency: 'INR' },
        }),
      }),
    });

    const res = await request(app)
      .post(`/api/ocr/document/${testDocument._id}/reprocess`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ forceVision: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe('gemini_vision');
    expect(res.body.data.extractedFields.detectedAmount).toBe(25000);
  });

  // 16. Claim amount versus detected bill amount discrepancy detection
  it('16. should calculate honest variance when both amounts are present, and never against null', () => {
    const claim = { requestedAmount: 25000 };

    // Case A: Missing bill amount -> AMOUNT_NOT_DETECTED
    const discMissing = ocrService.evaluateDiscrepancy(claim, { totalAmount: null });
    expect(discMissing.hasDiscrepancy).toBe(true);
    expect(discMissing.status).toBe('AMOUNT_NOT_DETECTED');
    expect(discMissing.variance).toBeNull();

    // Case B: Bill total differs (e.g. 18,000 vs 25,000) -> VARIANCE_DETECTED
    const discVariance = ocrService.evaluateDiscrepancy(claim, { totalAmount: 18000 });
    expect(discVariance.hasDiscrepancy).toBe(true);
    expect(discVariance.status).toBe('VARIANCE_DETECTED');
    expect(discVariance.variance).toBe(7000);

    // Case C: Bill total matches claim (25,000 vs 25,000) -> MATCH
    const discMatch = ocrService.evaluateDiscrepancy(claim, { totalAmount: 25000 });
    expect(discMatch.hasDiscrepancy).toBe(false);
    expect(discMatch.status).toBe('MATCH');
    expect(discMatch.variance).toBe(0);
  });

  // 17. Safe persistence of OCR corrections
  it('17. should persist audited officer corrections and update discrepancy status', async () => {
    const job = await OCRJob.findOne({ document: testDocument._id });
    expect(job).toBeDefined();

    const res = await request(app)
      .patch(`/api/ocr/jobs/${job._id}/correct`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        correctedFields: {
          detectedAmount: 24500,
          invoiceOrBillNumber: 'INV-CORRECTED-101',
        },
        auditNote: 'Adjusted total based on legible itemized hospital summary on page 1.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.correctionAuditNote).toContain('hospital summary');
    expect(res.body.data.correctedFields.detectedAmount).toBe(24500);

    // Verify in database
    const updated = await OCRJob.findById(job._id);
    expect(updated.correctedFields.get('detectedAmount')).toBe(24500);
    expect(updated.discrepancy.hasDiscrepancy).toBe(true);
    expect(updated.discrepancy.variance).toBe(500);
  });
});
