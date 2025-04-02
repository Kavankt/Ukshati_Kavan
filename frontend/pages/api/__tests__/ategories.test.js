import { createMocks } from 'node-mocks-http';
import handler from '../categories';
import { connectToDB } from '../../../lib/db';

jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(),
}));

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    console.error.mockRestore();
  });

  // ... other tests ...

  it('should handle database errors', async () => {
    const mockError = new Error('Database connection failed');
    connectToDB.mockRejectedValue(mockError);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: 'Database query failed',
      details: 'Database connection failed',
    });
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith(
      "Database error:",
      expect.any(Error)
    );
  });
});