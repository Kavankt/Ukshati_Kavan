// pages/api/__tests__/customer.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../customers'; // Corrected import path
import mysql from 'mysql2/promise';

// Mock the mysql2/promise module
jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn(() => ({
    execute: jest.fn(),
    end: jest.fn()
  }))
}));

describe('/api/customers', () => { // Updated to match endpoint
  let mockConnection;

  beforeEach(() => {
    // Create fresh mock connection for each test
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn()
    };
    mysql.createConnection.mockResolvedValue(mockConnection);
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  // GET Tests
  describe('GET /api/customers', () => {
    it('should fetch all customers', async () => {
      const mockCustomers = [
        { cid: 1, cname: 'John Doe', cphone: '1234567890', status: 'lead' }
      ];
      mockConnection.execute.mockResolvedValue([mockCustomers]);

      const { req, res } = createMocks({ method: 'GET' });
      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({ customers: mockCustomers });
      expect(mockConnection.execute).toHaveBeenCalledWith(
        "SELECT cid, cname, cphone, alternate_phone, status, remark FROM customer"
      );
    });

    it('should handle database errors', async () => {
      mockConnection.execute.mockRejectedValue(new Error('DB Error'));

      const { req, res } = createMocks({ method: 'GET' });
      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'Internal Server Error' });
      expect(console.error).toHaveBeenCalledWith('API Error:', expect.any(Error));
    });
  });

  // POST Tests
  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const newCustomer = {
        cname: 'Jane Smith',
        cphone: '9876543210',
        alternate_phone: '5555555555',
        status: 'active',
        remark: 'VIP customer'
      };
      const insertResult = { insertId: 2 };
      const createdCustomer = { cid: 2, ...newCustomer };

      mockConnection.execute
        .mockResolvedValueOnce([insertResult]) // For INSERT
        .mockResolvedValueOnce([[createdCustomer]]); // For SELECT

      const { req, res } = createMocks({
        method: 'POST',
        body: newCustomer
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual(createdCustomer);
    });

    it('should require name and phone', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { cname: '', cphone: '' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({ error: "Name and phone are required" });
    });
  });

  // PUT Tests
  describe('PUT /api/customers', () => {
    it('should update a customer', async () => {
      const existingCustomer = { cid: 1, cname: 'Old Name', cphone: '111', status: 'lead' };
      const updates = { cname: 'New Name', status: 'active' };
      const mergedData = { ...existingCustomer, ...updates };

      mockConnection.execute
        .mockResolvedValueOnce([[existingCustomer]]) // For SELECT
        .mockResolvedValueOnce([{}]); // For UPDATE

      const { req, res } = createMocks({
        method: 'PUT',
        query: { cid: '1' },
        body: updates
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(mergedData);
    });
  });

  // DELETE Tests
  describe('DELETE /api/customers', () => {
    it('should delete a customer', async () => {
      const existingCustomer = { cid: 1, cname: 'To Delete' };
      mockConnection.execute
        .mockResolvedValueOnce([[existingCustomer]]) // For SELECT
        .mockResolvedValueOnce([{}]); // For DELETE

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { cid: '1' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({ message: "Customer deleted successfully" });
    });
  });

  it('should always close the database connection', async () => {
    mockConnection.execute.mockResolvedValue([[]]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(mockConnection.end).toHaveBeenCalled();
  });
});