// backend/server.js - VULNERABLE (DB fixed + pool reuse)
require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== DB CONFIG (ใช้ IP+PORT แทน instance name) =====
const dbConfig = {
  user: process.env.DB_USER || 'labuser',
  password: process.env.DB_PASS || 'P@ssw0rd123',
  server: process.env.DB_SERVER || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'SecurityLab',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 15000
};

// ===== Global pool (reuse) =====
let poolPromise = null;
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig)
      .then(p => {
        console.log(`✅ SQL connected to ${dbConfig.server}:${dbConfig.port} / ${dbConfig.database}`);
        return p;
      })
      .catch(err => {
        console.error('Database connection failed:', err);
        poolPromise = null; // allow retry next time
        throw err;
      });
  }
  return poolPromise;
}

// ===== ROUTES (ยังคงช่องโหว่เพื่อใช้ทำแลบ) =====

// 🚨 SQL Injection: login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const query = `SELECT * FROM Users WHERE username='${username}' AND password='${password}'`;
    console.log('Query:', query);

    const pool = await getPool();
    const result = await pool.request().query(query);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,   // อาจเป็น undefined ถ้ายังไม่ได้เพิ่มคอลัมน์ใน DB
          role: user.role      // อาจเป็น undefined
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚨 XSS: comments
app.post('/comments', async (req, res) => {
  try {
    const { userId, content } = req.body;
    const query = `INSERT INTO Comments (user_id, content) VALUES (${userId}, '${content}')`;

    const pool = await getPool();
    await pool.request().query(query);

    res.json({ success: true, message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚨 IDOR: direct user fetch
app.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const query = `SELECT * FROM Users WHERE id=${userId}`;

    const pool = await getPool();
    const result = await pool.request().query(query);

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚨 SQLi: search products
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const query = `SELECT * FROM Products WHERE name LIKE '%${q}%'`;
    console.log('Search query:', query);

    const pool = await getPool();
    const result = await pool.request().query(query);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// comments list (ใช้ join กับ Users)
app.get('/comments', async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.username 
      FROM Comments c 
      JOIN Users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
    `;
    const pool = await getPool();
    const result = await pool.request().query(query);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚨 Vulnerable server running on http://localhost:${PORT}`);
  console.log('⚠️  This server has intentional security vulnerabilities for educational purposes');
});
