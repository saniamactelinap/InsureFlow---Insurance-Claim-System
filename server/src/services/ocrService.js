import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';

class OCRService {
  /**
   * Process a document file and extract text and structured fields
   * @param {string} filePath - Path to the file
   * @param {string} mimeType - MIME type of the document
   * @param {string} category - Insurance category: HEALTH | VEHICLE | PROPERTY
   */
  async processDocument(filePath, mimeType, category = 'HEALTH') {
    const startTime = Date.now();
    let rawText = '';
    let confidenceScore = 80;
    let extractionMethod = 'unknown';
    const warnings = [];

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      if (fileStats.size === 0) {
        throw new Error('The uploaded file is empty (0 bytes).');
      }

      const isPdf = mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf');
      const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(filePath);

      let opticalConfidence = 0;

      if (isPdf) {
        // 1. Digital PDF extraction attempt
        const buffer = fs.readFileSync(filePath);
        const { text, repaired } = await this.extractPdfText(buffer);

        if (text && text.trim().length >= 25) {
          rawText = text.trim();
          extractionMethod = repaired ? 'pdf_text_repaired' : 'pdf_text';
          opticalConfidence = 95;
        } else {
          // 2. Scanned PDF fallback: extract all image streams for multi-page support
          const embeddedImages = this.extractAllJpegImagesFromPdf(buffer);
          if (embeddedImages.length > 0) {
            const pageTexts = [];
            let totalConf = 0;
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
              warnings.push('Low optical character recognition output from scanned PDF image. Document flagged for manual review.');
            }
          } else {
            extractionMethod = 'scanned_pdf_empty_layer';
            opticalConfidence = 20;
            warnings.push('Scanned PDF contains no selectable text layer or standard image stream. Document flagged for manual officer inspection.');
          }
        }
      } else if (isImage) {
        // 3. Direct Image OCR via Tesseract.js
        const ocrResult = await this.runTesseractOcr(filePath);
        rawText = ocrResult.text;
        opticalConfidence = ocrResult.confidence;
        extractionMethod = 'tesseract_ocr';

        if (opticalConfidence < 60) {
          warnings.push(`Low optical recognition confidence (${opticalConfidence}%). Document may contain handwriting, low contrast, or degraded print.`);
        }
        if (!rawText || rawText.trim().length < 15) {
          warnings.push('Minimal text detected in image. Document flagged for manual officer inspection.');
        }
      } else {
        throw new Error(`Unsupported document MIME type: ${mimeType}`);
      }

      // Check for handwriting characteristics
      if (this.detectHandwritingCharacteristics(rawText, opticalConfidence)) {
        warnings.push('Document exhibits characteristics of handwritten or low-legibility content. Optical extraction may be incomplete; document flagged for manual review.');
      }

      // Extract structured fields
      const { documentType, fields, fieldWarnings, fieldExtractionConfidence } = this.extractStructuredFields(rawText, category);
      warnings.push(...fieldWarnings);

      // Defensible composite confidence score:
      // Weight: 40% optical character clarity + 60% structured insurance field completeness
      const confidenceScore = opticalConfidence > 0
        ? Math.round((opticalConfidence * 0.4) + (fieldExtractionConfidence * 0.6))
        : 0;

      let reviewStatus = 'VERIFIED';
      if (confidenceScore < 70 || fields.totalAmount === null || !fields.invoiceNumber || !fields.patientName) {
        reviewStatus = 'NEEDS_MANUAL_REVIEW';
      }

