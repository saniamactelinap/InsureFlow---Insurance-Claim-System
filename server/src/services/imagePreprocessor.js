import sharp from 'sharp';

/**
 * Image Preprocessor for Printed and Handwritten Insurance Documents
 */
class ImagePreprocessor {
  /**
   * Preprocess an image buffer or file path
   * @param {string|Buffer} input - Image file path or buffer
   * @param {object} [options]
   * @returns {Promise<{
   *   forTesseract: Buffer,
   *   forVision: Buffer,
   *   metadata: object,
   *   transformed: boolean
   * }>}
   */
  async preprocess(input, options = {}) {
    try {
      const pipeline = sharp(input);
      const meta = await pipeline.metadata();

      const {
        width = meta.width || 1000,
        height = meta.height || 1000,
        format = meta.format || 'jpeg',
      } = meta;

      // 1. Auto-orient according to EXIF metadata
      let rotated = sharp(input).rotate();

      // 2. Upscale low-resolution scans if width is smaller than 1200px
      let needUpscale = width < 1200;
      let targetWidth = needUpscale ? Math.min(2400, Math.round(width * 2)) : width;

      let enhancedPipeline = rotated;
      if (needUpscale) {
        enhancedPipeline = enhancedPipeline.resize({
          width: targetWidth,
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false,
        });
      }

      // 3. For Gemini Vision:
      // Keep color information intact so handwritten inks (blue, red, black)
      // and printed stamps/letterheads are clearly discernible.
      // Apply subtle contrast normalization and slight sharpening.
      const forVision = await enhancedPipeline
        .clone()
        .normalize() // Stretch luminance for clear contrast
        .sharpen({ sigma: 0.8, m1: 0.5, m2: 2.0 })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();

      // 4. For Local Tesseract OCR:
      // Convert to high-contrast grayscale with mild sharpening
      // to maximize optical character extraction.
      const forTesseract = await enhancedPipeline
        .clone()
        .grayscale()
        .normalize()
        .sharpen({ sigma: 1.2, m1: 0.8, m2: 2.5 })
        .png({ compressionLevel: 6 })
        .toBuffer();

      return {
        forTesseract,
        forVision,
        metadata: {
          originalWidth: width,
          originalHeight: height,
          originalFormat: format,
          processedWidth: targetWidth,
          upscaled: needUpscale,
        },
        transformed: true,
      };
    } catch (err) {
      console.warn('[ImagePreprocessor Warning]', err.message);
      // Fallback: return raw buffer if processing fails
      const fallbackBuf = Buffer.isBuffer(input) ? input : null;
      return {
        forTesseract: fallbackBuf,
        forVision: fallbackBuf,
        metadata: { error: err.message },
        transformed: false,
      };
    }
  }

  /**
   * Fast resize/format for quick thumbnail or preview
   */
  async createThumbnail(input, maxWidth = 800) {
    try {
      return await sharp(input)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (err) {
      return null;
    }
  }
}

export const imagePreprocessor = new ImagePreprocessor();
