import spendHandler from '../spend';
import { connectToDB } from '../../../lib/db';

jest.mock('../../../lib/db', () => ({
  connectToDB: jest.fn(() => ({
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
  }))
}));

const mockConsole = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
};

describe('Spend API', () => {
  let mockDb;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      execute: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    connectToDB.mockResolvedValue(mockDb);

    mockRequest = {
      method: 'POST',
      body: {
        stockId: 1,
        spentQty: 5,
        used_for: 101,
        recorded_by: 201,
        location: 'Warehouse A',
        remark: 'For project X'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should record stock usage successfully', async () => {
    // Mock responses
    mockDb.execute
      .mockResolvedValueOnce([[{ quantity: 10, price_pu: 100 }]]) // Stock lookup
      .mockResolvedValueOnce([[{ pid: 101 }]]) // Project validation
      .mockResolvedValueOnce([[{ id: 201 }]]) // Employee validation
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // Stock update
      .mockResolvedValueOnce([{ insertId: 500 }]); // Insert spent record

    await spendHandler(mockRequest, mockResponse);

    // Verify transaction flow
    expect(mockDb.beginTransaction).toHaveBeenCalled();
    expect(mockDb.commit).toHaveBeenCalled();

    // Verify console log
    expect(mockConsole.log).toHaveBeenCalledWith(
      "Request Body:",
      expect.objectContaining({
        stockId: 1,
        spentQty: 5
      })
    );

    // Verify database calls with flexible SQL matching
    expect(mockDb.execute).toHaveBeenCalledWith(
      "SELECT quantity, price_pu FROM stock WHERE stock_id = ?",
      [1]
    );
    expect(mockDb.execute).toHaveBeenCalledWith(
      "SELECT pid FROM project WHERE pid = ?",
      [101]
    );
    expect(mockDb.execute).toHaveBeenCalledWith(
      "SELECT id FROM employee WHERE id = ?",
      [201]
    );
    expect(mockDb.execute).toHaveBeenCalledWith(
      "UPDATE stock SET quantity = quantity - ?, price_pu = ? WHERE stock_id = ?",
      [5, 100, 1]
    );
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO inventory_spent"),
      [1, 5, 101, 201, 'Warehouse A', 'For project X']
    );

    // Verify response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Stock usage recorded successfully",
      spentId: 500
    });
  });
});