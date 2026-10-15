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

  console.log('Connected to MySQL. Creating customer_transactions and supplier_transactions tables...');

  // Customer Transactions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS customer_transactions (
      id VARCHAR(50) PRIMARY KEY,
      customer_id VARCHAR(50) NOT NULL,
      customer_name VARCHAR(200) NOT NULL,
      transaction_type VARCHAR(50) NOT NULL, -- 'INVOICE', 'PAYMENT', 'RETURN', 'ADJUSTMENT'
      reference_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      debit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,  -- مدين (عليه)
      credit DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- دائن (له / سداد)
      balance_after DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Supplier Transactions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS supplier_transactions (
      id VARCHAR(50) PRIMARY KEY,
      supplier_id VARCHAR(50) NOT NULL,
      supplier_name VARCHAR(200) NOT NULL,
      transaction_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'PAYMENT', 'RETURN', 'ADJUSTMENT'
      reference_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      debit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,  -- مدين (سداد للمورد)
      credit DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- دائن (فاتورة مشتريات / مستحق له)
      balance_after DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed sample transactions if empty
  const [custTxCount]: any = await conn.query('SELECT COUNT(*) as count FROM customer_transactions');
  if (custTxCount[0].count === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const sampleCustTx = [
      ['ctx-01', 'CUST-001', 'شركة النور للمقاولات والتجارة', 'INVOICE', 'INV-2026-081', today, 18500, 0, 18500, 'CREDIT', 'فاتورة توريد كاميرات مراقبة وشبكات'],
      ['ctx-02', 'CUST-001', 'شركة النور للمقاولات والتجارة', 'PAYMENT', 'REC-2026-012', today, 0, 4000, 14500, 'BANK_TRANSFER', 'دفعة نقدية تحويل بنكي CIB'],
      ['ctx-03', 'CUST-002', 'م/ طارق الزيات (عميل برمجيات سحابية)', 'INVOICE', 'INV-2026-085', today, 35000, 0, 35000, 'CREDIT', 'عقد تطوير منصة سحابية المرحلة الأولى'],
      ['ctx-04', 'CUST-002', 'م/ طارق الزيات (عميل برمجيات سحابية)', 'PAYMENT', 'REC-2026-019', today, 0, 10000, 25000, 'INSTAPAY', 'دفعة عبر انستاباي'],
      ['ctx-05', 'CUST-004', 'معرض الشروق للأدوات الكهربائية', 'INVOICE', 'INV-2026-090', today, 8200, 0, 8200, 'CREDIT', 'توريد كابلات شبكات وأجهزة لابتوب']
    ];
    for (const tx of sampleCustTx) {
      await conn.query(
        `INSERT INTO customer_transactions (id, customer_id, customer_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tx
      );
    }
    console.log('Seeded initial customer transactions');
  }

  const [supTxCount]: any = await conn.query('SELECT COUNT(*) as count FROM supplier_transactions');
  if (supTxCount[0].count === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const sampleSupTx = [
      ['stx-01', 'SUP-001', 'شركة الوكيل المعتمد للحواسب (دل ولينوفو)', 'PURCHASE', 'PUR-2026-015', today, 0, 78000, 78000, 'CREDIT', 'فاتورة شراء 3 أجهزة لابتوب Precision وقطع غيار'],
      ['stx-02', 'SUP-001', 'شركة الوكيل المعتمد للحواسب (دل ولينوفو)', 'PAYMENT', 'VOUCH-2026-004', today, 30000, 0, 48000, 'BANK_CHECK', 'سداد شيك بنكي من حساب الشركة'],
      ['stx-03', 'SUP-002', 'مؤسسة الأهرام لمعدات المراقبة والشبكات', 'PURCHASE', 'PUR-2026-022', today, 0, 22000, 22000, 'CREDIT', 'شراء كاميرات IP وكابلات شنايدر'],
      ['stx-04', 'SUP-002', 'مؤسسة الأهرام لمعدات المراقبة والشبكات', 'PAYMENT', 'VOUCH-2026-009', today, 22000, 0, 0, 'CASH', 'سداد كاش نقدي بالكامل']
    ];
    for (const tx of sampleSupTx) {
      await conn.query(
        `INSERT INTO supplier_transactions (id, supplier_id, supplier_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tx
      );
    }
    console.log('Seeded initial supplier transactions');
  }

  await conn.end();
  console.log('TRANSACTIONS_TABLES_CREATED_AND_SEEDED');
}

migrate().catch(console.error);
