import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  userEmail: {
    type: String,
    default: 'system',
  },
  role: {
    type: String,
    default: 'SYSTEM',
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  resourceType: {
    type: String,
    required: true,
    index: true,
  },
  resourceId: {
    type: String,
    default: '',
    index: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
