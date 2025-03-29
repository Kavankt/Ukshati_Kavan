import { createMocks } from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import handler from '../me';  // Corrected import path

jest.mock('jsonwebtoken');
jest.mock('mysql2/promise');

describe('/api/auth/me', () => {
  let mockConnection;
  const mockUser = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: 'admin'
  };

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn(),
    };
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {},
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if token is invalid', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid.token.here'
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Invalid token' });
  });

  it('should return user data with valid token', async () => {
    jwt.verify.mockReturnValue({ id: mockUser.id });
    mysql.createConnection.mockResolvedValue(mockConnection);
    mockConnection.execute.mockResolvedValue([[mockUser]]);

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid.token.here'
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ user: mockUser });
  });

  it('should handle database connection errors', async () => {
    jwt.verify.mockReturnValue({ id: mockUser.id });
    mysql.createConnection.mockRejectedValue(new Error('DB connection failed'));

    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid.token.here'
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Invalid token' });
  });
});