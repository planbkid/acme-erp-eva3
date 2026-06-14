const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER || 'acme_user',
  password: process.env.DB_PASS || 'acme1234',
  database: process.env.DB_NAME || 'acme_erp',
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  db.query(
    'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
    [nombre, descripcion, precio, stock],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, nombre, descripcion, precio, stock });
    }
  );
});

app.listen(3000, () => {
  console.log('Servidor ERP ACME corriendo en puerto 3000');
});
