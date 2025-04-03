import handler from '../updateStock';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

// Mock the dependencies
jest.mock('mysql2/promise');
jest.mock('jsonwebtoken');

// Mock console.error to track it without showing output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Stock Update API', () => {
  let mockConnection;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnection = {
      execute: jest.fn(),
      end: jest.fn()
    };
    mysql.createConnection.mockResolvedValue(mockConnection);

    mockRequest = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid.token.here'
      },
      body: {
        stockId: 1,
        quantity: 10,
        price: 19.99
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

  // ... (keep all your existing test cases)

  it('should handle database errors', async () => {
    jwt.verify.mockReturnValue({ role: 'admin' });
    const dbError = new Error('Database error');
    mockConnection.execute.mockRejectedValue(dbError);
    
    await handler(mockRequest, mockResponse);
    
    // Verify the error was logged
    expect(console.error).toHaveBeenCalledWith('Stock update error:', dbError);
    
    // Verify the response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Database error'
    });
  });

  // ... (other test cases)
});