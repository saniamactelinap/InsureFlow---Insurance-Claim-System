import mongoose from 'mongoose';

const ocrJobSchema = new mongoose.Schema({
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    index: true,
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClaimDocument',
    required: true,
  },
  provider: {
    type: String,
    enum: [
      'tesseract',
      'gemini_vision',
      'hybrid',
      'cloud_vision',
      'simulated_fallback',
      'pdf_parse',
      'scanned_pdf_ocr',
      'unknown'
    ],
    default: 'tesseract',
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'NEEDS_REVIEW', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  confidenceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  opticalConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  fieldExtractionConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  reviewStatus: {
    type: String,
    enum: ['VERIFIED', 'NEEDS_MANUAL_REVIEW'],
    default: 'NEEDS_MANUAL_REVIEW',
  },
  documentType: {
    type: String,
    default: 'general_document',
  },
  handwritingDetected: {
    type: Boolean,
    default: false,
  },
  candidateReadings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  fieldMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  engineComparison: {
    tesseract: { type: mongoose.Schema.Types.Mixed, default: null },
    gemini: { type: mongoose.Schema.Types.Mixed, default: null },
    disagreements: { type: [String], default: [] },
    agreementScore: { type: Number, default: 100 },
  },
  discrepancy: {
    hasDiscrepancy: { type: Boolean, default: false },
    claimAmount: { type: Number, default: null },
    detectedAmount: { type: Number, default: null },
    variance: { type: Number, default: null },
    status: { type: String, default: 'NO_DISCREPANCY' },
    explanation: { type: String, default: '' },
  },
  rawText: {
    type: String,
    default: '',
  },
  extractedFields: {
    documentNumber: { type: String, default: null },
    invoiceOrBillNumber: { type: String, default: null },
    detectedDate: { type: String, default: null },
    detectedAmount: { type: Number, default: null },
    issuerName: { type: String, default: null },
    policyNumberFound: { type: String, default: null },
    patientOrVehicleId: { type: String, default: null },
    diagnosesOrDamageKeywords: { type: [String], default: [] },
    // Structured extraction properties
    patientName: { type: String, default: null },
    hospitalName: { type: String, default: null },
    invoiceNumber: { type: String, default: null },
    invoiceDate: { type: String, default: null },
    admissionDate: { type: String, default: null },
    dischargeDate: { type: String, default: null },
    incidentOrServiceDate: { type: String, default: null },
    totalAmount: { type: Number, default: null },
    subtotal: { type: Number, default: null },
    taxAmount: { type: Number, default: null },
    discountAmount: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    vehicleRegistrationNumber: { type: String, default: null },
    paymentStatus: { type: String, default: null },
    diagnosis: { type: String, default: null },
    lineItems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    warnings: { type: [String], default: [] },
  },
  correctedFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  correctedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  correctedAt: {
    type: Date,
    default: null,
  },
  correctionAuditNote: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  processingDurationMs: {
    type: Number,
    default: 0,
  },
  sourcePagesCount: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

export const OCRJob = mongoose.model('OCRJob', ocrJobSchema);
