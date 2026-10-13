import mongoose from 'mongoose';

const claimTimelineEventSchema = new mongoose.Schema({
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  performerRole: {
    type: String,
    default: 'SYSTEM',
  },
  previousStatus: {
    type: String,
    default: null,
  },
  newStatus: {
    type: String,
    default: null,
  },
  isCustomerVisible: {
    type: Boolean,
    default: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true,
});

export const ClaimTimelineEvent = mongoose.model('ClaimTimelineEvent', claimTimelineEventSchema);
