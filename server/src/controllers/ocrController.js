import { OCRJob } from '../models/OCRJob.js';
import { ClaimDocument } from '../models/ClaimDocument.js';
import { ocrService } from '../services/ocrService.js';
import { auditService } from '../services/auditService.js';

export const scanDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided for OCR scanning.',
      });
    }

    const category = req.body.documentCategory || req.body.category || 'HEALTH';
    const ocrResult = await ocrService.processDocument(req.file.path, req.file.mimetype, category);

    res.json({
      success: ocrResult.success,
      documentType: ocrResult.documentType,
      extractionMethod: ocrResult.extractionMethod,
      confidenceScore: ocrResult.confidenceScore,
      opticalConfidence: ocrResult.opticalConfidence,
      fieldExtractionConfidence: ocrResult.fieldExtractionConfidence,
      reviewStatus: ocrResult.reviewStatus,
      fields: ocrResult.fields,
      extractedFields: ocrResult.extractedFields,
      rawText: ocrResult.rawText,
      warnings: ocrResult.warnings,
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
      .populate('correctedBy', 'name email role');

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

    const ocrJob = await OCRJob.findById(jobId);
    if (!ocrJob) {
      return res.status(404).json({ success: false, message: 'OCR Job record not found.' });
    }

    ocrJob.correctedFields = correctedFields;
    ocrJob.correctedBy = req.user._id;
    ocrJob.correctedAt = new Date();
    ocrJob.correctionAuditNote = auditNote || 'Manual officer correction applied after document inspection.';
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
  try {
    const { documentId } = req.params;
    const doc = await ClaimDocument.findById(documentId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const ocrResult = await ocrService.processDocument(doc.filePath, doc.mimeType, doc.documentCategory);
    let ocrJob = await OCRJob.findOne({ document: doc._id });

    if (!ocrJob) {
      ocrJob = new OCRJob({
        claim: doc.claim,
        document: doc._id,
      });
    }

    ocrJob.status = ocrResult.error ? 'FAILED' : 'COMPLETED';
    ocrJob.provider = ocrResult.extractionMethod?.includes('scanned')
      ? 'scanned_pdf_ocr'
      : (ocrResult.extractionMethod?.includes('pdf') ? 'pdf_parse' : (ocrResult.extractionMethod === 'error' ? 'unknown' : 'tesseract'));
    ocrJob.confidenceScore = ocrResult.confidenceScore ?? 0;
    ocrJob.opticalConfidence = ocrResult.opticalConfidence ?? 0;
    ocrJob.fieldExtractionConfidence = ocrResult.fieldExtractionConfidence ?? 0;
    ocrJob.reviewStatus = ocrResult.reviewStatus ?? 'NEEDS_MANUAL_REVIEW';
    ocrJob.rawText = ocrResult.rawText || '';
    ocrJob.extractedFields = {
      ...ocrResult.fields,
      invoiceOrBillNumber: ocrResult.fields.invoiceNumber ?? null,
      detectedDate: ocrResult.fields.invoiceDate ?? null,
      detectedAmount: ocrResult.fields.totalAmount ?? null,
      issuerName: ocrResult.fields.hospitalName ?? null,
      patientOrVehicleId: ocrResult.fields.patientName ?? null,
    };
    ocrJob.errorMessage = ocrResult.error || '';
    ocrJob.processingDurationMs = ocrResult.durationMs;
    await ocrJob.save();

    doc.ocrJob = ocrJob._id;
    await doc.save();

    res.json({
      success: true,
      message: 'OCR reprocessing completed.',
      data: ocrJob,
    });
  } catch (error) {
    next(error);
  }
};
