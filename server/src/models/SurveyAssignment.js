import mongoose from 'mongoose';

const surveyAssignmentSchema = new mongoose.Schema({
  claim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    index: true,
  },
  surveyor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledDate: {
    type: Date,
    default: null,
  },
  inspectionLocation: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['ASSIGNED', 'INSPECTION_SCHEDULED', 'INSPECTION_IN_PROGRESS', 'REPORT_SUBMITTED', 'RETURNED_FOR_CORRECTION', 'COMPLETED'],
    default: 'ASSIGNED',
    index: true,
  },
  instructions: {
    type: String,
    default: '',
  },
  dueDate: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

export const SurveyAssignment = mongoose.model('SurveyAssignment', surveyAssignmentSchema);
