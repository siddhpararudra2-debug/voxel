import request from 'supertest';
import { app, server } from '../src/server.js';

describe('Nebula Bound REST integration contract', () => {
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('reports healthy and ready states', async () => {
    await request(app).get('/health').expect(200).expect(({ body }) => {
      expect(body.status).toBe('ok');
    });
    await request(app).get('/ready').expect(200).expect(({ body }) => {
      expect(body.status).toBe('ready');
    });
  });

  it('rejects protected routes without a Supabase bearer token', async () => {
    await request(app).get('/api/me').expect(401);
  });
});
