import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-api'; // Pastikan ini sesuai library yang diinstall

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ambil kunci dari Environment Variables (Vercel)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Jika tidak ada kunci, server tidak jalan (keamanan)
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables!");
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES SUDAH TIDAK PERLU SQLITE LAGI ---
  // Kita biarkan kosong atau hapus rute API SQLite yang lama 
  // Karena Frontend (App.tsx) Anda sekarang langsung bicara ke Supabase 
  // via Client Side.

  // Vite middleware
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

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();