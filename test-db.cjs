const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://root:Ad7ZnKhLNgQyq341OfpPLctB@makalu.liara.cloud:34829/postgres' });
pool.query('SELECT key, value FROM site_settings', (err, res) => {
  if (err) {
    console.error("DB Error:", err);
  } else {
    console.log("DB Success: Current settings in Database:");
    res.rows.forEach(row => {
      console.log(`- Key: ${row.key}, Length: ${row.value ? row.value.length : 0}, Preview: ${row.value ? row.value.substring(0, 100) : 'null'}`);
    });
  }
  pool.end();
});

