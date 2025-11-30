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

/* ================================
   GET NUMERI
================================ */
app.get("/numbers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM numeri ORDER BY numero ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});

/* ================================
   CONFERMA ACQUISTO
================================ */
app.post("/confirm", async (req, res) => {
  const { numero, nome_acquirente } = req.body;

  if (!numero || !nome_acquirente) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  try {
    const result = await pool.query(
      "UPDATE numeri SET acquistato = true, nome_acquirente = $1 WHERE numero = $2 RETURNING *",
      [nome_acquirente, numero]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Numero non trovato" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore interno" });
  }
});

/* ================================
   RESET SINGOLO NUMERO
================================ */
app.post("/reset-number", async (req, res) => {
  const { numero, password } = req.body;

  if (password !== "reimar2002") {
    return res.status(403).json({ error: "Password errata" });
  }

  try {
    const result = await pool.query(
      "UPDATE numeri SET acquistato = false, nome_acquirente = NULL WHERE numero = $1 RETURNING *",
      [numero]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Numero inesistente" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore reset" });
  }
});

/* ================================
   RESET TUTTA LA GRIGLIA
================================ */
app.post("/reset-all", async (req, res) => {
  const { password } = req.body;

  if (password !== "reimar2002") {
    return res.status(403).json({ error: "Password errata" });
  }

  try {
    await pool.query("UPDATE numeri SET acquistato = false, nome_acquirente = NULL");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore reset completo" });
  }
});

/* ================================
   SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server attivo sulla porta", PORT);
});
