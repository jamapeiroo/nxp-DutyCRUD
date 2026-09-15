import { createDuty, deleteDuty, getDuties, updateDuty } from '../../services/duty.service';

function mockFetch(ok: boolean, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body
  });
}

describe('duty service', () => {
  it('returns the duties from the API', async () => {
    mockFetch(true, [{ id: '1', name: 'Plan' }]);

    await expect(getDuties()).resolves.toEqual([{ id: '1', name: 'Plan' }]);
  });

  it('sends the name when creating a duty', async () => {
    mockFetch(true, { id: '1', name: 'Plan' });

    await createDuty('Plan');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/duties',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Plan' }) })
    );
  });

  it('uses the id in the url when updating a duty', async () => {
    mockFetch(true, { id: '1', name: 'Plan' });

    await updateDuty('1', 'Plan');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/duties/1',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('sends a DELETE request and accepts an empty response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('204 has no body');
      }
    });

    await expect(deleteDuty('1')).resolves.toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/duties/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws the error message sent by the backend', async () => {
    mockFetch(false, { error: 'Name is required' });

    await expect(createDuty('')).rejects.toThrow('Name is required');
  });

  it('throws a generic message when the error response has no JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('not json');
      }
    });

    await expect(getDuties()).rejects.toThrow('Something went wrong, please try again');
  });

  it('throws a friendly message when the server is down', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getDuties()).rejects.toThrow('Could not connect to the server');
  });
});
