import fs from 'fs';

/**
 * Validar el tipo MIME real de un archivo usando sus Magic Bytes (Firma digital)
 * RN-07: Validación estricta para evitar spoofing de extensiones.
 */
export const validateMagicBytes = (filePath: string): string | null => {
  const buffer = Buffer.alloc(8);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  const hex = buffer.toString('hex').toUpperCase();

  // Firmas comunes
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  if (hex.startsWith('25504446')) return 'application/pdf';
  if (hex.startsWith('504B0304')) return 'application/vnd.openxmlformats-officedocument'; // DOCX, XLSX, etc. (ZIP based)
  if (hex.startsWith('D0CF11E0')) return 'application/msword'; // Legacy DOC
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') return 'image/webp';
  
  // Si no coincide con binarios conocidos, podría ser texto plano (CSV, TXT) o desconocido
  return null;
};

export const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv'
];
