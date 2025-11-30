const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Configura qui il tuo DATABASE_URL su Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Creazione tabella numeri se non esiste
(async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS numeri (
            numero INT PRIMARY KEY,
            acquistato BOOLEAN DEFAULT FALSE,
            nome_acquirente TEXT
        )
    `);

    // Inserisci i numeri da 1 a 90 se non ci sono
    for (let i = 1; i <= 90; i++) {
        await pool.query(
            `INSERT INTO numeri (numero) VALUES ($1)
            ON CONFLICT (numero) DO NOTHING`,
            [i]
        );
    }
})();

// ------------------- ENDPOINT -------------------

// Recupera tutti i numeri
app.get("/numbers", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM numeri ORDER BY numero ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore recupero numeri" });
    }
});

// Conferma acquisto numero
app.post("/confirm", async (req, res) => {
    const { numero, nome } = req.body;
    if (!numero || !nome) return res.status(400).json({ error: "Dati mancanti" });

    try {
        await pool.query(
            "UPDATE numeri SET acquistato=true, nome_acquirente=$2 WHERE numero=$1",
            [numero, nome]
        );
        res.json({ message: `Numero ${numero} acquistato da ${nome}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore conferma acquisto" });
    }
});

// Reset totale griglia
app.post("/reset", async (req, res) => {
    try {
        await pool.query("UPDATE numeri SET acquistato=false, nome_acquirente=NULL");
        res.json({ message: "Griglia resettata" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore reset griglia" });
    }
});

// Reset singolo numero
app.post("/reset/:numero", async (req, res) => {
    const numero = parseInt(req.params.numero);
    if (!numero) return res.status(400).json({ error: "Numero mancante" });

    try {
        await pool.query(
            "UPDATE numeri SET acquistato=false, nome_acquirente=NULL WHERE numero=$1",
            [numero]
        );
        res.json({ message: `Numero ${numero} resettato` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore reset numero" });
    }
});

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server avviato su port ${PORT}`));
