import { apiFetch, ApiError, api } from '@/lib/api';

global.fetch = jest.fn();

describe('API Client (apiFetch)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('adds token to headers when provided', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: { id: 1 } }),
    });

    await api.get('/test', 'my-token');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    );
  });

  it('parses error response and throws ApiError', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ status: 'error', message: 'Bad request' }),
    });

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
