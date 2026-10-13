import { OCRJob } from '../models/OCRJob.js';
import { ClaimDocument } from '../models/ClaimDocument.js';
import { ocrService } from '../services/ocrService.js';
import { auditService } from '../services/auditService.js';

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
    ocrJob.confidenceScore = ocrResult.confidenceScore;
    ocrJob.rawText = ocrResult.rawText;
    ocrJob.extractedFields = ocrResult.extractedFields;
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
