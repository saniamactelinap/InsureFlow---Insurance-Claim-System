import fs from 'fs';

/**
 * Supported document signatures (magic bytes)
 */
const MAGIC_SIGNATURES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // RIFF
};

/**
 * Validate document file format, magic bytes, size, and integrity
 * @param {string|Buffer} input - File path or Buffer
 * @param {string} [claimedMimeType] - Mime type reported by user/multer
 * @returns {object} Validation result with detected format, isPdf, isImage, isValid, error
 */
export function validateDocumentFile(input, claimedMimeType = '') {
  let buffer;
  let fileSize = 0;

  try {
    if (Buffer.isBuffer(input)) {
      buffer = input;
      fileSize = input.length;
    } else if (typeof input === 'string') {
      if (!fs.existsSync(input)) {
        return {
          isValid: false,
          error: `File not found at path: ${input}`,
          code: 'FILE_NOT_FOUND',
        };
      }
      const stats = fs.statSync(input);
      fileSize = stats.size;
      if (fileSize === 0) {
        return {
          isValid: false,
          error: 'The uploaded file is empty (0 bytes).',
          code: 'EMPTY_FILE',
        };
      }
      // Read first 4KB for header validation
      const fd = fs.openSync(input, 'r');
      const headerBuf = Buffer.alloc(Math.min(4096, fileSize));
      fs.readSync(fd, headerBuf, 0, headerBuf.length, 0);
      fs.closeSync(fd);
      buffer = headerBuf;
    } else {
      return {
        isValid: false,
        error: 'Invalid file input type.',
        code: 'INVALID_INPUT',
      };
    }

    if (fileSize === 0) {
      return {
        isValid: false,
        error: 'The uploaded file is empty (0 bytes).',
        code: 'EMPTY_FILE',
      };
    }

    // 1. Detect format by magic bytes
    let detectedFormat = null;
    let detectedMimeType = null;

    if (buffer.length >= 4 && matchesBytes(buffer, MAGIC_SIGNATURES.PDF)) {
      detectedFormat = 'pdf';
      detectedMimeType = 'application/pdf';
    } else if (buffer.length >= 3 && matchesBytes(buffer, MAGIC_SIGNATURES.JPEG)) {
      detectedFormat = 'jpeg';
      detectedMimeType = 'image/jpeg';
    } else if (buffer.length >= 8 && matchesBytes(buffer, MAGIC_SIGNATURES.PNG)) {
      detectedFormat = 'png';
      detectedMimeType = 'image/png';
    } else if (
      buffer.length >= 12 &&
      matchesBytes(buffer, MAGIC_SIGNATURES.WEBP_RIFF) &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      detectedFormat = 'webp';
      detectedMimeType = 'image/webp';
    }

    if (!detectedFormat) {
      return {
        isValid: false,
        error: `Unsupported file signature. Uploaded file is neither a valid PDF nor a supported image (JPEG, PNG, WebP).`,
        code: 'UNSUPPORTED_FORMAT',
        fileSize,
      };
    }

    // 2. Specific inspection for PDF
    if (detectedFormat === 'pdf') {
      const fullBuffer = Buffer.isBuffer(input) ? input : fs.readFileSync(input);
      const pdfInspection = inspectPdfStructure(fullBuffer);
      if (!pdfInspection.isValid) {
        return {
          isValid: false,
          error: pdfInspection.error,
          code: pdfInspection.code,
          isPdf: true,
          isImage: false,
          fileSize,
          pdfInspection,
        };
      }

      return {
        isValid: true,
        detectedFormat: 'pdf',
        detectedMimeType: 'application/pdf',
        isPdf: true,
        isImage: false,
        fileSize,
        pdfInspection,
      };
    }

    return {
      isValid: true,
      detectedFormat,
      detectedMimeType,
      isPdf: false,
      isImage: true,
      fileSize,
    };
  } catch (err) {
    return {
      isValid: false,
      error: `Failed to inspect document: ${err.message}`,
      code: 'INSPECTION_FAILED',
    };
  }
}

/**
 * Inspect PDF buffer for encryption, corruption, and structure
 */
export function inspectPdfStructure(buffer) {
  const binary = buffer.toString('binary');

  // Verify PDF header
  if (!binary.startsWith('%PDF-')) {
    return {
      isValid: false,
      error: 'Malformed PDF: Missing %PDF header.',
      code: 'PDF_MISSING_HEADER',
    };
  }

  // Check for password encryption
  if (binary.includes('/Encrypt')) {
    return {
      isValid: false,
      error: 'Encrypted PDF detected. Please upload an unencrypted or password-free document.',
      code: 'PDF_ENCRYPTED',
      isEncrypted: true,
    };
  }

  // Check for EOF marker
  const lastEof = binary.lastIndexOf('%%EOF');
  if (lastEof === -1) {
    return {
      isValid: false,
      error: 'Malformed PDF: Truncated document missing %%EOF terminator.',
      code: 'PDF_TRUNCATED',
    };
  }

  // Check XRef marker
  const hasStartXref = /startxref[\r\n]+\d+[\r\n]+%%EOF/i.test(binary);
  const hasXrefStream = binary.includes('/XRef') || binary.includes('xref');

  return {
    isValid: true,
    isEncrypted: false,
    hasStartXref,
    hasXrefStream,
    byteLength: buffer.length,
  };
}

/**
 * Classify document type based on category or contextual keywords
 */
export function classifyDocumentCategory(category = 'HEALTH', rawText = '', originalName = '') {
  const text = (rawText + ' ' + originalName).toLowerCase();

  if (text.includes('prescription') || text.includes('rx') || text.includes('dr.') && text.includes('tablet')) {
    return 'prescription';
  }
  if (text.includes('discharge') && (text.includes('summary') || text.includes('card') || text.includes('hospital'))) {
    return 'discharge_summary';
  }
  if (text.includes('garage') || text.includes('repair') || text.includes('motor') || text.includes('estimate') || category === 'VEHICLE') {
    return 'vehicle_repair';
  }
  if (text.includes('policy') || text.includes('premium') || text.includes('schedule') || text.includes('certificate of insurance')) {
    return 'policy_document';
  }
  if (text.includes('hospital') || text.includes('clinic') || text.includes('patient') || text.includes('medical') || category === 'HEALTH') {
    return 'medical_bill';
  }

  return 'other';
}

function matchesBytes(buffer, signature) {
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}
