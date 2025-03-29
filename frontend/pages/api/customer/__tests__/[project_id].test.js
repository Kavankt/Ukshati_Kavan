import { createMocks } from 'node-mocks-http';
import { connectToDB } from '../../../../lib/db'; // Updated path
import handler from '../[project_id]'; // Import the handler

// Mock the database connection
jest.mock('../../../../lib/db');

describe('/api/customer/[project_id]', () => {
  let mockConnection;

  beforeEach(() => {
    // Create a fresh mock connection for each test
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn(),
    };
    connectToDB.mockResolvedValue(mockConnection);
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return 405 for non-GET methods', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
      const { req, res } = createMocks({
        method,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(res._getHeaders()).toHaveProperty('allow', ['GET']);
      expect(res._getJSONData()).toEqual({
        error: `Method ${method} Not Allowed`
      });
    }
  });

  it('should return 400 if project_id is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      error: "Project ID is required."
    });
  });

  // ... include all your other test cases ...
});