import { connectToDB } from "../../lib/db"; // Import the connection helper

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    let connection;
    try {
        let { quote_id, from_date, to_date, customer_name } = req.query;

        // Get the database connection
        connection = await connectToDB();

        // Build the SQL query with optional filters
        let query = `
            SELECT 
                q.quote_id, 
                q.project_id, 
                c.cname AS customer_name,  
                c.cphone AS phone,  -- ✅ Fetch customer phone
                DATE_FORMAT(q.date, '%Y-%m-%d') AS date, 
                q.drip_cost, 
                q.plumbing_cost, 
                q.automation_cost, 
                q.labour_cost, 
                q.additional_cost, 
                p.pname,
                q.total_cost  
            FROM quotesdata q
            LEFT JOIN project p ON q.project_id = p.pid  -- ✅ Link to project table
            LEFT JOIN customer c ON p.cid = c.cid  -- ✅ Link to customer table using cid
            WHERE 1=1
        `;

        let values = [];

        if (quote_id) {
            query += " AND q.quote_id = ?";
            values.push(quote_id);
        }

        if (from_date && to_date) {
            query += " AND q.date BETWEEN ? AND ?";
            values.push(from_date, to_date);
        }

        if (customer_name) {
            query += " AND c.cname LIKE ?";
            values.push(`%${customer_name}%`);
        }

        // Execute the query
        const [results] = await connection.execute(query, values);

        res.status(200).json(results);
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        if (connection) connection.release(); // ✅ Corrected: Release connection instead of ending it
    }
}