import mongoose from 'mongoose';

const claimDocumentSchema = new mongoose.Schema({
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    index: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  sizeBytes: {
    type: Number,
    required: true,
  },
  documentCategory: {
    type: String,
    enum: [
      'POLICY_DOCUMENT',
      'MEDICAL_BILL',
      'DISCHARGE_SUMMARY',
      'PRESCRIPTION',
      'VEHICLE_RC',
      'DRIVING_LICENSE',
      'REPAIR_ESTIMATE',
      'ACCIDENT_PHOTO',
      'IDENTITY_PROOF',
      'OTHER'
    ],
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ocrJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OCRJob',
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  verificationNotes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export const ClaimDocument = mongoose.model('ClaimDocument', claimDocumentSchema);
