// pages/api/__tests__/protected.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../protected';  // Matches your API filename
import { authenticate } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  authenticate: jest.fn()
}));

describe('/api/protected', () => {  // Matches your endpoint
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return admin data for authenticated admin', async () => {
    authenticate.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      role: 'admin'
    });

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      message: 'Welcome, admin!',
      user: {
        id: 1,
        email: 'admin@example.com', 
        role: 'admin'
      }
    });
  });

  // ... rest of your test cases ...
});