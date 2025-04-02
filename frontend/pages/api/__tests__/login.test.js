// pages/api/__tests__/login.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../login';
import { connectToDB } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  connectToDB: jest.fn(() => ({
    execute: jest.fn(),
    release: jest.fn()
  }))
}));

jest.mock('bcryptjs');
jest.mock('@/lib/auth');

describe('/api/login', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    };
    connectToDB.mockResolvedValue(mockConnection);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
    console.log.mockRestore();
  });

  test('should return 405 for non-POST methods', async () => {
    const methods = ['GET', 'PUT', 'DELETE', 'PATCH'];
    for (const method of methods) {
      const { req, res } = createMocks({ method });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({ message: 'Method not allowed' });
    }
  });

  test('should return 400 if fields are missing', async () => {
    const testCases = [
      { email: '', password: 'pass', role: 'admin' },
      { email: 'test@example.com', password: '', role: 'admin' },
      { email: 'test@example.com', password: 'pass', role: '' },
      {}
    ];

    for (const body of testCases) {
      const { req, res } = createMocks({
        method: 'POST',
        body
      });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({ message: 'All fields are required' });
    }
  });

  test('should return 401 if user not found', async () => {
    mockConnection.execute.mockResolvedValue([[]]);
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: 'password',
        role: 'admin'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ 
      message: 'Invalid credentials: User not found' 
    });
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('should return 401 if password is invalid', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'admin'
    };
    
    mockConnection.execute.mockResolvedValue([[mockUser]]);
    bcrypt.compare.mockResolvedValue(false);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword',
        role: 'admin'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ 
      message: 'Invalid credentials: Password mismatch' 
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('should return token and user data on successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'admin',
      name: 'Test User'
    };
    
    mockConnection.execute.mockResolvedValue([[mockUser]]);
    bcrypt.compare.mockResolvedValue(true);
    generateToken.mockReturnValue('mockToken');

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'correctpassword',
        role: 'admin'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      token: 'mockToken',
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User'
      },
      message: 'Login successful'
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
    expect(generateToken).toHaveBeenCalledWith(mockUser);
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('should handle database errors', async () => {
    mockConnection.execute.mockRejectedValue(new Error('DB error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password',
        role: 'admin'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Internal server error' });
    expect(console.error).toHaveBeenCalledWith('Login error:', expect.any(Error));
  });

  test('should always release connection', async () => {
    mockConnection.execute.mockResolvedValue([[]]);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password',
        role: 'admin'
      }
    });

    await handler(req, res);

    expect(mockConnection.release).toHaveBeenCalled();
  });
});