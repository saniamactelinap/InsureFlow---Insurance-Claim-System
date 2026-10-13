import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  claimReference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  customerPolicy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerPolicy',
    required: true,
    index: true,
  },
  policySource: {
    type: String,
    enum: ['PLATFORM', 'EXTERNAL'],
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['HEALTH', 'VEHICLE', 'PROPERTY'],
    required: true,
    index: true,
  },
  claimType: {
    type: String,
    required: true,
    default: 'REIMBURSEMENT',
  },
  incidentDate: {
    type: Date,
    required: true,
  },
  incidentDescription: {
    type: String,
    required: true,
  },
  incidentLocation: {
    type: String,
    default: '',
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  approvedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'SUBMITTED',
      'DOCUMENT_PROCESSING',
      'DOCUMENTS_REQUIRED',
      'UNDER_REVIEW',
      'SURVEYOR_ASSIGNED',
      'INSPECTION_IN_PROGRESS',
      'SURVEY_REPORT_SUBMITTED',
      'MANAGER_REVIEW',
      'APPROVED',
      'REJECTED',
      'SETTLEMENT_PENDING',
      'SETTLEMENT_PROCESSING',
      'SETTLED',
      'CLOSED'
    ],
    default: 'SUBMITTED',
    index: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  assignedSurveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  ocrStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED', 'FAILED'],
    default: 'NOT_STARTED',
  },
  automatedValidation: {
    status: {
      type: String,
      enum: ['PENDING', 'PASS', 'FAIL', 'FLAGGED', 'REQUIRES_REVIEW'],
      default: 'PENDING',
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    rules: [{
      ruleId: String,
      name: String,
      status: {
        type: String,
        enum: ['PASS', 'FAIL', 'FLAGGED', 'REQUIRES_REVIEW', 'PENDING'],
      },
      reason: String,
      evidence: mongoose.Schema.Types.Mixed,
      severity: String,
    }],
  },
  officerNotes: {
    type: String,
    default: '',
  },
  customerNotes: {
    type: String,
    default: '',
  },
  managerNotes: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  missingDocumentsRequested: {
    type: [String],
    default: [],
  },
  isDuplicateWarning: {
    type: Boolean,
    default: false,
  },
  isHighValueClaim: {
    type: Boolean,
    default: false,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  settledAt: {
    type: Date,
    default: null,
  },
  closedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

export const Claim = mongoose.model('Claim', claimSchema);
