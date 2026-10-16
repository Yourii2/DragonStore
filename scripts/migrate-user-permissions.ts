import mysql from 'mysql2/promise';
import fs from 'fs';

async function migrateUserPermissions() {
  const config = JSON.parse(fs.readFileSync('c:/xampp/htdocs/DragonStore/db_config.json', 'utf8'));
  const conn = await mysql.createConnection({
    host: config.dbConfig.host,
    port: Number(config.dbConfig.port),
    user: config.dbConfig.user,
    password: config.dbConfig.password,
    database: config.dbConfig.database
  });

  console.log('Connected to MySQL. Checking users table columns...');

  const colsToAdd = [
    { name: 'permissions', def: 'LONGTEXT NULL' },
    { name: 'assigned_warehouse', def: "VARCHAR(150) NOT NULL DEFAULT 'ALL'" },
    { name: 'assigned_treasury', def: "VARCHAR(150) NOT NULL DEFAULT 'ALL'" },
    { name: 'financial_permissions', def: 'LONGTEXT NULL' }
  ];

  for (const col of colsToAdd) {
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      console.log(`Added column ${col.name} successfully.`);
    } catch (e: any) {
      if (e.message && e.message.includes('Duplicate column name')) {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.error(`Error adding column ${col.name}:`, e.message);
      }
    }
  }

  console.log('User permissions schema migration completed successfully.');
  await conn.end();
}

migrateUserPermissions().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
