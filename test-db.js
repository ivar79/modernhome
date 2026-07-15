const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://root:Ad7ZnKhLNgQyq341OfpPLctB@makalu.liara.cloud:34829/postgres' });
pool.query('SELECT 1', (err, res) => {
  if (err) console.error("DB Error:", err);
  else console.log("DB Success:", res.rows);
  pool.end();
});
