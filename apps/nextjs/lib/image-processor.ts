import sharp from 'sharp';

interface ProcessImageOptions {
  originalFileName: string;
  mimeType: string;
}

interface ProcessedImageResult {
  thumbnail: Buffer | null;
  optimized: Buffer | null;
  metadata: {
    width: number;
    height: number;
    format: string;
    space: string;
    channels: number;
    hasAlpha: boolean;
  } | null;
  compressionRatio: number | null;
}

export async function processImage(
  imageBuffer: Buffer,
  options: ProcessImageOptions
): Promise<ProcessedImageResult> {
  try {
    console.log('🖼️ Processing image:', options.originalFileName);
    
    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    console.log('📊 Image metadata:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      space: metadata.space,
      hasAlpha: metadata.hasAlpha
    });

    // Generate thumbnail (300x300)
    let thumbnail: Buffer | null = null;
    try {
      thumbnail = await image
        .clone()
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toBuffer();
      
      console.log('✅ Thumbnail generated:', thumbnail.length, 'bytes');
    } catch (thumbError) {
      console.error('⚠️ Failed to generate thumbnail:', thumbError);
    }

    // Generate optimized version (1200x1200 max)
    let optimized: Buffer | null = null;
    try {
      const maxSize = 1200;
      const shouldResize = metadata.width && metadata.height && 
                          (metadata.width > maxSize || metadata.height > maxSize);
      
      if (shouldResize) {
        optimized = await image
          .clone()
          .resize(maxSize, maxSize, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toBuffer();
        
        console.log('✅ Optimized version generated:', optimized.length, 'bytes');
      } else {
        console.log('ℹ️ Image already optimal size, skipping optimization');
      }
    } catch (optError) {
      console.error('⚠️ Failed to generate optimized version:', optError);
    }

    // Calculate compression ratio if we have optimized version
    let compressionRatio: number | null = null;
    if (optimized) {
      compressionRatio = 1 - (optimized.length / imageBuffer.length);
    }

    return {
      thumbnail,
      optimized,
      metadata: metadata.width && metadata.height ? {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown',
        space: metadata.space || 'unknown',
        channels: metadata.channels || 0,
        hasAlpha: metadata.hasAlpha || false
      } : null,
      compressionRatio
    };

  } catch (error) {
    console.error('❌ Image processing failed:', error);
    
    // Return empty result on failure
    return {
      thumbnail: null,
      optimized: null,
      metadata: null,
      compressionRatio: null
    };
  }
}

// Utility function to check if an image format is supported
export function isSupportedImageFormat(mimeType: string, fileName: string): boolean {
  const supportedMimeTypes = [
    'image/jpeg', 'image/jpg',
    'image/png',
    'image/tiff', 'image/tif',
    'image/webp',
    'application/octet-stream' // Some TIFF files come as this
  ];
  
  const supportedExtensions = /\.(jpe?g|png|tiff?|webp|bmp)$/i;
  
  return supportedMimeTypes.includes(mimeType.toLowerCase()) || 
         supportedExtensions.test(fileName.toLowerCase());
}
