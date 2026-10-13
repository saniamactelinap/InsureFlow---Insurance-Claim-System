import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';

class OCRService {
  /**
   * Process a document file and extract text and structured fields
   * @param {string} filePath - Absolute or relative path to the uploaded file
   * @param {string} mimeType - MIME type of the document
   * @param {string} category - Document category
   * @returns {Promise<{rawText: string, confidenceScore: number, extractedFields: object, provider: string}>}
   */
  async processDocument(filePath, mimeType, category = 'OTHER') {
    const startTime = Date.now();
    let rawText = '';
    let confidenceScore = 80;
    const provider = 'tesseract';

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      if (mimeType === 'application/pdf') {
        // PDF parsing using pdf-parse
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        rawText = pdfData.text || '';
        confidenceScore = rawText.trim().length > 50 ? 92 : 65;
      } else {
        // Image parsing using Tesseract.js
        const worker = await createWorker('eng');
        const ret = await worker.recognize(filePath);
        rawText = ret.data.text || '';
        confidenceScore = Math.round(ret.data.confidence) || 75;
        await worker.terminate();
      }

      const extractedFields = this.extractStructuredFields(rawText, category);

      return {
        rawText,
        confidenceScore,
        extractedFields,
        provider,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[OCR Service Error]', error);
      // Return a graceful extraction response with low confidence so the user can manually enter/review
      return {
        rawText: `[OCR Processing Note: ${error.message}]`,
        confidenceScore: 30,
        extractedFields: {
          documentNumber: '',
          invoiceOrBillNumber: '',
          detectedDate: '',
          detectedAmount: 0,
          issuerName: '',
          policyNumberFound: '',
          patientOrVehicleId: '',
          diagnosesOrDamageKeywords: [],
        },
        provider,
        durationMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Rule-based entity recognition for extracted OCR text
   */
  extractStructuredFields(text, category) {
    const fields = {
      documentNumber: '',
      invoiceOrBillNumber: '',
      detectedDate: '',
      detectedAmount: 0,
      issuerName: '',
      policyNumberFound: '',
      patientOrVehicleId: '',
      diagnosesOrDamageKeywords: [],
    };

    if (!text || typeof text !== 'string') return fields;

    // 1. Detect Policy Number
    const policyRegex = /(?:Policy\s*(?:No\.?|#|Number)?|POL)\s*[:\-]?\s*([A-Za-z0-9\-]{5,20})/i;
    const policyMatch = text.match(policyRegex);
    if (policyMatch) {
      fields.policyNumberFound = policyMatch[1].trim();
    }

    // 2. Detect Invoice / Bill Number
    const billRegex = /(?:Invoice|Bill|Receipt|Claim|Ref)\s*(?:No\.?|#|Number)?\s*[:\-]?\s*([A-Za-z0-9\-]{4,20})/i;
    const billMatch = text.match(billRegex);
    if (billMatch) {
      fields.invoiceOrBillNumber = billMatch[1].trim();
      fields.documentNumber = billMatch[1].trim();
    }

    // 3. Detect Dates (ISO YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY)
    const dateRegex = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      fields.detectedDate = dateMatch[1].trim();
    }

    // 4. Detect Monetary Amounts (Total, Grand Total, Net, Amount)
    const amountRegexes = [
      /(?:Grand\s*Total|Total\s*Amount|Net\s*Amount|Total\s*Payable|Amount\s*Due|Total)\s*[:\-]?\s*[$₹€£]?\s*([\d,]+(?:\.\d{2})?)/i,
      /[$₹€£]\s*([\d,]+(?:\.\d{2})?)/,
      /(?:Cost|Fee|Estimate|Subtotal)\s*[:\-]?\s*[$₹€£]?\s*([\d,]+(?:\.\d{2})?)/i
    ];

    for (const rx of amountRegexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        const cleanVal = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(cleanVal) && cleanVal > 0) {
          fields.detectedAmount = cleanVal;
          break;
        }
      }
    }

    // 5. Detect Issuer / Hospital / Clinic / Garage / Service Center
    const issuerRegex = /(?:Hospital|Clinic|Healthcare|Medical Center|Motors|Auto Works|Garage|Repair Center|Services|Laboratories)\b[^\n,.]*/i;
    const issuerMatch = text.match(issuerRegex);
    if (issuerMatch) {
      fields.issuerName = issuerMatch[0].trim().slice(0, 60);
    }

    // 6. Detect Vehicle Registration Number or Patient ID
    const regRegex = /\b([A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}|[A-Z0-9]{3}-[0-9]{3,4})\b/i;
    const regMatch = text.match(regRegex);
    if (regMatch) {
      fields.patientOrVehicleId = regMatch[1].trim();
    }

    // 7. Detect Medical / Damage keywords
    const keywords = [
      'fracture', 'fever', 'surgery', 'icu', 'admission', 'discharge',
      'collision', 'dent', 'bumper', 'windshield', 'scratch', 'headlight',
      'water leakage', 'fire damage', 'storm', 'burglary', 'theft', 'repair'
    ];
    const lowerText = text.toLowerCase();
    fields.diagnosesOrDamageKeywords = keywords.filter(k => lowerText.includes(k));

    return fields;
  }
}

export const ocrService = new OCRService();
