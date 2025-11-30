// server.js (versione pronta per Render con initNumbers integrato)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initNumbers() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS numbers (
      numero INT PRIMARY KEY,
      acquistato BOOLEAN DEFAULT FALSE,
      nome_acquirente VARCHAR(100)
    );
  `);

  const res = await pool.query('SELECT COUNT(*) FROM numbers;');
  if (parseInt(res.rows[0].count) === 0) {
    for (let i = 1; i <= 90; i++) {
      await pool.query('INSERT INTO numbers(numero) VALUES($1)', [i]);
    }
    console.log('Inizializzazione completata: numeri 1-90 inseriti.');
  } else {
    console.log('Tabella già inizializzata.');
  }
}

initNumbers().catch(err => {
  console.error('Errore initNumbers:', err);
});

app.get('/numbers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM numbers ORDER BY numero;');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore server' });
  }
});

app.post('/purchase', async (req, res) => {
  try {
    const { numero, nome, metodo } = req.body;
    if (!numero || !nome || !metodo) return res.status(400).json({ error: 'campi mancanti' });

    const numObj = await pool.query('SELECT * FROM numbers WHERE numero=$1', [numero]);
    if (!numObj.rows[0]) return res.status(404).json({ error: 'Numero non trovato' });
    if (numObj.rows[0].acquistato) return res.status(400).json({ error: 'Numero già acquistato' });

    let link;
    if (metodo === 'paypal') link = `https://www.paypal.me/reimar2002/2`;
    else if (metodo === 'revolut') link = `https://revolut.me/marioreita`;
    else return res.status(400).json({ error: 'Metodo pagamento non valido' });

    res.json({ link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore server' });
  }
});

app.post('/confirm', async (req, res) => {
  try {
    const { numero, nome } = req.body;
    if (!numero || !nome) return res.status(400).json({ error: 'campi mancanti' });

    const numObj = await pool.query('SELECT * FROM numbers WHERE numero=$1', [numero]);
    if (!numObj.rows[0]) return res.status(404).json({ error: 'Numero non trovato' });
    if (numObj.rows[0].acquistato) return res.status(400).json({ error: 'Numero già acquistato' });

    await pool.query('UPDATE numbers SET acquistato=true, nome_acquirente=$1 WHERE numero=$2', [nome, numero]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore server' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
