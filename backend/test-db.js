// test-db.js
const sql = require('mssql');

const config = {
  user: process.env.DB_USER || 'labuser',
  password: process.env.DB_PASS || 'P@ssw0rd123',
  server: process.env.DB_SERVER || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'master',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5, min: 0, idleTimeoutMillis: 30000 }
};

(async () => {
  try {
    await sql.connect(config);
    const r = await sql.query`SELECT TOP 1 @@VERSION AS v`;
    console.log('DB OK ->', r.recordset);
    await sql.close();
  } catch (e) {
    console.error('DB CONNECT ERROR:', e);
  }
})();
