// pages/api/__tests__/inventory_spent.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../inventory_spent';
import mysql from 'mysql2/promise';

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn(() => ({
    execute: jest.fn(),
    end: jest.fn()
  }))
}));

describe('/api/inventory_spent', () => {
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

  test('should return inventory spent data', async () => {
    const mockData = [
      {
        productName: 'PVC Pipe',
        quantity: 5,
        price: 25.50,
        remark: 'For project X'
      }
    ];
    
    mockConnection.execute.mockResolvedValue([mockData]);

    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(mockData);
    expect(mockConnection.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(mockConnection.end).toHaveBeenCalled();
  });

  test('should handle database connection errors', async () => {
    mysql.createConnection.mockRejectedValue(new Error('Connection failed'));

    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ message: 'Server error' });
    expect(console.error).toHaveBeenCalledWith('Error fetching inventory spent:', expect.any(Error));
  });

  test('should handle query execution errors', async () => {
    mockConnection.execute.mockRejectedValue(new Error('Query failed'));

    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(console.error).toHaveBeenCalledWith('Error fetching inventory spent:', expect.any(Error));
  });

  test('should always close the database connection', async () => {
    mockConnection.execute.mockResolvedValue([[]]);

    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(mockConnection.end).toHaveBeenCalled();
  });
});