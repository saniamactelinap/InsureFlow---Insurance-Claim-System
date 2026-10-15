import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import { validateDocumentFile, classifyDocumentCategory } from './documentValidator.js';
import { imagePreprocessor } from './imagePreprocessor.js';
import { geminiOcrService } from './geminiOcrService.js';

class OCRService {
  /**
   * Process a document file and extract text and structured fields
   * @param {string|Buffer} input - Path to the file or Buffer
   * @param {string} claimedMimeType - MIME type of the document
   * @param {string} category - Insurance category: HEALTH | VEHICLE | PROPERTY
   * @param {object} [options] - Options (e.g. forceVision, claim context)
   */
  async processDocument(input, claimedMimeType, category = 'HEALTH', options = {}) {
    const startTime = Date.now();
    let rawText = '';
    let opticalConfidence = 0;
    let extractionMethod = 'unknown';
    const warnings = [];
    let tesseractFields = null;
    let geminiFields = null;
    let handwritingDetected = false;
    let candidateReadings = {};
    let fieldMetadata = {};
    let pagesCount = 1;

    try {
      // ---------------------------------------------------------
      // STAGE A: FILE VALIDATION & SECURITY INTEGRITY CHECK
      // ---------------------------------------------------------
      const validation = validateDocumentFile(input, claimedMimeType);
      if (!validation.isValid) {
        return {
          success: false,
          documentType: 'unknown',
          extractionMethod: 'validation_error',
          confidenceScore: 0,
          opticalConfidence: 0,
          fieldExtractionConfidence: 0,
          reviewStatus: 'NEEDS_MANUAL_REVIEW',
          fields: this.getEmptyFields(),
          extractedFields: {
            ...this.getEmptyFields(),
            detectedAmount: null,
            invoiceOrBillNumber: null,
            detectedDate: null,
            issuerName: null,
            patientOrVehicleId: null,
          },
          rawText: `[Validation Failure: ${validation.error}]`,
          warnings: [`Document validation failed: ${validation.error}`],
          durationMs: Date.now() - startTime,
          error: validation.error,
          errorCode: validation.code,
        };
      }

      const isPdf = validation.isPdf;
      const isImage = validation.isImage;
      const filePath = typeof input === 'string' ? input : null;
      const fileBuffer = Buffer.isBuffer(input) ? input : fs.readFileSync(filePath);

      let preprocessed = null;
      if (isImage) {
        // ---------------------------------------------------------
        // STAGE C: IMAGE PREPROCESSING
        // ---------------------------------------------------------
        preprocessed = await imagePreprocessor.preprocess(fileBuffer);
      }

      // ---------------------------------------------------------
      // STAGE B & D: PDF EXTRACTION & LOCAL TESSERACT OCR
      // ---------------------------------------------------------
      let pdfHasUsableText = false;

      if (isPdf) {
        const { text, repaired, pageCount } = await this.extractPdfText(fileBuffer);
        pagesCount = pageCount || 1;

        if (text && text.trim().length >= 25 && this.isMeaningfulText(text)) {
          rawText = text.trim();
          extractionMethod = repaired ? 'pdf_text_repaired' : 'pdf_text';
          opticalConfidence = 95;
          pdfHasUsableText = true;
        } else {
          // Scanned PDF: attempt JPEG stream extraction for local Tesseract pass
          const embeddedImages = this.extractAllJpegImagesFromPdf(fileBuffer);
          if (embeddedImages.length > 0) {
            const pageTexts = [];
            let totalConf = 0;
            pagesCount = embeddedImages.length;

            for (let i = 0; i < embeddedImages.length; i++) {
              const ocrResult = await this.runTesseractOcr(embeddedImages[i]);
              if (ocrResult.text) {
                pageTexts.push(embeddedImages.length > 1 ? `--- Page ${i + 1} ---\n${ocrResult.text}` : ocrResult.text);
              }
              totalConf += (ocrResult.confidence || 60);
            }

            rawText = pageTexts.join('\n\n').trim();
            opticalConfidence = Math.round(totalConf / embeddedImages.length);
            extractionMethod = embeddedImages.length > 1 ? 'multi_page_scanned_pdf_ocr' : 'scanned_pdf_image_ocr';

            if (rawText.length < 25) {
              warnings.push('Low optical character recognition output from scanned PDF. High-resolution vision model recommended.');
            }
          } else {
            // No direct text layer and no standard JPEG streams
            extractionMethod = 'scanned_pdf_complex_stream';
            opticalConfidence = 25;
            warnings.push('PDF contains no standard text layer or raw JPEG stream. Vision AI or manual inspection required.');
          }
        }
      } else if (isImage) {
        // Direct Tesseract OCR on preprocessed image buffer
        const tesseractInput = preprocessed?.forTesseract || fileBuffer;
        const ocrResult = await this.runTesseractOcr(tesseractInput);
        rawText = ocrResult.text;
        opticalConfidence = ocrResult.confidence;
        extractionMethod = 'tesseract_ocr';

        if (opticalConfidence < 65) {
          warnings.push(`Low optical recognition confidence (${opticalConfidence}%). Document may contain handwriting or low contrast.`);
        }
        if (!rawText || rawText.trim().length < 15) {
          warnings.push('Minimal text detected in image.');
        }
      }

      // Check heuristics for handwriting
      if (this.detectHandwritingCharacteristics(rawText, opticalConfidence)) {
        handwritingDetected = true;
        warnings.push('Document exhibits characteristics of handwritten notes or prescription.');
      }

      // Extract baseline fields from local OCR / PDF text
      const baselineExtraction = this.extractStructuredFields(rawText, category);
      tesseractFields = baselineExtraction.fields;
      warnings.push(...baselineExtraction.fieldWarnings);

      // ---------------------------------------------------------
      // STAGE E: GEMINI VISION-BASED EXTRACTION
      // ---------------------------------------------------------
      const configuredProvider = process.env.OCR_PROVIDER || 'hybrid';
      const shouldTriggerVision =
        options.forceVision === true ||
        configuredProvider === 'gemini' ||
        configuredProvider === 'hybrid' ||
        opticalConfidence < 75 ||
        handwritingDetected ||
        tesseractFields.totalAmount === null ||
        !tesseractFields.invoiceNumber ||
        (!pdfHasUsableText && isPdf);

      let geminiExtraction = null;

      if (shouldTriggerVision && geminiOcrService.isAvailable()) {
        try {
          // Prepare buffer: for images, use enhanced color buffer; for PDF, use original PDF buffer
          const visionBuffer = isImage ? (preprocessed?.forVision || fileBuffer) : fileBuffer;
          const visionMime = isPdf ? 'application/pdf' : (validation.detectedMimeType || 'image/jpeg');

          geminiExtraction = await geminiOcrService.extractStructuredData({
            buffer: visionBuffer,
            mimeType: visionMime,
            category,
            originalName: options.originalName || (filePath ? path.basename(filePath) : 'document'),
          });

          if (geminiExtraction.success && geminiExtraction.data) {
            geminiFields = geminiExtraction.data.fields;
            fieldMetadata = geminiExtraction.data.fieldMetadata || {};

            if (geminiExtraction.data.handwritingDetected) {
              handwritingDetected = true;
            }
            if (geminiExtraction.data.candidateReadings) {
              candidateReadings = geminiExtraction.data.candidateReadings;
            }
          } else {
            warnings.push(`Gemini Vision fallback note: ${geminiExtraction.error}. Retained local OCR extraction.`);
          }
        } catch (visionErr) {
          warnings.push(`Gemini Vision call failed: ${visionErr.message}. Retained local OCR extraction.`);
        }
      } else if (shouldTriggerVision && !geminiOcrService.isAvailable()) {
        warnings.push('Gemini Vision is recommended for this document but GEMINI_API_KEY is not configured. Processed using local OCR only.');
      }

      // ---------------------------------------------------------
      // STAGE F & G: HYBRID RECONCILIATION & STRUCTURED EXTRACTION
      // ---------------------------------------------------------
      const reconciled = this.reconcileExtractions({
        tesseractFields,
        geminiFields,
        opticalConfidence,
        geminiLegibilityConfidence: geminiExtraction?.data?.overallLegibilityConfidence || 85,
        handwritingDetected,
        candidateReadings,
        fieldMetadata,
      });

      const finalFields = reconciled.fields;
      const documentType = geminiExtraction?.data?.documentType || baselineExtraction.documentType || classifyDocumentCategory(category, rawText);

      // Determine final provider/engine label
      let provider = 'tesseract';
      if (geminiFields && tesseractFields && rawText.length > 0) {
        provider = 'hybrid';
      } else if (geminiFields) {
        provider = 'gemini_vision';
      } else if (isPdf && pdfHasUsableText) {
        provider = 'pdf_parse';
      } else if (isPdf && !pdfHasUsableText) {
        provider = 'scanned_pdf_ocr';
      }

      // Check for malformed PDF where nothing could be read
      if (isPdf && !pdfHasUsableText && !geminiFields && (!rawText || rawText.trim().length === 0)) {
        return {
          success: false,
          documentType,
          extractionMethod: 'unreadable_pdf',
          confidenceScore: 0,
          opticalConfidence: 0,
          fieldExtractionConfidence: 0,
          reviewStatus: 'NEEDS_MANUAL_REVIEW',
          fields: this.getEmptyFields(),
          extractedFields: {
            ...this.getEmptyFields(),
            detectedAmount: null,
            invoiceOrBillNumber: null,
            detectedDate: null,
            issuerName: null,
            patientOrVehicleId: null,
          },
          rawText: '[Unreadable PDF: No extractable text layer or standard image stream found.]',
          warnings: ['PDF is unreadable or malformed. Manual officer review required.'],
          durationMs: Date.now() - startTime,
          error: 'PDF contains no usable text layer or standard image streams.',
        };
      }

      // ---------------------------------------------------------
      // STAGE H: CROSS-VALIDATION & CLAIM DISCREPANCY DETECTION
      // ---------------------------------------------------------
      const discrepancy = this.evaluateDiscrepancy(options.claim, finalFields);

      // Review status decision
      let reviewStatus = 'VERIFIED';
      if (
        reconciled.confidenceScore < 70 ||
        finalFields.totalAmount === null ||
        !finalFields.invoiceNumber ||
        !finalFields.patientName ||
        handwritingDetected ||
        discrepancy.hasDiscrepancy
      ) {
        reviewStatus = 'NEEDS_MANUAL_REVIEW';
      }

      return {
        success: true,
        documentType,
        provider,
        extractionMethod: provider === 'hybrid' ? 'hybrid_tesseract_gemini' : (geminiFields ? 'gemini_vision' : extractionMethod),
        confidenceScore: reconciled.confidenceScore,
        opticalConfidence: reconciled.opticalConfidence,
        fieldExtractionConfidence: reconciled.fieldExtractionConfidence,
        reviewStatus,
        fields: finalFields,
        extractedFields: {
          ...finalFields,
          invoiceOrBillNumber: finalFields.invoiceNumber ?? null,
          detectedDate: finalFields.invoiceDate ?? null,
          detectedAmount: finalFields.totalAmount ?? null, // NEVER convert null to 0!
          issuerName: finalFields.hospitalName ?? null,
          patientOrVehicleId: finalFields.patientName ?? null,
          diagnosesOrDamageKeywords: finalFields.diagnosis ? [finalFields.diagnosis] : [],
        },
        fieldMetadata: reconciled.fieldMetadata,
        handwritingDetected,
        candidateReadings,
        engineComparison: reconciled.engineComparison,
        discrepancy,
        rawText,
        warnings,
        sourcePagesCount: pagesCount,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[OCR Service Error]', error.message);
      return {
        success: false,
        documentType: 'unknown',
        extractionMethod: 'error',
        confidenceScore: 0,
        fields: this.getEmptyFields(),
        extractedFields: {
          ...this.getEmptyFields(),
          detectedAmount: null,
          invoiceOrBillNumber: null,
          detectedDate: null,
          issuerName: null,
          patientOrVehicleId: null,
        },
        rawText: `[OCR Processing Note: ${error.message}]`,
        warnings: [`Failed to process document: ${error.message}`],
        durationMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Safely extract text from PDF with automatic XRef repair if needed
   */
  async extractPdfText(buffer) {
    try {
      const safeBuffer = buffer instanceof Uint8Array
        ? new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
        : buffer;

      const data = await pdfParse(safeBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return { text: data.text, repaired: false, pageCount: data.numpages || 1 };
      }
    } catch (err) {
      // Auto-repair for CRLF / ReportLab XRef offset mismatch or bad XRef entry
      try {
        const repairedBuf = this.repairPdfBuffer(buffer);
        const safeFixed = new Uint8Array(repairedBuf.buffer.slice(repairedBuf.byteOffset, repairedBuf.byteOffset + repairedBuf.byteLength));
        const fixedData = await pdfParse(safeFixed);
        if (fixedData && fixedData.text && fixedData.text.trim().length > 0) {
          return { text: fixedData.text, repaired: true, pageCount: fixedData.numpages || 1 };
        }
      } catch (repairErr) {
        // Fallback returns empty text
      }
    }
    return { text: '', repaired: false, pageCount: 1 };
  }

  /**
   * Inspect and repair broken PDF XRef byte offset
   */
  repairPdfBuffer(buffer) {
    try {
      const binary = buffer.toString('binary');
      const startxrefMatch = /startxref[\r\n]+(\d+)[\r\n]+%%EOF/i.exec(binary);
      if (!startxrefMatch) return buffer;

      const declaredOffset = parseInt(startxrefMatch[1], 10);
      const actualXref = binary.lastIndexOf('xref\n') !== -1
        ? binary.lastIndexOf('xref\n')
        : binary.lastIndexOf('xref\r\n');

      if (actualXref !== -1 && actualXref !== declaredOffset) {
        const fixedBinary = binary.replace(/startxref[\r\n]+\d+[\r\n]+%%EOF/i, `startxref\n${actualXref}\n%%EOF`);
        return Buffer.from(fixedBinary, 'binary');
      }

      // Check trailing garbage after %%EOF
      const lastEof = binary.lastIndexOf('%%EOF');
      if (lastEof !== -1 && lastEof + 5 < binary.length) {
        return buffer.slice(0, lastEof + 5);
      }
    } catch (e) {
      // Return original on error
    }
    return buffer;
  }

  /**
   * Check if extracted text contains meaningful language rather than random binary artifacts
   */
  isMeaningfulText(text) {
    if (!text || text.length < 20) return false;
    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    return (alphanumericCount / text.length) > 0.4;
  }

  /**
   * Extract all raw JPEG image streams from scanned PDF buffer for multi-page support
   */
  extractAllJpegImagesFromPdf(buffer) {
    const images = [];
    const binary = buffer.toString('binary');
    const streamRegex = /stream[\r\n]+/g;
    let match;

    while ((match = streamRegex.exec(binary)) !== null) {
      const streamStart = match.index + match[0].length;
      if (buffer[streamStart] === 0xFF && buffer[streamStart + 1] === 0xD8) {
        const endstreamIdx = binary.indexOf('endstream', streamStart);
        if (endstreamIdx !== -1) {
          let imgEnd = endstreamIdx;
          while (imgEnd > streamStart && (buffer[imgEnd - 1] === 0x0A || buffer[imgEnd - 1] === 0x0D)) {
            imgEnd--;
          }
          images.push(buffer.slice(streamStart, imgEnd));
        }
      }
    }
    if (images.length > 0) return images;

    // Fallback searching all SOI markers \xFF\xD8\xFF
    const soi = '\xFF\xD8\xFF';
    let searchFrom = 0;
    while (true) {
      const soiIdx = binary.indexOf(soi, searchFrom);
      if (soiIdx === -1) break;
      const endstreamIdx = binary.indexOf('endstream', soiIdx);
      if (endstreamIdx !== -1) {
        let imgEnd = endstreamIdx;
        while (imgEnd > soiIdx && (buffer[imgEnd - 1] === 0x0A || buffer[imgEnd - 1] === 0x0D)) {
          imgEnd--;
        }
        images.push(buffer.slice(soiIdx, imgEnd));
        searchFrom = endstreamIdx + 9;
      } else {
        const eoi = '\xFF\xD9';
        const eoiIdx = binary.indexOf(eoi, soiIdx);
        if (eoiIdx !== -1 && eoiIdx > soiIdx + 100) {
          images.push(buffer.slice(soiIdx, eoiIdx + 2));
          searchFrom = eoiIdx + 2;
        } else {
          searchFrom = soiIdx + 3;
        }
      }
    }
    return images;
  }

  /**
   * Execute Tesseract OCR on a file path or image buffer
   */
  async runTesseractOcr(imageSource) {
    try {
      const worker = await createWorker('eng');
      try {
        const ret = await worker.recognize(imageSource);
        const text = ret.data.text || '';
        const confidence = Math.round(ret.data.confidence) || 60;
        return { text: text.trim(), confidence };
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      console.warn('[Tesseract Engine Warning]', err.message);
      return { text: '', confidence: 0, error: err.message };
    }
  }

  /**
   * Heuristic to flag likely handwritten text
   */
  detectHandwritingCharacteristics(text, confidenceScore) {
    if (!text || text.length < 15) return false;
    if (confidenceScore > 0 && confidenceScore < 60) return true;
    const lower = text.toLowerCase();
    if (lower.includes('clinic') && (lower.includes('rx') || lower.includes('ry') || lower.includes('consultation')) && confidenceScore < 85) {
      return true;
    }
    const specialChars = (text.match(/[^a-zA-Z0-9\s.,/:-]/g) || []).length;
    return (specialChars / text.length) > 0.12;
  }

  /**
   * Reconcile Tesseract vs Gemini extractions
   */
  reconcileExtractions({
    tesseractFields,
    geminiFields,
    opticalConfidence,
    geminiLegibilityConfidence = 85,
    handwritingDetected,
    candidateReadings,
    fieldMetadata,
  }) {
    const tFields = tesseractFields || this.getEmptyFields();
    const gFields = geminiFields || null;

    const merged = { ...tFields };
    const disagreements = [];
    const meta = { ...fieldMetadata };

    if (gFields) {
      // For each key, reconcile intelligently:
      // Gemini has superior semantic accuracy and handwriting capability.
      // But if both detected amounts, check for agreement or discrepancy.
      const keys = [
        'patientName',
        'hospitalName',
        'invoiceNumber',
        'invoiceDate',
        'admissionDate',
        'dischargeDate',
        'incidentOrServiceDate',
        'totalAmount',
        'subtotal',
        'taxAmount',
        'discountAmount',
        'paymentStatus',
        'diagnosis',
        'currency',
        'policyNumberFound',
        'vehicleRegistrationNumber',
      ];

      for (const k of keys) {
        const tVal = tFields[k];
        const gVal = gFields[k];

        if (gVal !== null && gVal !== undefined) {
          merged[k] = gVal;
          if (!meta[k]) {
            meta[k] = {
              confidence: geminiLegibilityConfidence,
              sourcePage: 1,
              engine: 'gemini_vision',
              evidence: typeof gVal === 'number' ? `Stated amount: ${gVal}` : String(gVal),
            };
          } else {
            meta[k].engine = 'gemini_vision';
          }
        } else if (tVal !== null && tVal !== undefined) {
          merged[k] = tVal;
          if (!meta[k]) {
            meta[k] = {
              confidence: opticalConfidence,
              sourcePage: 1,
              engine: 'tesseract',
              evidence: typeof tVal === 'number' ? `Detected amount: ${tVal}` : String(tVal),
            };
          }
        }

        // Compare conflicting non-null amounts or invoice numbers
        if (tVal !== null && gVal !== null && tVal !== undefined && gVal !== undefined) {
          if (k === 'totalAmount' && Math.abs(Number(tVal) - Number(gVal)) > 1) {
            disagreements.push(`totalAmount: Tesseract found ${tVal} vs Gemini Vision found ${gVal}`);
          } else if (k === 'invoiceNumber' && String(tVal).toLowerCase() !== String(gVal).toLowerCase()) {
            disagreements.push(`invoiceNumber: Tesseract found '${tVal}' vs Gemini Vision found '${gVal}'`);
          }
        }
      }

      if (Array.isArray(gFields.lineItems) && gFields.lineItems.length > 0) {
        merged.lineItems = gFields.lineItems;
      }
    }

    // Calculate core completeness
    let filledCoreCount = 0;
    if (merged.hospitalName) filledCoreCount += 20;
    if (merged.invoiceNumber) filledCoreCount += 20;
    if (merged.invoiceDate) filledCoreCount += 20;
    if (merged.patientName) filledCoreCount += 20;
    if (merged.totalAmount !== null && !isNaN(merged.totalAmount)) filledCoreCount += 20;
    const fieldExtractionConfidence = filledCoreCount;

    // Defensible composite confidence
    let baseConfidence = gFields
      ? Math.round((opticalConfidence * 0.3) + (geminiLegibilityConfidence * 0.3) + (fieldExtractionConfidence * 0.4))
      : Math.round((opticalConfidence * 0.4) + (fieldExtractionConfidence * 0.6));

    // Penalty for handwriting ambiguity or engine disagreements
    if (handwritingDetected && Object.keys(candidateReadings).length > 0) {
      baseConfidence = Math.min(baseConfidence, 65);
    }
    if (disagreements.length > 0) {
      baseConfidence = Math.max(0, baseConfidence - 15);
    }

    const agreementScore = disagreements.length === 0 ? 100 : Math.max(40, 100 - disagreements.length * 25);

    return {
      fields: merged,
      confidenceScore: Math.min(100, Math.max(0, baseConfidence)),
      opticalConfidence,
      fieldExtractionConfidence,
      fieldMetadata: meta,
      engineComparison: {
        tesseract: tFields,
        gemini: gFields,
        disagreements,
        agreementScore,
      },
    };
  }

  /**
   * Evaluate claim discrepancy
   */
  evaluateDiscrepancy(claim, extractedFields) {
    if (!claim) {
      return {
        hasDiscrepancy: false,
        claimAmount: null,
        detectedAmount: extractedFields?.totalAmount ?? null,
        variance: null,
        status: 'NO_CLAIM_CONTEXT',
        explanation: 'No linked claim attached for cross-validation.',
      };
    }

    const claimAmt = claim.requestedAmount != null ? Number(claim.requestedAmount) : null;
    const rawDocAmt = extractedFields?.totalAmount !== undefined ? extractedFields.totalAmount : null;
    const docAmt = rawDocAmt !== null && !isNaN(rawDocAmt) ? Number(rawDocAmt) : null;

    if (docAmt === null) {
      return {
        hasDiscrepancy: true,
        claimAmount: claimAmt,
        detectedAmount: null,
        variance: null,
        status: 'AMOUNT_NOT_DETECTED',
        explanation: 'Bill total could not be detected on the document — officer manual review required.',
      };
    }

    if (claimAmt === null) {
      return {
        hasDiscrepancy: false,
        claimAmount: null,
        detectedAmount: docAmt,
        variance: null,
        status: 'NO_CLAIM_AMOUNT',
        explanation: 'Claim has no requested amount specified.',
      };
    }

    const variance = Math.round(Math.abs(claimAmt - docAmt) * 100) / 100;
    if (variance > 1) {
      return {
        hasDiscrepancy: true,
        claimAmount: claimAmt,
        detectedAmount: docAmt,
        variance,
        status: 'VARIANCE_DETECTED',
        explanation: `Claim requested ₹${claimAmt.toLocaleString('en-IN')}, but document total is ₹${docAmt.toLocaleString('en-IN')} (variance: ₹${variance.toLocaleString('en-IN')}).`,
      };
    }

    return {
      hasDiscrepancy: false,
      claimAmount: claimAmt,
      detectedAmount: docAmt,
      variance: 0,
      status: 'MATCH',
      explanation: `Document total of ₹${docAmt.toLocaleString('en-IN')} matches customer claim requested amount.`,
    };
  }

  getEmptyFields() {
    return {
      patientName: null,
      hospitalName: null,
      invoiceNumber: null,
      invoiceDate: null,
      admissionDate: null,
      dischargeDate: null,
      incidentOrServiceDate: null,
      diagnosis: null,
      lineItems: [],
      subtotal: null,
      taxAmount: null,
      discountAmount: null,
      totalAmount: null, // Note: Always null when empty, never 0!
      currency: 'INR',
      vehicleRegistrationNumber: null,
      policyNumberFound: null,
      paymentStatus: null,
    };
  }

  /**
   * Extract structured insurance information from raw text using regex
   */
  extractStructuredFields(text, category) {
    const fields = this.getEmptyFields();
    const fieldWarnings = [];

    if (!text || typeof text !== 'string') {
      fieldWarnings.push('No legible text available for entity recognition.');
      return { documentType: 'other', fields, fieldWarnings, fieldExtractionConfidence: 0 };
    }

    const documentType = classifyDocumentCategory(category, text);

    // 1. Healthcare Provider / Hospital / Garage Name
    const hospMatch = text.match(/([A-Z0-9\s.,'&-]{4,50}(?:HOSPITAL|CLINIC|HEALTHCARE|MEDICAL CENTER|NURSING HOME|LABORATORY|LABORATORIES|MOTORS|AUTO WORKS|GARAGE|REPAIR CENTER))/i);
    if (hospMatch) {
      fields.hospitalName = hospMatch[1].trim().replace(/\r?\n/g, ' ');
    } else {
      fieldWarnings.push('Provider or facility name could not be identified with certainty.');
    }

    // 2. Invoice / Bill / Reference Number
    const invMatch = text.match(/(?:Invoice\s*(?:Number|No\.?|#)|Bill\s*(?:Number|No\.?|#)|Receipt\s*(?:Number|No\.?|#)|Estimate\s*(?:Number|No\.?|#)|Ref(?:erence)?\s*(?:No\.?|#)|(?:Invoice|Bill|Receipt)\s*[:#])\s*[:\-#]?\s*([A-Za-z0-9][A-Za-z0-9\/\-_]{2,})/i);
    if (invMatch) {
      fields.invoiceNumber = invMatch[1].trim();
    } else {
      fieldWarnings.push('Invoice / Bill reference number not found or unreadable.');
    }

    // 3. Date pattern matching
    const datePattern = '(\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{4}|\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})';

    // Invoice Date
    const invDateMatch = text.match(new RegExp('(?:Invoice\\s*Date|Bill\\s*Date|Date of (?:Invoice|Issue)|Date)\\s*[:\\-]?\\s*' + datePattern, 'i'));
    if (invDateMatch) {
      fields.invoiceDate = invDateMatch[1].trim();
    } else {
      fieldWarnings.push('Invoice date could not be identified with certainty.');
    }

    // Admission Date
    const admMatch = text.match(new RegExp('(?:Admission\\s*Date|Admitted\\s*(?:on)?|DOA)\\s*[:\\-]?\\s*' + datePattern, 'i'));
    if (admMatch) {
      fields.admissionDate = admMatch[1].trim();
    }

    // Discharge Date
    const disMatch = text.match(new RegExp('(?:Discharge\\s*Date|Discharged\\s*(?:on)?|DOD)\\s*[:\\-]?\\s*' + datePattern, 'i'));
    if (disMatch) {
      fields.dischargeDate = disMatch[1].trim();
    }

    // 4. Patient Name / Customer Name
    const patMatch = text.match(/\b(?:Patient\s*(?:Name)?|Insured\s*(?:Name)?|Customer\s*(?:Name)?|Client\s*(?:Name)?)\b\s*[:\-]?\s*([^\r\n]+)/i);
    if (patMatch) {
      let name = patMatch[1].trim();
      name = name.replace(/(Customer|Portal|InsureFlow|Policy|Age|Gender|Sex|Mr|Mrs|Ms|Date|Admission|Discharge|Invoice|Reason).*/i, '').trim();
      if (name.length > 2 && /[A-Za-z]/.test(name)) {
        fields.patientName = name;
      }
    }
    if (!fields.patientName) {
      fieldWarnings.push('Patient or policyholder name not detected on document.');
    }

    // 5. Total Amount (Avoid matching inside 'Subtotal')
    const totalMatch = text.match(/(?:Total\s*Payable\s*Amount|Grand\s*Total|Total\s*Amount|Net\s*Amount|Total\s*Due|Total\s*Paid|Final\s*Bill|\bTotal\b)\s*[:\-]?\s*(?:[\u20B9\u0024]|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (totalMatch) {
      fields.totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
    } else {
      fieldWarnings.push('Total payable bill amount could not be detected with certainty.');
    }

    // 6. Subtotal
    const subMatch = text.match(/(?:Subtotal|Sub\s*Total)\s*[:\-]?\s*(?:[\u20B9\u0024]|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (subMatch) {
      fields.subtotal = parseFloat(subMatch[1].replace(/,/g, ''));
    }

    // 7. Discount
    const discMatch = text.match(/(?:Discount)\s*[:\-]?\s*(?:[\u20B9\u0024]|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (discMatch) {
      fields.discountAmount = parseFloat(discMatch[1].replace(/,/g, ''));
    }

    // 8. Taxes
    const taxMatch = text.match(/(?:GST|Tax|Taxes|VAT)\s*[:\-]?\s*(?:[\u20B9\u0024]|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/i);
    if (taxMatch) {
      fields.taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''));
    }

    // 9. Payment Status
    const payMatch = text.match(/(?:Payment\s*Status|Status)\s*[:\-]?\s*(Paid|Pending|Unpaid|Settled|Cashless|Partially\s*Paid)/i);
    if (payMatch) {
      fields.paymentStatus = payMatch[1].toUpperCase();
    } else if (/\bPAID\b/i.test(text)) {
      fields.paymentStatus = 'PAID';
    }

    // 10. Diagnosis / Treatment / Reason
    const diagMatch = text.match(/(?:Reason\s*for\s*Visit|Diagnosis|Treatment\s*(?:for)?|Chief\s*Complaint|Nature\s*of\s*Damage)\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    if (diagMatch) {
      fields.diagnosis = diagMatch[1].trim().replace(/\r?\n/g, ' ').replace(/(Itemized|Medical Charges|Charges|Subtotal|Total).*/i, '').trim();
    }

    // 11. Line Items breakdown
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (/Description|Total Payable|Subtotal|Discount|GST|Tax|Grand Total|Itemized/i.test(line)) continue;

      const itemMatch = line.match(/^(.+?)(?:(\d+?))?([\d,]+\.\d{2})([\d,]+\.\d{2})$/);
      if (itemMatch) {
        const desc = itemMatch[1].trim();
        const amt = parseFloat(itemMatch[4].replace(/,/g, ''));
        if (desc.length > 2 && !isNaN(amt) && amt > 0) {
          fields.lineItems.push({
            description: desc,
            amount: amt,
            sourcePage: 1,
          });
          continue;
        }
      }

      const singleMatch = line.match(/^([A-Za-z0-9\s&(),\-\/.]+?)\s*(?:[:\-])?\s*(?:[\u20B9\u0024]|Rs\.?|INR)?\s*([\d,]+\.\d{2})$/);
      if (singleMatch) {
        const desc = singleMatch[1].trim();
        const amt = parseFloat(singleMatch[2].replace(/,/g, ''));
        if (desc.length > 2 && !isNaN(amt) && amt > 0) {
          fields.lineItems.push({
            description: desc,
            amount: amt,
            sourcePage: 1,
          });
        }
      }
    }

    let filledCoreCount = 0;
    if (fields.hospitalName) filledCoreCount += 20;
    if (fields.invoiceNumber) filledCoreCount += 20;
    if (fields.invoiceDate) filledCoreCount += 20;
    if (fields.patientName) filledCoreCount += 20;
    if (fields.totalAmount !== null && !isNaN(fields.totalAmount)) filledCoreCount += 20;
    const fieldExtractionConfidence = filledCoreCount;

    return { documentType, fields, fieldWarnings, fieldExtractionConfidence };
  }
}

export const ocrService = new OCRService();
