import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("kedai578.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER DEFAULT -1, -- -1 means unlimited/service
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount INTEGER NOT NULL,
    customer_name TEXT,
    order_type TEXT,
    amount_paid INTEGER,
    change_amount INTEGER,
    payment_method TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    product_id INTEGER,
    product_name TEXT,
    quantity INTEGER,
    price INTEGER,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
  );
`);

// Check if image_url column exists (for migration)
try {
  db.prepare("SELECT image_url FROM products LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
}

// Check if customer_name and order_type columns exist (for migration)
try {
  db.prepare("SELECT customer_name FROM transactions LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE transactions ADD COLUMN customer_name TEXT");
  db.exec("ALTER TABLE transactions ADD COLUMN order_type TEXT");
}

// Check if payment details columns exist (for migration)
try {
  db.prepare("SELECT amount_paid FROM transactions LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE transactions ADD COLUMN amount_paid INTEGER");
  db.exec("ALTER TABLE transactions ADD COLUMN change_amount INTEGER");
  db.exec("ALTER TABLE transactions ADD COLUMN payment_method TEXT");
}

// Seed initial data if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insert = db.prepare("INSERT INTO products (name, category, price, stock, image_url) VALUES (?, ?, ?, ?, ?)");
  
  // Seblak
  insert.run("Seblak Original", "Seblak", 10000, -1, "https://picsum.photos/seed/seblak1/400/300");
  insert.run("Seblak Spesial", "Seblak", 15000, -1, "https://picsum.photos/seed/seblak2/400/300");
  
  // Toppings
  insert.run("Ceker", "Topping", 2000, 50, "https://picsum.photos/seed/ceker/400/300");
  insert.run("Bakso", "Topping", 2000, 50, "https://picsum.photos/seed/bakso/400/300");
  insert.run("Sosis", "Topping", 2000, 50, "https://picsum.photos/seed/sosis/400/300");
  insert.run("Dumpling Cheese", "Topping", 3000, 30, "https://picsum.photos/seed/dumpling/400/300");
  insert.run("Chikuwa", "Topping", 2000, 40, "https://picsum.photos/seed/chikuwa/400/300");
  
  // Minuman
  insert.run("Es Teh Manis", "Minuman", 5000, -1, "https://picsum.photos/seed/esteh/400/300");
  insert.run("Es Jeruk", "Minuman", 7000, -1, "https://picsum.photos/seed/esjeruk/400/300");
  insert.run("Air Mineral", "Minuman", 3000, 24, "https://picsum.photos/seed/water/400/300");
  
  // Pulsa & Quota
  insert.run("Pulsa 5k", "Pulsa", 7000, -1, null);
  insert.run("Pulsa 10k", "Pulsa", 12000, -1, null);
  insert.run("Quota 1GB", "Quota", 15000, -1, null);
  
  // Snacks
  insert.run("Keripik Kaca", "Snack", 5000, 20, "https://picsum.photos/seed/keripik/400/300");
  insert.run("Makaroni Pedas", "Snack", 5000, 20, "https://picsum.photos/seed/makaroni/400/300");
  
  // Services
  insert.run("Print Hitam Putih (Lembar)", "Service", 1000, -1, null);
  insert.run("Print Warna (Lembar)", "Service", 2000, -1, null);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.patch("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, stock, image_url } = req.body;
    
    try {
      const update = db.prepare("UPDATE products SET name = ?, price = ?, stock = ?, image_url = ? WHERE id = ?");
      update.run(name, price, stock, image_url, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/products", (req, res) => {
    const { name, category, price, stock, image_url } = req.body;
    try {
      const insert = db.prepare("INSERT INTO products (name, category, price, stock, image_url) VALUES (?, ?, ?, ?, ?)");
      const result = insert.run(name, category, price, stock, image_url);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    try {
      const del = db.prepare("DELETE FROM products WHERE id = ?");
      del.run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { items, total_amount, customer_name, order_type, amount_paid, change_amount, payment_method } = req.body;
    
    const insertTransaction = db.prepare("INSERT INTO transactions (total_amount, customer_name, order_type, amount_paid, change_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)");
    const insertItem = db.prepare("INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)");
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock > -1");

    const transaction = db.transaction(() => {
      const result = insertTransaction.run(total_amount, customer_name, order_type, amount_paid, change_amount, payment_method);
      const transactionId = result.lastInsertRowid;

      for (const item of items) {
        insertItem.run(transactionId, item.id, item.name, item.quantity, item.price);
        updateStock.run(item.quantity, item.id);
      }
      return transactionId;
    });

    try {
      const id = transaction();
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/transactions/history", (req, res) => {
    try {
      const transactions = db.prepare(`
        SELECT * FROM transactions 
        ORDER BY timestamp DESC 
        LIMIT 100
      `).all() as any[];

      const history = transactions.map(t => {
        const items = db.prepare("SELECT * FROM transaction_items WHERE transaction_id = ?").all(t.id);
        return { ...t, items };
      });

      res.json(history);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.get("/api/analytics/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT 
        date(timestamp) as date,
        SUM(total_amount) as total
      FROM transactions
      GROUP BY date(timestamp)
      ORDER BY date ASC
      LIMIT 30
    `).all();
    res.json(sales);
  });

  app.get("/api/analytics/top-products", (req, res) => {
    const topProducts = db.prepare(`
      SELECT 
        product_name as name,
        SUM(quantity) as total_quantity
      FROM transaction_items
      GROUP BY product_name
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all();
    res.json(topProducts);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
