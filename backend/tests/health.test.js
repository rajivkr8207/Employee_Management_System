import request from 'supertest';
import { app } from '../src/app.js';

describe('Healthcheck API', () => {
  it('should return 200 OK from /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Server is healthy');
    expect(res.body.data.message).toBe('OK');
  });
});
