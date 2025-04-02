// pages/api/__tests__/category.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../category';
import { connectToDB } from '../../../lib/db';

// Mock the database module
jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(() => ({
    execute: jest.fn(),
    release: jest.fn()
  }))
}));

describe('/api/category', () => {
  let mockDb;
  
  beforeEach(() => {
    // Create fresh mock connection for each test
    mockDb = {
      execute: jest.fn(),
      release: jest.fn()
    };
    connectToDB.mockResolvedValue(mockDb);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  it('should return 405 for non-GET methods', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
      const { req, res } = createMocks({ method });
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({
        error: `Method ${method} Not Allowed`
      });
    }
  });

  it('should return filtered categories excluding Electronics, Pumping, Tools', async () => {
    const mockCategories = [
      { category_id: 1, category_name: 'Furniture' },
      { category_id: 2, category_name: 'Clothing' }
    ];
    
    mockDb.execute.mockResolvedValue([mockCategories]);
    
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(mockCategories);
    expect(mockDb.execute).toHaveBeenCalledWith(
      "SELECT * FROM category WHERE category_name NOT IN ('Electronics', 'Pumping', 'Tools')"
    );
    expect(mockDb.release).toHaveBeenCalled();
  });

  it('should return empty array when no categories found', async () => {
    mockDb.execute.mockResolvedValue([[]]);
    
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual([]);
  });

  it('should handle database connection errors', async () => {
    const mockError = new Error('Connection failed');
    connectToDB.mockRejectedValue(mockError);
    
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Internal Server Error' });
    expect(console.error).toHaveBeenCalledWith(
      'Database error:',
      mockError
    );
  });

  it('should handle query execution errors', async () => {
    const mockError = new Error('Query failed');
    mockDb.execute.mockRejectedValue(mockError);
    
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Internal Server Error' });
    expect(console.error).toHaveBeenCalledWith(
      'Database error:',
      mockError
    );
    expect(mockDb.release).toHaveBeenCalled();
  });

  it('should always release the database connection', async () => {
    mockDb.execute.mockResolvedValue([[]]);
    
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    
    expect(mockDb.release).toHaveBeenCalled();
  });
});