import { Claim } from '../models/Claim.js';
import { CustomerPolicy } from '../models/CustomerPolicy.js';
import { ClaimDocument } from '../models/ClaimDocument.js';
import { OCRJob } from '../models/OCRJob.js';
import { ClaimTimelineEvent } from '../models/ClaimTimelineEvent.js';
import { SurveyReport } from '../models/SurveyReport.js';
import { Settlement } from '../models/Settlement.js';
import { ocrService } from '../services/ocrService.js';
import { ruleEngineService } from '../services/ruleEngineService.js';
import { stateMachineService } from '../services/stateMachineService.js';
import { notificationService } from '../services/notificationService.js';
import { auditService } from '../services/auditService.js';

// Helper to generate reference: CLM-YYYYMMDD-XXXX
const generateClaimReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CLM-${dateStr}-${randomSuffix}`;
};

export const createClaim = async (req, res, next) => {
  try {
    const {
      customerPolicyId,
      claimType,
      incidentDate,
      incidentDescription,
      incidentLocation,
      requestedAmount,
    } = req.body;

    if (!customerPolicyId || !incidentDate || !incidentDescription || !requestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Policy, incident date, incident description, and requested amount are required.',
      });
    }

    const policy = await CustomerPolicy.findById(customerPolicyId);
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }

    // Verify policy belongs to customer
    if (String(policy.customer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Cannot file a claim on a policy you do not own.' });
    }

    const claimReference = generateClaimReference();

    const claim = await Claim.create({
      claimReference,
      customer: req.user._id,
      customerPolicy: policy._id,
      policySource: policy.policySource,
      category: policy.category,
      claimType: claimType || 'REIMBURSEMENT',
      incidentDate: new Date(incidentDate),
      incidentDescription,
      incidentLocation: incidentLocation || '',
      requestedAmount: Number(requestedAmount),
      status: 'SUBMITTED',
      ocrStatus: 'NOT_STARTED',
    });

    // Handle files if uploaded in multipart/form-data
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Document category can be derived from body or default
        const docCategory = req.body.documentCategory || 'MEDICAL_BILL';
        const doc = await ClaimDocument.create({
          claim: claim._id,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileUrl: `/uploads/${file.filename}`,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          documentCategory: docCategory,
          uploadedBy: req.user._id,
        });

        // Run OCR in background/inline
        try {
          claim.ocrStatus = 'IN_PROGRESS';
          await claim.save();

          const ocrResult = await ocrService.processDocument(file.path, file.mimetype, docCategory);

          const ocrJob = await OCRJob.create({
            claim: claim._id,
            document: doc._id,
            status: ocrResult.error ? 'FAILED' : 'COMPLETED',
            confidenceScore: ocrResult.confidenceScore,
            rawText: ocrResult.rawText,
            extractedFields: ocrResult.extractedFields,
            errorMessage: ocrResult.error || '',
            processingDurationMs: ocrResult.durationMs,
          });

          doc.ocrJob = ocrJob._id;
          await doc.save();
        } catch (ocrErr) {
          console.error('[OCR Async Warning]', ocrErr);
        }
      }

      claim.ocrStatus = 'COMPLETED';
      await claim.save();
    }

    // Run deterministic automated rules validation
    await ruleEngineService.evaluateClaim(claim._id);

    // Record initial timeline event
    await ClaimTimelineEvent.create({
      claim: claim._id,
      eventType: 'CLAIM_SUBMISSION',
      title: 'Claim Submitted Successfully',
      description: `Claim ${claim.claimReference} has been officially submitted by the policyholder.`,
      performedBy: req.user._id,
      performerRole: 'CUSTOMER',
      newStatus: 'SUBMITTED',
      isCustomerVisible: true,
    });

    await auditService.log(req, 'SUBMIT_CLAIM', 'Claim', claim._id, {
      claimReference: claim.claimReference,
      requestedAmount: claim.requestedAmount,
    });

    await notificationService.notifyUser(req.user._id, {
      title: `Claim ${claim.claimReference} Submitted`,
      message: `Your claim submission of $${claim.requestedAmount.toLocaleString()} has been received and queued for automated document verification.`,
      type: 'CLAIM_SUBMITTED',
      link: `/customer/claims/${claim._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ customer: req.user._id })
      .populate('customerPolicy', 'policyNumber insurerName category coverageAmount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

export const listClaims = async (req, res, next) => {
  try {
    const {
      status,
      category,
      policySource,
      priority,
      ocrStatus,
      assignedOfficer,
      search,
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (policySource) query.policySource = policySource;
    if (priority) query.priority = priority;
    if (ocrStatus) query.ocrStatus = ocrStatus;
    if (assignedOfficer) query.assignedOfficer = assignedOfficer;

    if (search) {
      query.$or = [
        { claimReference: { $regex: search, $options: 'i' } },
        { incidentDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate('customer', 'name email phone')
        .populate('customerPolicy', 'policyNumber insurerName category')
        .populate('assignedOfficer', 'name email')
        .populate('assignedSurveyor', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Claim.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: claims.length,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

export const getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('customerPolicy')
      .populate('assignedOfficer', 'name email department')
      .populate('assignedSurveyor', 'name email phone');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    const isCustomer = req.user.role === 'CUSTOMER';
    if (isCustomer && String(claim.customer._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this claim record.' });
    }

    // Fetch related documents, OCR jobs, reports, timeline, and settlement
    const documents = await ClaimDocument.find({ claim: claim._id })
      .populate('ocrJob')
      .sort({ createdAt: 1 });

    const timelineEvents = await ClaimTimelineEvent.find({
      claim: claim._id,
      ...(isCustomer ? { isCustomerVisible: true } : {}),
    }).sort({ createdAt: 1 });

    const surveyReports = await SurveyReport.find({ claim: claim._id })
      .populate('surveyor', 'name email phone')
      .sort({ createdAt: -1 });

    const settlement = await Settlement.findOne({ claim: claim._id })
      .populate('authorizedBy', 'name email');

    // Filter out internal notes for customer
    const sanitizedClaim = claim.toObject();
    if (isCustomer) {
      delete sanitizedClaim.officerNotes;
      delete sanitizedClaim.managerNotes;
    }

    res.json({
      success: true,
      data: {
        claim: sanitizedClaim,
        documents,
        timelineEvents,
        surveyReports,
        settlement,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAdditionalDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentCategory } = req.body;

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document file.' });
    }

    const doc = await ClaimDocument.create({
      claim: claim._id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      documentCategory: documentCategory || 'OTHER',
      uploadedBy: req.user._id,
    });

    // Run OCR
    try {
      const ocrResult = await ocrService.processDocument(req.file.path, req.file.mimetype, doc.documentCategory);
      const ocrJob = await OCRJob.create({
        claim: claim._id,
        document: doc._id,
        status: ocrResult.error ? 'FAILED' : 'COMPLETED',
        confidenceScore: ocrResult.confidenceScore,
        rawText: ocrResult.rawText,
        extractedFields: ocrResult.extractedFields,
        errorMessage: ocrResult.error || '',
        processingDurationMs: ocrResult.durationMs,
      });

      doc.ocrJob = ocrJob._id;
      await doc.save();
    } catch (e) {
      console.error('[OCR Error]', e);
    }

    // Re-evaluate rules
    await ruleEngineService.evaluateClaim(claim._id);

    // If claim was in DOCUMENTS_REQUIRED and customer uploads, move to UNDER_REVIEW
    if (claim.status === 'DOCUMENTS_REQUIRED' && req.user.role === 'CUSTOMER') {
      await stateMachineService.transition(claim._id, 'UNDER_REVIEW', req.user, {
        notes: 'Additional document uploaded by policyholder. Returned to active review queue.',
      });
    } else {
      await ClaimTimelineEvent.create({
        claim: claim._id,
        eventType: 'DOCUMENT_UPLOADED',
        title: 'New Document Uploaded',
        description: `Uploaded document: ${req.file.originalname} (${doc.documentCategory})`,
        performedBy: req.user._id,
        performerRole: req.user.role,
        isCustomerVisible: true,
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully.',
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

export const requestAdditionalDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { requestedDocuments, officerNotes } = req.body;

    if (!requestedDocuments || !Array.isArray(requestedDocuments) || requestedDocuments.length === 0) {
      return res.status(400).json({ success: false, message: 'Please specify the list of required documents.' });
    }

    const updatedClaim = await stateMachineService.transition(id, 'DOCUMENTS_REQUIRED', req.user, {
      missingDocuments: requestedDocuments,
      officerNotes,
      notes: `Officer requested additional documentation: ${requestedDocuments.join(', ')}`,
    });

    await notificationService.notifyUser(updatedClaim.customer, {
      title: 'Action Required: Supporting Documents Requested',
      message: `Your insurance officer has requested additional documents: ${requestedDocuments.join(', ')}`,
      type: 'DOCUMENT_REQUIRED',
      link: `/customer/claims/${id}`,
    });

    res.json({
      success: true,
      message: 'Requested documents notification sent to customer.',
      data: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

export const recommendClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recommendation, officerNotes, recommendedAmount } = req.body; // recommendation: 'APPROVE' or 'REJECT' or 'ESCALATE'

    const updatedClaim = await stateMachineService.transition(id, 'MANAGER_REVIEW', req.user, {
      officerNotes: `Recommendation [${recommendation}]: ${officerNotes || ''} (Recommended amount: $${recommendedAmount || 0})`,
      notes: `Officer completed review and escalated claim for manager decision with recommendation: ${recommendation}.`,
    });

    res.json({
      success: true,
      message: 'Claim escalated to manager review workspace.',
      data: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

export const assignOfficer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { officerId } = req.body;

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }

    claim.assignedOfficer = officerId;
    if (claim.status === 'SUBMITTED') {
      claim.status = 'UNDER_REVIEW';
    }
    await claim.save();

    await ClaimTimelineEvent.create({
      claim: claim._id,
      eventType: 'OFFICER_ASSIGNED',
      title: 'Insurance Officer Assigned',
      description: 'An insurance verification officer has been assigned to evaluate this claim.',
      performedBy: req.user._id,
      performerRole: req.user.role,
      isCustomerVisible: true,
    });

    res.json({
      success: true,
      message: 'Officer assigned successfully.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};
