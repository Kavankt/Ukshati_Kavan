import saveQuoteHandler from '../save-quote';

// Option 1: Use the correct relative path (go up 3 levels from test file)
jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn()
  }))
}));

// Option 2: Or use path.resolve for absolute path
// const path = require('path');
// jest.mock(path.resolve(__dirname, '../../../lib/db'), () => ({
//   connectToDB: jest.fn(() => ({
//     query: jest.fn(),
//     release: jest.fn()
//   }))
// }));

// Option 3: Or use your path alias if configured
// jest.mock('@/lib/db', () => ({
//   connectToDB: jest.fn(() => ({
//     query: jest.fn(),
//     release: jest.fn()
//   }))
// }));

// Mock console.error
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Save Quote API', () => {
  let mockDb;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock database connection
    mockDb = {
      query: jest.fn(),
      release: jest.fn()
    };
    require('../../../lib/db').connectToDB.mockResolvedValue(mockDb);
    // Or use the same path you used in jest.mock:
    // require('@/lib/db').connectToDB.mockResolvedValue(mockDb);

    // Setup mock request/response
    mockRequest = {
      method: 'POST',
      body: {
        project_id: 123,
        customer_name: 'Test Customer',
        additional_cost: 100,
        total_cost: 1500,
        design: 500,
        development: 700,
        testing: 300
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should save a quote successfully', async () => {
    mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    await saveQuoteHandler(mockRequest, mockResponse);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO quotesdata'),
      [123, 'Test Customer', 500, 700, 300, 100, 1500]
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Quote saved successfully!"
    });
  });

  // ... (keep all other test cases)
});