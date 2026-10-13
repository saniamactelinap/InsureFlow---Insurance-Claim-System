import mongoose from 'mongoose';

const customerPolicySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  policySource: {
    type: String,
    enum: ['PLATFORM', 'EXTERNAL'],
    required: true,
    default: 'PLATFORM',
    index: true,
  },
  policyNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PolicyProduct',
    default: null,
  },
  insurerName: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['HEALTH', 'VEHICLE', 'PROPERTY'],
    required: true,
  },
  policyholderName: {
    type: String,
    required: true,
  },
  coverageAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  deductible: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: function() {
      return this.policySource === 'PLATFORM' ? 'VERIFIED' : 'PENDING';
    },
    index: true,
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
  policyDocumentUrl: {
    type: String,
    default: '',
  },
  externalVerificationNotes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE',
  }
}, {
  timestamps: true,
});

export const CustomerPolicy = mongoose.model('CustomerPolicy', customerPolicySchema);
