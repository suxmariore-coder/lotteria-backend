import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get("/", (req, res) => {
  res.send("Backend Lotteria ONLINE ✔");
});

/* ================================
   GET NUMERI
================================ */
app.get("/numbers", async (req, res) => {
  console.log("📥 Richiesta GET /numbers");

  try {
    const result = await pool.query("SELECT * FROM numeri ORDER BY numero ASC");
    console.log("📤 Dati inviati al frontend:", result.rows.length, "righe");

    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERRORE GET /numbers:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

/* ================================
   POST CONFERMA ACQUISTO
================================ */
app.post("/confirm", async (req, res) => {
  console.log("====================================");
  console.log("📥 RICHIESTA POST /confirm");
  console.log("Body ricevuto:", req.body);

  const { numero, nome_acquirente } = req.body;

  if (!numero || !nome_acquirente) {
    console.log("❌ ERRORE: numero o nome_acquirente MANCANTI");
    return res.status(400).json({ error: "Dati mancanti" });
  }

  console.log("➡ Sto aggiornando numero:", numero, "con nome:", nome_acquirente);

  try {
    const result = await pool.query(
      "UPDATE numeri SET acquistato = true, nome_acquirente = $1 WHERE numero = $2 RETURNING *",
      [nome_acquirente, numero]
    );

    console.log("Risultato UPDATE:", result.rows);

    if (result.rowCount === 0) {
      console.log("⚠ Nessun numero aggiornato. Numero inesistente:", numero);
      return res.status(400).json({ error: "Numero non trovato" });
    }

    console.log("✔ ACQUISTO REGISTRATO CORRETTAMENTE");
    res.json({ success: true, numero });
  } catch (err) {
    console.error("❌ ERRORE SQL DURANTE UPDATE:", err);
    res.status(500).json({ error: "Errore interno durante conferma" });
  }
});

/* ================================
   RESET DI UN NUMERO
================================ */
app.post("/reset", async (req, res) => {
  const { numero } = req.body;

  console.log("♻ Richiesta reset numero:", numero);

  try {
    const result = await pool.query(
      "UPDATE numeri SET acquistato = false, nome_acquirente = NULL WHERE numero = $1 RETURNING *",
      [numero]
    );

    if (result.rowCount === 0) {
      console.log("⚠ Numero non trovato:", numero);
      return res.status(400).json({ error: "Numero inesistente" });
    }

    console.log("✔ Numero resettato:", numero);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Errore reset:", err);
    res.status(500).json({ error: "Errore reset" });
  }
});

/* ================================
   AVVIO SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 SERVER AVVIATO sulla porta", PORT);
});
