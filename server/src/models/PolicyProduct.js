import mongoose from 'mongoose';

const policyProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  insurer: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['HEALTH', 'VEHICLE', 'PROPERTY'],
    required: true,
    index: true,
  },
  planCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  coverageLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  deductible: {
    type: Number,
    default: 0,
    min: 0,
  },
  annualPremium: {
    type: Number,
    required: true,
    min: 0,
  },
  durationMonths: {
    type: Number,
    default: 12,
  },
  eligibilityCriteria: {
    type: [String],
    default: [],
  },
  keyBenefits: {
    type: [String],
    default: [],
  },
  exclusions: {
    type: [String],
    default: [],
  },
  requiredDocuments: {
    type: [String],
    default: [],
  },
  officialUrl: {
    type: String,
    default: '',
    trim: true,
  },
  coverageTypeLabel: {
    type: String,
    default: 'Coverage Limit',
  },
  isDemonstration: {
    type: Boolean,
    default: true,
  },
  disclaimer: {
    type: String,
    default: 'Demonstration catalog only. Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer\'s current offering. Confirm all details against the official policy wording before purchasing or applying.',
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  version: {
    type: Number,
    default: 1,
  }
}, {
  timestamps: true,
});

export const PolicyProduct = mongoose.model('PolicyProduct', policyProductSchema);
