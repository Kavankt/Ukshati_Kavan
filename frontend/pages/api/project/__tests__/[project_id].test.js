import { createMocks } from 'node-mocks-http';
import handler from '../[project_id]';

// Mock the database connection properly
jest.mock('../../../../lib/db', () => ({
  connectToDb: jest.fn(() => Promise.resolve({
    query: jest.fn(),
    release: jest.fn()
  }))
}));

const { connectToDb } = require('../../../../lib/db');

describe('/api/project/[project_id]', () => {
  let mockDb;
  const mockProject = {
    pid: 1,
    pname: 'Website Redesign',
    start_date: '2023-01-01',
    end_date: '2023-06-30',
    status: 'active',
    cid: 1,
    cname: 'Acme Corp'
  };

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      release: jest.fn()
    };
    connectToDb.mockImplementation(() => Promise.resolve(mockDb));
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should fetch a single project with customer details', async () => {
      mockDb.query.mockResolvedValueOnce([[mockProject]]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' }
      });

      await handler(req, res);

      // More flexible query verification
      const [query, params] = mockDb.query.mock.calls[0];
      expect(query).toMatch(/SELECT p\.\*, c\.cname/);
      expect(query).toMatch(/FROM projects p/);
      expect(query).toMatch(/LEFT JOIN customers c ON p\.cid = c\.cid/);
      expect(query).toMatch(/WHERE p\.pid = \?/);
      expect(params).toEqual(['1']);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(mockProject);
    });

    it('should fetch all projects when no ID is provided', async () => {
      mockDb.query.mockResolvedValueOnce([[mockProject, {...mockProject, pid: 2}]]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {}
      });

      await handler(req, res);

      const [query, params] = mockDb.query.mock.calls[0];
      expect(query).toMatch(/SELECT p\.\*, c\.cname/);
      expect(query).toMatch(/FROM projects p/);
      expect(query).toMatch(/LEFT JOIN customers c ON p\.cid = c\.cid/);
      expect(query).toMatch(/ORDER BY p\.start_date DESC/);
      expect(params).toBeUndefined();
      
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData().length).toBe(2);
    });
  });

  // POST, PUT, DELETE tests would go here...
});