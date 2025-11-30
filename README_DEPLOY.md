# Istruzioni deploy Tabella 1-90

1. Carica tutti i file su GitHub in un nuovo repository.
2. Vai su https://render.com → New → Web Service.
3. Seleziona il repository.
4. Build command: npm install
5. Start command: node server.js
6. Crea un database PostgreSQL su Render.
7. Copia la DATABASE_URL nelle variabili d’ambiente.
8. Fai deploy.
9. Prendi l’URL del backend e mettilo in index.html al posto di API_URL.
10. Pubblica index.html su GitHub Pages.
