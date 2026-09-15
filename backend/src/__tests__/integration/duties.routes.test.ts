import request from 'supertest';
import { app } from '../../app';
import { pool } from '../../config/database';

// The whole app runs (routes, controller, service, repository) but pool.query is a mock,
// so we don't need a real database
jest.mock('../../config/database', () => ({
  pool: { query: jest.fn() }
}));

const query = pool.query as unknown as jest.Mock;
const duty = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Plan release' };

describe('GET /api/duties', () => {
  it('returns the list of duties', async () => {
    query.mockResolvedValueOnce({ rows: [duty] });

    const response = await request(app).get('/api/duties');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([duty]);
  });

  it('returns 500 without leaking database errors', async () => {
    query.mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    const response = await request(app).get('/api/duties');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Something went wrong' });
  });
});

describe('POST /api/duties', () => {
  it('creates a duty', async () => {
    query.mockResolvedValueOnce({ rows: [duty] });

    const response = await request(app).post('/api/duties').send({ name: '  Plan release  ' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(duty);
    // the name is saved trimmed
    expect(query.mock.calls[0][1]).toEqual(['Plan release']);
  });

  it('returns 400 when the name is only spaces', async () => {
    const response = await request(app).post('/api/duties').send({ name: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Name is required' });
    expect(query).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const response = await request(app)
      .post('/api/duties')
      .set('Content-Type', 'application/json')
      .send('{ bad json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid JSON body' });
  });
});

describe('PUT /api/duties/:id', () => {
  it('updates a duty', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...duty, name: 'Updated duty' }] });

    const response = await request(app).put(`/api/duties/${duty.id}`).send({ name: 'Updated duty' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...duty, name: 'Updated duty' });
  });

  it('returns 404 when the duty does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).put(`/api/duties/${duty.id}`).send({ name: 'Missing duty' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Duty not found' });
  });

  it('returns 400 when the id is not a UUID', async () => {
    const response = await request(app).put('/api/duties/123').send({ name: 'Valid name' });

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/duties/:id', () => {
  it('deletes a duty', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app).delete(`/api/duties/${duty.id}`);

    expect(response.status).toBe(204);
  });

  it('returns 404 when the duty does not exist', async () => {
    query.mockResolvedValueOnce({ rowCount: 0 });

    const response = await request(app).delete(`/api/duties/${duty.id}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Duty not found' });
  });

  it('returns 400 when the id is not a UUID', async () => {
    const response = await request(app).delete('/api/duties/123');

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('unknown routes', () => {
  it('returns 404', async () => {
    const response = await request(app).get('/api/missing');

    expect(response.status).toBe(404);
  });
});
