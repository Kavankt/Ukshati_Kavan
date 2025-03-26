import mysql from "mysql2/promise";
import { connectToDB } from "../db"; // Adjust path as needed

// Mock MySQL createPool
jest.mock("mysql2/promise", () => {
  const mockGetConnection = jest.fn().mockResolvedValue({
    release: jest.fn(), // Mock release function
  });

  return {
    createPool: jest.fn(() => ({
      getConnection: mockGetConnection,
    })),
    __mockGetConnection: mockGetConnection, // Store reference for error simulation
  };
});

describe("Database Connection", () => {
  test("should establish a connection successfully", async () => {
    const connection = await connectToDB();
    
    expect(connection).toBeDefined();
    expect(typeof connection.release).toBe("function");

    connection.release(); // Simulate releasing connection
  });

  test("should throw an error if connection fails", async () => {
    mysql.__mockGetConnection.mockRejectedValueOnce(new Error("Connection failed"));

    await expect(connectToDB()).rejects.toThrow("Connection failed");
  });
});
