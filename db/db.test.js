import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from a .env file

const dbConfig = {
  host: "127.0.0.1",
  user: "company",
  password: "Ukshati@123",
  database: "company_db",
};

describe("Database Tests", () => {
  let connection;

  beforeAll(async () => {
    connection = await mysql.createConnection(dbConfig);
  });

  afterAll(async () => {
    await connection.end();
  });

  test("Database should exist", async () => {
    const [rows] = await connection.query("SHOW DATABASES LIKE 'company_db'");
    expect(rows.length).toBe(1);
  });

  test("Tables should exist", async () => {
    const requiredTables = [
      "category",
      "customer",
      "employee",
      "stock",
      "project",
      "quotesdata",
      "inventory_spent",
      "rates",
      "works_on",
      "add_expenses",
    ];

    for (const table of requiredTables) {
      const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
      expect(rows.length).toBe(1);
    }
  });

  test("Employee table should contain data", async () => {
    const [rows] = await connection.query("SELECT * FROM employee");
    expect(rows.length).toBeGreaterThan(0);
  });

  test("Stock table should contain correct data", async () => {
    const [rows] = await connection.query("SELECT * FROM stock WHERE item_name = 'Hammer'");
    expect(rows.length).toBe(1);
    expect(rows[0].quantity).toBe(20);
  });

  test("Project table should have valid foreign key relations", async () => {
    const [rows] = await connection.query("SELECT * FROM project WHERE cid IS NOT NULL");
    expect(rows.length).toBeGreaterThan(0);
  });

  test("Can insert a new employee", async () => {
    const [result] = await connection.query(
      "INSERT INTO employee (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      ["Test User", "testuser@example.com", "9999999999", "hashed_password", "Employee"]
    );
    expect(result.affectedRows).toBe(1);
  });

  test("Can fetch inserted employee", async () => {
    const [rows] = await connection.query("SELECT * FROM employee WHERE email = 'testuser@example.com'");
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Test User");
  });

  test("Can delete the test employee", async () => {
    const [result] = await connection.query("DELETE FROM employee WHERE email = 'testuser@example.com'");
    expect(result.affectedRows).toBe(1);
  });
});
