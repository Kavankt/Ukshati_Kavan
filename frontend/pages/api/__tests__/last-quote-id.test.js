// pages/api/__tests__/last-quote-id.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../last-quote-id';
import { connectToDB } from '../../../lib/db';

// Mock the database connection
jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(() => ({
    execute: jest.fn(),
    release: jest.fn()
  }))
}));

describe('/api/last-quote-id', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    };
    connectToDB.mockResolvedValue(mockConnection);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  test('should return 405 for non-GET methods', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    for (const method of methods) {
      const { req, res } = createMocks({ method });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({ error: 'Method Not Allowed' });
    }
  });

  test('should return next quote ID when quotes exist', async () => {
    const mockResult = [{ last_quote_id: 100 }];
    mockConnection.execute.mockResolvedValue([mockResult]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ nextQuoteId: 101 });
    expect(mockConnection.execute).toHaveBeenCalledWith(
      'SELECT MAX(quote_id) AS last_quote_id FROM quotesdata'
    );
  });

  test('should return 1 when no quotes exist', async () => {
    const mockResult = [{ last_quote_id: null }];
    mockConnection.execute.mockResolvedValue([mockResult]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ nextQuoteId: 1 });
  });

  test('should handle database errors', async () => {
    mockConnection.execute.mockRejectedValue(new Error('Database error'));

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Internal Server Error' });
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching last quote ID:',
      expect.any(Error)
    );
  });

  test('should always release connection', async () => {
    mockConnection.execute.mockResolvedValue([[]]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(mockConnection.release).toHaveBeenCalled();
  });
});