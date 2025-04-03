import { createMocks } from 'node-mocks-http';
import handler from '../fetch';

// Mock the database connection
jest.mock('../../../lib/db.js', () => ({
  connectToDB: jest.fn(() => ({
    execute: jest.fn(),
    release: jest.fn()
  }))
}));

describe('/api/fetch', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    };
    require('../../../lib/db.js').connectToDB.mockResolvedValue(mockConnection);
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
      expect(res._getJSONData()).toEqual({ error: "Method Not Allowed" });
    }
  });

  it('should fetch quotes with all fields', async () => {
    const mockQuotes = [{
      quote_id: 1,
      project_id: 101,
      customer_name: 'Test Customer',
      phone: '1234567890',
      date: '2023-01-01',
      drip_cost: 1000,
      plumbing_cost: 1500,
      automation_cost: 800,
      labour_cost: 1200,
      additional_cost: 500,
      pname: 'Test Project',
      total_cost: 5000
    }];
    
    mockConnection.execute.mockResolvedValue([mockQuotes]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(mockQuotes);
  });

  it('should filter by quote_id', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { quote_id: '1' }
    });

    await handler(req, res);
    
    expect(mockConnection.execute).toHaveBeenCalledWith(
      expect.stringContaining('AND q.quote_id = ?'),
      ['1']
    );
  });

  it('should filter by date range', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { from_date: '2023-01-01', to_date: '2023-12-31' }
    });

    await handler(req, res);
    
    expect(mockConnection.execute).toHaveBeenCalledWith(
      expect.stringContaining('AND q.date BETWEEN ? AND ?'),
      ['2023-01-01', '2023-12-31']
    );
  });

  it('should filter by customer name', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { customer_name: 'Test' }
    });

    await handler(req, res);
    
    expect(mockConnection.execute).toHaveBeenCalledWith(
      expect.stringContaining('AND c.cname LIKE ?'),
      ['%Test%']
    );
  });

  it('should handle database errors', async () => {
    mockConnection.execute.mockRejectedValue(new Error('DB Error'));
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: "Internal server error" });
    expect(console.error).toHaveBeenCalledWith('❌ Error:', expect.any(Error));
  });

  it('should always release connection', async () => {
    mockConnection.execute.mockResolvedValue([[]]);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(mockConnection.release).toHaveBeenCalled();
  });
});