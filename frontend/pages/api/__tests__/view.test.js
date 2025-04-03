import handler from "../view";
import { createMocks } from "node-mocks-http";
import { connectToDB } from "../../../lib/db";

jest.mock("../../../lib/db");

describe("API Route: /api/view", () => {
  let mockDb;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});  // Suppress error logs
  });

  afterAll(() => {
    console.error.mockRestore();  // Restore original console.error
  });

  beforeEach(() => {
    mockDb = {
      execute: jest.fn(),
    };
    connectToDB.mockResolvedValue(mockDb);
  });

  it("should return 200 and stock data on successful GET request", async () => {
    const mockStockData = [
      {
        stock_id: 1,
        productName: "Laptop",
        categoryName: "Electronics",
        quantity: 10,
        price: 50000,
      },
    ];
    
    mockDb.execute.mockResolvedValue([mockStockData]);

    const { req, res } = createMocks({ method: "GET" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockStockData);
  });

  it("should return 500 if database query fails", async () => {
    mockDb.execute.mockRejectedValue(new Error("Database Error"));

    const { req, res } = createMocks({ method: "GET" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({ error: "Internal Server Error" });
  });

  it("should return 405 for non-GET requests", async () => {
    const { req, res } = createMocks({ method: "POST" });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()["allow"]).toContain("GET");
    expect(res._getData()).toBe("Method POST Not Allowed");
  });
});
