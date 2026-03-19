// ============================================================================
// Helpify — Validador MIME por Magic Bytes
// Sección RF-19, RF-21, RN-07 del Documento Técnico
// ============================================================================
// El backend lee los magic bytes del archivo para determinar su tipo real,
// independientemente de la extensión del nombre del archivo.
// Tipos permitidos: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, TXT, CSV
// ============================================================================

/** Tipos MIME permitidos en Helpify */
export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',                                                    // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',                                                             // .txt
  'text/csv',                                                               // .csv
]);

/**
 * Firmas de magic bytes conocidas.
 * Cada entrada tiene el offset desde el inicio del archivo y los bytes esperados.
 */
const MAGIC_BYTES: Array<{
  mimeType: string;
  bytes: number[];
  offset?: number;
}> = [
  // JPEG: FF D8 FF
  { mimeType: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  // GIF: 47 49 46 38
  { mimeType: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  { mimeType: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  // PDF: 25 50 44 46 (%PDF)
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  // DOC: D0 CF 11 E0 A1 B1 1A E1 (OLE compound document)
  { mimeType: 'application/msword', bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },
  // DOCX/ZIP: 50 4B 03 04 (PK..)
  {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: [0x50, 0x4B, 0x03, 0x04],
  },
];

/**
 * Detecta el tipo MIME real de un archivo basándose en sus magic bytes.
 * @param buffer - Buffer con los primeros bytes del archivo (mínimo 8 bytes)
 * @returns El tipo MIME detectado o null si no se reconoce
 */
export function detectMimeType(buffer: Buffer): string | null {
  for (const sig of MAGIC_BYTES) {
    const offset = sig.offset ?? 0;
    const match = sig.bytes.every(
      (byte, index) => buffer[offset + index] === byte
    );

    if (match) {
      // Verificación adicional para WEBP (bytes 8-11 deben ser "WEBP")
      if (sig.mimeType === 'image/webp') {
        const webpCheck = buffer[8] === 0x57 && buffer[9] === 0x45 &&
                          buffer[10] === 0x42 && buffer[11] === 0x50;
        if (!webpCheck) continue;
      }
      return sig.mimeType;
    }
  }

  // Fallback para archivos de texto (TXT y CSV)
  // Verificar si los primeros bytes son todos ASCII imprimibles
  const isText = Array.from(buffer.slice(0, Math.min(512, buffer.length))).every(
    (byte) => byte === 0x0A || byte === 0x0D || byte === 0x09 || (byte >= 0x20 && byte <= 0x7E)
  );

  if (isText) {
    return 'text/plain';
  }

  return null;
}

/**
 * Valida si un tipo MIME es permitido en Helpify.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Tamaño máximo de archivo en bytes (10 MB por defecto).
 */
export function getMaxFileSizeBytes(): number {
  const maxMb = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
  return maxMb * 1024 * 1024;
}

/**
 * Valida un archivo completamente (MIME + tamaño).
 * @returns Objeto con el resultado de la validación
 */
export function validateFile(
  buffer: Buffer,
  originalFilename: string,
  fileSize: number
): { valid: boolean; mimeType?: string; error?: string; statusCode?: number } {
  // Validar tamaño (RF-20)
  if (fileSize > getMaxFileSizeBytes()) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${process.env.MAX_FILE_SIZE_MB || 10} MB.`,
      statusCode: 413,
    };
  }

  // Detectar MIME real por magic bytes (RN-07)
  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      error: `No se pudo determinar el tipo del archivo "${originalFilename}".`,
      statusCode: 415,
    };
  }

  // Validar que el MIME sea permitido (RF-21)
  if (!isAllowedMimeType(detectedMime)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${detectedMime}. Tipos aceptados: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, TXT, CSV.`,
      statusCode: 415,
    };
  }

  return { valid: true, mimeType: detectedMime };
}
