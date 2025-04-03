// Option 1: If your handler is exported as default
import uploadStocksHandler from '../upload-stocks';

// Option 2: If your handler is exported as a named export
// import { handler as uploadStocksHandler } from '../upload-stocks';

jest.mock('@/lib/db', () => ({
  connectToDB: jest.fn(() => ({
    beginTransaction: jest.fn(),
    query: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock console.error
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Stock Upload API', () => {
  let mockConnection;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      end: jest.fn()
    };
    require('@/lib/db').connectToDB.mockResolvedValue(mockConnection);

    mockRequest = {
      method: 'POST',
      body: {
        stocks: [
          {
            categoryName: 'Electronics',
            productName: 'Laptop',
            quantity: 5,
            price: 999.99
          }
        ]
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

  it('should process valid stock entries', async () => {
    // Mock category lookup
    mockConnection.query.mockResolvedValueOnce([[
      { category_id: 1, lower_name: 'electronics' }
    ]]);
    
    // Mock existing stock check
    mockConnection.query.mockResolvedValueOnce([[]]);
    
    // Mock insert result
    mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    
    // Mock final stock fetch
    mockConnection.query.mockResolvedValueOnce([[
      { stock_id: 1, item_name: 'Laptop', category_id: 1, quantity: 5, price_pu: 999.99 }
    ]]);

    await uploadStocksHandler(mockRequest, mockResponse);
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      stocks: expect.arrayContaining([
        expect.objectContaining({ item_name: 'Laptop' })
      ]),
      processed: 1,
      errors: []
    });
  });
});