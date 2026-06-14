const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'clave-por-defecto';

// Pool de conexiones a PostgreSQL en AWS RDS
const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'acme_user',
  password: process.env.DB_PASS || 'acme1234',
  database: process.env.DB_NAME || 'acme_erp',
  ssl: { rejectUnauthorized: false },
  max: 10
});

// Usuario administrador de la PoC (contrasena hasheada con bcrypt)
const ADMIN = {
  username: 'admin',
  passwordHash: bcrypt.hashSync('admin1234', 10)
};

// Middleware: valida el token JWT en las rutas protegidas
function autenticar(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado: token requerido' });
  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ error: 'Token invalido o expirado' });
    req.usuario = usuario;
    next();
  });
}

// POST /api/login -> valida credenciales y entrega un token de acceso
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN.username || !bcrypt.compareSync(password, ADMIN.passwordHash)) {
    return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// GET /api/productos -> protegido, requiere token
app.get('/api/productos', autenticar, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM productos ORDER BY id');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/productos -> protegido, requiere token
app.post('/api/productos', autenticar, async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  try {
    const r = await db.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion, precio, stock]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor ERP ACME (PostgreSQL + JWT) corriendo en puerto 3000');
});
