import sharp from 'sharp';

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  density?: number;
  hasAlpha?: boolean;
  channels?: number;
  space?: string;
}

export interface ProcessingOptions {
  originalFileName?: string;
  mimeType?: string;
  generateThumbnail?: boolean;
  generateOptimized?: boolean;
  thumbnailSize?: { width: number; height: number };
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface ProcessedImages {
  original: Buffer;
  thumbnail?: Buffer;
  optimized?: Buffer;
  metadata?: ImageMetadata;
  compressionRatio?: number;
  validation?: {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Process images for NDVI analysis and storage
 */
export async function processImage(
  imageBuffer: Buffer,
  options: ProcessingOptions = {}
): Promise<ProcessedImages> {
  try {
    const {
      generateThumbnail: shouldGenerateThumbnail = true,
      generateOptimized: shouldGenerateOptimized = true,
      thumbnailSize = { width: 300, height: 300 },
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 85,
    } = options;

    // Extract metadata from the original image
    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();

    const imageMetadata: ImageMetadata = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels,
      space: metadata.space,
    };

    // Validate NDVI image
    const validation = await validateNDVIImage(imageBuffer, imageMetadata);

    const result: ProcessedImages = {
      original: imageBuffer,
      metadata: imageMetadata,
      validation,
    };

    // Generate thumbnail if requested
    if (shouldGenerateThumbnail) {
      try {
        result.thumbnail = await generateThumbnail(imageBuffer, thumbnailSize);
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
    }

    // Generate optimized version if requested
    if (shouldGenerateOptimized) {
      try {
        const { buffer: optimizedBuffer, compressionRatio } = await optimizeImage(imageBuffer, {
          maxWidth,
          maxHeight,
          quality: metadata.format === 'tiff' ? 95 : quality,
        });
        result.optimized = optimizedBuffer;
        result.compressionRatio = compressionRatio;
      } catch (error) {
        console.warn('Failed to generate optimized image:', error);
      }
    }

    return result;

  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Generate a thumbnail from image buffer
 */
async function generateThumbnail(
  imageBuffer: Buffer,
  size: { width: number; height: number } = { width: 300, height: 300 }
): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Optimize image for web delivery
 */
async function optimizeImage(
  imageBuffer: Buffer,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<{ buffer: Buffer; compressionRatio: number }> {
  try {
    const {
      quality = 85,
      maxWidth = 2048,
      maxHeight = 2048,
      format = 'jpeg',
    } = options;

    let pipeline = sharp(imageBuffer);

    // Resize if needed
    if (maxWidth || maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimization
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
        break;
      case 'png':
        pipeline = pipeline.png({
          quality,
          compressionLevel: 9,
          progressive: true,
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({
          quality,
          effort: 6,
        });
        break;
    }

    const optimizedBuffer = await pipeline.toBuffer();

    // Calculate compression ratio
    const originalSize = imageBuffer.length;
    const optimizedSize = optimizedBuffer.length;
    const compressionRatio = originalSize > 0 ? (originalSize - optimizedSize) / originalSize : 0;

    return {
      buffer: optimizedBuffer,
      compressionRatio,
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}

/**
 * Validate NDVI image requirements
 */
async function validateNDVIImage(
  imageBuffer: Buffer,
  metadata?: ImageMetadata
): Promise<{
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  try {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Use provided metadata or extract it
    let imageMetadata = metadata;
    if (!imageMetadata) {
      const sharpMeta = await sharp(imageBuffer).metadata();
      imageMetadata = {
        width: sharpMeta.width,
        height: sharpMeta.height,
        format: sharpMeta.format,
        size: sharpMeta.size,
        hasAlpha: sharpMeta.hasAlpha,
        channels: sharpMeta.channels,
        space: sharpMeta.space,
      };
    }

    // Check format
    const supportedFormats = ['tiff', 'tif', 'png', 'jpeg', 'jpg', 'webp'];
    if (imageMetadata.format && !supportedFormats.includes(imageMetadata.format.toLowerCase())) {
      issues.push(`Unsupported format: ${imageMetadata.format}`);
    }

    // Check dimensions
    if (imageMetadata.width && imageMetadata.height) {
      if (imageMetadata.width < 100 || imageMetadata.height < 100) {
        issues.push('Image dimensions too small for NDVI analysis');
      }

      if (imageMetadata.width > 10000 || imageMetadata.height > 10000) {
        recommendations.push('Large image detected - consider resizing for faster processing');
      }
    }

    // Check file size
    const fileSizeThreshold = 50 * 1024 * 1024; // 50MB
    if (imageBuffer.length > fileSizeThreshold) {
      recommendations.push('Large file size - optimization recommended');
    }

    // NDVI-specific checks
    if (imageMetadata.channels && imageMetadata.channels < 3) {
      issues.push('NDVI images typically require at least 3 channels (RGB or multispectral)');
    }

    if (imageMetadata.format === 'tiff' && !imageMetadata.hasAlpha) {
      recommendations.push('TIFF format detected - ensure it contains proper band information');
    }

    // Additional recommendations
    if (imageMetadata.format === 'jpeg') {
      recommendations.push('JPEG format may lose precision for NDVI analysis - consider TIFF or PNG');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  } catch (error) {
    return {
      isValid: false,
      issues: ['Failed to validate image: ' + (error as Error).message],
      recommendations: [],
    };
  }
}

/**
 * Extract detailed metadata from image buffer
 */
export async function extractImageMetadata(imageBuffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels,
      space: metadata.space,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw new Error('Failed to extract image metadata');
  }
}