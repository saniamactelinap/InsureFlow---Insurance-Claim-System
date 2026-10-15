import { GoogleGenAI } from '@google/genai';

/**
 * Production Gemini Vision Service for Insurance Documents
 */
class GeminiOcrService {
  constructor() {
    this.mockClient = null;
  }

  /**
   * Check if Gemini API is configured and ready
   */
  isAvailable() {
    if (this.mockClient) return true;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    return !!(apiKey && apiKey.trim().length > 0 && !apiKey.includes('your_gemini_api_key'));
  }

  /**
   * Set a mock client for testing
   */
  setMockClient(client) {
    this.mockClient = client;
  }

  /**
   * Get active model identifier
   */
  getModelName() {
    return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  /**
   * Extract structured insurance document data from image or PDF
   * @param {object} params
   * @param {Buffer} params.buffer - Document file buffer
   * @param {string} params.mimeType - MIME type ('application/pdf', 'image/jpeg', 'image/png')
   * @param {string} [params.category] - Claim category: HEALTH | VEHICLE | PROPERTY
   * @param {string} [params.originalName] - Original filename
   * @returns {Promise<object>}
   */
  async extractStructuredData({ buffer, mimeType, category = 'HEALTH', originalName = '' }) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Gemini API key is not configured. Falling back to local OCR.',
        code: 'API_KEY_MISSING',
      };
    }

    const startTime = Date.now();
    try {
      // 1. Prepare base64 inline data
      const base64Data = buffer.toString('base64');

      // 2. Build structured extraction prompt
      const prompt = `You are an expert insurance document verification specialist and forensic OCR auditor for InsureFlow.
Carefully examine the attached insurance document (${originalName || 'uploaded file'}).

Context:
- Expected Claim Category: ${category}
- Document may be a printed hospital invoice, handwritten doctor prescription, pharmacy bill, vehicle repair estimate, discharge summary, or insurance policy schedule.

CRITICAL EXTRACTION RULES:
1. ONLY extract information that is physically visible and legible on this document.
2. NEVER guess, hallucinate, or fabricate any missing numbers, dates, or names.
3. If a field cannot be read or is not present, set its value to null.
4. NEVER convert a missing total amount to 0 or INR 0. A 0 must ONLY be returned if a zero (0.00) is explicitly printed or written on the document as the net payable total.
5. HANDWRITING ACCURACY:
   - Carefully interpret handwritten amounts, patient names, dates, and doctor notes.
   - If any digit or value is ambiguous or unclear (e.g. uncertain if 2,500 or 25,000), set "isAmbiguous": true and list possible interpretations in "candidateReadings".
   - Flag "isHandwritten": true if the document or key fields contain handwriting.
6. Verify arithmetic: note subtotal, taxes, and discounts if itemized.

Return STRICTLY valid JSON conforming to this schema without any markdown formatting or commentary:
{
  "documentType": "medical_bill | prescription | vehicle_repair | policy_document | discharge_summary | receipt | other",
  "provider": {
    "name": string | null,
    "registrationNumber": string | null,
    "facilityType": string | null
  },
  "patientOrInsured": {
    "name": string | null,
    "policyNumber": string | null,
    "vehicleRegistrationNumber": string | null
  },
  "identifiers": {
    "invoiceNumber": string | null,
    "billNumber": string | null,
    "receiptNumber": string | null
  },
  "dates": {
    "invoiceDate": string | null,
    "admissionDate": string | null,
    "dischargeDate": string | null,
    "incidentOrServiceDate": string | null
  },
  "financials": {
    "currency": string,
    "subtotal": number | null,
    "taxAmount": number | null,
    "discountAmount": number | null,
    "totalAmount": number | null,
    "paymentStatus": "PAID" | "PENDING" | "UNPAID" | "SETTLED" | null
  },
  "lineItems": [
    {
      "description": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "amount": number,
      "sourcePage": number
    }
  ],
  "handwritingDetails": {
    "detected": boolean,
    "ambiguousFields": string[],
    "notes": string
  },
  "fieldMetadata": {
    "totalAmount": {
      "confidence": number,
      "sourcePage": number,
      "evidence": string,
      "isHandwritten": boolean,
      "isAmbiguous": boolean,
      "candidateReadings": number[]
    },
    "invoiceNumber": {
      "confidence": number,
      "sourcePage": number,
      "evidence": string
    },
    "providerName": {
      "confidence": number,
      "sourcePage": number,
      "evidence": string
    },
    "patientName": {
      "confidence": number,
      "sourcePage": number,
      "evidence": string
    },
    "invoiceDate": {
      "confidence": number,
      "sourcePage": number,
      "evidence": string
    }
  },
  "overallLegibilityConfidence": number,
  "summaryNotes": string
}`;

      let responseText = '';

      if (this.mockClient) {
        // Use mocked client for automated testing
        const mockRes = await this.mockClient.generateContent({
          model: this.getModelName(),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        responseText = typeof mockRes === 'string' ? mockRes : (mockRes.text || JSON.stringify(mockRes));
      } else {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const ai = new GoogleGenAI({ apiKey });

        const requestPayload = {
          model: this.getModelName(),
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'application/pdf',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        };

        // Bounded 25-second timeout call
        const response = await Promise.race([
          ai.models.generateContent(requestPayload),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini Vision API request timed out (25s threshold).')), 25000)
          ),
        ]);

        responseText = response.text || '';
      }

      if (!responseText) {
        throw new Error('Empty response received from Gemini Vision model.');
      }

      // 3. Clean and parse JSON
      const cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanedJson);

      // 4. Normalize extracted fields to application standard schema
      const normalized = this.normalizeExtractedData(parsed);

      return {
        success: true,
        data: normalized,
        rawJson: parsed,
        durationMs: Date.now() - startTime,
        model: this.getModelName(),
      };
    } catch (err) {
      console.error('[Gemini Vision Extraction Error]', err.message);

      let isRateLimit = false;
      let isTimeout = false;

      if (err.status === 429 || (err.message && err.message.includes('429')) || (err.message && err.message.includes('quota'))) {
        isRateLimit = true;
      }
      if (err.message && err.message.includes('timed out')) {
        isTimeout = true;
      }

      return {
        success: false,
        error: err.message,
        isRateLimit,
        isTimeout,
        code: isRateLimit ? 'RATE_LIMITED' : (isTimeout ? 'TIMEOUT' : 'EXTRACTION_FAILED'),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Normalize Gemini structured JSON into InsureFlow's standard fields structure
   */
  normalizeExtractedData(parsed) {
    const fields = {
      patientName: parsed.patientOrInsured?.name ?? null,
      hospitalName: parsed.provider?.name ?? null,
      invoiceNumber: parsed.identifiers?.invoiceNumber || parsed.identifiers?.billNumber || parsed.identifiers?.receiptNumber || null,
      invoiceDate: parsed.dates?.invoiceDate ?? null,
      admissionDate: parsed.dates?.admissionDate ?? null,
      dischargeDate: parsed.dates?.dischargeDate ?? null,
      incidentOrServiceDate: parsed.dates?.incidentOrServiceDate ?? null,
      diagnosis: parsed.summaryNotes || null,
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      subtotal: parsed.financials?.subtotal != null ? Number(parsed.financials.subtotal) : null,
      taxAmount: parsed.financials?.taxAmount != null ? Number(parsed.financials.taxAmount) : null,
      discountAmount: parsed.financials?.discountAmount != null ? Number(parsed.financials.discountAmount) : null,
      totalAmount: parsed.financials?.totalAmount != null ? Number(parsed.financials.totalAmount) : null,
      paymentStatus: parsed.financials?.paymentStatus ?? null,
      currency: parsed.financials?.currency || 'INR',
      policyNumberFound: parsed.patientOrInsured?.policyNumber ?? null,
      vehicleRegistrationNumber: parsed.patientOrInsured?.vehicleRegistrationNumber ?? null,
    };

    const handwritingDetected = !!(
      parsed.handwritingDetails?.detected ||
      parsed.fieldMetadata?.totalAmount?.isHandwritten ||
      parsed.documentClassification?.isHandwritten
    );

    const candidateReadings = {};
    if (parsed.fieldMetadata?.totalAmount?.candidateReadings?.length > 0) {
      candidateReadings.totalAmount = parsed.fieldMetadata.totalAmount.candidateReadings;
    }

    return {
      documentType: parsed.documentType || 'general_document',
      fields,
      fieldMetadata: parsed.fieldMetadata || {},
      handwritingDetected,
      candidateReadings,
      overallLegibilityConfidence: parsed.overallLegibilityConfidence || 85,
      summaryNotes: parsed.summaryNotes || '',
    };
  }
}

export const geminiOcrService = new GeminiOcrService();
