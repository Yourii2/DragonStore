import mysql from 'mysql2/promise';
import fs from 'fs';

async function migrate() {
  const config = JSON.parse(fs.readFileSync('c:/xampp/htdocs/DragonStore/db_config.json', 'utf8'));
  const conn = await mysql.createConnection({
    host: config.dbConfig.host,
    port: Number(config.dbConfig.port),
    user: config.dbConfig.user,
    password: config.dbConfig.password,
    database: config.dbConfig.database
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT NULL,
      image_url LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id VARCHAR(50) PRIMARY KEY,
      reference_no VARCHAR(50) NOT NULL,
      movement_type VARCHAR(50) NOT NULL,
      product_id VARCHAR(50) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_price DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
      source_warehouse VARCHAR(150) NULL,
      target_warehouse VARCHAR(150) NULL,
      notes TEXT NULL,
      created_by VARCHAR(150) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed categories
  const [catRows] = await conn.query('SELECT COUNT(*) as count FROM product_categories');
  if ((catRows as any)[0].count === 0) {
    const cats = [
      ['cat-01', 'أجهزة ولابتوبات', 'حواسيب مكتبية، لابتوبات استيراد وجديد، وسيرفرات مدمجة', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300'],
      ['cat-02', 'كاميرات المراقبة وأجهزة NVR', 'كاميرات IP وHD، أجهزة DVR وNVR، ومحولات PoE', 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300'],
      ['cat-03', 'شبكات ومعدات ISP', 'راوترات، سويتشات، كابلات شبكة CAT6/CAT7، وأكسس بوينت', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300'],
      ['cat-04', 'قطع الغيار والشاشات', 'شاشات لابتوب، بطاريات أصلية، هاردات SSD، ورامات DDR4/DDR5', 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300']
    ];
    for (const c of cats) {
      await conn.query('INSERT IGNORE INTO product_categories (id, name, description, image_url) VALUES (?, ?, ?, ?)', c);
    }
  }

  // Seed stock movements
  const [mvRows] = await conn.query('SELECT COUNT(*) as count FROM stock_movements');
  if ((mvRows as any)[0].count === 0) {
    const movements = [
      ['SM-1001', 'REF-IN-01', 'IN', 'PRD-001', 'لابتوب Dell Latitude 5420 Core i7 16GB', 12, 19500, 234000, null, 'مخزن المتجر الرئيسي (البضائع والأجهزة)', 'استلام شحنة بضاعة من شركة الوكيل', 'admin'],
      ['SM-1002', 'REF-IN-02', 'IN', 'PRD-002', 'كاميرا مراقبة Hikvision 5MP IP Outdoor', 30, 1100, 33000, null, 'مخزن عهدة مشاريع CCTV والشبكات', 'توريد معدات لمشروع فيلا التجمع', 'admin'],
      ['SM-1003', 'REF-TR-01', 'TRANSFER', 'PRD-003', 'سويتش Cisco Catalyst 24-Port Gigabit', 4, 4200, 16800, 'مخزن المتجر الرئيسي (البضائع والأجهزة)', 'مخزن ورشة الصيانة وقطع الغيار', 'نقل للاختبار والتشغيل', 'admin']
    ];
    for (const m of movements) {
      await conn.query('INSERT IGNORE INTO stock_movements (id, reference_no, movement_type, product_id, product_name, quantity, unit_price, total_price, source_warehouse, target_warehouse, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', m);
    }
  }

  console.log('SUCCESS: product_categories and stock_movements migrated successfully');
  await conn.end();
}

migrate().catch(console.error);
