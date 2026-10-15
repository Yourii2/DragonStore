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

  console.log('Connected to MySQL. Updating employees table and creating employee_transactions table...');

  // 1. Alter employees table to make sure salary_cycle exists
  try {
    const [cols]: any = await conn.query("SHOW COLUMNS FROM employees LIKE 'salary_cycle'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE employees ADD COLUMN salary_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY' AFTER base_salary");
      console.log('Added salary_cycle column to employees');
    }
  } catch (err: any) {
    console.warn('Column check error:', err.message);
  }

  // 2. Create employee_transactions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS employee_transactions (
      id VARCHAR(50) PRIMARY KEY,
      employee_id VARCHAR(50) NOT NULL,
      employee_name VARCHAR(200) NOT NULL,
      transaction_type VARCHAR(50) NOT NULL, -- 'SALARY_PAYMENT', 'ADVANCE', 'COMMISSION', 'DEDUCTION', 'BONUS'
      reference_no VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      flow VARCHAR(20) NOT NULL, -- 'INCENTIVE' (عمولة/مكافأة تضاف له), 'DEDUCTION' (سلفة/خصم تخصم منه), 'PAYOUT' (صرف مستحقات)
      payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('employee_transactions table is ready');

  // 3. Seed some initial sample employees if table is empty or update cycles
  const [empCount]: any = await conn.query('SELECT COUNT(*) as count FROM employees');
  if (empCount[0].count === 0) {
    const sampleEmployees = [
      ['EMP-001', 'م/ إسلام عبد العزيز', 'مهندس صيانة حواسيب وإلكترونيات', 'ورشة الصيانة والدعم الفني', '01012349988', 'islam.tech@dragonsystems.com', 7500, 'MONTHLY', 1800, 1000, 8300, 'SHOP', 'ACTIVE', '2024-01-15'],
      ['EMP-002', 'م/ عمر مصطفى', 'مطور برمجيات Full-Stack Senior', 'وحدة تطوير البرمجيات السحابية', '01122338877', 'omar.dev@dragonsystems.com', 14000, 'MONTHLY', 3500, 0, 17500, 'FREELANCE', 'ACTIVE', '2023-08-01'],
      ['EMP-003', 'أحمد سعيد البنداري', 'فني تركيب شبكات وكاميرات مراقبة', 'المشاريع الميدانية والـ ISP', '01255667788', 'ahmed.cctv@dragonsystems.com', 1500, 'WEEKLY', 300, 100, 1700, 'SHOP', 'ACTIVE', '2024-03-10'],
      ['EMP-004', 'كريم عادل الشناوي', 'أمين نقطة البيع ومسؤول كاشير', 'المتجر والمبيعات', '01599884433', 'karim.pos@dragonsystems.com', 5500, 'MONTHLY', 750, 0, 6250, 'SHOP', 'ACTIVE', '2024-05-01']
    ];
    for (const e of sampleEmployees) {
      await conn.query(
        `INSERT INTO employees (id, name, job_title, department, phone, email, base_salary, salary_cycle, commissions, advances, net_payable, business_unit, status, hire_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        e
      );
    }
    console.log('Seeded sample employees');
  }

  // 4. Seed initial employee transactions
  const [txCount]: any = await conn.query('SELECT COUNT(*) as count FROM employee_transactions');
  if (txCount[0].count === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const sampleTx = [
      ['etx-01', 'EMP-001', 'م/ إسلام عبد العزيز', 'COMMISSION', 'COM-2026-001', today, 1800, 'INCENTIVE', 'CASH', 'حافز إنجاز وصيانة دورية لشهر سبتمبر'],
      ['etx-02', 'EMP-001', 'م/ إسلام عبد العزيز', 'ADVANCE', 'ADV-2026-003', today, 1000, 'DEDUCTION', 'CASH', 'سلفة نقدية على الحساب'],
      ['etx-03', 'EMP-002', 'م/ عمر مصطفى', 'COMMISSION', 'COM-2026-002', today, 3500, 'INCENTIVE', 'INSTAPAY', 'مكافأة تسليم مرحلة تطبيق سحابي'],
      ['etx-04', 'EMP-003', 'أحمد سعيد البنداري', 'COMMISSION', 'COM-2026-003', today, 300, 'INCENTIVE', 'CASH', 'بدل انتقال ومكافأة تركيب كاميرات'],
      ['etx-05', 'EMP-003', 'أحمد سعيد البنداري', 'ADVANCE', 'ADV-2026-004', today, 100, 'DEDUCTION', 'CASH', 'خصم سلفة أسبوعية'],
      ['etx-06', 'EMP-004', 'كريم عادل الشناوي', 'COMMISSION', 'COM-2026-004', today, 750, 'INCENTIVE', 'CASH', 'عمولة مبيعات شاشات وإكسسوارات']
    ];
    for (const t of sampleTx) {
      await conn.query(
        `INSERT INTO employee_transactions (id, employee_id, employee_name, transaction_type, reference_no, date, amount, flow, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        t
      );
    }
    console.log('Seeded sample employee transactions');
  }

  await conn.end();
  console.log('EMPLOYEES_TABLES_MIGRATION_COMPLETED');
}

migrate().catch(console.error);
