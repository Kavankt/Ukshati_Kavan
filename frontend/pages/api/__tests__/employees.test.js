// pages/api/__tests__/employees.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../employees';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Mock modules
jest.mock('mysql2/promise');
jest.mock('bcryptjs');

describe('/api/employees', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn()
    };
    mysql.createConnection.mockResolvedValue(mockConnection);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  describe('POST /api/employees', () => {
    const validEmployee = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '9876543210',
      role: 'manager',
      password: 'securepassword123'
    };

    beforeEach(() => {
      bcrypt.genSalt.mockResolvedValue('somesalt');
      bcrypt.hash.mockResolvedValue('hashedpassword');
    });

    it('should create a new employee with hashed password', async () => {
      const insertResult = { insertId: 2 };
      mockConnection.execute.mockResolvedValue([insertResult]);

      const { req, res } = createMocks({
        method: 'POST',
        body: validEmployee
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual({
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '9876543210',
        role: 'manager'
      });

      // Verify bcrypt was called correctly
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('securepassword123', 'somesalt');

      // Verify the SQL query (now checking for any matching call)
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO employee'),
        ['Jane Smith', 'jane@example.com', '9876543210', 'manager', 'hashedpassword']
      );
    });

    // ... rest of your test cases ...
  });

  // ... other test suites ...
});