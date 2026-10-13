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
    enum: ['tesseract', 'cloud_vision', 'simulated_fallback'],
    default: 'tesseract',
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  confidenceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  rawText: {
    type: String,
    default: '',
  },
  extractedFields: {
    documentNumber: { type: String, default: '' },
    invoiceOrBillNumber: { type: String, default: '' },
    detectedDate: { type: String, default: '' },
    detectedAmount: { type: Number, default: 0 },
    issuerName: { type: String, default: '' },
    policyNumberFound: { type: String, default: '' },
    patientOrVehicleId: { type: String, default: '' },
    diagnosesOrDamageKeywords: { type: [String], default: [] },
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
  }
}, {
  timestamps: true,
});

export const OCRJob = mongoose.model('OCRJob', ocrJobSchema);
