import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());
app.use(express.json());

/* ================================
   CONNESSIONE DATABASE
================================ */
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ================================
   HOME
================================ */
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
    console.log("📤 Inviate", result.rows.length, "righe");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERRORE GET /numbers:", err);
    res.status(500).json({ error: "Errore server" });
  }
});

/* ================================
   CONFERMA ACQUISTO
================================ */
app.post("/confirm", async (req, res) => {
  console.log("📥 POST /confirm");
  console.log("Body:", req.body);

  const { numero, nome_acquirente } = req.body;

  if (!numero || !nome_acquirente) {
    console.log("❌ Dati mancanti");
    return res.status(400).json({ error: "Dati mancanti" });
  }

  try {
    const result = await pool.query(
      "UPDATE numeri SET acquistato = true, nome_acquirente = $1 WHERE numero = $2 RETURNING *",
      [nome_acquirente, numero]
    );

    if (result.rowCount === 0) {
      console.log("⚠ Numero inesistente:", numero);
      return res.status(400).json({ error: "Numero non trovato" });
    }

    console.log("✔ Numero acquistato:", numero);
    res.json({ success: true, numero });
  } catch (err) {
    console.error("❌ ERRORE UPDATE /confirm:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

/* ================================
   RESET SINGOLO NUMERO
================================ */
app.post("/reset", async (req, res) => {
  const { numero } = req.body;

  console.log("♻ Reset numero:", numero);

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
    console.error("❌ Errore reset singolo:", err);
    res.status(500).json({ error: "Errore reset" });
  }
});

/* ================================
   RESET TOTALE GRIGLIA
================================ */
app.post("/reset-all", async (req, res) => {
  console.log("♻ RESET TOTALE richiesto");

  try {
    await pool.query(
      "UPDATE numeri SET acquistato = false, nome_acquirente = NULL"
    );

    console.log("✔ TUTTI i numeri sono stati resettati");
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Errore reset-all:", err);
    res.status(500).json({ error: "Errore reset totale" });
  }
});

/* ================================
   AVVIO SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 SERVER AVVIATO sulla porta", PORT);
});
