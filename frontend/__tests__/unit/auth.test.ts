import {
  decodeTokenPayload,
  getToken,
  setToken,
  removeToken,
  AUTH_TOKEN_KEY,
} from '@/lib/auth';
import { UserRole } from '@/lib/types';

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('decodeTokenPayload', () => {
    it('decodes valid token payload without validation', () => {
      const payload = { id: 'user-1', role: UserRole.ADMIN, departmentId: 'dept-1' };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `header.${base64Payload}.signature`;

      const decoded = decodeTokenPayload(token);
      expect(decoded).toEqual(payload);
    });

    it('returns null for unparseable token payload', () => {
      expect(decodeTokenPayload('invalid.token.here')).toBeNull();
    });
  });

  describe('localStorage token helpers', () => {
    it('setToken stores JWT and getToken reads it', () => {
      setToken('jwt-value');
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-value');
      expect(getToken()).toBe('jwt-value');
    });

    it('removeToken clears the stored JWT', () => {
      setToken('jwt-value');
      removeToken();
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(getToken()).toBeUndefined();
    });
  });
});
