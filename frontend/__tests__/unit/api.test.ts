import { ApiError, api } from '@/lib/api';

global.fetch = jest.fn();

function jsonResponse(overrides: {
  ok?: boolean;
  status?: number;
  json?: () => Promise<unknown>;
} = {}) {
  const contentType = 'application/json';
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    json: async () => ({ status: 'success', data: { id: 1 } }),
    ...overrides,
  };
}

describe('API Client (apiFetch)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('adds token to headers when provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        json: async () => ({ status: 'success', data: { id: 1 } }),
      }),
    );

    await api.get('/test', 'my-token');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      }),
    );
  });

  it('parses error response and throws ApiError', async () => {
    (fetch as jest.Mock).mockResolvedValue(
      jsonResponse({
        ok: false,
        status: 400,
        json: async () => ({ status: 'error', message: 'Bad request' }),
      }),
    );

    await expect(api.get('/test')).rejects.toThrow(ApiError);
    await expect(api.get('/test')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Bad request',
    });
  });

  it('handles 204 No Content', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const res = await api.delete('/test');
    expect(res).toBeUndefined();
  });
});
