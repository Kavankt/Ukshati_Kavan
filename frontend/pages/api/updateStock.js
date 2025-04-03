import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const dbConfig = {
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { stockId, quantity, price } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    // Update stock
    await connection.execute(
      `UPDATE stock 
       SET quantity = quantity + ?, price_pu = ?
       WHERE stock_id = ?`,
      [Number(quantity), parseFloat(price), stockId]
    );

    await connection.end();
    res.status(200).json({ message: 'Stock updated successfully' });

  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error' 
    });
  }
}