      return {
        success: true,
        documentType,
        extractionMethod,
        opticalConfidence,
        fieldExtractionConfidence,
        confidenceScore,
        reviewStatus,
        fields,
        extractedFields: {
          ...fields,
          invoiceOrBillNumber: fields.invoiceNumber ?? null,
          detectedDate: fields.invoiceDate ?? null,
          detectedAmount: fields.totalAmount ?? null,
          issuerName: fields.hospitalName ?? null,
          patientOrVehicleId: fields.patientName ?? null,
          diagnosesOrDamageKeywords: fields.diagnosis ? [fields.diagnosis] : [],
        },
        rawText,
        warnings,
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
      // Ensure clean typed array slice so PDF.js doesn't read pooled memory or suffer offset misalignment
      const safeBuffer = buffer instanceof Uint8Array
        ? new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength))
        : buffer;

      const data = await pdfParse(safeBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return { text: data.text, repaired: false };
      }
    } catch (err) {
      // Auto-repair for CRLF / ReportLab XRef offset mismatch
      try {
        const str = buffer.toString('binary');
        const actualXref = str.indexOf('xref');
        if (actualXref !== -1) {
          const fixedStr = str.replace(/startxref\r?\n\d+\r?\n%%EOF/, `startxref\n${actualXref}\n%%EOF`);
          const fixedBuf = Buffer.from(fixedStr, 'binary');
          const safeFixed = new Uint8Array(fixedBuf.buffer.slice(fixedBuf.byteOffset, fixedBuf.byteOffset + fixedBuf.byteLength));
          const fixedData = await pdfParse(safeFixed);
          if (fixedData && fixedData.text && fixedData.text.trim().length > 0) {
            return { text: fixedData.text, repaired: true };
          }
        }
      } catch (repairErr) {
        // Fallback returns empty text
      }
    }
    return { text: '', repaired: false };
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
   * Extract first JPEG image stream from scanned PDF buffer if present
   */
  extractFirstJpegFromPdf(buffer) {
    const all = this.extractAllJpegImagesFromPdf(buffer);
    return all.length > 0 ? all[0] : null;
  }

  /**
   * Execute Tesseract OCR on a file path or image buffer
   */
  async runTesseractOcr(imageSource) {
    const worker = await createWorker('eng');
    try {
      const ret = await worker.recognize(imageSource);
      const text = ret.data.text || '';
      const confidence = Math.round(ret.data.confidence) || 60;
      return { text: text.trim(), confidence };
    } finally {
      await worker.terminate();
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

  getEmptyFields() {
    return {
      patientName: null,
      hospitalName: null,
      invoiceNumber: null,
      invoiceDate: null,
      admissionDate: null,
      dischargeDate: null,
      diagnosis: null,
      lineItems: [],
      subtotal: null,
      taxAmount: null,
      discountAmount: null,
      totalAmount: null,
      paymentStatus: null,
    };
  }

  /**
   * Extract structured insurance information from raw text
   */
  extractStructuredFields(text, category) {
    const fields = this.getEmptyFields();
    const fieldWarnings = [];

    if (!text || typeof text !== 'string') {
      fieldWarnings.push('No legible text available for entity recognition.');
      return { documentType: 'other', fields, fieldWarnings, fieldExtractionConfidence: 0 };
    }

    const lower = text.toLowerCase();
    let documentType = 'general_document';

    if (category === 'HEALTH' || lower.includes('hospital') || lower.includes('patient') || lower.includes('medical') || lower.includes('doctor') || lower.includes('clinic')) {
      documentType = 'medical_bill';
    } else if (category === 'VEHICLE' || lower.includes('garage') || lower.includes('repair') || lower.includes('vehicle') || lower.includes('motors') || lower.includes('chassis')) {
      documentType = 'vehicle_repair';
    } else if (category === 'PROPERTY' || lower.includes('property') || lower.includes('damage') || lower.includes('restoration') || lower.includes('contractor')) {
      documentType = 'property_damage';
    }

    // 1. Healthcare Provider / Hospital / Garage Name
    const hospMatch = text.match(/([A-Z0-9\s.,'&-]{4,50}(?:HOSPITAL|CLINIC|HEALTHCARE|MEDICAL CENTER|NURSING HOME|LABORATORY|LABORATORIES|MOTORS|AUTO WORKS|GARAGE|REPAIR CENTER))/i);
    if (hospMatch) {
      fields.hospitalName = hospMatch[1].trim().replace(/\r?\n/g, ' ');
    } else {
      fieldWarnings.push('Healthcare provider or facility name could not be identified with certainty.');
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
      
      // Concatenated or spaced table format with Qty, Unit Price and Total
      const itemMatch = line.match(/^(.+?)(?:(\d+?))?([\d,]+\.\d{2})([\d,]+\.\d{2})$/);
      if (itemMatch) {
        const desc = itemMatch[1].trim();
        const amt = parseFloat(itemMatch[4].replace(/,/g, ''));
        if (desc.length > 2 && !isNaN(amt) && amt > 0) {
          fields.lineItems.push({
            description: desc,
            amount: amt,
          });
          continue;
        }
      }

      // Single item with price format
      const singleMatch = line.match(/^([A-Za-z0-9\s&(),\-\/.]+?)\s*(?:[:\-])?\s*(?:[\u20B9\u0024]|Rs\.?|INR)?\s*([\d,]+\.\d{2})$/);
      if (singleMatch) {
        const desc = singleMatch[1].trim();
        const amt = parseFloat(singleMatch[2].replace(/,/g, ''));
        if (desc.length > 2 && !isNaN(amt) && amt > 0) {
          fields.lineItems.push({
            description: desc,
            amount: amt,
          });
        }
      }
    }

    // Calculate defensible field extraction confidence based on core insurance fields
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
