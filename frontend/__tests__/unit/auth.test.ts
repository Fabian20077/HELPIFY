import { decodeTokenPayload, getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: { get: jest.fn() }
}));

// mock next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'mock-token' })
  })
}));

describe('Auth Utilities', () => {
  beforeEach(() => {
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

  describe('getCurrentUser', () => {
    it('fetches current user using token from cookies', async () => {
      const mockUser = { id: 'user-1', name: 'John Doe', role: UserRole.CUSTOMER };
      (api.get as jest.Mock).mockResolvedValueOnce(mockUser);

      const user = await getCurrentUser();
      expect(api.get).toHaveBeenCalledWith('/users/me', 'mock-token');
      expect(user).toEqual(mockUser);
    });

    it('returns null if api fails', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Auth failed'));
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
