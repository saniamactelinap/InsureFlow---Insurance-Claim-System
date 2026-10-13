import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'CLAIM_SUBMITTED',
      'CLAIM_UPDATE',
      'DOCUMENT_REQUIRED',
      'DOCUMENT_UPLOADED',
      'OCR_COMPLETED',
      'SURVEYOR_ASSIGNED',
      'SURVEY_REPORT_SUBMITTED',
      'CLAIM_APPROVED',
      'CLAIM_REJECTED',
      'SETTLEMENT_CREATED',
      'SETTLEMENT_PROCESSED',
      'SYSTEM'
    ],
    default: 'CLAIM_UPDATE',
    index: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  link: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true,
});

export const Notification = mongoose.model('Notification', notificationSchema);
