import { connectToDB } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let connection;
  try {
    connection = await connectToDB();
    await connection.beginTransaction();

    // 1. Get categories
    const [categories] = await connection.query(
      "SELECT category_id, LOWER(category_name) AS lower_name FROM category"
    );

    if (!categories.length) {
      await connection.rollback();
      return res.status(400).json({ error: "No categories found in database" });
    }

    const categoryMap = new Map(categories.map((c) => [c.lower_name, c.category_id]));

    // 2. Validate and Group Data
    const errors = [];
    const processedStocks = [];
    const newEntries = [];
    const updateEntries = [];
    const itemLookup = new Map();

    for (const [index, entry] of (req.body.stocks || []).entries()) {
      try {
        if (!entry?.categoryName || !entry?.productName) {
          throw new Error("Missing required fields");
        }

        const categoryId = categoryMap.get(entry.categoryName.toLowerCase().trim());
        if (!categoryId) throw new Error(`Category '${entry.categoryName}' not found`);

        const quantity = Number(entry.quantity) || 0;
        const price = Number(entry.price) || 0;
        if (quantity <= 0) throw new Error("Invalid quantity");
        if (price <= 0) throw new Error("Invalid price");

        const itemKey = `${categoryId}_${entry.productName.trim()}`;
        if (!itemLookup.has(itemKey)) {
          itemLookup.set(itemKey, { categoryId, productName: entry.productName.trim(), quantity, price });
        } else {
          const existing = itemLookup.get(itemKey);
          existing.quantity += quantity;
          existing.price += price;
          itemLookup.set(itemKey, existing);
        }
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    // 3. Fetch existing stocks in a single query
    const keys = [...itemLookup.keys()];
    if (keys.length > 0) {
      const placeholders = keys.map(() => "(?, ?)").join(", ");
      const values = keys.flatMap((key) => {
        const [categoryId, productName] = key.split("_");
        return [categoryId, productName];
      });

      const [existingStocks] = await connection.query(
        `SELECT stock_id, category_id, item_name, quantity, price_pu 
         FROM stock 
         WHERE (category_id, item_name) IN (${placeholders})`,
        values
      );

      // Create a map for fast lookup
      const stockMap = new Map(
        existingStocks.map((s) => [`${s.category_id}_${s.item_name}`, s])
      );

      // 4. Process batch updates and inserts
      for (const [key, item] of itemLookup.entries()) {
        if (stockMap.has(key)) {
          // Update existing stock
          const existing = stockMap.get(key);
          updateEntries.push({
            stockId: existing.stock_id,
            newQuantity: existing.quantity + item.quantity,
            newPrice: existing.price_pu + item.price,
          });
        } else {
          // Insert new stock
          newEntries.push([item.productName, item.categoryId, item.quantity, item.price]);
        }
      }

      // 5. Perform batch updates
      if (updateEntries.length > 0) {
        const updateQueries = updateEntries.map(
          ({ stockId, newQuantity, newPrice }) =>
            connection.query(
              `UPDATE stock 
               SET quantity = ?, price_pu = ?
               WHERE stock_id = ?`,
              [newQuantity, newPrice, stockId]
            )
        );
        await Promise.all(updateQueries);
      }

      // 6. Perform batch inserts
      if (newEntries.length > 0) {
        await connection.query(
          `INSERT INTO stock (item_name, category_id, quantity, price_pu) VALUES ?`,
          [newEntries]
        );
      }

      processedStocks.push(...keys);
    }

    await connection.commit();

    // 7. Fetch updated stock list
    const [updatedStocks] = await connection.query(`
      SELECT s.*, c.category_name 
      FROM stock s
      JOIN category c ON s.category_id = c.category_id
      ORDER BY s.stock_id DESC
    `);

    return res.status(200).json({
      success: true,
      stocks: updatedStocks.map((s) => ({ ...s, price_pu: Number(s.price_pu) || 0 })),
      processed: processedStocks.length,
      errors,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  } finally {
    if (connection) connection.end();
  }
}