import stocksHandler from '../stocks';

// Option 1: Use the correct relative path (adjust based on your actual file structure)
jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(() => ({
    execute: jest.fn(),
    release: jest.fn()
  }))
}));

// Option 2: Or use path.resolve for absolute path
// const path = require('path');
// jest.mock(path.resolve(__dirname, '../../../lib/db'), () => ({
//   connectToDB: jest.fn(() => ({
//     execute: jest.fn(),
//     release: jest.fn()
//   }))
// }));

// Option 3: Or use your path alias if configured
// jest.mock('@/lib/db', () => ({
//   connectToDB: jest.fn(() => ({
//     execute: jest.fn(),
//     release: jest.fn()
//   }))
// }));

// Mock console methods
const mockConsole = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  time: jest.spyOn(console, 'time').mockImplementation(() => {}),
  timeEnd: jest.spyOn(console, 'timeEnd').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
};

describe('Stocks API', () => {
  let mockDb;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      execute: jest.fn(),
      release: jest.fn()
    };
    require('../../../lib/db').connectToDB.mockResolvedValue(mockDb);
    // Or use the same path you used in jest.mock:
    // require('@/lib/db').connectToDB.mockResolvedValue(mockDb);

    mockRequest = {
      method: 'GET',
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ... (keep all your test cases here)
  it('should fetch stocks with category names', async () => {
    const mockStocks = [
      { stock_id: 1, item_name: 'Laptop', quantity: 5, price_pu: 999.99, category_name: 'Electronics' }
    ];
    
    mockDb.execute.mockResolvedValueOnce([mockStocks]);

    await stocksHandler(mockRequest, mockResponse);

    expect(mockDb.execute).toHaveBeenCalledWith(expect.stringContaining('SELECT stock.stock_id'));
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockStocks);
  });
});