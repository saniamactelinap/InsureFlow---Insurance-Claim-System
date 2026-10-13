import mongoose from 'mongoose';

const policyApplicationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PolicyProduct',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  },
  applicantDetails: {
    fullName: String,
    dateOfBirth: Date,
    address: String,
    nomineeName: String,
    nomineeRelationship: String,
    healthDeclaration: String,
    vehicleDetails: {
      registrationNumber: String,
      makeModel: String,
      manufactureYear: Number,
    },
    propertyDetails: {
      propertyAddress: String,
      propertyType: String,
      estimatedValue: Number,
    }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  issuedPolicy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerPolicy',
    default: null,
  },
  reviewNotes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export const PolicyApplication = mongoose.model('PolicyApplication', policyApplicationSchema);
