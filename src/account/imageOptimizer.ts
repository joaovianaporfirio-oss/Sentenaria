const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024; // 8 MB raw limit before resize
const TARGET_DIMENSION = 256;
const MAX_OUTPUT_BYTES = 80 * 1024; // ~80 KB target

/**
 * Validates actual file magic bytes (PNG, JPEG, or WebP) so spoofed file extensions
 * or malicious non-image payloads cannot be processed.
 */
async function validateImageMagicBytes(file: File): Promise<boolean> {
  const headerBuf = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(headerBuf);
  if (bytes.length < 12) return false;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  // JPEG: FF D8 FF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  // WebP: RIFF....WEBP
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  return isPng || isJpeg || isWebp;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64Part = dataUrl.split(',')[1] || '';
  return Math.ceil((base64Part.length * 3) / 4);
}

/**
 * Validates, center-crops, resizes to 256x256, and compresses a user-uploaded avatar image
 * into WebP (or JPEG fallback) under ~80KB for fast Firebase Realtime Database loading.
 */
export async function optimizeAvatarFile(file: File): Promise<{
  dataUrl: string;
  sizeBytes: number;
}> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      'Formato inválido. Envie uma imagem PNG, JPEG ou WebP.'
    );
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('A imagem original excede o limite de 8 MB.');
  }

  const validSignature = await validateImageMagicBytes(file);
  if (!validSignature) {
    throw new Error(
      'O arquivo selecionado não é uma imagem válida (assinatura incompatível).'
    );
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error('Não foi possível decodificar a imagem selecionada.'));
      el.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_DIMENSION;
    canvas.height = TARGET_DIMENSION;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Seu navegador não suporta processamento de imagem.');
    }

    // Center-crop square from the original image
    const minSide = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - minSide) / 2);
    const sy = Math.floor((img.height - minSide) / 2);

    ctx.clearRect(0, 0, TARGET_DIMENSION, TARGET_DIMENSION);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      sx,
      sy,
      minSide,
      minSide,
      0,
      0,
      TARGET_DIMENSION,
      TARGET_DIMENSION
    );

    // Try WebP first, then JPEG, iteratively reducing quality until <= 80KB
    const formats: Array<'image/webp' | 'image/jpeg'> = [
      'image/webp',
      'image/jpeg',
    ];
    const qualities = [0.82, 0.72, 0.6, 0.48, 0.36];

    for (const mime of formats) {
      for (const quality of qualities) {
        const candidate = canvas.toDataURL(mime, quality);
        if (!candidate.startsWith(`data:${mime}`)) {
          break; // Browser doesn't support this encoder (e.g. WebP on older Safari)
        }
        const bytes = estimateDataUrlBytes(candidate);
        if (bytes <= MAX_OUTPUT_BYTES) {
          return { dataUrl: candidate, sizeBytes: bytes };
        }
      }
    }

    // Final fallback at lower resolution (192x192 JPEG) if extremely noisy image
    canvas.width = 192;
    canvas.height = 192;
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 192, 192);
    const fallback = canvas.toDataURL('image/jpeg', 0.55);
    const fallbackBytes = estimateDataUrlBytes(fallback);
    if (fallbackBytes > MAX_OUTPUT_BYTES) {
      throw new Error(
        'Não foi possível comprimir a imagem abaixo de 80 KB. Tente outra imagem.'
      );
    }
    return { dataUrl: fallback, sizeBytes: fallbackBytes };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
