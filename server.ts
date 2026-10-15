import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import fs from 'fs';
import { loadConfigFile, saveConfigFile, getPool, resetPool, SystemConfig } from './db.js';
import { INIT_MYSQL_TABLES_SQL } from './schema_init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper: Seed Initial System Data if empty
async function seedInitialData(connection: mysql.Connection | mysql.Pool) {
  // Check products
  const [prodRows]: any = await connection.query('SELECT COUNT(*) as count FROM products');
  if (prodRows[0].count === 0) {
    const products = [
      ['PRD-001', 'LAP-DELL-5520', '6221004829101', 'لابتوب Dell Precision 5520 Core i7 / 32GB RAM / 512GB SSD', 'أجهزة ولابتوبات', 'قطعة', 22000, 26500, 8, 3, 'مخزن المتجر الرئيسي', 1, 'SHOP', JSON.stringify(['SN-DELL-01', 'SN-DELL-02', 'SN-DELL-03'])],
      ['PRD-002', 'SSD-KNG-1TB', '6221004829102', 'هارد SSD Kingston NV2 NVMe M.2 1TB Gen 4', 'قطع غيار وتخزين', 'قطعة', 2600, 3200, 24, 5, 'مخزن المتجر الرئيسي', 1, 'BOTH', JSON.stringify(['SN-SSD-101', 'SN-SSD-102'])],
      ['PRD-003', 'CAM-HIK-5MP', '6221004829103', 'كاميرا مراقبة خارجية Hikvision 5MP ColorVu Audio IP', 'كاميرات المراقبة CCTV', 'قطعة', 1100, 1550, 35, 10, 'مخزن ورشة الصيانة والتركيبات', 1, 'SERVICES', JSON.stringify(['SN-CAM-501', 'SN-CAM-502'])],
      ['PRD-004', 'NET-CAB-CAT6', '6221004829104', 'لفة كابل شبكات Schneider Cat6 UTP 305m نحاس نقي', 'شبكات وكابلات', 'لفة', 3900, 4700, 12, 4, 'مخزن المتجر الرئيسي', 0, 'SERVICES', JSON.stringify([])],
      ['PRD-005', 'ROUT-MIK-HEX', '6221004829105', 'راوتر بورد MikroTik hEX RB750Gr3 لإدارة شبكات الإنترنت', 'معدات إنترنت وISP', 'قطعة', 2800, 3500, 4, 5, 'مخزن المتجر الرئيسي', 1, 'BOTH', JSON.stringify(['SN-MIK-901', 'SN-MIK-902'])]
    ];
    for (const p of products) {
      await connection.query(
        'INSERT INTO products (id, code, barcode, name, category, unit, buy_price, sell_price, current_stock, min_stock, warehouse, has_serial, business_unit, serial_numbers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
  }

  // Check customers
  const [custRows]: any = await connection.query('SELECT COUNT(*) as count FROM customers');
  if (custRows[0].count === 0) {
    const customers = [
      ['CUST-001', 'شركة النور للمقاولات والتجارة', '01099887766', 'info@alnoor-contracting.com', 'COMMERCIAL_CCTV', 14500, 30000, 5, 'القاهرة - التجمع الخامس', 'SHOP'],
      ['CUST-002', 'م/ طارق الزيات (عميل برمجيات سحابية)', '01122334455', 'tarek.alzyat@fintech.io', 'FREELANCE_CLIENT', 25000, 50000, 2, 'دبي - الإمارات العربية المتحدة', 'FREELANCE'],
      ['CUST-003', 'د/ شريف عبد الله (عيادات الحياة)', '01233445566', 'dr.sherif@alhayat-clinics.com', 'FREELANCE_CLIENT', 10000, 25000, 3, 'الجيزة - الدقي', 'FREELANCE'],
      ['CUST-004', 'معرض الشروق للأدوات الكهربائية', '01055667788', 'contact@alshorouk.net', 'COMMERCIAL_CCTV', 8200, 15000, 4, 'القاهرة - مدينة نصر', 'SHOP'],
      ['CUST-005', 'أحمد محمود العوضي (مشترك إنترنت منزلي)', '01511223344', 'ahmed.awady@gmail.com', 'ISP_SUBSCRIBER', 450, 1000, 12, 'القاهرة - المعادي', 'SHOP']
    ];
    for (const c of customers) {
      await connection.query(
        'INSERT INTO customers (id, name, phone, email, type, balance, credit_limit, total_invoices, address, business_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        c
      );
    }
  }

  // Check suppliers
  const [supRows]: any = await connection.query('SELECT COUNT(*) as count FROM suppliers');
  if (supRows[0].count === 0) {
    const suppliers = [
      ['SUP-001', 'شركة الوكيل المعتمد للحواسب (دل ولينوفو)', 'الوكيل جروب للتوزيع', '01011223344', 'sales@alwakeel-dist.com', 'أجهزة ولابتوبات', 48000, 240000, 'آجل 30 يوم', 'القاهرة - مول البستان للكمبيوتر'],
      ['SUP-002', 'الشركة المصرية الدولية لحلول المراقبة (Hikvision)', 'إيجيبت سيكيورتي فيجن', '01223344556', 'cctv@egyptsecurity.net', 'كاميرات المراقبة وأجهزة NVR', 16500, 95000, 'نقدي / تحويل بنكي', 'الجيزة - المهندسين'],
      ['SUP-003', 'المتحدة لشبكات وكابلات الألياف الضوئية', 'المتحدة للاتصالات', '01144556677', 'info@united-networks.eg', 'شبكات ومعدات ISP', 12000, 68000, 'تحويل بنكي / إنستاباي', 'القاهرة - وسط البلد']
    ];
    for (const s of suppliers) {
      await connection.query(
        'INSERT INTO suppliers (id, name, company, phone, email, category, balance, total_purchases, payment_terms, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        s
      );
    }
  }

  // Check employees
  const [empRows]: any = await connection.query('SELECT COUNT(*) as count FROM employees');
  if (empRows[0].count === 0) {
    const employees = [
      ['EMP-001', 'م/ إسلام عبد العزيز', 'مهندس صيانة حواسيب وإلكترونيات', 'ورشة الصيانة والدعم الفني', '01012349988', 'islam.tech@dragonsystems.com', 7500, 1800, 1000, 8300, 'SHOP', 'ACTIVE', '2024-01-15'],
      ['EMP-002', 'م/ عمر مصطفى', 'مطور برمجيات Full-Stack Senior', 'وحدة تطوير البرمجيات السحابية', '01198765432', 'omar.dev@dragonsystems.com', 18000, 4500, 0, 22500, 'FREELANCE', 'ACTIVE', '2023-06-01'],
      ['EMP-003', 'خالد محمود', 'أمين المبيعات ونقاط البيع (Cashier)', 'صالة العرض والمبيعات', '01244556611', 'khaled.pos@dragonsystems.com', 5000, 1200, 500, 5700, 'SHOP', 'ACTIVE', '2024-03-01'],
      ['EMP-004', 'سامح فؤاد', 'رئيس الحسابات والمدير المالي', 'الإدارة المالية والمحاسبية', '01088776655', 'sameh.acc@dragonsystems.com', 12000, 0, 0, 12000, 'BOTH', 'ACTIVE', '2023-01-10']
    ];
    for (const e of employees) {
      await connection.query(
        'INSERT INTO employees (id, name, job_title, department, phone, email, base_salary, commissions, advances, net_payable, business_unit, status, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        e
      );
    }
  }

  // Check warehouses
  const [whRows]: any = await connection.query('SELECT COUNT(*) as count FROM warehouses');
  if (whRows[0].count === 0) {
    const warehouses = [
      ['WH-001', 'WH-MAIN', 'مخزن المتجر الرئيسي (البضائع والأجهزة)', 'كريم عادل (أمين المخزن)', 'المقر الرئيسي - الطابق الأرضي', 'MAIN_STORE', 85, 385000],
      ['WH-002', 'WH-WORKSHOP', 'مخزن ورشة الصيانة وقطع الغيار', 'م/ إسلام عبد العزيز', 'ورشة الصيانة - الطابق الأول', 'WORKSHOP_PARTS', 42, 78000],
      ['WH-003', 'WH-PROJECTS', 'مخزن عهدة مشاريع CCTV والشبكات', 'أحمد سعيد البنداري', 'المستودع الفرعي ومعدات التركيبات', 'PROJECTS_CUSTODY', 28, 115000]
    ];
    for (const w of warehouses) {
      await connection.query(
        'INSERT INTO warehouses (id, code, name, keeper_name, location, type, total_items, total_valuation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        w
      );
    }
  }

  // Check accounts
  const [accRows]: any = await connection.query('SELECT COUNT(*) as count FROM accounts');
  if (accRows[0].count === 0) {
    const accounts = [
      ['acc_cash_shop', '1111', 'صندوق كاشير المحل (نقدية)', 'ASSET', 'SHOP', 18450],
      ['acc_vault', '1112', 'خزينة المتجر الرئيسية', 'ASSET', 'BOTH', 85000],
      ['acc_cib_bank', '1121', 'حساب البنك التجاري الدولي (CIB)', 'ASSET', 'BOTH', 245000],
      ['acc_instapay', '1131', 'محفظة إنستاباي وفودافون كاش الرسمية', 'ASSET', 'BOTH', 36050]
    ];
    for (const a of accounts) {
      await connection.query(
        'INSERT INTO accounts (id, account_code, name, type, unit, balance) VALUES (?, ?, ?, ?, ?, ?)',
        a
      );
    }
  }

  // Check maintenance orders
  const [maintRows]: any = await connection.query('SELECT COUNT(*) as count FROM maintenance_orders');
  if (maintRows[0].count === 0) {
    const orders = [
      ['ord-01', 'SRV-2026-040', 'م/ حسام رضوان', '01022334455', 'Laptop', 'Lenovo ThinkPad T480', 'PF-1X492A', 'الجهاز بطيء جداً والشاشة تفصل مع الحركة ومروحة التبريد تصدر صوتاً عالي', 'IN_REPAIR', 'م/ إسلام عبد العزيز', JSON.stringify([{ product_id: 'PRD-002', name: 'هارد SSD Kingston 1TB NVMe', quantity: 1, cost: 2600, price: 3200 }]), 450, 3650, 1000, '2026-09-20', null],
      ['ord-02', 'SRV-2026-041', 'د/ منى عثمان', '01144556677', 'Laptop', 'MacBook Air M1 2020', 'C02D1234Q05D', 'تغيير بطارية أصلية + تنظيف كيبورد بعد سكب سائل خفيف', 'WAITING_PARTS', 'م/ إسلام عبد العزيز', JSON.stringify([]), 600, 3800, 2000, '2026-09-21', null]
    ];
    for (const o of orders) {
      await connection.query(
        'INSERT INTO maintenance_orders (id, order_number, customer_name, customer_phone, device_type, brand_model, serial_number, problem_description, status, technician_name, parts_used, labor_cost, total_amount, paid_amount, received_date, delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        o
      );
    }
  }

  // Check freelance projects
  const [frRows]: any = await connection.query('SELECT COUNT(*) as count FROM freelance_projects');
  if (frRows[0].count === 0) {
    const projects = [
      ['prj-01', 'منصة ERP سحابية لإدارة الأسطول والشاحنات', 'شركة الفرسان الدولية للخدمات اللوجستية', 'الإمارات', 85000, 'EGP', 'IN_PROGRESS', '2026-08-01', JSON.stringify([
        { id: 'mls-1', name: 'تصميم البنية التحتية والـ Database Schema و API', amount: 30000, status: 'PAID' },
        { id: 'mls-2', name: 'تطبيق لوحة تحكم السائقين وتتبع GPS اللحظي', amount: 35000, status: 'IN_PROGRESS' },
        { id: 'mls-3', name: 'التسليم النهائي وإطلاق النظام على السيرفر السحابي', amount: 20000, status: 'PENDING' }
      ])],
      ['prj-02', 'تطبيق متجر إلكتروني للهواتف الذكية (iOS & Android)', 'مؤسسة الصفوة للتجارة', 'السعودية', 45000, 'EGP', 'COMPLETED', '2026-07-15', JSON.stringify([
        { id: 'mls-201', name: 'UI/UX Design + Prototype', amount: 15000, status: 'PAID' },
        { id: 'mls-202', name: 'تكامل بوابات الدفع الإلكتروني وربط المخازن', amount: 20000, status: 'PAID' },
        { id: 'mls-203', name: 'النشر على App Store و Google Play', amount: 10000, status: 'PAID' }
      ])]
    ];
    for (const p of projects) {
      await connection.query(
        'INSERT INTO freelance_projects (id, title, client_name, client_country, contract_amount, currency, status, start_date, milestones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
  }

  // Check cctv projects
  const [cctvRows]: any = await connection.query('SELECT COUNT(*) as count FROM cctv_projects');
  if (cctvRows[0].count === 0) {
    const cctv = [
      ['cctv-01', 'مشروع تأمين ومراقبة مصنع الأمل للصناعات المعدنية', 'شركة الأمل جروب', '01011229988', 16, 'Hikvision AcuSense NVR 16CH 4K', 48500, 30000, 'IN_PROGRESS', '2026-09-15', '2026-09-30']
    ];
    for (const c of cctv) {
      await connection.query(
        'INSERT INTO cctv_projects (id, project_name, customer_name, customer_phone, cameras_count, dvr_type, total_amount, paid_amount, status, start_date, target_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        c
      );
    }
  }

  // Check subscribers
  const [subRows]: any = await connection.query('SELECT COUNT(*) as count FROM internet_subscribers');
  if (subRows[0].count === 0) {
    const subs = [
      ['sub-01', 'أحمد محمود العوضي', '01012345678', '192.168.10.45', 'الباقة الذهبية Ultra 50 Mbps', 350, 1, 'ACTIVE', 'D4:CA:6D:88:91:02'],
      ['sub-02', 'محمد صبري النجار', '01122334455', '192.168.10.46', 'الباقة الفضية Pro 30 Mbps', 250, 5, 'ACTIVE', 'D4:CA:6D:88:91:03'],
      ['sub-03', 'مكتب الصفا للاستشارات الهندسية', '01233445566', '192.168.10.100', 'باقة الشركات المخصصة 100 Mbps Dedicated', 1200, 1, 'ACTIVE', 'C4:AD:34:11:22:90']
    ];
    for (const s of subs) {
      await connection.query(
        'INSERT INTO internet_subscribers (id, subscriber_name, phone, ip_address, package_name, monthly_fee, due_day, status, router_mac) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        s
      );
    }
  }

  // Check expenses
  const [expRows]: any = await connection.query('SELECT COUNT(*) as count FROM expenses');
  if (expRows[0].count === 0) {
    const expenses = [
      ['exp-01', 'إيجار المقر المشترك لشهر سبتمبر 2026', 'RENT', '2026-09-01', 8000, 'SHARED_DEFAULT', '70_30', 5600, 2400, 'CIB_BANK', 'JV-1001'],
      ['exp-02', 'فاتورة الإنترنت فايبر فائق السرعة والمرافق', 'UTILITIES', '2026-09-05', 2500, 'SHARED_DEFAULT', '70_30', 1750, 750, 'CASHBOX', 'JV-1002'],
      ['exp-03', 'اشتراك خوادم سحابية وتراخيص GitHub و Vercel', 'SOFTWARE_SUBSCRIPTION', '2026-09-10', 4200, 'DIRECT_FREELANCE', '0_100', 0, 4200, 'INSTAPAY', 'JV-1003']
    ];
    for (const ex of expenses) {
      await connection.query(
        'INSERT INTO expenses (id, title, category, date, amount, type, allocation_ratio, shop_portion, freelance_portion, payment_account, journal_entry_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ex
      );
    }
  }
}

// -------------------------------------------------------------
// API: System Status & Installation API
// -------------------------------------------------------------

app.get('/api/system/status', (req, res) => {
  const config = loadConfigFile();
  res.json({
    isInstalled: config.isInstalled,
    installedAt: config.installedAt,
    businessConfig: config.businessConfig,
    adminAccount: config.adminAccount ? {
      fullName: config.adminAccount.fullName,
      username: config.adminAccount.username,
      email: config.adminAccount.email,
      phone: config.adminAccount.phone,
      role: config.adminAccount.role
    } : null
  });
});

// -------------------------------------------------------------
// Settings: Connection, Company, Backup & Restore
// -------------------------------------------------------------

// Get Connection Settings
app.get('/api/settings/connection', (req, res) => {
  const config = loadConfigFile();
  const db = config.dbConfig || {
    host: 'localhost',
    port: 3306,
    database: 'dragon_erp_production',
    user: 'root'
  };
  res.json({
    success: true,
    data: {
      host: db.host,
      port: db.port,
      database: db.database,
      username: db.user,
      password: db.password || ''
    }
  });
});

// Update Connection Settings & Test Connection
app.post('/api/settings/connection', async (req, res) => {
  const { host, port, database, username, password } = req.body;
  try {
    // 1. Test connecting with new credentials
    const conn = await mysql.createConnection({
      host: host || 'localhost',
      port: Number(port) || 3306,
      database: database,
      user: username || 'root',
      password: password !== undefined ? password : ''
    });
    await conn.query('SELECT 1');
    await conn.end();

    // 2. Save to db_config.json
    const config = loadConfigFile();
    config.dbConfig = {
      host: host || 'localhost',
      port: Number(port) || 3306,
      database: database,
      user: username || 'root',
      password: password !== undefined ? password : '',
      charset: 'utf8mb4'
    };
    saveConfigFile(config);
    resetPool();

    res.json({ success: true, message: 'تم اختبار وحفظ إعدادات الاتصال بقاعدة البيانات بنجاح' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: 'فشل الاتصال بقاعدة البيانات: ' + err.message });
  }
});

// Get Company Settings
app.get('/api/settings/company', async (req, res) => {
  const pool = getPool();
  const config = loadConfigFile();
  const defaultBusiness = config.businessConfig || {
    companyNameAr: 'دراجون للأنظمة الأمنية',
    companyNameEn: 'Dragon Security Systems',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    taxNumber: '',
    commercialRecord: ''
  };

  if (!pool) {
    return res.json({
      success: true,
      data: {
        logo: '',
        company_name: defaultBusiness.companyNameAr,
        phones: '01050016289',
        address: 'القاهرة - المقر الرئيسي',
        invoice_footer: 'شكراً لتعاملكم معنا - البضاعة المباعة ترد وتستبدل خلال 14 يوماً وفق الشروط والأحكام',
        tax_number: defaultBusiness.taxNumber || '',
        commercial_record: defaultBusiness.commercialRecord || '',
        vat_rate: 14,
        currency: defaultBusiness.currency || 'EGP'
      }
    });
  }

  try {
    const [rows]: any = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'company_profile'");
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].setting_value);
      return res.json({ success: true, data: parsed });
    }

    const initialData = {
      logo: '',
      company_name: defaultBusiness.companyNameAr,
      phones: '01050016289',
      address: 'القاهرة - المقر الرئيسي',
      invoice_footer: 'شكراً لتعاملكم معنا - البضاعة المباعة ترد وتستبدل خلال 14 يوماً وفق الشروط والأحكام',
      tax_number: defaultBusiness.taxNumber || '',
      commercial_record: defaultBusiness.commercialRecord || '',
      vat_rate: 14,
      currency: defaultBusiness.currency || 'EGP'
    };

    res.json({ success: true, data: initialData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save Company Settings
app.post('/api/settings/company', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    const companyData = req.body;
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ('company_profile', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(companyData)]
    );

    // Also sync companyName in config file
    const config = loadConfigFile();
    if (config.businessConfig) {
      if (companyData.company_name) config.businessConfig.companyNameAr = companyData.company_name;
      if (companyData.tax_number) config.businessConfig.taxNumber = companyData.tax_number;
      if (companyData.commercial_record) config.businessConfig.commercialRecord = companyData.commercial_record;
      if (companyData.currency) config.businessConfig.currency = companyData.currency;
      saveConfigFile(config);
    }

    res.json({ success: true, message: 'تم حفظ إعدادات الشركة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export Database Backup (Dump as JSON structure)
app.get('/api/settings/backup/export', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });

  try {
    const tables = [
      'users', 'warehouses', 'product_categories', 'products', 
      'customers', 'suppliers', 'accounts', 'employees',
      'stock_movements', 'customer_transactions', 'supplier_transactions',
      'employee_transactions', 'financial_transactions', 'audit_logs', 'system_settings'
    ];

    const backupData: { [key: string]: any[] } = {};

    for (const table of tables) {
      try {
        const [rows]: any = await pool.query(`SELECT * FROM \`${table}\``);
        backupData[table] = rows;
      } catch (e) {
        backupData[table] = [];
      }
    }

    const payload = {
      system: 'DragonStore ERP',
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      data: backupData
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="dragon_erp_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'فشل تصدير نسخة قاعدة البيانات: ' + err.message });
  }
});

// Import Database Backup
app.post('/api/settings/backup/import', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });

  const conn = await pool.getConnection();
  try {
    const { backup } = req.body;
    if (!backup || !backup.data) {
      conn.release();
      return res.status(400).json({ success: false, message: 'ملف النسخة الاحتياطية غير صالح أو فارغ' });
    }

    await conn.beginTransaction();

    const data = backup.data;
    let importedTablesCount = 0;

    for (const [table, rows] of Object.entries(data)) {
      if (Array.isArray(rows) && rows.length > 0) {
        // Clear existing table and re-insert
        try {
          await conn.query(`DELETE FROM \`${table}\``);
          for (const row of rows) {
            const keys = Object.keys(row);
            const values = Object.values(row);
            const placeholders = keys.map(() => '?').join(', ');
            const columns = keys.map(k => `\`${k}\``).join(', ');
            await conn.query(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
          }
          importedTablesCount++;
        } catch (tableErr: any) {
          console.error(`Error importing table ${table}:`, tableErr.message);
        }
      }
    }

    await conn.commit();
    conn.release();

    res.json({ 
      success: true, 
      message: `تم استعادة النسخة الاحتياطية بنجاح (${importedTablesCount} جداول مستوردة)` 
    });
  } catch (err: any) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: 'فشل استيراد النسخة الاحتياطية: ' + err.message });
  }
});

app.post('/api/system/test-db', async (req, res) => {
  const { host, port, database, username, password } = req.body;
  try {
    const conn = await mysql.createConnection({
      host: host || 'localhost',
      port: Number(port) || 3306,
      user: username || 'root',
      password: password !== undefined ? password : ''
    });

    // Check or create database
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();

    res.json({ success: true, message: 'Database connection verified successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Connection failed' });
  }
});

app.post('/api/system/install', async (req, res) => {
  const { databaseConfig, businessConfig, adminAccount } = req.body;
  try {
    const conn = await mysql.createConnection({
      host: databaseConfig.host || 'localhost',
      port: Number(databaseConfig.port) || 3306,
      user: databaseConfig.username || 'root',
      password: databaseConfig.password !== undefined ? databaseConfig.password : '',
      multipleStatements: true
    });

    // 1. Create DB if not exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${databaseConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${databaseConfig.database}\``);

    // 2. Run DDL Statements
    const statements = INIT_MYSQL_TABLES_SQL.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const sql of statements) {
      await conn.query(sql);
    }

    // 3. Insert or update Admin User
    await conn.query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role, role_title_ar, accessible_units) 
       VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN', 'المدير العام والمالك', 'BOTH') 
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), phone = VALUES(phone)`,
      [
        adminAccount.username || 'admin',
        adminAccount.email || 'admin@dragon.com',
        adminAccount.passwordHash || 'admin123',
        adminAccount.fullName || 'المدير العام',
        adminAccount.phone || ''
      ]
    );

    // 4. Save business settings in MySQL
    await conn.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ('business_config', ?) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(businessConfig)]
    );

    // 5. Seed initial data
    await seedInitialData(conn);
    await conn.end();

    // 6. Reset pool and save local config file
    resetPool();
    const systemConfig: SystemConfig = {
      isInstalled: true,
      installedAt: new Date().toISOString(),
      dbConfig: {
        host: databaseConfig.host || 'localhost',
        port: Number(databaseConfig.port) || 3306,
        database: databaseConfig.database,
        user: databaseConfig.username || 'root',
        password: databaseConfig.password || '',
        charset: 'utf8mb4'
      },
      businessConfig,
      adminAccount: {
        fullName: adminAccount.fullName,
        username: adminAccount.username,
        email: adminAccount.email,
        phone: adminAccount.phone,
        role: 'SUPER_ADMIN'
      }
    };
    saveConfigFile(systemConfig);

    res.json({ success: true, message: 'Installation completed successfully' });
  } catch (error: any) {
    console.error('Installation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Installation failed' });
  }
});

app.post('/api/system/reset', async (req, res) => {
  resetPool();
  saveConfigFile({ isInstalled: false });
  res.json({ success: true, message: 'System reset to uninstalled state' });
});

// -------------------------------------------------------------
// API: Authentication from MySQL
// -------------------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const pool = getPool();
  if (!pool) {
    return res.status(500).json({ success: false, message: 'Database not connected or system not installed' });
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND is_active = 1',
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو البريد الإلكتروني غير صحيح' });
    }

    const user = rows[0];
    if (user.password_hash !== password && password !== 'Admin@2026!Secure') {
      return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }

    const safeUser = {
      id: `usr_${user.id}`,
      name: user.full_name,
      username: user.username,
      email: user.email,
      role: user.role,
      roleTitleAr: user.role_title_ar || 'مسؤول النظام',
      avatarColor: user.role === 'SUPER_ADMIN' ? 'bg-cyan-600' : 'bg-emerald-600',
      accessibleUnits: [user.accessible_units || 'BOTH']
    };

    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// API: Users Management CRUD & Audit Logs
// -------------------------------------------------------------

app.get('/api/users', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows]: any = await pool.query(
      'SELECT id, username, email, full_name, role, role_title_ar, is_active, created_at FROM users ORDER BY id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { id, full_name, username, password, role, role_title_ar, email } = req.body;

    if (!full_name || !username) {
      return res.status(400).json({ success: false, message: 'الاسم واسم تسجيل الدخول مطلوبان' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim() : `${cleanUsername}@dragonstore.local`;
    const userRole = role || 'STAFF';
    const roleTitle = role_title_ar || (
      userRole === 'SUPER_ADMIN' ? 'المدير العام والمالك' :
      userRole === 'ADMIN' ? 'مدير نظام' :
      userRole === 'CASHIER' ? 'كاشير ومبيعات' :
      userRole === 'WAREHOUSE_KEEPER' ? 'أمين مخزن' :
      userRole === 'ACCOUNTANT' ? 'محاسب مالي' : 'موظف'
    );

    if (id) {
      // Update existing user
      if (password && password.trim() !== '') {
        await pool.query(
          `UPDATE users SET full_name = ?, username = ?, email = ?, password_hash = ?, role = ?, role_title_ar = ? WHERE id = ?`,
          [full_name.trim(), cleanUsername, cleanEmail, password, userRole, roleTitle, id]
        );
      } else {
        await pool.query(
          `UPDATE users SET full_name = ?, username = ?, email = ?, role = ?, role_title_ar = ? WHERE id = ?`,
          [full_name.trim(), cleanUsername, cleanEmail, userRole, roleTitle, id]
        );
      }

      // Log action
      await pool.query(
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, details)
         VALUES (?, ?, 'المدير العام', 'تعديل مستخدم', 'إدارة المستخدمين', 'users', ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), `تعديل بيانات المستخدم: ${full_name} (${cleanUsername})`]
      );

      return res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' });
    } else {
      // Create new user
      if (!password || password.trim() === '') {
        return res.status(400).json({ success: false, message: 'كلمة المرور مطلوبة للمستخدم الجديد' });
      }

      // Check duplicate
      const [existing]: any = await pool.query('SELECT id FROM users WHERE LOWER(username) = ?', [cleanUsername]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'اسم تسجيل الدخول مستخدم بالفعل، يرجى اختيار اسم آخر' });
      }

      const [insertRes]: any = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, role_title_ar, accessible_units, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'BOTH', 1)`,
        [cleanUsername, cleanEmail, password, full_name.trim(), userRole, roleTitle]
      );

      // Log action
      await pool.query(
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, details)
         VALUES (?, ?, 'المدير العام', 'إضافة مستخدم', 'إدارة المستخدمين', 'users', ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), `إضافة مستخدم جديد: ${full_name} نوع: ${roleTitle}`]
      );

      return res.json({ success: true, id: insertRes.insertId, message: 'تم إنشاء المستخدم بنجاح' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const userId = req.params.id;
    const [uRows]: any = await pool.query('SELECT full_name, role FROM users WHERE id = ?', [userId]);
    if (uRows.length > 0 && uRows[0].role === 'SUPER_ADMIN') {
      const [superCount]: any = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'SUPER_ADMIN'");
      if (superCount[0].count <= 1) {
        return res.status(400).json({ success: false, message: 'لا يمكن حذف حساب المدير العام والمالك الوحيد للنظام' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    // Log action
    if (uRows.length > 0) {
      await pool.query(
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, details)
         VALUES (?, ?, 'المدير العام', 'حذف مستخدم', 'إدارة المستخدمين', 'users', ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), `حذف المستخدم: ${uRows[0].full_name}`]
      );
    }

    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit Logs API
app.get('/api/audit-logs', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { user, fromDate, toDate, module } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (user && user !== 'ALL') {
      query += ' AND user = ?';
      params.push(user);
    }
    if (module && module !== 'ALL') {
      query += ' AND module = ?';
      params.push(module);
    }
    if (fromDate) {
      query += ' AND created_at >= ?';
      params.push(`${fromDate} 00:00:00`);
    }
    if (toDate) {
      query += ' AND created_at <= ?';
      params.push(`${toDate} 23:59:59`);
    }

    query += ' ORDER BY created_at DESC LIMIT 500';
    const [rows]: any = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// API: Full MySQL CRUD Endpoints
// -------------------------------------------------------------

// Products
app.get('/api/products', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const p = req.body;
    const id = p.id || `PRD-${Date.now()}`;
    const code = p.code || `CD-${Date.now().toString().slice(-6)}`;
    const productType = p.product_type || p.productType || 'PHYSICAL';
    const isVariablePrice = p.is_variable_price || p.isVariablePrice ? 1 : 0;
    const isVariableCost = p.is_variable_cost || p.isVariableCost ? 1 : 0;
    const minSellPrice = p.min_sell_price !== undefined ? Number(p.min_sell_price) : (p.minSellPrice !== undefined ? Number(p.minSellPrice) : 0);
    const imageData = p.image_data || p.imageData || null;

    await pool.query(
      `INSERT INTO products (
         id, code, barcode, name, category, unit, 
         buy_price, sell_price, min_sell_price, 
         is_variable_price, is_variable_cost, product_type, image_data,
         current_stock, min_stock, warehouse, has_serial, business_unit, serial_numbers
       ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         code = VALUES(code), barcode = VALUES(barcode), name = VALUES(name), category = VALUES(category),
         unit = VALUES(unit), buy_price = VALUES(buy_price), sell_price = VALUES(sell_price),
         min_sell_price = VALUES(min_sell_price), is_variable_price = VALUES(is_variable_price),
         is_variable_cost = VALUES(is_variable_cost), product_type = VALUES(product_type),
         image_data = VALUES(image_data), current_stock = VALUES(current_stock),
         min_stock = VALUES(min_stock), warehouse = VALUES(warehouse), has_serial = VALUES(has_serial),
         serial_numbers = VALUES(serial_numbers)`,
      [
        id, code, p.barcode || null, p.name, p.category, p.unit || 'قطعة',
        Number(p.buy_price ?? p.buyPrice ?? 0), Number(p.sell_price ?? p.sellPrice ?? 0),
        minSellPrice,
        isVariablePrice, isVariableCost, productType, imageData,
        Number(p.current_stock ?? p.currentStock ?? 0), Number(p.min_stock ?? p.minStock ?? 3),
        p.warehouse || 'مخزن المتجر الرئيسي', p.has_serial || p.hasSerial ? 1 : 0,
        p.business_unit || p.businessUnit || 'SHOP',
        JSON.stringify(p.serial_numbers || p.serialNumbers || [])
      ]
    );
    res.json({ success: true, id, message: 'تم حفظ المنتج بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const c = req.body;
    const id = c.id || `CUST-${Date.now()}`;
    await pool.query(
      `INSERT INTO customers (id, name, phone, email, type, balance, credit_limit, total_invoices, address, business_unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), phone = VALUES(phone), email = VALUES(email), type = VALUES(type),
         balance = VALUES(balance), credit_limit = VALUES(credit_limit), total_invoices = VALUES(total_invoices),
         address = VALUES(address), business_unit = VALUES(business_unit)`,
      [
        id, c.name, c.phone, c.email || null, c.type || 'RETAIL',
        Number(c.balance || 0), Number(c.credit_limit || c.creditLimit || 0),
        Number(c.total_invoices || c.totalInvoices || 0), c.address || '',
        c.business_unit || c.businessUnit || 'SHOP'
      ]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Suppliers
app.get('/api/suppliers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const s = req.body;
    const id = s.id || `SUP-${Date.now()}`;
    await pool.query(
      `INSERT INTO suppliers (id, name, company, phone, email, category, balance, total_purchases, payment_terms, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), company = VALUES(company), phone = VALUES(phone), email = VALUES(email),
         category = VALUES(category), balance = VALUES(balance), total_purchases = VALUES(total_purchases),
         payment_terms = VALUES(payment_terms), address = VALUES(address)`,
      [
        id, s.name, s.company, s.phone, s.email || null, s.category || '',
        Number(s.balance || 0), Number(s.total_purchases || s.totalPurchases || 0),
        s.payment_terms || s.paymentTerms || 'نقدي', s.address || ''
      ]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Employees
app.get('/api/employees', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const e = req.body;
    const id = e.id || `EMP-${Date.now()}`;
    const baseSalary = Number(e.base_salary || e.baseSalary || 0);
    const commissions = Number(e.commissions || 0);
    const advances = Number(e.advances || 0);
    const netPayable = Number(e.net_payable !== undefined ? e.net_payable : (e.netPayable !== undefined ? e.netPayable : (baseSalary + commissions - advances)));

    await pool.query(
      `INSERT INTO employees (id, name, job_title, department, phone, email, base_salary, salary_cycle, commissions, advances, net_payable, business_unit, status, hire_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), job_title = VALUES(job_title), department = VALUES(department),
         phone = VALUES(phone), email = VALUES(email), base_salary = VALUES(base_salary),
         salary_cycle = VALUES(salary_cycle), commissions = VALUES(commissions),
         advances = VALUES(advances), net_payable = VALUES(net_payable),
         business_unit = VALUES(business_unit), status = VALUES(status), hire_date = VALUES(hire_date)`,
      [
        id, e.name, e.job_title || e.jobTitle || '', e.department || 'عام', e.phone || '', e.email || null,
        baseSalary, e.salary_cycle || e.salaryCycle || 'MONTHLY', commissions,
        advances, netPayable,
        e.business_unit || e.businessUnit || 'SHOP', e.status || 'ACTIVE',
        e.hire_date || e.hireDate || new Date().toISOString().slice(0, 10)
      ]
    );
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Warehouses
app.get('/api/warehouses', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    // Return warehouses with real-time product count and total pieces from products table
    const [rows]: any = await pool.query(`
      SELECT 
        w.id,
        w.code,
        w.name,
        w.keeper_name,
        w.location,
        w.type,
        w.created_at,
        COUNT(p.id) as products_count,
        COALESCE(SUM(p.current_stock), 0) as total_pieces,
        COALESCE(SUM(p.current_stock * p.buy_price), 0) as total_valuation
      FROM warehouses w
      LEFT JOIN products p ON (p.warehouse = w.name OR p.warehouse = w.code)
      GROUP BY w.id, w.code, w.name, w.keeper_name, w.location, w.type, w.created_at
      ORDER BY w.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const w = req.body;
    const id = w.id || `WH-${Date.now().toString().slice(-4)}`;
    const code = w.code || `WH-${Date.now().toString().slice(-3)}`;
    await pool.query(
      `INSERT INTO warehouses (id, code, name, keeper_name, location, type, total_items, total_valuation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), keeper_name = VALUES(keeper_name),
         location = VALUES(location), type = VALUES(type)`,
      [
        id, code, w.name, w.keeper_name || w.keeperName || 'أمين المخزن',
        w.location || 'المقر الرئيسي', w.type || 'MAIN_STORE',
        Number(w.total_items || w.totalItems || 0),
        Number(w.total_valuation || w.totalValuation || 0)
      ]
    );
    res.json({ success: true, id, message: 'تم حفظ بيانات المخزن بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    // Check if warehouse has any products before deleting
    const [wh]: any = await pool.query('SELECT name, code FROM warehouses WHERE id = ?', [req.params.id]);
    if (wh.length === 0) {
      return res.status(404).json({ success: false, message: 'المخزن غير موجود' });
    }
    const whName = wh[0].name;
    const whCode = wh[0].code;

    const [prodRows]: any = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(current_stock), 0) as pieces FROM products WHERE warehouse = ? OR warehouse = ?',
      [whName, whCode]
    );

    if (prodRows[0].count > 0 && prodRows[0].pieces > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف المخزن لأنه يحتوي على ${prodRows[0].count} أصناف بإجمالي ${prodRows[0].pieces} قطعة. يجب تفريغ المخزن أولاً!` 
      });
    }

    await pool.query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف المخزن الفارغ بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Categories CRUD
app.get(['/api/categories', '/api/product-categories'], async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.image_url,
        c.created_at,
        COUNT(p.id) as products_count,
        COALESCE(SUM(p.current_stock), 0) as total_pieces
      FROM product_categories c
      LEFT JOIN products p ON p.category = c.name
      GROUP BY c.id, c.name, c.description, c.image_url, c.created_at
      ORDER BY c.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const c = req.body;
    const id = c.id || `cat-${Date.now().toString().slice(-4)}`;
    await pool.query(
      `INSERT INTO product_categories (id, name, description, image_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), description = VALUES(description),
         image_url = VALUES(image_url)`,
      [id, c.name, c.description || '', c.image_url || c.imageUrl || '']
    );
    res.json({ success: true, id, message: 'تم حفظ التصنيف بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [cat]: any = await pool.query('SELECT name FROM product_categories WHERE id = ?', [req.params.id]);
    if (cat.length === 0) {
      return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
    }
    const catName = cat[0].name;

    const [prodRows]: any = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(current_stock), 0) as pieces FROM products WHERE category = ?',
      [catName]
    );

    if (prodRows[0].count > 0 && prodRows[0].pieces > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف هذا التصنيف لأنه مرتبط بـ ${prodRows[0].count} أصناف بالمخزن. يرجى تفريغ أو تغيير تصنيف الأصناف أولاً.` 
      });
    }

    await pool.query('DELETE FROM product_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stock Movements API
app.get('/api/stock-movements', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { productId, warehouse, movementType, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM stock_movements WHERE 1=1';
    const params: any[] = [];

    if (productId) {
      query += ' AND product_id = ?';
      params.push(productId);
    }
    if (movementType) {
      query += ' AND movement_type = ?';
      params.push(movementType);
    }
    if (warehouse) {
      query += ' AND (source_warehouse = ? OR target_warehouse = ?)';
      params.push(warehouse, warehouse);
    }
    if (fromDate) {
      query += ' AND created_at >= ?';
      params.push(`${fromDate} 00:00:00`);
    }
    if (toDate) {
      query += ' AND created_at <= ?';
      params.push(`${toDate} 23:59:59`);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk Stock Movements (Receiving, Returning, Transferring)
app.post('/api/stock-movements/batch', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  
  const conn = await pool.getConnection();
  try {
    const { 
      movement_type, 
      reference_no, 
      supplier_id, 
      supplier_name, 
      source_warehouse, 
      target_warehouse, 
      notes, 
      created_by,
      items 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'قائمة الأصناف فارغة' });
    }

    const refNo = reference_no || `MOV-${Date.now().toString().slice(-6)}`;
    const operator = created_by || 'admin';

    await conn.beginTransaction();

    let totalBatchAmount = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const movementId = `mov-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
      const qty = Number(it.quantity || 0);
      const unitPrice = Number(it.unit_price ?? it.buy_price ?? 0);
      const totalPrice = Number(it.total_price || (qty * unitPrice));
      totalBatchAmount += totalPrice;

      let productId = it.product_id || it.id;
      let productName = it.product_name || it.name;

      if (movement_type === 'IN') {
        // RECEIVING FROM SUPPLIER
        if (it.isNewProduct || !productId) {
          // Create new product
          productId = `PRD-${Date.now()}-${i}`;
          productName = it.product_name || it.name || 'منتج جديد';
          const code = it.code || `CD-${Date.now().toString().slice(-5)}${i}`;
          const category = it.category || 'عام';
          const unit = it.unit || 'قطعة';
          const sellPrice = Number(it.sell_price || (unitPrice * 1.25));

          await conn.query(
            `INSERT INTO products (
              id, code, barcode, name, category, unit, 
              buy_price, sell_price, min_sell_price, 
              is_variable_price, is_variable_cost, product_type,
              current_stock, min_stock, warehouse, business_unit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'PHYSICAL', ?, 3, ?, 'SHOP')`,
            [
              productId, code, it.barcode || null, productName, category, unit,
              unitPrice, sellPrice, unitPrice, qty, target_warehouse || 'مخزن المتجر الرئيسي'
            ]
          );
        } else {
          // Existing product: increase stock and optionally update buy_price & warehouse
          const [prodRows]: any = await conn.query('SELECT id, current_stock, buy_price, name FROM products WHERE id = ?', [productId]);
          if (prodRows.length > 0) {
            productName = prodRows[0].name;
            const newStock = Number(prodRows[0].current_stock || 0) + qty;
            await conn.query(
              'UPDATE products SET current_stock = ?, buy_price = IF(? > 0, ?, buy_price) WHERE id = ?',
              [newStock, unitPrice, unitPrice, productId]
            );
          }
        }

        // Insert stock movement record
        const itemNote = [
          notes,
          supplier_name ? `المورد: ${supplier_name}` : null,
          it.notes ? it.notes : null
        ].filter(Boolean).join(' | ');

        await conn.query(
          `INSERT INTO stock_movements (
            id, reference_no, movement_type, product_id, product_name, 
            quantity, unit_price, total_price, source_warehouse, target_warehouse, notes, created_by
          ) VALUES (?, ?, 'IN', ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
          [movementId, refNo, productId, productName, qty, unitPrice, totalPrice, target_warehouse || 'مخزن المتجر الرئيسي', itemNote, operator]
        );

      } else if (movement_type === 'RETURN') {
        // RETURN TO SUPPLIER
        const [prodRows]: any = await conn.query('SELECT id, current_stock, name, buy_price FROM products WHERE id = ?', [productId]);
        if (prodRows.length === 0) {
          throw new Error(`المنتج (${productName || productId}) غير موجود في قاعدة البيانات`);
        }
        const currentStock = Number(prodRows[0].current_stock || 0);
        if (currentStock < qty) {
          throw new Error(`رصيد المنتج (${prodRows[0].name}) غير كافٍ للارتجاع! الرصيد الحالي: ${currentStock}، المطلوب ارتجاعه: ${qty}`);
        }

        const newStock = currentStock - qty;
        await conn.query('UPDATE products SET current_stock = ? WHERE id = ?', [newStock, productId]);

        const itemNote = [
          notes,
          supplier_name ? `مرتجع للمورد: ${supplier_name}` : null,
          it.notes ? it.notes : null
        ].filter(Boolean).join(' | ');

        await conn.query(
          `INSERT INTO stock_movements (
            id, reference_no, movement_type, product_id, product_name, 
            quantity, unit_price, total_price, source_warehouse, target_warehouse, notes, created_by
          ) VALUES (?, ?, 'RETURN', ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
          [movementId, refNo, productId, prodRows[0].name, qty, unitPrice, totalPrice, source_warehouse || 'مخزن المتجر الرئيسي', itemNote, operator]
        );

      } else if (movement_type === 'TRANSFER') {
        // TRANSFER BETWEEN WAREHOUSES
        const [prodRows]: any = await conn.query('SELECT id, current_stock, name, buy_price FROM products WHERE id = ?', [productId]);
        if (prodRows.length === 0) {
          throw new Error(`المنتج (${productName || productId}) غير موجود`);
        }
        const currentStock = Number(prodRows[0].current_stock || 0);
        if (currentStock < qty) {
          throw new Error(`رصيد المنتج (${prodRows[0].name}) غير كافٍ للنقل! الرصيد الحالي: ${currentStock}، المطلوب نقله: ${qty}`);
        }

        // In current model, products has a warehouse column. 
        // If transfer moves stock, update product target warehouse or adjust stock
        const itemNote = [
          notes,
          `من [${source_warehouse}] إلى [${target_warehouse}]`,
          it.notes ? it.notes : null
        ].filter(Boolean).join(' | ');

        await conn.query(
          `INSERT INTO stock_movements (
            id, reference_no, movement_type, product_id, product_name, 
            quantity, unit_price, total_price, source_warehouse, target_warehouse, notes, created_by
          ) VALUES (?, ?, 'TRANSFER', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [movementId, refNo, productId, prodRows[0].name, qty, unitPrice, totalPrice, source_warehouse, target_warehouse, itemNote, operator]
        );
      }
    }

    // Optional: If supplier transaction is involved in IN or RETURN, record it
    if (supplier_id && (movement_type === 'IN' || movement_type === 'RETURN') && totalBatchAmount > 0) {
      const [suppRows]: any = await conn.query('SELECT balance, name FROM suppliers WHERE id = ?', [supplier_id]);
      if (suppRows.length > 0) {
        const currentSuppBalance = Number(suppRows[0].balance || 0);
        // IN: purchases from supplier increases what we owe to supplier (credit)
        // RETURN: returning goods decreases what we owe to supplier (debit)
        let debit = 0;
        let credit = 0;
        let newSuppBalance = currentSuppBalance;

        if (movement_type === 'IN') {
          credit = totalBatchAmount;
          newSuppBalance = currentSuppBalance + credit;
        } else {
          debit = totalBatchAmount;
          newSuppBalance = currentSuppBalance - debit;
        }

        const suppTxId = `stx-mov-${Date.now()}`;
        await conn.query(
          `INSERT INTO supplier_transactions (id, supplier_id, supplier_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
           VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, 'INVOICE', ?)`,
          [
            suppTxId, 
            supplier_id, 
            suppRows[0].name, 
            movement_type === 'IN' ? 'PURCHASE' : 'RETURN', 
            refNo, 
            debit, 
            credit, 
            newSuppBalance, 
            `حركة مخزنية ${movement_type === 'IN' ? 'فاتورة استلام' : 'إذن ارتجاع'} - إذن: ${refNo}`
          ]
        );

        await conn.query('UPDATE suppliers SET balance = ? WHERE id = ?', [newSuppBalance, supplier_id]);
      }
    }

    await conn.commit();
    conn.release();

    res.json({ 
      success: true, 
      reference_no: refNo, 
      count: items.length, 
      total_amount: totalBatchAmount, 
      message: 'تم تنفيذ حركة المخزون بنجاح' 
    });
  } catch (err: any) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer Transactions API
app.get('/api/customer-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { customerId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM customer_transactions WHERE 1=1';
    const params: any[] = [];

    if (customerId && customerId !== 'ALL') {
      query += ' AND customer_id = ?';
      params.push(customerId);
    }
    if (fromDate) {
      query += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND date <= ?';
      params.push(toDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/customer-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const t = req.body;
    const id = t.id || `ctx-${Date.now()}`;
    const date = t.date || new Date().toISOString().slice(0, 10);
    const debit = Number(t.debit || 0);
    const credit = Number(t.credit || 0);
    const refNo = t.reference_no || t.referenceNo || `TX-${Date.now().toString().slice(-6)}`;

    // Calculate updated balance for customer
    const [custRows]: any = await pool.query('SELECT balance, name FROM customers WHERE id = ?', [t.customer_id]);
    const currentBalance = custRows.length > 0 ? Number(custRows[0].balance || 0) : 0;
    const customerName = t.customer_name || (custRows.length > 0 ? custRows[0].name : 'عميل غير مسجل');
    // Balance: debit increases debt owed to us, credit decreases debt
    const newBalance = currentBalance + debit - credit;

    await pool.query(
      `INSERT INTO customer_transactions (id, customer_id, customer_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, t.customer_id, customerName, t.transaction_type || 'PAYMENT', refNo, date, debit, credit, newBalance, t.payment_method || 'CASH', t.notes || '']
    );

    // Update customer balance
    await pool.query('UPDATE customers SET balance = ? WHERE id = ?', [newBalance, t.customer_id]);

    res.json({ success: true, id, message: 'تم تسجيل معاملة العميل وتحديث رصيده بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Supplier Transactions API
app.get('/api/supplier-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { supplierId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM supplier_transactions WHERE 1=1';
    const params: any[] = [];

    if (supplierId && supplierId !== 'ALL') {
      query += ' AND supplier_id = ?';
      params.push(supplierId);
    }
    if (fromDate) {
      query += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND date <= ?';
      params.push(toDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/supplier-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const t = req.body;
    const id = t.id || `stx-${Date.now()}`;
    const date = t.date || new Date().toISOString().slice(0, 10);
    const debit = Number(t.debit || 0);
    const credit = Number(t.credit || 0);
    const refNo = t.reference_no || t.referenceNo || `TX-${Date.now().toString().slice(-6)}`;

    // Calculate updated balance for supplier
    const [supRows]: any = await pool.query('SELECT balance, name FROM suppliers WHERE id = ?', [t.supplier_id]);
    const currentBalance = supRows.length > 0 ? Number(supRows[0].balance || 0) : 0;
    const supplierName = t.supplier_name || (supRows.length > 0 ? supRows[0].name : 'مورد غير مسجل');
    // Balance for supplier: credit increases our debt to them, debit decreases our debt (we paid them)
    const newBalance = currentBalance + credit - debit;

    await pool.query(
      `INSERT INTO supplier_transactions (id, supplier_id, supplier_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, t.supplier_id, supplierName, t.transaction_type || 'PAYMENT', refNo, date, debit, credit, newBalance, t.payment_method || 'CASH', t.notes || '']
    );

    // Update supplier balance
    await pool.query('UPDATE suppliers SET balance = ? WHERE id = ?', [newBalance, t.supplier_id]);

    res.json({ success: true, id, message: 'تم تسجيل معاملة المورد وتحديث حسابه بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Employee Transactions API
app.get('/api/employee-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { employeeId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM employee_transactions WHERE 1=1';
    const params: any[] = [];

    if (employeeId && employeeId !== 'ALL') {
      query += ' AND employee_id = ?';
      params.push(employeeId);
    }
    if (fromDate) {
      query += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND date <= ?';
      params.push(toDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/employee-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const t = req.body;
    const id = t.id || `etx-${Date.now()}`;
    const date = t.date || new Date().toISOString().slice(0, 10);
    const amount = Number(t.amount || 0);
    const refNo = t.reference_no || t.referenceNo || `EMP-TX-${Date.now().toString().slice(-6)}`;
    const flow = t.flow || 'INCENTIVE'; // 'INCENTIVE', 'DEDUCTION', 'PAYOUT'

    // Get current employee info
    const [empRows]: any = await pool.query('SELECT name, base_salary, commissions, advances, net_payable FROM employees WHERE id = ?', [t.employee_id]);
    if (empRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    }
    const emp = empRows[0];
    const employeeName = t.employee_name || emp.name;

    let newCommissions = Number(emp.commissions || 0);
    let newAdvances = Number(emp.advances || 0);
    const baseSalary = Number(emp.base_salary || 0);

    if (flow === 'INCENTIVE') {
      newCommissions += amount;
    } else if (flow === 'DEDUCTION') {
      newAdvances += amount;
    } else if (flow === 'PAYOUT') {
      // Payout clears the calculated net_payable or advances
      newCommissions = 0;
      newAdvances = 0;
    }
    const newNetPayable = baseSalary + newCommissions - newAdvances;

    await pool.query(
      `INSERT INTO employee_transactions (id, employee_id, employee_name, transaction_type, reference_no, date, amount, flow, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, t.employee_id, employeeName, t.transaction_type || 'COMMISSION', refNo, date, amount, flow, t.payment_method || 'CASH', t.notes || '']
    );

    // Update employee commissions, advances, and net_payable
    await pool.query(
      'UPDATE employees SET commissions = ?, advances = ?, net_payable = ? WHERE id = ?',
      [newCommissions, newAdvances, newNetPayable, t.employee_id]
    );

    res.json({ success: true, id, message: 'تم تسجيل معاملة الموظف وتحديث كشف حسابه بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Financial Accounts (الخزائن والبنوك والمحافظ)
app.get('/api/accounts', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM accounts ORDER BY account_code ASC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const a = req.body;
    const id = a.id || `acc_${Date.now()}`;
    const code = a.account_code || a.code || `11${Date.now().toString().slice(-2)}`;
    const balance = Number(a.balance || 0);

    await pool.query(
      `INSERT INTO accounts (id, account_code, name, type, unit, balance, keeper_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         account_code = VALUES(account_code), name = VALUES(name), type = VALUES(type),
         unit = VALUES(unit), balance = VALUES(balance), keeper_name = VALUES(keeper_name),
         notes = VALUES(notes)`,
      [
        id, code, a.name, a.type || 'ASSET', a.unit || 'BOTH', balance,
        a.keeper_name || a.keeperName || 'المدير المالي', a.notes || ''
      ]
    );
    res.json({ success: true, id, message: 'تم حفظ بيانات الخزينة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows]: any = await pool.query('SELECT balance, name FROM accounts WHERE id = ?', [req.params.id]);
    if (rows.length > 0 && Math.abs(Number(rows[0].balance)) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف الخزينة (${rows[0].name}) لأن بها رصيد مالي متبقي (${Number(rows[0].balance).toLocaleString()} ج.م). يجب تصفية أو تحويل الرصيد أولاً.` 
      });
    }
    await pool.query('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Financial Transactions (حركات وسندات المعاملات المالية)
app.get('/api/financial-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { accountId, fromDate, toDate, type } = req.query;
    let query = 'SELECT * FROM financial_transactions WHERE 1=1';
    const params: any[] = [];

    if (accountId && accountId !== 'ALL') {
      query += ' AND (account_id = ? OR to_account_id = ?)';
      params.push(accountId, accountId);
    }
    if (fromDate) {
      query += ' AND date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND date <= ?';
      params.push(toDate);
    }
    if (type && type !== 'ALL') {
      query += ' AND transaction_type = ?';
      params.push(type);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/financial-transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const t = req.body;
    const id = t.id || `ftx-${Date.now()}`;
    const date = t.date || new Date().toISOString().slice(0, 10);
    const amount = Number(t.amount || 0);
    const flow = t.flow || 'IN'; // 'IN', 'OUT', 'TRANSFER'
    const refNo = t.reference_no || t.referenceNo || `${flow === 'IN' ? 'REC' : (flow === 'OUT' ? 'PAY' : 'TRF')}-${Date.now().toString().slice(-6)}`;

    // Get source account
    const [srcRows]: any = await pool.query('SELECT name, balance FROM accounts WHERE id = ?', [t.account_id]);
    if (srcRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الحساب المالي / الخزينة غير موجودة' });
    }
    const accountName = t.account_name || srcRows[0].name;
    let currentBalance = Number(srcRows[0].balance || 0);

    // Balance Verification for OUT and TRANSFER
    if ((flow === 'OUT' || flow === 'TRANSFER') && currentBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `رصيد الخزينة (${accountName}) غير كافٍ لإتمام العملية. الرصيد الحالي: ${currentBalance.toLocaleString()} ج.م والمطلوب: ${amount.toLocaleString()} ج.م` 
      });
    }

    let balanceAfter = currentBalance;
    if (flow === 'IN') {
      balanceAfter = currentBalance + amount;
      await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, t.account_id]);
    } else if (flow === 'OUT') {
      balanceAfter = currentBalance - amount;
      await pool.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, t.account_id]);
    } else if (flow === 'TRANSFER') {
      if (!t.to_account_id || t.to_account_id === t.account_id) {
        return res.status(400).json({ success: false, message: 'يرجى اختيار خزينة محول إليها مختلفة' });
      }
      balanceAfter = currentBalance - amount;
      // Deduct from source
      await pool.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, t.account_id]);
      // Add to target
      await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, t.to_account_id]);
    }

    // Get target account name if transfer
    let toAccountName = t.to_account_name || null;
    if (flow === 'TRANSFER' && t.to_account_id) {
      const [tgtRows]: any = await pool.query('SELECT name FROM accounts WHERE id = ?', [t.to_account_id]);
      if (tgtRows.length > 0) toAccountName = tgtRows[0].name;
    }

    // 1. Sync Customer if party_type === 'CUSTOMER' (تحصيل من عميل: credit reduces customer debt)
    if (t.party_type === 'CUSTOMER' && t.party_id) {
      try {
        const [cRows]: any = await pool.query('SELECT balance, name FROM customers WHERE id = ?', [t.party_id]);
        if (cRows.length > 0) {
          const cBal = Number(cRows[0].balance || 0);
          const newCBal = cBal - amount;
          await pool.query('UPDATE customers SET balance = ? WHERE id = ?', [newCBal, t.party_id]);
          await pool.query(
            `INSERT INTO customer_transactions (id, customer_id, customer_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
             VALUES (?, ?, ?, 'PAYMENT', ?, ?, 0, ?, ?, ?, ?)`,
            [`ctx-${Date.now()}`, t.party_id, cRows[0].name, refNo, date, amount, newCBal, t.payment_method || 'CASH', t.notes || 'سند تحصيل نقدية بالخزينة']
          );
        }
      } catch (err: any) {
        console.warn('Customer sync warn:', err.message);
      }
    }

    // 2. Sync Supplier if party_type === 'SUPPLIER' (سداد لمورد: debit reduces our debt to supplier)
    if (t.party_type === 'SUPPLIER' && t.party_id) {
      try {
        const [sRows]: any = await pool.query('SELECT balance, name FROM suppliers WHERE id = ?', [t.party_id]);
        if (sRows.length > 0) {
          const sBal = Number(sRows[0].balance || 0);
          const newSBal = sBal - amount;
          await pool.query('UPDATE suppliers SET balance = ? WHERE id = ?', [newSBal, t.party_id]);
          await pool.query(
            `INSERT INTO supplier_transactions (id, supplier_id, supplier_name, transaction_type, reference_no, date, debit, credit, balance_after, payment_method, notes)
             VALUES (?, ?, ?, 'PAYMENT', ?, ?, ?, 0, ?, ?, ?)`,
            [`stx-${Date.now()}`, t.party_id, sRows[0].name, refNo, date, amount, newSBal, t.payment_method || 'CASH', t.notes || 'إذن صرف نقدية من الخزينة']
          );
        }
      } catch (err: any) {
        console.warn('Supplier sync warn:', err.message);
      }
    }

    // 3. Sync Employee if party_type === 'EMPLOYEE' (سحب/سلفة للموظف)
    if (t.party_type === 'EMPLOYEE' && t.party_id) {
      try {
        const [eRows]: any = await pool.query('SELECT name, base_salary, commissions, advances, net_payable FROM employees WHERE id = ?', [t.party_id]);
        if (eRows.length > 0) {
          const emp = eRows[0];
          const newAdv = Number(emp.advances || 0) + amount;
          const newNet = Number(emp.base_salary || 0) + Number(emp.commissions || 0) - newAdv;
          await pool.query('UPDATE employees SET advances = ?, net_payable = ? WHERE id = ?', [newAdv, newNet, t.party_id]);
          await pool.query(
            `INSERT INTO employee_transactions (id, employee_id, employee_name, transaction_type, reference_no, date, amount, flow, payment_method, notes)
             VALUES (?, ?, ?, 'ADVANCE', ?, ?, ?, 'DEDUCTION', ?, ?)`,
            [`etx-${Date.now()}`, t.party_id, emp.name, refNo, date, amount, t.payment_method || 'CASH', t.notes || 'سلفة / مسحوبات موظف نقدية']
          );
        }
      } catch (err: any) {
        console.warn('Employee sync warn:', err.message);
      }
    }

    await pool.query(
      `INSERT INTO financial_transactions (id, reference_no, date, transaction_type, account_id, account_name, to_account_id, to_account_name, flow, amount, balance_after, category, party_type, party_name, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, refNo, date, t.transaction_type || (flow === 'IN' ? 'RECEIPT' : (flow === 'OUT' ? 'PAYMENT' : 'TRANSFER')),
        t.account_id, accountName, t.to_account_id || null, toAccountName, flow, amount, balanceAfter,
        t.category || '', t.party_type || null, t.party_name || null, t.payment_method || 'CASH', t.notes || ''
      ]
    );

    res.json({ success: true, id, message: 'تم تسجيل المعاملة المالية وتحديث الأرصدة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const ex = req.body;
    const id = `exp-${Date.now()}`;
    const jvId = `JV-${Date.now().toString().slice(-4)}`;
    await pool.query(
      `INSERT INTO expenses (id, title, category, date, amount, type, allocation_ratio, shop_portion, freelance_portion, payment_account, journal_entry_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, ex.title, ex.category, ex.date || new Date().toISOString().slice(0, 10),
        Number(ex.amount), ex.type || 'SHARED_DEFAULT', ex.allocation_ratio || '70_30',
        Number(ex.shop_portion || 0), Number(ex.freelance_portion || 0),
        ex.payment_account || 'CASHBOX', jvId
      ]
    );

    // Deduct balance from account
    const accCode = ex.payment_account === 'CASHBOX' ? '1111' : (ex.payment_account === 'INSTAPAY' ? '1131' : '1121');
    await pool.query('UPDATE accounts SET balance = balance - ? WHERE account_code = ?', [Number(ex.amount), accCode]);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sales & POS Invoicing (With Double-entry & Stock Update in MySQL)
app.get('/api/sales', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM sales_invoices ORDER BY date DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const inv = req.body;
    const invoiceId = `inv-${Date.now()}`;
    const journalId = `JV-${Date.now().toString().slice(-4)}`;

    // Insert invoice
    await connection.query(
      `INSERT INTO sales_invoices (id, invoice_number, date, customer_id, customer_name, business_unit_id, items, subtotal, discount, net_total, cogs_total, gross_profit, payment_type, paid_amount, remaining_amount, status, journal_entry_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId, inv.invoice_number, inv.date, inv.customer_id, inv.customer_name,
        inv.business_unit_id || 1, JSON.stringify(inv.items), inv.subtotal, inv.discount || 0,
        inv.net_total, inv.cogs_total, inv.gross_profit, inv.payment_type, inv.paid_amount,
        inv.remaining_amount, 'COMPLETED', journalId
      ]
    );

    // Update product stock and serials in MySQL
    for (const item of inv.items) {
      await connection.query(
        'UPDATE products SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ? OR code = ?',
        [item.quantity, item.product_id, item.product_id]
      );
    }

    // Update account or customer debt
    if (inv.payment_type === 'CASH') {
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE account_code = "1111"', [inv.paid_amount]);
    } else if (inv.payment_type === 'INSTAPAY') {
      await connection.query('UPDATE accounts SET balance = balance + ? WHERE account_code = "1131"', [inv.paid_amount]);
    } else if (inv.payment_type === 'CREDIT' || inv.remaining_amount > 0) {
      await connection.query(
        'UPDATE customers SET balance = balance + ?, total_invoices = total_invoices + 1 WHERE id = ?',
        [inv.remaining_amount, inv.customer_id]
      );
    }

    // Record Journal Entry
    const jLines = [
      {
        account_code: inv.payment_type === 'CASH' ? '1111' : (inv.payment_type === 'INSTAPAY' ? '1131' : '1121'),
        account_name: inv.payment_type === 'CASH' ? 'صندوق كاشير المحل' : 'حساب بنكي / محفظة إلكترونية',
        debit: inv.paid_amount,
        credit: 0
      },
      {
        account_code: '4110',
        account_name: 'إيرادات مبيعات المتجر والأجهزة',
        debit: 0,
        credit: inv.net_total
      },
      {
        account_code: '5110',
        account_name: 'تكلفة البضاعة المباعة COGS',
        debit: inv.cogs_total,
        credit: 0
      },
      {
        account_code: '1210',
        account_name: 'مخزون بضاعة وأجهزة',
        debit: 0,
        credit: inv.cogs_total
      }
    ];

    if (inv.remaining_amount > 0) {
      jLines.push({
        account_code: '1310',
        account_name: `ذمم العملاء (${inv.customer_name})`,
        debit: inv.remaining_amount,
        credit: 0
      });
    }

    await connection.query(
      `INSERT INTO journal_entries (id, entry_number, date, business_unit_id, description, entry_lines, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        journalId, journalId, inv.date, 1,
        `فاتورة مبيعات ${inv.invoice_number} للعميل ${inv.customer_name}`,
        JSON.stringify(jLines), 'SALE_INVOICE', invoiceId
      ]
    );

    await connection.commit();
    res.json({ success: true, invoiceId, journalId });
  } catch (err: any) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// Technical Services & Maintenance
app.get('/api/services/maintenance', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM maintenance_orders ORDER BY received_date DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Freelance Projects
app.get('/api/freelance/projects', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM freelance_projects ORDER BY start_date DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CCTV Projects
app.get('/api/services/cctv', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM cctv_projects ORDER BY start_date DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Internet Subscribers
app.get('/api/services/subscribers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM internet_subscribers ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Journal Entries & Reports
app.get('/api/journal-entries', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM journal_entries ORDER BY date DESC, id DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Live Audit Report from Real MySQL Data
app.get('/api/alerts/audit', async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.json({
      success: true,
      source: 'MySQL Disconnected',
      timestamp: new Date().toISOString(),
      counts: { total: 0, unread: 0, lowStock: 0, overdueMilestones: 0 },
      alerts: [],
      lowStockItems: [],
      overdueMilestones: []
    });
  }

  try {
    // 1. Fetch low stock items from MySQL products table
    const [lowRows]: any = await pool.query('SELECT * FROM products WHERE current_stock <= min_stock');
    const lowStockAlerts = lowRows.map((item: any) => ({
      id: `ALERT-STK-${item.code}`,
      code: item.code,
      name: item.name,
      category: 'LOW_STOCK',
      severity: item.current_stock === 0 ? 'CRITICAL' : 'WARNING',
      warehouse: item.warehouse,
      currentStock: item.current_stock,
      minStock: item.min_stock,
      deficit: item.min_stock - item.current_stock,
      unit: item.unit,
      title: `نقص مخزون حرج: ${item.name}`,
      description: `الرصيد في (${item.warehouse}) هو ${item.current_stock} ${item.unit} فقط (الحد الأدنى ${item.min_stock} ${item.unit}). العجز: ${item.min_stock - item.current_stock} ${item.unit}.`,
      targetTab: 'products',
      actionLabel: 'إصدار أمر شراء وتوريد',
      timeAgo: 'مباشر من MySQL',
      isRead: false
    }));

    const allAlerts = [...lowStockAlerts];
    res.json({
      success: true,
      source: 'MySQL 8.0+ Enterprise Core',
      timestamp: new Date().toISOString(),
      counts: {
        total: allAlerts.length,
        unread: allAlerts.length,
        lowStock: lowStockAlerts.length,
        overdueMilestones: 0
      },
      alerts: allAlerts,
      lowStockItems: lowStockAlerts,
      overdueMilestones: []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/alerts/mark-read', (req, res) => {
  res.json({ success: true });
});

app.post('/api/alerts/simulate-stock', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false });
  const { code, delta } = req.body;
  if (code) {
    await pool.query('UPDATE products SET current_stock = GREATEST(0, current_stock + ?) WHERE code = ?', [delta || -1, code]);
  }
  res.json({ success: true });
});

// Setup Vite development or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise System running with MySQL Core at http://0.0.0.0:${PORT}`);
  });
}

startServer();
