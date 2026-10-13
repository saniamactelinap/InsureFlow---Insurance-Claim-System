import mongoose from 'mongoose';

const surveyReportSchema = new mongoose.Schema({
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    index: true,
  },
  surveyAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SurveyAssignment',
    required: true,
  },
  surveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  inspectionDate: {
    type: Date,
    required: true,
  },
  inspectionLocation: {
    type: String,
    required: true,
  },
  damageSummary: {
    type: String,
    required: true,
  },
  detailedFindings: {
    type: String,
    required: true,
  },
  estimatedRepairCost: {
    type: Number,
    required: true,
    min: 0,
  },
  recommendedSettlementAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  salvageValue: {
    type: Number,
    default: 0,
  },
  liabilityAssessment: {
    type: String,
    enum: ['TOTAL_LOSS', 'PARTIAL_LOSS', 'NO_INSURER_LIABILITY', 'THIRD_PARTY_FAULT', 'STANDARD_REPAIR'],
    default: 'PARTIAL_LOSS',
  },
  photographs: {
    type: [String],
    default: [],
  },
  reportDocumentUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED'],
    default: 'SUBMITTED',
  },
  revisionNotes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export const SurveyReport = mongoose.model('SurveyReport', surveyReportSchema);
