import jwt from "jsonwebtoken";
import { authenticate, generateToken } from "../auth"; // ✅ Adjust the path based on actual location

// Mock environment variable
process.env.JWT_SECRET = "test_secret";

describe("JWT Authentication", () => {
  const mockUser = { id: 1, role: "admin" };
  let token;

  beforeAll(() => {
    token = generateToken(mockUser);
  });

  test("should generate a valid JWT token", () => {
    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty("userId", mockUser.id);
    expect(decoded).toHaveProperty("role", mockUser.role);
  });

  test("should authenticate a valid token", async () => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const decoded = await authenticate(req);

    expect(decoded).toHaveProperty("userId", mockUser.id);
    expect(decoded).toHaveProperty("role", mockUser.role);
  });

  test("should throw an error for missing token", async () => {
    const req = { headers: {} };

    await expect(authenticate(req)).rejects.toThrow("Authorization token required");
  });

  test("should throw an error for an invalid token", async () => {
    const req = { headers: { authorization: "Bearer invalid_token" } };

    await expect(authenticate(req)).rejects.toThrow();
  });
});
