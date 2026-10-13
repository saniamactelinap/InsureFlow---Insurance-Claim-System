import mongoose from 'mongoose';

const configurableRuleSchema = new mongoose.Schema({
  ruleId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['ELIGIBILITY', 'COVERAGE', 'DOCUMENTS', 'FRAUD_PREVENTION', 'WORKFLOW'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['BLOCKING', 'FLAGGED', 'INFO'],
    default: 'FLAGGED',
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  version: {
    type: Number,
    default: 1,
  }
}, {
  timestamps: true,
});

export const ConfigurableRule = mongoose.model('ConfigurableRule', configurableRuleSchema);
