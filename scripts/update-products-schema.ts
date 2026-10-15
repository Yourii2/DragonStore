import mysql from 'mysql2/promise';
import fs from 'fs';

async function updateDb() {
  const config = JSON.parse(fs.readFileSync('c:/xampp/htdocs/DragonStore/db_config.json', 'utf8'));
  const conn = await mysql.createConnection({
    host: config.dbConfig.host,
    port: Number(config.dbConfig.port),
    user: config.dbConfig.user,
    password: config.dbConfig.password,
    database: config.dbConfig.database
  });

  const cols = [
    { name: 'product_type', def: "VARCHAR(50) NOT NULL DEFAULT 'PHYSICAL'" },
    { name: 'min_sell_price', def: 'DECIMAL(12, 2) NOT NULL DEFAULT 0.00' },
    { name: 'is_variable_price', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'is_variable_cost', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'image_data', def: 'LONGTEXT NULL' }
  ];

  for (const col of cols) {
    try {
      await conn.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.def}`);
      console.log('Added column ' + col.name);
    } catch (e: any) {
      if (!e.message.includes('Duplicate column name')) {
        console.error(e.message);
      }
    }
  }

  await conn.query("UPDATE products SET product_type = 'PHYSICAL' WHERE product_type IS NULL OR product_type = ''");

  console.log('PRODUCTS_TABLE_UPDATED_SUCCESSFULLY');
  await conn.end();
}

updateDb().catch(console.error);
