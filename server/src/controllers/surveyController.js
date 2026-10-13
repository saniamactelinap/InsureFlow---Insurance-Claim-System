import { SurveyAssignment } from '../models/SurveyAssignment.js';
import { SurveyReport } from '../models/SurveyReport.js';
import { Claim } from '../models/Claim.js';
import { stateMachineService } from '../services/stateMachineService.js';
import { notificationService } from '../services/notificationService.js';
import { auditService } from '../services/auditService.js';

export const assignSurveyor = async (req, res, next) => {
  try {
    const { claimId, surveyorId, instructions, dueDate, inspectionLocation } = req.body;

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    claim.assignedSurveyor = surveyorId;
    await claim.save();

    const assignment = await SurveyAssignment.create({
      claim: claim._id,
      surveyor: surveyorId,
      assignedBy: req.user._id,
      instructions: instructions || 'Conduct thorough technical inspection and submit repair assessment report.',
      dueDate: dueDate ? new Date(dueDate) : null,
      inspectionLocation: inspectionLocation || claim.incidentLocation || '',
      status: 'ASSIGNED',
    });

    await stateMachineService.transition(claim._id, 'SURVEYOR_ASSIGNED', req.user, {
      notes: `Surveyor assigned for technical assessment.`,
    });

    await notificationService.notifyUser(surveyorId, {
      title: `New Survey Inspection Assigned: ${claim.claimReference}`,
      message: `You have been assigned to inspect Claim ${claim.claimReference}. Instructions: ${assignment.instructions}`,
      type: 'SURVEYOR_ASSIGNED',
      link: `/surveyor/inspections/${assignment._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Surveyor assigned successfully.',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAssignedInspections = async (req, res, next) => {
  try {
    const assignments = await SurveyAssignment.find({ surveyor: req.user._id })
      .populate({
        path: 'claim',
        populate: [
          { path: 'customer', select: 'name email phone' },
          { path: 'customerPolicy', select: 'policyNumber insurerName category' },
        ]
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleInspection = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { scheduledDate, inspectionLocation } = req.body;

    const assignment = await SurveyAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    assignment.scheduledDate = new Date(scheduledDate);
    if (inspectionLocation) assignment.inspectionLocation = inspectionLocation;
    assignment.status = 'INSPECTION_SCHEDULED';
    await assignment.save();

    await stateMachineService.transition(assignment.claim, 'INSPECTION_IN_PROGRESS', req.user, {
      notes: `Inspection scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${assignment.inspectionLocation}.`,
    });

    res.json({
      success: true,
      message: 'Inspection date scheduled successfully.',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const submitSurveyReport = async (req, res, next) => {
  try {
    const {
      assignmentId,
      inspectionDate,
      inspectionLocation,
      damageSummary,
      detailedFindings,
      estimatedRepairCost,
      recommendedSettlementAmount,
      salvageValue,
      liabilityAssessment,
    } = req.body;

    const assignment = await SurveyAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Survey assignment not found.' });
    }

    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map(f => `/uploads/${f.filename}`);
    }

    const report = await SurveyReport.create({
      claim: assignment.claim,
      surveyAssignment: assignment._id,
      surveyor: req.user._id,
      inspectionDate: new Date(inspectionDate || Date.now()),
      inspectionLocation: inspectionLocation || assignment.inspectionLocation,
      damageSummary,
      detailedFindings,
      estimatedRepairCost: Number(estimatedRepairCost),
      recommendedSettlementAmount: Number(recommendedSettlementAmount),
      salvageValue: Number(salvageValue || 0),
      liabilityAssessment: liabilityAssessment || 'PARTIAL_LOSS',
      photographs: photos,
      status: 'SUBMITTED',
    });

    assignment.status = 'REPORT_SUBMITTED';
    await assignment.save();

    await stateMachineService.transition(assignment.claim, 'SURVEY_REPORT_SUBMITTED', req.user, {
      notes: `Survey report submitted by inspector. Recommended amount: $${Number(recommendedSettlementAmount).toLocaleString()}.`,
    });

    await auditService.log(req, 'SUBMIT_SURVEY_REPORT', 'SurveyReport', report._id, {
      recommendedAmount: report.recommendedSettlementAmount,
    });

    res.status(201).json({
      success: true,
      message: 'Survey report submitted successfully.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportsByClaim = async (req, res, next) => {
  try {
    const reports = await SurveyReport.find({ claim: req.params.claimId })
      .populate('surveyor', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};
