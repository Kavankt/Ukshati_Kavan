import { createMocks } from 'node-mocks-http';
import { connectToDB } from '../../../lib/db';
import handler from './[category_id].js'; // Explicit extension and correct path

// Mock the database connection
jest.mock('../../../lib/db');

describe('/api/items/[category_id]', () => {
  let mockConnection;
  const mockRates = [
    { id: 1, category_id: 1, rate_name: 'Standard', price: 100 },
    { id: 2, category_id: 1, rate_name: 'Premium', price: 150 }
  ];

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn(),
    };
    connectToDB.mockResolvedValue(mockConnection);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return 405 for non-GET methods', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ error: "Method not allowed" });
  });

  it('should return 400 if category_id is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: "Category ID is required." });
  });

  // Add other test cases here...
});