import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  settlementReference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  approvedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ON_HOLD'],
    default: 'PENDING',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'CHEQUE', 'DIRECT_DEPOSIT'],
    default: 'BANK_TRANSFER',
  },
  beneficiaryDetails: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    routingOrIfsc: String,
  },
  paymentReference: {
    type: String,
    default: '',
  },
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorizedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  disbursementNotes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export const Settlement = mongoose.model('Settlement', settlementSchema);
