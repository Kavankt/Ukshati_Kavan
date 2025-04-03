const { handler } = require('../../../pages/api/tasks');
const db = require('@/lib/db');

// Correct mock implementation
jest.mock('@/lib/db', () => ({
  connectToDB: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn()
  }))
}));

describe('Project API', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      release: jest.fn()
    };
    db.connectToDB.mockResolvedValue(mockDb);
  });

  // Mock response helper
  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res._getStatusCode = jest.fn().mockReturnValue(200);
    res._getJSONData = jest.fn(() => res.json.mock.calls[0]?.[0] || {});
    return res;
  };

  describe('GET /api/tasks', () => {
    it('should return all projects with customer names', async () => {
      const mockProjects = [
        { pid: 1, pname: 'Project 1', cname: 'Customer A' }
      ];
      
      mockDb.query.mockResolvedValue([mockProjects]);

      const req = { method: 'GET' };
      const res = mockResponse();

      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });
  });

  // Add similar tests for other methods (POST, PUT, DELETE)
  // following the same pattern
});