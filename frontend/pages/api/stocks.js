import { connectToDB } from "../../lib/db";

export default async function handler(req, res) {
  let db;
  try {
    db = await connectToDB();

    if (req.method === "POST") {
      console.time("POST request processing time");

      // Extract and validate required fields
      const { category_name, productName, quantity, price } = req.body;
      if (!category_name || !productName || !quantity || !price) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const parsedQuantity = parseInt(quantity, 10);
      const parsedPrice = parseFloat(price);
      if (parsedQuantity <= 0 || parsedPrice <= 0) {
        return res.status(400).json({ error: "Quantity and price must be positive" });
      }

      const normalizedProductName = productName

      // Fetch category_id
      const [[category]] = await db.execute(
        "SELECT category_id FROM category WHERE category_name = ? LIMIT 1",
        [category_name.trim()]
      );
      if (!category) return res.status(400).json({ error: "Category not found" });

      const categoryId = category.category_id;

      // Check if stock already exists
      const [existingStock] = await db.execute(
        "SELECT stock_id, quantity, price_pu FROM stock WHERE category_id = ? AND TRIM(LOWER(item_name)) = TRIM(LOWER(?)) LIMIT 1",
        [categoryId, productName]
      );

      if (existingStock.length > 0) {
        const stock = existingStock[0]; // Get the first entry
        const stockId = stock.stock_id;
        const oldQuantity = parseInt(stock.quantity);
        const oldPricePerUnit = parseFloat(stock.price_pu);
        const newQuantity = oldQuantity + parseInt(quantity);
      
        // Compute the new price per unit (weighted average)
        const newPricePerUnit = oldPricePerUnit + parseFloat(price);

        console.log(`Updating Stock ID: ${stockId}, Old Price: ${oldPricePerUnit}, New Price: ${newPricePerUnit}`);
      
        // Update stock with new quantity & price
        await db.execute(
          "UPDATE stock SET quantity = ?, price_pu = ? WHERE stock_id = ?",
          [newQuantity, newPricePerUnit, stockId]
        );

        // Update stock with new quantity & updated price
        await db.execute(
          "UPDATE stock SET quantity = ?, price_pu = ? WHERE stock_id = ?",
          [newQuantity, newPricePerUnit, stockId]
        );

        console.timeEnd("POST request processing time");

        return res.status(200).json({ message: "Stock updated successfully" });
      } else {
        // Insert new stock
        const [result] = await db.execute(
          "INSERT INTO stock (item_name, category_id, quantity, price_pu) VALUES (?, ?, ?, ?)",
          [normalizedProductName, categoryId, parsedQuantity, parsedPrice]
        );

        console.timeEnd("POST request processing time");

        return res
          .status(201)
          .json({ message: "Stock added successfully", stockId: result.insertId });
      }
    }

    else if (req.method === "GET") {
      console.time("GET request processing time");

      // Fetch stocks with category names (latest 100 entries)
      const [stocks] = await db.execute(`
        SELECT stock.stock_id, stock.item_name, stock.quantity, stock.price_pu, 
               category.category_name 
        FROM stock 
        JOIN category ON stock.category_id = category.category_id
        ORDER BY stock.stock_id DESC
        LIMIT 100
      `);

      console.timeEnd("GET request processing time");
      return res.status(200).json(stocks);
    }

    else {
      res.setHeader("Allow", ["POST", "GET"]);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (db) db.release(); // Ensure database connection is closed
  }
}