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

  console.log('Connected to MySQL. Setting up financial_transactions table and updating accounts table...');

  // 1. Ensure accounts table has description, is_active, keeper_name etc.
  try {
    const [cols]: any = await conn.query("SHOW COLUMNS FROM accounts LIKE 'keeper_name'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE accounts ADD COLUMN keeper_name VARCHAR(150) NULL DEFAULT 'المدير المالي'");
    }
  } catch (err: any) {
    console.warn('Column check keeper_name error:', err.message);
  }

  try {
    const [cols]: any = await conn.query("SHOW COLUMNS FROM accounts LIKE 'notes'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE accounts ADD COLUMN notes TEXT NULL");
    }
  } catch (err: any) {
    console.warn('Column check notes error:', err.message);
  }

  // 2. Create financial_transactions table (حركات وسندات الخزائن والبنوك)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id VARCHAR(50) PRIMARY KEY,
      reference_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      transaction_type VARCHAR(50) NOT NULL, -- 'RECEIPT' (قبض/إيداع), 'PAYMENT' (صرف), 'TRANSFER' (تحويل بين خزائن), 'EXPENSE' (مصروف)
      account_id VARCHAR(50) NOT NULL,
      account_name VARCHAR(200) NOT NULL,
      to_account_id VARCHAR(50) NULL,
      to_account_name VARCHAR(200) NULL,
      flow VARCHAR(20) NOT NULL, -- 'IN' (إيداع / وارد للخزينة), 'OUT' (صرف / منصرف من الخزينة), 'TRANSFER' (تحويل)
      amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
      balance_after DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
      category VARCHAR(100) NULL,
      party_type VARCHAR(50) NULL, -- 'CUSTOMER', 'SUPPLIER', 'EMPLOYEE', 'EXPENSE', 'INTERNAL'
      party_name VARCHAR(200) NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('financial_transactions table is ready');

  // 3. Seed sample transactions if empty
  const [txCount]: any = await conn.query('SELECT COUNT(*) as count FROM financial_transactions');
  if (txCount[0].count === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const sampleTx = [
      ['ftx-01', 'REC-2026-001', today, 'RECEIPT', 'acc_cash_shop', 'صندوق كاشير المحل (نقدية)', null, null, 'IN', 4500, 18450, 'مبيعات نقدية', 'CUSTOMER', 'عميل نقدي كاشير', 'CASH', 'إيراد مبيعات وردية الصباح'],
      ['ftx-02', 'REC-2026-002', today, 'RECEIPT', 'acc_cib_bank', 'حساب البنك التجاري الدولي (CIB)', null, null, 'IN', 15000, 245000, 'سداد عقد برمجي', 'CUSTOMER', 'م/ طارق الزيات', 'BANK_TRANSFER', 'تحويل بنكي دفعة أولى'],
      ['ftx-03', 'PAY-2026-001', today, 'PAYMENT', 'acc_cash_shop', 'صندوق كاشير المحل (نقدية)', null, null, 'OUT', 1200, 17250, 'مصروفات تشغيلية', 'EXPENSE', 'شركة الكهرباء', 'CASH', 'فاتورة استهلاك كهرباء المقر'],
      ['ftx-04', 'TRF-2026-001', today, 'TRANSFER', 'acc_cash_shop', 'صندوق كاشير المحل (نقدية)', 'acc_vault', 'خزينة المتجر الرئيسية', 'TRANSFER', 10000, 7250, 'تحويل سيولة داخلية', 'INTERNAL', 'إيداع إغلاق وردية بالخزينة', 'CASH', 'ترحيل نقدية فائضة لخزينة المتجر'],
      ['ftx-05', 'REC-2026-003', today, 'RECEIPT', 'acc_instapay', 'محفظة إنستاباي وفودافون كاش الرسمية', null, null, 'IN', 3800, 36050, 'صيانة وخدمات فنية', 'CUSTOMER', 'د/ منى عثمان', 'INSTAPAY', 'سداد تكلفة صيانة ماكبوك']
    ];

    for (const t of sampleTx) {
      await conn.query(
        `INSERT INTO financial_transactions (id, reference_no, date, transaction_type, account_id, account_name, to_account_id, to_account_name, flow, amount, balance_after, category, party_type, party_name, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t
      );
    }
    console.log('Seeded sample financial transactions');
  }

  await conn.end();
  console.log('FINANCIAL_TABLES_MIGRATION_COMPLETED');
}

migrate().catch(console.error);
