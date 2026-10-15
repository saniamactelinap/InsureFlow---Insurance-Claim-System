import { OCRJob } from '../models/OCRJob.js';
import { ClaimDocument } from '../models/ClaimDocument.js';
import { Claim } from '../models/Claim.js';
import { ocrService } from '../services/ocrService.js';
import { auditService } from '../services/auditService.js';

// In-memory set to lock documents during processing and prevent concurrent duplicates
const processingLocks = new Set();

export const scanDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided for OCR scanning.',
      });
    }

    const category = req.body.documentCategory || req.body.category || 'HEALTH';
    const forceVision = req.body.forceVision === 'true' || req.body.forceVision === true;

    const ocrResult = await ocrService.processDocument(
      req.file.path,
      req.file.mimetype,
      category,
      {
        forceVision,
        originalName: req.file.originalname,
      }
    );

    res.json({
      success: ocrResult.success,
      documentType: ocrResult.documentType,
      provider: ocrResult.provider || 'tesseract',
      extractionMethod: ocrResult.extractionMethod,
      confidenceScore: ocrResult.confidenceScore,
      opticalConfidence: ocrResult.opticalConfidence,
      fieldExtractionConfidence: ocrResult.fieldExtractionConfidence,
      reviewStatus: ocrResult.reviewStatus,
      fields: ocrResult.fields,
      extractedFields: ocrResult.extractedFields,
      fieldMetadata: ocrResult.fieldMetadata || {},
      handwritingDetected: ocrResult.handwritingDetected || false,
      candidateReadings: ocrResult.candidateReadings || {},
      engineComparison: ocrResult.engineComparison || null,
      discrepancy: ocrResult.discrepancy || null,
      rawText: ocrResult.rawText,
      warnings: ocrResult.warnings,
      sourcePagesCount: ocrResult.sourcePagesCount || 1,
      durationMs: ocrResult.durationMs,
      error: ocrResult.error || null,
      fileMeta: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileUrl: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        documentCategory: req.body.documentCategory || 'MEDICAL_BILL',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOcrJobByDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const ocrJob = await OCRJob.findOne({ document: documentId })
      .populate('correctedBy', 'name email role')
      .populate('document')
      .populate('claim');

    if (!ocrJob) {
      return res.status(404).json({ success: false, message: 'OCR Job not found for this document.' });
    }

    res.json({ success: true, data: ocrJob });
  } catch (error) {
    next(error);
  }
};

export const correctOcrFields = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { correctedFields, auditNote } = req.body;

    const ocrJob = await OCRJob.findById(jobId).populate('claim');
    if (!ocrJob) {
      return res.status(404).json({ success: false, message: 'OCR Job record not found.' });
    }

    if (!auditNote || !auditNote.trim()) {
      return res.status(400).json({
        success: false,
        message: 'An audit note is required to justify manual field modifications.',
      });
    }

    ocrJob.correctedFields = correctedFields;
    ocrJob.correctedBy = req.user._id;
    ocrJob.correctedAt = new Date();
    ocrJob.correctionAuditNote = auditNote.trim();

    // Re-evaluate discrepancy against claim if amount was corrected
    if (ocrJob.claim && correctedFields?.detectedAmount !== undefined) {
      const mergedFields = {
        ...(ocrJob.extractedFields?.toObject ? ocrJob.extractedFields.toObject() : ocrJob.extractedFields),
        totalAmount: correctedFields.detectedAmount !== null && correctedFields.detectedAmount !== '' ? Number(correctedFields.detectedAmount) : null,
      };
      ocrJob.discrepancy = ocrService.evaluateDiscrepancy(ocrJob.claim, mergedFields);
    }

    await ocrJob.save();

    await auditService.log(req, 'CORRECT_OCR_FIELDS', 'OCRJob', ocrJob._id, {
      correctedFields,
      auditNote,
    });

    res.json({
      success: true,
      message: 'OCR extracted fields updated and audited successfully.',
      data: ocrJob,
    });
  } catch (error) {
    next(error);
  }
};

export const reprocessOcr = async (req, res, next) => {
  const { documentId } = req.params;
  const lockKey = String(documentId);

  // Prevent concurrent duplicate processing
  if (processingLocks.has(lockKey)) {
    return res.status(409).json({
      success: false,
      message: 'This document is currently undergoing OCR extraction. Please wait for completion.',
    });
  }

  processingLocks.add(lockKey);

  try {
    const doc = await ClaimDocument.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const claim = await Claim.findById(doc.claim);
    const forceVision = req.body.forceVision === true || req.body.forceVision === 'true';

    const ocrResult = await ocrService.processDocument(
      doc.filePath,
      doc.mimeType,
      doc.documentCategory,
      {
        forceVision,
        claim,
        originalName: doc.originalName,
      }
    );

    let ocrJob = await OCRJob.findOne({ document: doc._id });

    if (!ocrJob) {
      ocrJob = new OCRJob({
        claim: doc.claim,
        document: doc._id,
      });
    }

    ocrJob.status = ocrResult.error ? 'FAILED' : (ocrResult.reviewStatus === 'VERIFIED' ? 'COMPLETED' : 'NEEDS_REVIEW');
    ocrJob.provider = ocrResult.provider || 'tesseract';
    ocrJob.confidenceScore = ocrResult.confidenceScore ?? 0;
    ocrJob.opticalConfidence = ocrResult.opticalConfidence ?? 0;
    ocrJob.fieldExtractionConfidence = ocrResult.fieldExtractionConfidence ?? 0;
    ocrJob.reviewStatus = ocrResult.reviewStatus ?? 'NEEDS_MANUAL_REVIEW';
    ocrJob.documentType = ocrResult.documentType || 'general_document';
    ocrJob.handwritingDetected = ocrResult.handwritingDetected || false;
    ocrJob.candidateReadings = ocrResult.candidateReadings || {};
    ocrJob.fieldMetadata = ocrResult.fieldMetadata || {};
    ocrJob.engineComparison = ocrResult.engineComparison || null;
    ocrJob.discrepancy = ocrResult.discrepancy || null;
    ocrJob.sourcePagesCount = ocrResult.sourcePagesCount || 1;
    ocrJob.rawText = ocrResult.rawText || '';
    ocrJob.extractedFields = {
      ...ocrResult.fields,
      invoiceOrBillNumber: ocrResult.fields.invoiceNumber ?? null,
      detectedDate: ocrResult.fields.invoiceDate ?? null,
      detectedAmount: ocrResult.fields.totalAmount ?? null, // NEVER convert null to 0!
      issuerName: ocrResult.fields.hospitalName ?? null,
      patientOrVehicleId: ocrResult.fields.patientName ?? null,
    };
    ocrJob.errorMessage = ocrResult.error || '';
    ocrJob.processingDurationMs = ocrResult.durationMs;
    await ocrJob.save();

    doc.ocrJob = ocrJob._id;
    await doc.save();

    await auditService.log(req, 'REPROCESS_OCR', 'OCRJob', ocrJob._id, {
      forceVision,
      provider: ocrJob.provider,
      confidenceScore: ocrJob.confidenceScore,
    });

    res.json({
      success: true,
      message: `OCR reprocessing completed using ${ocrJob.provider}.`,
      data: ocrJob,
    });
  } catch (error) {
    next(error);
  } finally {
    processingLocks.delete(lockKey);
  }
};
