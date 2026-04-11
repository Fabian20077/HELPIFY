// ============================================================================
// Helpify — Unit Tests: Validador MIME
// Documento Técnico Sección RF-19, RF-21, RN-07 + Sección 9.3
// ============================================================================

import {
  detectMimeType,
  isAllowedMimeType,
  validateFile,
  ALLOWED_MIME_TYPES,
} from '../../services/mime-validator';

describe('MIME Validator', () => {
  // ── Detección de tipos por magic bytes ──────────────────────────────────
  describe('Detección por magic bytes', () => {
    it('detecta JPEG correctamente', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(detectMimeType(buffer)).toBe('image/jpeg');
    });

    it('detecta PNG correctamente', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(detectMimeType(buffer)).toBe('image/png');
    });

    it('detecta GIF correctamente', () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      expect(detectMimeType(buffer)).toBe('image/gif');
    });

    it('detecta PDF correctamente', () => {
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31]);
      expect(detectMimeType(buffer)).toBe('application/pdf');
    });

    it('detecta DOC (OLE) correctamente', () => {
      const buffer = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
      expect(detectMimeType(buffer)).toBe('application/msword');
    });

    it('detecta DOCX/ZIP correctamente', () => {
      const buffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00]);
      expect(detectMimeType(buffer)).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('detecta archivo de texto plano', () => {
      const buffer = Buffer.from('Hello, this is a plain text file.\n', 'utf8');
      expect(detectMimeType(buffer)).toBe('text/plain');
    });
  });

  // ── Archivos con extensión falsa (RN-07) ───────────────────────────────
  describe('Extensión falsa (exe renombrado como pdf)', () => {
    it('detecta un EXE aunque se nombre .pdf', () => {
      // Magic bytes de un archivo EXE (MZ header)
      const buffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const result = detectMimeType(buffer);
      // No es ningún tipo permitido
      expect(result).not.toBe('application/pdf');
    });

    it('validateFile rechaza un EXE renombrado como .pdf con 415', () => {
      const buffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      const result = validateFile(buffer, 'malicious.pdf', 1024);
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(415);
    });
  });

  // ── Validación de tipos permitidos ──────────────────────────────────────
  describe('Tipos permitidos', () => {
    it('acepta todos los tipos del documento (9 tipos)', () => {
      expect(ALLOWED_MIME_TYPES.size).toBe(9);
    });

    it('image/jpeg está permitido', () => {
      expect(isAllowedMimeType('image/jpeg')).toBe(true);
    });

    it('application/pdf está permitido', () => {
      expect(isAllowedMimeType('application/pdf')).toBe(true);
    });

    it('text/csv está permitido', () => {
      expect(isAllowedMimeType('text/csv')).toBe(true);
    });

    it('application/x-executable NO está permitido', () => {
      expect(isAllowedMimeType('application/x-executable')).toBe(false);
    });

    it('application/javascript NO está permitido', () => {
      expect(isAllowedMimeType('application/javascript')).toBe(false);
    });
  });

  // ── Validación de tamaño (RF-20) ───────────────────────────────────────
  describe('Validación de tamaño', () => {
    it('rechaza archivo de 15 MB con error 413', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const fifteenMB = 15 * 1024 * 1024;
      const result = validateFile(buffer, 'large-image.png', fifteenMB);
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(413);
    });

    it('acepta archivo de 5 MB', () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const fiveMB = 5 * 1024 * 1024;
      const result = validateFile(buffer, 'normal-image.png', fiveMB);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/png');
    });
  });

  // ── Validación completa ────────────────────────────────────────────────
  describe('Validación completa (validateFile)', () => {
    it('valida un JPEG válido correctamente', () => {
      const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const result = validateFile(buffer, 'photo.jpg', 1024);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('rechaza archivo binario desconocido con 415', () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      const result = validateFile(buffer, 'unknown.bin', 1024);
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(415);
    });
  });
});
