// pages/api/__tests__/projects.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../projects';
import { connectToDB } from '../../../lib/db';

// Mock the database connection
jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn()
  }))
}));

describe('/api/projects', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      release: jest.fn()
    };
    connectToDB.mockResolvedValue(mockConnection);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  test('GET - should return active projects', async () => {
    const mockProjects = [
      { pid: 1 },
      { pid: 2 },
      { pid: 3 }
    ];
    mockConnection.query.mockResolvedValue([mockProjects]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(mockProjects);
    expect(mockConnection.query).toHaveBeenCalledWith(
      "SELECT pid FROM project WHERE status != 'completed'"
    );
  });

  test('GET - should return empty array when no active projects', async () => {
    mockConnection.query.mockResolvedValue([[]]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual([]);
  });

  test('should return 405 for non-GET methods', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    for (const method of methods) {
      const { req, res } = createMocks({ method });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({ error: `Method ${method} Not Allowed` });
    }
  });

  test('should handle database errors', async () => {
    mockConnection.query.mockRejectedValue(new Error('Database error'));

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Internal Server Error' });
    expect(console.error).toHaveBeenCalledWith('Database error:', expect.any(Error));
  });

  test('should always release connection', async () => {
    mockConnection.query.mockResolvedValue([[]]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(mockConnection.release).toHaveBeenCalled();
  });
});