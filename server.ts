import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import fs from 'fs';
import { execSync } from 'child_process';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { loadConfigFile, saveConfigFile, getPool, resetPool, SystemConfig } from './db.js';
import { INIT_MYSQL_TABLES_SQL } from './schema_init.js';
import { getLicenseStatus, verifyLicenseOnline, getHardwareId } from './licenseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper: Seed Initial System Data if empty
// SeedInitialData removed - System starts clean without mock data

// -------------------------------------------------------------
// API: System Status & Installation API
// -------------------------------------------------------------

app.get('/api/system/status', async (req, res) => {
  const config = loadConfigFile();
  let isInstalled = Boolean(config.isInstalled);
  let businessConfig: any = null;
  let adminAccount: any = null;

  // Dynamically verify database existence and schema if config flags isInstalled = true
  if (isInstalled && config.dbConfig) {
    let conn;
    try {
      conn = await mysql.createConnection({
        host: config.dbConfig.host || 'localhost',
        port: Number(config.dbConfig.port) || 3306,
        database: config.dbConfig.database,
        user: config.dbConfig.user || 'root',
        password: config.dbConfig.password || '',
        connectTimeout: 2000
      });

      // Verify essential tables exist
      const [tableRows]: any = await conn.query("SHOW TABLES LIKE 'users'");
      if (!tableRows || tableRows.length === 0) {
        console.warn('⚠️ [System Status]: Database exists but users table is missing. Re-routing to Installation Wizard.');
        isInstalled = false;
      } else {
        // Fetch businessConfig directly from database (system_settings)
        try {
          const [settingsRows]: any = await conn.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('business_config', 'company_profile')"
          );
          for (const row of settingsRows) {
            try {
              const val = JSON.parse(row.setting_value);
              if (row.setting_key === 'business_config') {
                businessConfig = val;
              } else if (!businessConfig && row.setting_key === 'company_profile') {
                businessConfig = {
                  companyNameAr: val.company_name || 'دراجون للأنظمة',
                  companyNameEn: val.company_name_en || 'Dragon Systems',
                  currency: val.currency || 'EGP',
                  currencySymbol: val.currency_symbol || 'ج.م',
                  country: 'جمهورية مصر العربية',
                  taxNumber: val.tax_number || '',
                  commercialRecord: val.commercial_record || '',
                  shopUnitName: 'متجر الحواسيب والشبكات',
                  freelanceUnitName: 'تطوير البرمجيات والحلول السحابية',
                  defaultSharedShopRatio: 70,
                  defaultSharedFreelanceRatio: 30
                };
              }
            } catch {}
          }
        } catch (settingsErr: any) {
          console.warn('⚠️ Could not query system_settings:', settingsErr.message);
        }

        // Fetch super admin account directly from database (users)
        try {
          const [userRows]: any = await conn.query(
            "SELECT full_name, username, email, phone, role FROM users WHERE role = 'SUPER_ADMIN' ORDER BY id ASC LIMIT 1"
          );
          if (userRows && userRows.length > 0) {
            adminAccount = {
              fullName: userRows[0].full_name,
              username: userRows[0].username,
              email: userRows[0].email,
              phone: userRows[0].phone,
              role: userRows[0].role
            };
          }
        } catch (userErr: any) {
          console.warn('⚠️ Could not query super admin:', userErr.message);
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [System Status]: Database verification failed (' + err.message + '). Re-routing to Installation Wizard.');
      isInstalled = false;
    } finally {
      if (conn) {
        await conn.end().catch(() => {});
      }
    }
  }

  res.json({
    isInstalled,
    installedAt: isInstalled ? config.installedAt : null,
    businessConfig,
    adminAccount
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
  const targetDb = database && typeof database === 'string' ? database.trim() : '';

  try {
    // 1. Test connecting to MySQL server directly without forcing database to exist yet
    const conn = await mysql.createConnection({
      host: host || 'localhost',
      port: Number(port) || 3306,
      user: username || 'root',
      password: password !== undefined ? password : ''
    });
    await conn.query('SELECT 1');

    // 2. If database name is supplied, ensure it exists or create it automatically
    let createdNew = false;
    let tablesCount = 0;
    if (targetDb) {
      const [dbRows]: any = await conn.query(`SHOW DATABASES LIKE '${targetDb.replace(/'/g, "\\'")}'`);
      if (!dbRows || dbRows.length === 0) {
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        createdNew = true;
      } else {
        const [tables]: any = await conn.query(`SHOW TABLES FROM \`${targetDb}\``);
        tablesCount = Array.isArray(tables) ? tables.length : 0;
      }
    }
    await conn.end();

    // 3. Save to db_config.json only if system is already installed or explicitly requested (not on initial test)
    const config = loadConfigFile();
    if (config.isInstalled || req.body.saveConfig === true) {
      config.dbConfig = {
        host: host || 'localhost',
        port: Number(port) || 3306,
        database: targetDb || 'dragon_erp_production',
        user: username || 'root',
        password: password !== undefined ? password : '',
        charset: 'utf8mb4'
      };
      saveConfigFile(config);
      resetPool();
    }

    const successMessage = targetDb
      ? (createdNew
        ? `تم الاتصال بالخادم بنجاح وإنشاء قاعدة البيانات "${targetDb}" تلقائياً لأنها لم تكن موجودة!`
        : `تم الاتصال بنجاح بقاعدة البيانات "${targetDb}" (${tablesCount === 0 ? 'فارغة وجاهزة للتنصيب' : `تحتوي على ${tablesCount} جدول`})`)
      : 'تم الاتصال بخادم MySQL بنجاح!';

    res.json({ 
      success: true, 
      message: successMessage,
      createdDatabase: createdNew,
      tablesCount 
    });
  } catch (err: any) {
    let friendlyMessage = err.message || 'فشل الاتصال';
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      if (err.message && err.message.includes('using password: NO')) {
        friendlyMessage = 'خادم MySQL يتطلب كلمة مرور (يرجى إدخال كلمة مرور مستخدم root).';
      } else {
        friendlyMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
      }
    } else if (err.code === 'ECONNREFUSED') {
      friendlyMessage = `تعذر الوصول إلى خادم MySQL على (${host || 'localhost'}:${port || 3306}). تأكد من تشغيل خادم MySQL عبر XAMPP أو كخدمة في النظام.`;
    } else if (err.code === 'ENOTFOUND') {
      friendlyMessage = `عنوان الخادم (${host}) غير صحيح أو تعذر الوصول إليه.`;
    }
    res.status(400).json({ success: false, message: 'فشل الاتصال بقاعدة البيانات: ' + friendlyMessage, originalError: err.message });
  }
});

// Get Company Settings
app.get('/api/settings/company', async (req, res) => {
  const pool = getPool();
  const emptyCompany = {
    logo: '',
    company_name: '',
    phones: '',
    address: '',
    invoice_footer: '',
    tax_number: '',
    commercial_record: '',
    vat_rate: 14,
    currency: 'EGP',
    show_network_page: false,
    show_software_features: true
  };

  if (!pool) {
    return res.json({
      success: true,
      data: emptyCompany
    });
  }

  try {
    const [rows]: any = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'company_profile'");
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].setting_value);
      if (parsed.show_software_features === undefined) {
        parsed.show_software_features = true;
      }
      return res.json({ success: true, data: parsed });
    }

    res.json({ success: true, data: emptyCompany });
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
    // Company profile stored directly in MySQL system_settings

    res.json({ success: true, message: 'تم حفظ إعدادات الشركة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// Settings: Print Templates & Layout Customizer
// -------------------------------------------------------------

// Get Print Settings
app.get('/api/settings/print', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    const [rows]: any = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'print_settings'");
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].setting_value);
      return res.json({ success: true, data: parsed });
    }
    // Return empty default to let client load defaults
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save Print Settings
app.post('/api/settings/print', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    const settings = req.body;
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ('print_settings', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [JSON.stringify(settings)]
    );
    res.json({ success: true, message: 'تم حفظ إعدادات وقوالب الطباعة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// Network Management APIs (معاملات الشبكة: دفعات ومصروفات)
// -------------------------------------------------------------

// Ensure network_transactions table exists on first query
async function ensureNetworkTable() {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS network_transactions (
      id VARCHAR(50) PRIMARY KEY,
      type ENUM('INCOME', 'EXPENSE') NOT NULL,
      amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
      treasury_id VARCHAR(50) NOT NULL,
      treasury_name VARCHAR(150) NOT NULL,
      reason TEXT NOT NULL,
      subscriber_name VARCHAR(200) NULL,
      phone VARCHAR(50) NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// 1. Get all network transactions
app.get('/api/network/transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    await ensureNetworkTable();
    const [rows]: any = await pool.query('SELECT * FROM network_transactions ORDER BY date DESC, created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Add network transaction (INCOME or EXPENSE) & synchronize with Treasury
app.post('/api/network/transactions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    await ensureNetworkTable();
    const { type, amount, treasury_id, reason, subscriber_name, phone, date } = req.body;
    
    const numAmount = Number(amount);
    if (!type || isNaN(numAmount) || numAmount <= 0 || !treasury_id || !reason) {
      return res.status(400).json({ success: false, message: 'يرجى استيفاء جميع البيانات المطلوبة بدقة' });
    }

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Get current treasury
      const [accRows]: any = await conn.query('SELECT name, balance FROM accounts WHERE id = ? FOR UPDATE', [treasury_id]);
      if (accRows.length === 0) {
        throw new Error('الخزينة المحددة غير موجودة');
      }
      const treasuryName = accRows[0].name;
      const currentBalance = Number(accRows[0].balance);

      if (type === 'EXPENSE' && currentBalance < numAmount) {
        throw new Error(`رصيد الخزينة (${currentBalance.toFixed(2)} ج.م) غير كافٍ لصرف المبلغ المطلوبة`);
      }

      const newBalance = type === 'INCOME' ? currentBalance + numAmount : currentBalance - numAmount;
      await conn.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, treasury_id]);

      // 2. Insert into network_transactions
      const netId = `NET-${Date.now()}`;
      const txDate = date || new Date().toISOString().slice(0, 10);
      await conn.query(
        `INSERT INTO network_transactions (id, type, amount, treasury_id, treasury_name, reason, subscriber_name, phone, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [netId, type, numAmount, treasury_id, treasuryName, reason, subscriber_name || '', phone || '', txDate]
      );

      // 3. Sync to financial_transactions (حركة الخزينة العامة)
      const ftxId = `FTX-${Date.now()}`;
      const ftxType = type === 'INCOME' ? 'RECEIPT' : 'PAYMENT';
      const ftxFlow = type === 'INCOME' ? 'IN' : 'OUT';
      const ftxCategory = type === 'INCOME' ? 'إيرادات واشتراكات شبكة' : 'مصروفات وصيانة شبكة';
      const party = subscriber_name ? `مشترك: ${subscriber_name}` : 'إدارة الشبكة';

      await conn.query(
        `INSERT INTO financial_transactions (
          id, reference_no, date, transaction_type, account_id, account_name,
          flow, amount, balance_after, category, party_type, party_name,
          payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NETWORK', ?, 'CASH', ?)`,
        [ftxId, `REF-${Date.now().toString().slice(-6)}`, txDate, ftxType, treasury_id, treasuryName, ftxFlow, numAmount, newBalance, ftxCategory, party, reason]
      );

      // If EXPENSE, also log in general expenses table for accounting transparency
      if (type === 'EXPENSE') {
        const expId = `EXP-${Date.now()}`;
        await conn.query(
          `INSERT INTO expenses (id, title, category, date, amount, type, allocation_ratio, shop_portion, freelance_portion, payment_account)
           VALUES (?, ?, 'مصروفات شبكة وإنترنت', ?, ?, 'SHARED_DEFAULT', '100_0', ?, 0.00, ?)`,
          [expId, reason, txDate, numAmount, numAmount, treasuryName]
        );
      }

      await conn.commit();
      conn.release();

      res.json({
        success: true,
        message: type === 'INCOME' ? 'تم استلام وتوريد الدفعة إلى الخزينة بنجاح' : 'تم تسجيل وصرف المصروف من الخزينة بنجاح',
        data: { id: netId, newBalance }
      });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// Specialized Segmented Reports API
// -------------------------------------------------------------

// 1. Network P&L Report (تقرير أرباح وخسائر الشبكة حسب المدة)
app.get('/api/reports/network-pnl', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    await ensureNetworkTable();
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM network_transactions';
    const params: any[] = [];
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    query += ' ORDER BY date DESC, created_at DESC';

    const [rows]: any = await pool.query(query, params);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const r of rows) {
      const amt = Number(r.amount) || 0;
      if (r.type === 'INCOME') totalIncome += amt;
      else totalExpense += amt;
    }
    const netProfit = totalIncome - totalExpense;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0',
        transactions: rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Physical Goods Profit & Sales Report (تقرير مبيعات وأرباح السلع المادية)
app.get('/api/reports/physical-goods', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM sales_invoices WHERE status = 'COMPLETED'";
    const params: any[] = [];
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    query += ' ORDER BY date DESC';

    const [invoices]: any = await pool.query(query, params);

    // Get physical products map
    const [products]: any = await pool.query("SELECT id, name, category, product_type, buy_price, sell_price FROM products WHERE product_type = 'PHYSICAL'");
    const physicalIds = new Set(products.map((p: any) => p.id));
    const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));

    let totalSales = 0;
    let totalCogs = 0;
    const itemsSummary: { [key: string]: { name: string; category: string; quantity: number; salesTotal: number; cogsTotal: number; profit: number } } = {};

    for (const inv of invoices) {
      let invItems: any[] = [];
      try {
        invItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
      } catch (e) {
        invItems = [];
      }

      for (const itm of invItems) {
        const prodId = itm.productId || itm.id;
        // Check if item is physical or not explicitly digital/service
        const prod = productMap.get(prodId);
        const isPhysical = physicalIds.has(prodId) || (!itm.type || itm.type === 'PHYSICAL');

        if (isPhysical) {
          const qty = Number(itm.quantity || itm.qty || 1);
          const price = Number(itm.unitPrice || itm.price || 0);
          const buyPrice = Number(prod ? prod.buy_price : (itm.buyPrice || itm.costPrice || 0));
          const lineTotal = Number(itm.total || (qty * price));
          const lineCogs = qty * buyPrice;
          const lineProfit = lineTotal - lineCogs;

          totalSales += lineTotal;
          totalCogs += lineCogs;

          const key = prodId || itm.name;
          if (!itemsSummary[key]) {
            itemsSummary[key] = {
              name: itm.name || (prod ? prod.name : 'منتج غير معروف'),
              category: prod ? prod.category : 'عام',
              quantity: 0,
              salesTotal: 0,
              cogsTotal: 0,
              profit: 0
            };
          }
          itemsSummary[key].quantity += qty;
          itemsSummary[key].salesTotal += lineTotal;
          itemsSummary[key].cogsTotal += lineCogs;
          itemsSummary[key].profit += lineProfit;
        }
      }
    }

    const netProfit = totalSales - totalCogs;
    res.json({
      success: true,
      data: {
        totalSales,
        totalCogs,
        netProfit,
        margin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0',
        items: Object.values(itemsSummary).sort((a, b) => b.profit - a.profit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Maintenance Profit Report (تقرير أرباح الصيانة والأجهزة)
app.get('/api/reports/maintenance-profit', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM maintenance_orders";
    const params: any[] = [];
    if (startDate && endDate) {
      query += ' WHERE received_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    query += ' ORDER BY received_date DESC';

    const [orders]: any = await pool.query(query, params);

    let totalRevenue = 0;
    let totalPartsCost = 0;
    let totalLabor = 0;

    const ordersDetails = orders.map((ord: any) => {
      const total = Number(ord.total_amount) || 0;
      const labor = Number(ord.labor_cost) || 0;
      let partsCost = 0;

      try {
        const parts = typeof ord.parts_used === 'string' ? JSON.parse(ord.parts_used) : (ord.parts_used || []);
        if (Array.isArray(parts)) {
          partsCost = parts.reduce((acc: number, p: any) => acc + (Number(p.cost || p.buy_price || 0) * Number(p.quantity || 1)), 0);
        }
      } catch (e) {
        partsCost = 0;
      }

      const profit = total - partsCost;
      totalRevenue += total;
      totalPartsCost += partsCost;
      totalLabor += labor;

      return {
        id: ord.id,
        order_number: ord.order_number,
        customer_name: ord.customer_name,
        device_type: ord.device_type,
        brand_model: ord.brand_model,
        status: ord.status,
        date: ord.received_date,
        totalAmount: total,
        partsCost,
        laborCost: labor,
        netProfit: profit
      };
    });

    const netProfit = totalRevenue - totalPartsCost;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalPartsCost,
        totalLabor,
        netProfit,
        margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
        orders: ordersDetails
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Software & Digital Sales Report (تقرير مبيعات وأرباح البرمجيات والحلول الرقمية)
app.get('/api/reports/software-sales', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });
  try {
    const { startDate, endDate } = req.query;

    // A. Digital products from sales invoices
    let invQuery = "SELECT * FROM sales_invoices WHERE status = 'COMPLETED'";
    const invParams: any[] = [];
    if (startDate && endDate) {
      invQuery += ' AND date BETWEEN ? AND ?';
      invParams.push(startDate, endDate);
    }
    const [invoices]: any = await pool.query(invQuery, invParams);

    // Get digital/software products
    const [digitalProducts]: any = await pool.query("SELECT id, name, category, product_type, buy_price, sell_price FROM products WHERE product_type = 'DIGITAL'");
    const digitalIds = new Set(digitalProducts.map((p: any) => p.id));
    const digitalMap = new Map<string, any>(digitalProducts.map((p: any) => [p.id, p]));

    let softwareProductSales = 0;
    let softwareProductCost = 0;
    const softwareItems: any[] = [];

    for (const inv of invoices) {
      let items: any[] = [];
      try {
        items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);
      } catch (e) {
        items = [];
      }

      for (const itm of items) {
        const prodId = itm.productId || itm.id;
        const prod = digitalMap.get(prodId);
        if (digitalIds.has(prodId) || itm.type === 'DIGITAL' || itm.category?.includes('برمج') || itm.name?.includes('برنامج') || itm.name?.includes('سيرفر')) {
          const qty = Number(itm.quantity || itm.qty || 1);
          const price = Number(itm.unitPrice || itm.price || 0);
          const cost = Number(prod ? prod.buy_price : (itm.buyPrice || 0));
          const lineTotal = Number(itm.total || (qty * price));
          const lineCost = qty * cost;
          const lineProfit = lineTotal - lineCost;

          softwareProductSales += lineTotal;
          softwareProductCost += lineCost;

          softwareItems.push({
            date: inv.date,
            invoiceNumber: inv.invoice_number,
            customerName: inv.customer_name,
            productName: itm.name,
            quantity: qty,
            revenue: lineTotal,
            cost: lineCost,
            profit: lineProfit
          });
        }
      }
    }

    // B. Freelance Projects (مشاريع تطوير البرمجيات السحابية)
    let projectQuery = "SELECT * FROM freelance_projects";
    const projParams: any[] = [];
    if (startDate && endDate) {
      projectQuery += ' WHERE start_date BETWEEN ? AND ?';
      projParams.push(startDate, endDate);
    }
    const [projects]: any = await pool.query(projectQuery, projParams);

    let projectsTotalRevenue = 0;
    const projectDetails = projects.map((proj: any) => {
      const amount = Number(proj.contract_amount) || 0;
      projectsTotalRevenue += amount;
      return {
        id: proj.id,
        title: proj.title,
        clientName: proj.client_name,
        country: proj.client_country,
        amount,
        currency: proj.currency,
        status: proj.status,
        date: proj.start_date
      };
    });

    const totalSoftwareRevenue = softwareProductSales + projectsTotalRevenue;
    const totalSoftwareProfit = totalSoftwareRevenue - softwareProductCost;

    res.json({
      success: true,
      data: {
        totalRevenue: totalSoftwareRevenue,
        productSales: softwareProductSales,
        projectsRevenue: projectsTotalRevenue,
        cost: softwareProductCost,
        netProfit: totalSoftwareProfit,
        margin: totalSoftwareRevenue > 0 ? ((totalSoftwareProfit / totalSoftwareRevenue) * 100).toFixed(1) : '100',
        items: softwareItems,
        projects: projectDetails
      }
    });
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

// -------------------------------------------------------------
// System Updates & GitHub Synchronization API
// -------------------------------------------------------------
const GITHUB_REPO = 'Yourii2/DragonStore';

function getCurrentVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.version) {
        return pkg.version.startsWith('v') ? pkg.version : `v${pkg.version}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'v1.0.3';
}

function isVersionNewer(latest: string, current: string): boolean {
  try {
    const cleanLatest = (latest || '').replace(/^v/, '').trim();
    const cleanCurrent = (current || '').replace(/^v/, '').trim();
    const lParts = cleanLatest.split('.').map(n => parseInt(n, 10) || 0);
    const cParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
      const l = lParts[i] || 0;
      const c = cParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  } catch {
    return latest !== current;
  }
}

app.get('/api/system/version', (req, res) => {
  const currentVersion = getCurrentVersion();
  res.json({
    success: true,
    currentVersion,
    repoUrl: `https://github.com/${GITHUB_REPO}.git`
  });
});

app.get('/api/system/check-updates', async (req, res) => {
  const currentVersion = getCurrentVersion();
  try {
    // Check latest release from GitHub public API
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'User-Agent': 'DragonStore-ERP-Updater' }
    });

    if (response.ok) {
      const release: any = await response.json();
      const latestTag = release.tag_name || release.name || currentVersion;
      const hasUpdate = isVersionNewer(latestTag, currentVersion);

      let assetDownloadUrl = '';
      let assetName = '';
      if (Array.isArray(release.assets) && release.assets.length > 0) {
        const compiledZip = release.assets.find((a: any) => a.name.endsWith('.zip') && !a.name.toLowerCase().includes('source'));
        const anyZip = release.assets.find((a: any) => a.name.endsWith('.zip'));
        const chosen = compiledZip || anyZip;
        if (chosen) {
          assetDownloadUrl = chosen.browser_download_url;
          assetName = chosen.name;
        }
      }
      if (!assetDownloadUrl && release.zipball_url) {
        assetDownloadUrl = release.zipball_url;
        assetName = `DragonStore-${latestTag}.zip`;
      }

      return res.json({
        success: true,
        currentVersion,
        latestVersion: latestTag,
        hasUpdate,
        releaseNotes: release.body || 'لا توجد ملاحظات إصدار إضافية',
        publishedAt: release.published_at,
        downloadUrl: release.html_url,
        assetDownloadUrl,
        assetName
      });
    }

    // Fallback: check repository tags
    const tagsRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/tags`, {
      headers: { 'User-Agent': 'DragonStore-ERP-Updater' }
    });

    if (tagsRes.ok) {
      const tags: any = await tagsRes.json();
      if (Array.isArray(tags) && tags.length > 0) {
        const latestTag = tags[0].name;
        const hasUpdate = isVersionNewer(latestTag, currentVersion);
        return res.json({
          success: true,
          currentVersion,
          latestVersion: latestTag,
          hasUpdate,
          releaseNotes: `أحدث وسم مسجل على GitHub: ${latestTag}`,
          publishedAt: new Date().toISOString(),
          assetDownloadUrl: `https://github.com/${GITHUB_REPO}/archive/refs/tags/${latestTag}.zip`,
          assetName: `${latestTag}.zip`
        });
      }
    }

    res.json({
      success: true,
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      releaseNotes: 'أنت تعمل حالياً بأحدث إصدار مستقر من النظام'
    });
  } catch (err: any) {
    res.json({
      success: true,
      currentVersion,
      latestVersion: currentVersion,
      hasUpdate: false,
      message: 'تعذر الاتصال بـ GitHub للتحقق: ' + err.message
    });
  }
});

app.post('/api/system/apply-update', async (req, res) => {
  const currentVersion = getCurrentVersion();
  let tempDir = '';
  try {
    let { downloadUrl, version } = req.body || {};

    // If downloadUrl not supplied, fetch latest release metadata from GitHub
    if (!downloadUrl) {
      const relRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: { 'User-Agent': 'DragonStore-ERP-Updater' }
      });
      if (relRes.ok) {
        const release: any = await relRes.json();
        version = release.tag_name || release.name;
        if (Array.isArray(release.assets)) {
          const compiledZip = release.assets.find((a: any) => a.name.endsWith('.zip') && !a.name.toLowerCase().includes('source'));
          const anyZip = release.assets.find((a: any) => a.name.endsWith('.zip'));
          const chosen = compiledZip || anyZip;
          if (chosen) downloadUrl = chosen.browser_download_url;
        }
        if (!downloadUrl && release.zipball_url) {
          downloadUrl = release.zipball_url;
        }
      }
    }

    if (!downloadUrl) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم العثور على رابط ملف التحديث في مستودع GitHub'
      });
    }

    console.log(`[Auto-Update] Starting update to ${version || 'latest'} from: ${downloadUrl}`);

    // Create unique temp directory
    tempDir = path.join(process.cwd(), `temp_update_${Date.now()}`);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    const tempZip = path.join(tempDir, 'update.zip');
    const extractDir = path.join(tempDir, 'extracted');
    fs.mkdirSync(extractDir, { recursive: true });

    // 1. Download zip file from GitHub release (follows 302 redirects automatically)
    console.log('[Auto-Update] Downloading update zip...');
    const dlResponse = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'DragonStore-ERP-Updater' }
    });
    if (!dlResponse.ok || !dlResponse.body) {
      throw new Error(`فشل تنزيل ملف التحديث من GitHub (رمز الخطأ: ${dlResponse.status})`);
    }

    const fileStream = fs.createWriteStream(tempZip);
    await pipeline(Readable.fromWeb(dlResponse.body as any), fileStream);
    console.log('[Auto-Update] Download completed. Extracting archive...');

    // 2. Extract zip archive (using built-in bsdtar or powershell fallback)
    try {
      execSync(`tar -xf "${tempZip}" -C "${extractDir}"`, { stdio: 'pipe' });
    } catch (tarErr) {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'pipe' });
    }
    console.log('[Auto-Update] Extraction completed.');

    // 3. Locate content root inside extracted folder (unwrap single parent folder if present)
    let sourceRoot = extractDir;
    const extractedEntries = fs.readdirSync(extractDir);
    if (extractedEntries.length === 1) {
      const candidate = path.join(extractDir, extractedEntries[0]);
      if (fs.statSync(candidate).isDirectory()) {
        sourceRoot = candidate;
      }
    }

    // 4. Recursive copy protecting sensitive files
    const PROTECTED_ITEMS = new Set([
      'db_config.json',
      'Dragon.enc',
      '.env',
      '.git',
      'backups'
    ]);

    let filesCopied = 0;
    const copyRecursive = (src: string, dest: string) => {
      const items = fs.readdirSync(src);
      for (const item of items) {
        if (PROTECTED_ITEMS.has(item) || item.endsWith('.enc') || item.startsWith('temp_update')) {
          continue; // strictly preserve database configs, licenses, and environment
        }
        const sPath = path.join(src, item);
        const dPath = path.join(dest, item);
        const stat = fs.statSync(sPath);

        if (stat.isDirectory()) {
          if (!fs.existsSync(dPath)) {
            fs.mkdirSync(dPath, { recursive: true });
          }
          copyRecursive(sPath, dPath);
        } else {
          fs.copyFileSync(sPath, dPath);
          filesCopied++;
        }
      }
    };

    console.log('[Auto-Update] Applying updated files to system...');
    copyRecursive(sourceRoot, process.cwd());
    console.log(`[Auto-Update] Replaced ${filesCopied} files successfully.`);

    // 5. Clean up temp folder
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanErr) {
      // ignore
    }

    const updatedVersion = getCurrentVersion();
    res.json({
      success: true,
      message: `تم تطبيق التحديث وتثبيت الإصدار (${updatedVersion}) بنجاح!`,
      previousVersion: currentVersion,
      newVersion: updatedVersion,
      filesUpdated: filesCopied
    });
  } catch (error: any) {
    console.error('[Auto-Update Error]', error);
    if (tempDir && fs.existsSync(tempDir)) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      error: 'فشل تطبيق التحديث التلقائي: ' + (error.message || error)
    });
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
  const { databaseConfig, businessConfig, companyConfig, defaultsConfig, adminAccount, backupData } = req.body;
  try {
    const dbName = (databaseConfig && databaseConfig.database && databaseConfig.database.trim()) || 'dragon_erp_production';
    const conn = await mysql.createConnection({
      host: databaseConfig?.host || 'localhost',
      port: Number(databaseConfig?.port) || 3306,
      user: databaseConfig?.username || 'root',
      password: databaseConfig?.password !== undefined ? databaseConfig.password : '',
      multipleStatements: true
    });

    // 1. Create DB if not exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);

    // 2. Run DDL Statements
    const statements = INIT_MYSQL_TABLES_SQL.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const sql of statements) {
      await conn.query(sql);
    }

    // 3. If a backup was restored directly
    if (backupData && backupData.data) {
      const data = backupData.data;
      for (const [table, rows] of Object.entries(data)) {
        if (Array.isArray(rows) && rows.length > 0) {
          try {
            await conn.query(`DELETE FROM \`${table}\``);
            for (const row of rows) {
              const keys = Object.keys(row);
              const values = Object.values(row);
              const placeholders = keys.map(() => '?').join(', ');
              const columns = keys.map(k => `\`${k}\``).join(', ');
              await conn.query(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`, values);
            }
          } catch (tableErr: any) {
            console.error(`Error restoring table ${table}:`, tableErr.message);
          }
        }
      }
    } else {
      // 4. Fresh Install Setup

      // A. Insert or update Admin User
      if (adminAccount) {
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
      }

      // B. Save company profile in MySQL
      if (companyConfig) {
        await conn.query(
          `INSERT INTO system_settings (setting_key, setting_value) 
           VALUES ('company_profile', ?) 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [JSON.stringify(companyConfig)]
        );
      }

      // C. Save business settings in MySQL
      if (businessConfig) {
        await conn.query(
          `INSERT INTO system_settings (setting_key, setting_value) 
           VALUES ('business_config', ?) 
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [JSON.stringify(businessConfig)]
        );
      }

      // D. Insert Default Warehouse
      if (defaultsConfig && defaultsConfig.warehouseName) {
        const warehouseId = 'WH-01';
        const warehouseName = defaultsConfig.warehouseName.trim();
        await conn.query(
          `INSERT INTO warehouses (id, code, name, keeper_name, location, type, total_items, total_valuation)
           VALUES (?, 'WH-MAIN', ?, ?, 'المقر الرئيسي', 'MAIN_STORE', 0, 0.00)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [warehouseId, warehouseName, adminAccount?.fullName || 'مسؤول المخزن']
        );
      }

      // E. Insert Default Treasury & Opening Balance
      if (defaultsConfig && defaultsConfig.treasuryName) {
        const treasuryId = 'ACC-CASH-01';
        const treasuryName = defaultsConfig.treasuryName.trim();
        const openingBalance = Number(defaultsConfig.openingBalance) || 0;

        await conn.query(
          `INSERT INTO accounts (id, account_code, name, type, unit, balance, notes)
           VALUES (?, '1111', ?, 'ASSET', 'SHOP', ?, 'الخزينة الافتراضية للنظام')
           ON DUPLICATE KEY UPDATE name = VALUES(name), balance = VALUES(balance)`,
          [treasuryId, treasuryName, openingBalance]
        );

        // If opening balance > 0, log opening transaction
        if (openingBalance > 0) {
          const txId = `FTX-${Date.now()}`;
          const today = new Date().toISOString().slice(0, 10);
          await conn.query(
            `INSERT INTO financial_transactions (
              id, reference_no, date, transaction_type, account_id, account_name,
              flow, amount, balance_after, category, party_type, party_name,
              payment_method, notes
            ) VALUES (?, ?, ?, 'RECEIPT', ?, ?, 'IN', ?, ?, 'رصيد افتتاحي', 'INTERNAL', 'إيداع رصيد افتتاحي عند التثبيت', 'CASH', 'الرصيد الافتتاحي للخزينة عند بدء تشغيل النظام')`,
            [txId, `OPN-${Date.now().toString().slice(-6)}`, today, treasuryId, treasuryName, openingBalance, openingBalance]
          );
        }
      }
    }

    await conn.end();

    // 5. Reset pool and save local config file
    resetPool();
    const systemConfig: SystemConfig = {
      isInstalled: true,
      installedAt: new Date().toISOString(),
      dbConfig: {
        host: databaseConfig?.host || 'localhost',
        port: Number(databaseConfig?.port) || 3306,
        database: dbName,
        user: databaseConfig?.username || 'root',
        password: databaseConfig?.password || '',
        charset: 'utf8mb4'
      }
    };
    saveConfigFile(systemConfig);

    res.json({ success: true, message: 'Installation completed successfully' });
  } catch (error: any) {
    console.error('Installation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Installation failed' });
  }
});

// Helper function to create an automated snapshot backup of MySQL database
async function createAutoBackup(reason: string): Promise<any> {
  const pool = getPool();
  if (!pool) return null;
  const tables = [
    'users', 'warehouses', 'product_categories', 'products', 
    'customers', 'suppliers', 'accounts', 'employees',
    'sales_invoices', 'stock_movements', 'customer_transactions', 'supplier_transactions',
    'employee_transactions', 'financial_transactions', 'audit_logs', 'system_settings',
    'expenses', 'journal_entries', 'maintenance_orders', 'network_projects', 'cctv_projects',
    'internet_subscribers', 'freelance_projects'
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
    reason,
    data: backupData
  };

  try {
    await pool.query(
      `INSERT INTO system_backups (reason, backup_data) VALUES (?, ?)`,
      [reason, JSON.stringify(payload)]
    );
  } catch (dbErr: any) {
    console.error('Failed to write backup to database:', dbErr.message);
  }

  return payload;
}

// -------------------------------------------------------------
// Zero Counters (تصفير العدادات والمعاملات والأرصدة والكميات)
// -------------------------------------------------------------
app.post('/api/system/zero-counters', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });

  try {
    // 1. Take automatic backup before any deletion
    const backup = await createAutoBackup('zero_counters');

    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      // 2. Clear all transaction & movement tables
      const tablesToClear = [
        'sales_invoices',
        'stock_movements',
        'customer_transactions',
        'supplier_transactions',
        'employee_transactions',
        'financial_transactions',
        'expenses',
        'journal_entries',
        'maintenance_orders'
      ];

      for (const table of tablesToClear) {
        try {
          await conn.query(`DELETE FROM \`${table}\``);
        } catch (tblErr: any) {
          console.warn(`Could not clear table ${table}:`, tblErr.message);
        }
      }

      // 3. Reset product quantities to 0 (keep products, categories, prices, codes)
      await conn.query('UPDATE products SET current_stock = 0');

      // 4. Reset warehouse statistics to 0 (keep warehouse names and info)
      await conn.query('UPDATE warehouses SET total_items = 0, total_valuation = 0.00');

      // 5. Reset customers balance & invoice counts to 0 (keep customers info)
      await conn.query('UPDATE customers SET balance = 0.00, total_invoices = 0');

      // 6. Reset suppliers balance & purchase totals to 0 (keep suppliers info)
      await conn.query('UPDATE suppliers SET balance = 0.00, total_purchases = 0.00');

      // 7. Reset employee commissions and advances to 0, reset net_payable to base_salary (keep employees & salaries)
      await conn.query('UPDATE employees SET commissions = 0.00, advances = 0.00, net_payable = base_salary');

      // 8. Reset all treasuries / accounts balances to 0 (keep accounts and codes)
      await conn.query('UPDATE accounts SET balance = 0.00');

      // 9. Log this action in audit_logs
      await conn.query(
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
         VALUES (?, ?, 'المدير العام', 'تصفير العدادات', 'إعدادات النظام', 'all', 'system', ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), 'تم تصفير جميع المعاملات والمبيعات وكميات المخزون والأرصدة مع الاحتفاظ بالبيانات الأساسية وأخذ نسخة احتياطية تلقائية']
      );

      await conn.commit();
      conn.release();

      res.json({
        success: true,
        message: 'تم تصفير جميع العدادات والمعاملات والأرصدة بنجاح، وتم أخذ نسخة احتياطية من البيانات.',
        backup
      });
    } catch (err: any) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (error: any) {
    console.error('Zero counters error:', error);
    res.status(500).json({ success: false, message: 'فشلت عملية تصفير العدادات: ' + error.message });
  }
});

// -------------------------------------------------------------
// Factory Reset (إعادة ضبط المصنع بالكامل)
// -------------------------------------------------------------
app.post('/api/system/reset', async (req, res) => {
  try {
    // 1. Take automatic backup before wiping
    const backup = await createAutoBackup('factory_reset');

    resetPool();
    saveConfigFile({ isInstalled: false });
    
    res.json({ 
      success: true, 
      message: 'تمت إعادة ضبط المصنع بنجاح، وتم حفظ نسخة احتياطية تلقائية للبيانات السابقة.',
      backup 
    });
  } catch (err: any) {
    resetPool();
    saveConfigFile({ isInstalled: false });
    res.json({ success: true, message: 'System reset to uninstalled state' });
  }
});

// -------------------------------------------------------------
// API: License & Activation (نظام التراخيص والتفعيل وحماية النظام)
// -------------------------------------------------------------

// 1. Get current license status & Hardware ID
app.get('/api/license/status', (req, res) => {
  try {
    const status = getLicenseStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'فشل استعلام حالة الترخيص: ' + err.message });
  }
});

// 2. Activate or renew license online via Google Script
app.post('/api/license/activate', async (req, res) => {
  try {
    const { company, phone } = req.body || {};
    const license = await verifyLicenseOnline({ company, phone });
    res.json({
      success: true,
      message: license.status === 'active' ? 'تم التحقق من الترخيص وتفعيله بنجاح من السيرفر السحابي!' : 'تم فحص الترخيص',
      data: license
    });
  } catch (err: any) {
    console.error('Online activation failed:', err.message);
    res.status(500).json({
      success: false,
      message: 'فشل الاتصال بخادم التفعيل السحابي (Google Sheets): ' + (err.message || 'خطأ غير معروف')
    });
  }
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
    if (user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }

    let userPerms = {};
    try {
      if (user.permissions) {
        userPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      }
    } catch (e) {}

    let userFinPerms = {};
    try {
      if (user.financial_permissions) {
        userFinPerms = typeof user.financial_permissions === 'string' ? JSON.parse(user.financial_permissions) : user.financial_permissions;
      }
    } catch (e) {}

    const safeUser = {
      id: `usr_${user.id}`,
      db_id: user.id,
      name: user.full_name,
      username: user.username,
      email: user.email,
      role: user.role,
      roleTitleAr: user.role_title_ar || 'مسؤول النظام',
      avatarColor: user.role === 'SUPER_ADMIN' ? 'bg-cyan-600' : 'bg-emerald-600',
      accessibleUnits: [user.accessible_units || 'BOTH'],
      permissions: userPerms,
      assignedWarehouse: user.assigned_warehouse || 'ALL',
      assignedTreasury: user.assigned_treasury || 'ALL',
      financialPermissions: userFinPerms
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
      'SELECT id, username, email, full_name, role, role_title_ar, accessible_units, permissions, assigned_warehouse, assigned_treasury, financial_permissions, is_active, created_at FROM users ORDER BY id ASC'
    );
    const parsedRows = rows.map((u: any) => {
      let perms = {};
      try {
        if (u.permissions) perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
      } catch (e) {}
      let finPerms = {};
      try {
        if (u.financial_permissions) finPerms = typeof u.financial_permissions === 'string' ? JSON.parse(u.financial_permissions) : u.financial_permissions;
      } catch (e) {}
      return {
        ...u,
        permissions: perms,
        assigned_warehouse: u.assigned_warehouse || 'ALL',
        assigned_treasury: u.assigned_treasury || 'ALL',
        financial_permissions: finPerms
      };
    });
    res.json({ success: true, data: parsedRows });
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
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
         VALUES (?, ?, 'المدير العام', 'تعديل مستخدم', 'إدارة المستخدمين', 'users', ?, ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), String(id), `تعديل بيانات المستخدم: ${full_name} (${cleanUsername})`]
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
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
         VALUES (?, ?, 'المدير العام', 'إضافة مستخدم', 'إدارة المستخدمين', 'users', ?, ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), String(insertRes.insertId), `إضافة مستخدم جديد: ${full_name} نوع: ${roleTitle}`]
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
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
         VALUES (?, ?, 'المدير العام', 'حذف مستخدم', 'إدارة المستخدمين', 'users', ?, ?)`,
        [`log-${Date.now()}`, new Date().toISOString(), String(userId), `حذف المستخدم: ${uRows[0].full_name}`]
      );
    }

    res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update User Permissions, Assigned Warehouse, Assigned Treasury & Financial Operations
app.post('/api/users/:id/permissions', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const userId = req.params.id;
    const { permissions, assigned_warehouse, assigned_treasury, financial_permissions } = req.body;

    const permsStr = permissions ? JSON.stringify(permissions) : null;
    const finPermsStr = financial_permissions ? JSON.stringify(financial_permissions) : null;
    const warehouseVal = assigned_warehouse || 'ALL';
    const treasuryVal = assigned_treasury || 'ALL';

    await pool.query(
      `UPDATE users 
       SET permissions = ?, assigned_warehouse = ?, assigned_treasury = ?, financial_permissions = ? 
       WHERE id = ?`,
      [permsStr, warehouseVal, treasuryVal, finPermsStr, userId]
    );

    // Get user details for audit log
    const [uRows]: any = await pool.query('SELECT full_name, username FROM users WHERE id = ?', [userId]);
    const userName = uRows.length > 0 ? uRows[0].full_name : `مستخدم #${userId}`;

    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
       VALUES (?, ?, 'المدير العام', 'تعديل صلاحيات', 'صلاحيات المستخدمين', 'users', ?, ?)`,
      [`log-${Date.now()}`, new Date().toISOString(), String(userId), `تحديث مصفوفة الصلاحيات وتخصيص الخزينة (${treasuryVal}) والمخزن (${warehouseVal}) للمستخدم: ${userName}`]
    );

    res.json({ success: true, message: 'تم حفظ الصلاحيات والتخصيصات بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Change Current User Password & Profile
app.post('/api/users/change-password', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { username, current_password, new_password, full_name, email } = req.body;
    if (!username || !new_password) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور الجديدة مطلوبان' });
    }

    const [rows]: any = await pool.query('SELECT * FROM users WHERE LOWER(username) = ?', [username.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const user = rows[0];
    if (current_password && user.password_hash !== current_password) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    const updatedName = full_name ? full_name.trim() : user.full_name;
    const updatedEmail = email ? email.trim() : user.email;

    await pool.query(
      'UPDATE users SET password_hash = ?, full_name = ?, email = ? WHERE id = ?',
      [new_password, updatedName, updatedEmail, user.id]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
       VALUES (?, ?, ?, 'تغيير كلمة المرور', 'الملف الشخصي', 'users', ?, ?)`,
      [`log-${Date.now()}`, new Date().toISOString(), user.full_name, String(user.id), `قام المستخدم ${user.username} بتغيير كلمة المرور الخاصة به بنجاح`]
    );

    res.json({ 
      success: true, 
      message: 'تم تغيير كلمة المرور وتحديث البيانات بنجاح',
      user: {
        id: `usr_${user.id}`,
        name: updatedName,
        username: user.username,
        email: updatedEmail,
        role: user.role,
        roleTitleAr: user.role_title_ar || 'مسؤول النظام',
        avatarColor: user.role === 'SUPER_ADMIN' ? 'bg-cyan-600' : 'bg-emerald-600',
        accessibleUnits: [user.accessible_units || 'BOTH']
      }
    });
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
        Number(productType === 'PHYSICAL' ? (p.current_stock ?? p.currentStock ?? 0) : 0),
        Number(productType === 'PHYSICAL' ? (p.min_stock ?? p.minStock ?? 3) : 0),
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
    res.json({ success: true, data: rows, warehouses: rows });
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
    res.json({ success: true, data: rows, categories: rows });
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
    const keeperName = a.keeper_name || a.keeperName || 'المدير المالي';

    // Ensure keeper_name column exists in accounts
    try {
      const [cols]: any = await pool.query("SHOW COLUMNS FROM accounts LIKE 'keeper_name'");
      if (cols.length === 0) {
        await pool.query("ALTER TABLE accounts ADD COLUMN keeper_name VARCHAR(150) NULL DEFAULT 'المدير المالي' AFTER balance");
      }
    } catch (e: any) {
      console.warn('Accounts keeper_name check notice:', e.message);
    }

    try {
      await pool.query(
        `INSERT INTO accounts (id, account_code, name, type, unit, balance, keeper_name, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           account_code = VALUES(account_code), name = VALUES(name), type = VALUES(type),
           unit = VALUES(unit), balance = VALUES(balance), keeper_name = VALUES(keeper_name),
           notes = VALUES(notes)`,
        [
          id, code, a.name, a.type || 'ASSET', a.unit || 'BOTH', balance,
          keeperName, a.notes || ''
        ]
      );
    } catch (insertErr: any) {
      if (insertErr.message && insertErr.message.includes('keeper_name')) {
        await pool.query(
          `INSERT INTO accounts (id, account_code, name, type, unit, balance, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             account_code = VALUES(account_code), name = VALUES(name), type = VALUES(type),
             unit = VALUES(unit), balance = VALUES(balance), notes = VALUES(notes)`,
          [
            id, code, a.name, a.type || 'ASSET', a.unit || 'BOTH', balance,
            a.notes || ''
          ]
        );
      } else {
        throw insertErr;
      }
    }
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

    // 4. Sync Expense to expenses table if transaction_type === 'EXPENSE'
    if (t.transaction_type === 'EXPENSE') {
      try {
        const expId = `exp-${Date.now()}`;
        const jvId = `JV-${Date.now().toString().slice(-4)}`;
        await pool.query(
          `INSERT INTO expenses (id, title, category, date, amount, type, allocation_ratio, shop_portion, freelance_portion, payment_account, journal_entry_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expId,
            t.notes || t.category || 'مصروف عام',
            t.category || 'مصروفات تشغيلية',
            date,
            amount,
            'SHARED_DEFAULT',
            '70_30',
            amount,
            0,
            accountName,
            jvId
          ]
        );
      } catch (err: any) {
        console.warn('Sync expense to expenses table warn:', err.message);
      }
    }

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

// Expense Categories
app.get('/api/expenses/categories', async (req, res) => {
  const defaultCategories = [
    'كهرباء ومياه ومرافق',
    'إيجارات ومقرات',
    'ضيافة وبوفيه ونثريات',
    'صيانة ومعدات وقطع غيار',
    'نقل وشحن وانتقالات',
    'دعاية وتسويق وإعلانات',
    'برمجيات واشتراكات وسيرفرات',
    'أدوات مكتبية ومطبوعات',
    'رسوم وتراخيص ومصروفات حكومية',
    'مصروفات تشغيلية عامة',
    'أخرى / متنوعة'
  ];

  const pool = getPool();
  if (!pool) {
    return res.json({ success: true, categories: defaultCategories });
  }

  try {
    const [rows1]: any = await pool.query(
      `SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL AND category != ''`
    );
    const [rows2]: any = await pool.query(
      `SELECT DISTINCT category FROM financial_transactions WHERE transaction_type = 'EXPENSE' AND category IS NOT NULL AND category != ''`
    );
    const set = new Set<string>(defaultCategories);
    for (const r of rows1) {
      if (r.category && r.category.trim()) set.add(r.category.trim());
    }
    for (const r of rows2) {
      if (r.category && r.category.trim()) set.add(r.category.trim());
    }
    res.json({ success: true, categories: Array.from(set) });
  } catch (err: any) {
    res.json({ success: true, categories: defaultCategories });
  }
});

// =============================================================
// Technical Services & Maintenance (CRUD & Persistence)
// =============================================================

// Initial Seed Data for Services & Freelance when tables are empty
const defaultSeedMaintenance = [
  { id: 'mnt1', order_number: 'SRV-2026-041', customer_name: 'د. خالد توفيق', customer_phone: '01011122233', device_type: 'لابتوب', brand_model: 'HP Omen 16 Gaming', serial_number: 'HP-OMN-8821', problem_description: 'ارتفاع مفاجئ في درجة الحرارة وصوت مروحة عالي مع إيقاف تشغيل تلقائي', status: 'IN_REPAIR', technician_name: 'م/ مصطفى كمال', parts_used: JSON.stringify([{ product_id: 'p4', name: 'معجون حراري Arctic MX-4 وتنظيف شامل', quantity: 1, cost: 250, price: 500 }]), labor_cost: 600, total_amount: 1100, paid_amount: 500, received_date: '2026-09-20' },
  { id: 'mnt2', order_number: 'SRV-2026-042', customer_name: 'أ/ منى عبد العزيز', customer_phone: '01288899900', device_type: 'حاسوب مكتبي PC', brand_model: 'Custom Core i5 12th', serial_number: 'PC-CUS-1092', problem_description: 'الجهاز لا يعمل تماماً (Power Dead)', status: 'WAITING_APPROVAL', technician_name: 'م/ مصطفى كمال', parts_used: JSON.stringify([{ product_id: 'p3', name: 'باور سبلاي Cooler Master 650W Bronze', quantity: 1, cost: 2100, price: 2750 }]), labor_cost: 350, total_amount: 3100, paid_amount: 0, received_date: '2026-09-22' },
  { id: 'mnt3', order_number: 'SRV-2026-040', customer_name: 'مكتب الأندلس للعقارات', customer_phone: '01122334455', device_type: 'لابتوب', brand_model: 'Dell Vostro 3510', serial_number: 'DL-VST-9941', problem_description: 'تغيير شاشة مكسورة وترقية رامات وهارد SSD', status: 'READY', technician_name: 'م/ مصطفى كمال', parts_used: JSON.stringify([{ product_id: 'p4', name: 'هارد SSD Samsung 1TB', quantity: 1, cost: 3200, price: 4100 }]), labor_cost: 700, total_amount: 4800, paid_amount: 4800, received_date: '2026-09-18', delivery_date: '2026-09-22' }
];

const defaultSeedCctv = [
  { id: 'cctv1', project_name: 'توريد وتركيب منظومة مراقبة مصنع الأمل للألومنيوم', customer_name: 'شركة الأمل الصناعية', customer_phone: '01000112233', location: 'المنطقة الصناعية - العاشر من رمضان', cameras_count: 16, dvr_type: 'NVR 16-Channel 4K', contract_value: 68000, total_amount: 68000, hardware_cost: 41000, labor_cost: 8500, other_expenses: 2500, total_cost: 52000, net_profit: 16000, paid_amount: 50000, status: 'IN_PROGRESS', start_date: '2026-09-10' },
  { id: 'cctv2', project_name: 'تركيب 8 كاميرات بدقة 5MP وفيلا سكنية', customer_name: 'أ/ كريم الشناوي', customer_phone: '01155544433', location: 'التجمع الخامس - حي النرجس', cameras_count: 8, dvr_type: 'DVR 8-Channel 5MP', contract_value: 28500, total_amount: 28500, hardware_cost: 16800, labor_cost: 3500, other_expenses: 800, total_cost: 21100, net_profit: 7400, paid_amount: 28500, status: 'COMPLETED', start_date: '2026-09-01', end_date: '2026-09-05' }
];

const defaultSeedNetworks = [
  { id: 'net1', project_name: 'تأسيس شبكة راك و 24 نقطة بيانات لمكتب محاماة واستشارات', customer_name: 'شركة الأفق للاستشارات الهندسية', client_name: 'شركة الأفق للاستشارات الهندسية', location: 'مصر الجديدة - ميدان الحجاز', scope_description: 'توريد وتركيب راك 9U وسويتش 24 بورت جيجابت وتمديد كابلات Cat6 مع شهادات اختبار', contract_value: 45000, total_value: 45000, hardware_cost: 24500, labor_cost: 6000, other_expenses: 1500, installation_fees: 7500, total_cost: 32000, net_profit: 13000, paid_amount: 35000, status: 'IN_PROGRESS', start_date: '2026-09-12' }
];

const defaultSeedSubscribers = [
  { id: 'sub1', subscriber_name: 'أ/ محمد إبراهيم البنا', phone: '01011223344', ip_address: '192.168.10.25', mac_address: 'E4:8D:8C:21:44:A1', router_mac: 'E4:8D:8C:21:44:A1', package_name: 'باقة سوبر 30 ميجا غير محدودة', monthly_fee: 350, line_cost: 190, profit: 160, due_day_of_month: 1, due_day: 1, last_payment_date: '2026-09-01', status: 'ACTIVE' },
  { id: 'sub2', subscriber_name: 'محل عصير النخيل', phone: '01122446688', ip_address: '192.168.10.42', mac_address: '00:1A:2B:3C:4D:5E', router_mac: '00:1A:2B:3C:4D:5E', package_name: 'باقة الترا 50 ميجا تجارية', monthly_fee: 550, line_cost: 290, profit: 260, due_day_of_month: 5, due_day: 5, last_payment_date: '2026-09-05', status: 'ACTIVE' },
  { id: 'sub3', subscriber_name: 'أ/ حسن الصياد', phone: '01299887711', ip_address: '192.168.10.78', mac_address: 'A0:B1:C2:D3:E4:F5', router_mac: 'A0:B1:C2:D3:E4:F5', package_name: 'باقة سوبر 30 ميجا غير محدودة', monthly_fee: 350, line_cost: 190, profit: 160, due_day_of_month: 10, due_day: 10, last_payment_date: '2026-08-10', status: 'OVERDUE' }
];

const defaultSeedFreelance = [
  { 
    id: 'flp1', 
    project_name: 'تطوير منصة إدارة العقارات والتأجير السكني (SaaS)', 
    title: 'تطوير منصة إدارة العقارات والتأجير السكني (SaaS)',
    client_id: 'c3', 
    client_name: 'م/ طارق عبد الرحمن - الرياض', 
    client_country: 'السعودية',
    contract_value: 65000, 
    contract_amount: 65000,
    paid_amount: 40000, 
    remaining_amount: 25000, 
    direct_expenses: 5400, 
    net_profit: 59600, 
    currency: 'EGP',
    status: 'IN_PROGRESS', 
    start_date: '2026-08-15', 
    expected_end_date: '2026-10-30',
    milestones: JSON.stringify([
      { name: 'الدفعة المقدمة وتصميم المعمارية وقواعد البيانات', amount: 20000, is_paid: true, due_date: '2026-08-15' },
      { name: 'إنجاز لوحة الإدارة وواجهات برمجة REST API', amount: 20000, is_paid: true, due_date: '2026-09-15' },
      { name: 'تكامل بوابات الدفع والتطبيق والاختبار النهائي', amount: 25000, is_paid: false, due_date: '2026-10-30' }
    ])
  },
  { 
    id: 'flp2', 
    project_name: 'نظام أتمتة مستودعات لشركة أدوات طبية', 
    title: 'نظام أتمتة مستودعات لشركة أدوات طبية',
    client_id: 'c1', 
    client_name: 'شركة الأفق للاستشارات الهندسية', 
    client_country: 'مصر',
    contract_value: 48000, 
    contract_amount: 48000,
    paid_amount: 48000, 
    remaining_amount: 0, 
    direct_expenses: 2800, 
    net_profit: 45200, 
    currency: 'EGP',
    status: 'COMPLETED', 
    start_date: '2026-07-01', 
    expected_end_date: '2026-08-25',
    milestones: JSON.stringify([
      { name: 'مقدم العقد', amount: 24000, is_paid: true, due_date: '2026-07-01' },
      { name: 'التسليم النهائي والتدريب', amount: 24000, is_paid: true, due_date: '2026-08-25' }
    ])
  }
];

// 1. Maintenance Orders
app.get('/api/services/maintenance', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [cnt]: any = await pool.query('SELECT COUNT(*) as cnt FROM maintenance_orders');
    if (cnt[0]?.cnt === 0) {
      for (const m of defaultSeedMaintenance) {
        await pool.query(
          `INSERT INTO maintenance_orders (id, order_number, customer_name, customer_phone, device_type, brand_model, serial_number, problem_description, status, technician_name, parts_used, labor_cost, total_amount, paid_amount, received_date, delivery_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.id, m.order_number, m.customer_name, m.customer_phone, m.device_type, m.brand_model, m.serial_number, m.problem_description, m.status, m.technician_name, m.parts_used, m.labor_cost, m.total_amount, m.paid_amount, m.received_date, (m as any).delivery_date || null]
        );
      }
    }
    const [rows]: any = await pool.query('SELECT * FROM maintenance_orders ORDER BY received_date DESC, id DESC');
    const parsed = rows.map((r: any) => ({
      ...r,
      parts_used: typeof r.parts_used === 'string' ? JSON.parse(r.parts_used) : (r.parts_used || []),
      labor_cost: Number(r.labor_cost) || 0,
      total_amount: Number(r.total_amount) || 0,
      paid_amount: Number(r.paid_amount) || 0
    }));
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/services/maintenance', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const {
      id,
      order_number,
      customer_name,
      customer_phone,
      device_type,
      brand_model,
      serial_number,
      problem_description,
      status,
      technician_name,
      parts_used,
      labor_cost,
      total_amount,
      paid_amount,
      received_date,
      delivery_date
    } = req.body;

    const finalId = id || `mnt_${Date.now()}`;
    const finalOrderNumber = order_number || `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const finalReceivedDate = received_date || new Date().toISOString().slice(0, 10);
    const finalStatus = status || 'RECEIVED';
    const partsJson = typeof parts_used === 'string' ? parts_used : JSON.stringify(parts_used || []);

    await pool.query(
      `INSERT INTO maintenance_orders (id, order_number, customer_name, customer_phone, device_type, brand_model, serial_number, problem_description, status, technician_name, parts_used, labor_cost, total_amount, paid_amount, received_date, delivery_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         order_number = VALUES(order_number),
         customer_name = VALUES(customer_name),
         customer_phone = VALUES(customer_phone),
         device_type = VALUES(device_type),
         brand_model = VALUES(brand_model),
         serial_number = VALUES(serial_number),
         problem_description = VALUES(problem_description),
         status = VALUES(status),
         technician_name = VALUES(technician_name),
         parts_used = VALUES(parts_used),
         labor_cost = VALUES(labor_cost),
         total_amount = VALUES(total_amount),
         paid_amount = VALUES(paid_amount),
         received_date = VALUES(received_date),
         delivery_date = VALUES(delivery_date)`,
      [
        finalId,
        finalOrderNumber,
        customer_name || 'عميل نقدي',
        customer_phone || '',
        device_type || 'حاسوب',
        brand_model || '',
        serial_number || '',
        problem_description || 'صيانة عامة',
        finalStatus,
        technician_name || 'م/ مصطفى كمال',
        partsJson,
        Number(labor_cost) || 0,
        Number(total_amount) || 0,
        Number(paid_amount) || 0,
        finalReceivedDate,
        delivery_date || null
      ]
    );

    res.json({ success: true, message: 'تم حفظ أمر الصيانة بنجاح', id: finalId, order_number: finalOrderNumber });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/services/maintenance/:id/status', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { id } = req.params;
    const { status, delivery_date } = req.body;
    const finalDeliveryDate = status === 'DELIVERED' ? (delivery_date || new Date().toISOString().slice(0, 10)) : null;

    await pool.query(
      `UPDATE maintenance_orders SET status = ?, delivery_date = COALESCE(?, delivery_date) WHERE id = ?`,
      [status, finalDeliveryDate, id]
    );
    res.json({ success: true, message: 'تم تحديث حالة الصيانة بنجاح', status, delivery_date: finalDeliveryDate });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/services/maintenance/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM maintenance_orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف أمر الصيانة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. CCTV Projects
app.get('/api/services/cctv', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [cnt]: any = await pool.query('SELECT COUNT(*) as cnt FROM cctv_projects');
    if (cnt[0]?.cnt === 0) {
      for (const c of defaultSeedCctv) {
        await pool.query(
          `INSERT INTO cctv_projects (id, project_name, customer_name, customer_phone, location, cameras_count, dvr_type, contract_value, total_amount, hardware_cost, labor_cost, other_expenses, total_cost, net_profit, paid_amount, status, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.project_name, c.customer_name, c.customer_phone, c.location, c.cameras_count, c.dvr_type, c.contract_value, c.total_amount, c.hardware_cost, c.labor_cost, c.other_expenses, c.total_cost, c.net_profit, c.paid_amount, c.status, c.start_date, (c as any).end_date || null]
        );
      }
    }
    const [rows]: any = await pool.query('SELECT * FROM cctv_projects ORDER BY start_date DESC, id DESC');
    const mapped = rows.map((r: any) => ({
      ...r,
      contract_value: Number(r.contract_value || r.total_amount) || 0,
      hardware_cost: Number(r.hardware_cost) || 0,
      labor_cost: Number(r.labor_cost) || 0,
      other_expenses: Number(r.other_expenses) || 0,
      total_cost: Number(r.total_cost) || (Number(r.hardware_cost || 0) + Number(r.labor_cost || 0) + Number(r.other_expenses || 0)),
      net_profit: Number(r.net_profit) || ((Number(r.contract_value || r.total_amount || 0)) - (Number(r.hardware_cost || 0) + Number(r.labor_cost || 0) + Number(r.other_expenses || 0))),
      paid_amount: Number(r.paid_amount) || 0
    }));
    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/services/cctv', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const {
      id,
      project_name,
      customer_name,
      customer_phone,
      location,
      cameras_count,
      dvr_type,
      contract_value,
      hardware_cost,
      labor_cost,
      other_expenses,
      paid_amount,
      status,
      start_date,
      end_date
    } = req.body;

    const finalId = id || `cctv_${Date.now()}`;
    const cVal = Number(contract_value) || 0;
    const hCost = Number(hardware_cost) || 0;
    const lCost = Number(labor_cost) || 0;
    const oCost = Number(other_expenses) || 0;
    const totalCost = hCost + lCost + oCost;
    const netProfit = cVal - totalCost;

    await pool.query(
      `INSERT INTO cctv_projects (id, project_name, customer_name, customer_phone, location, cameras_count, dvr_type, contract_value, total_amount, hardware_cost, labor_cost, other_expenses, total_cost, net_profit, paid_amount, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         project_name = VALUES(project_name),
         customer_name = VALUES(customer_name),
         customer_phone = VALUES(customer_phone),
         location = VALUES(location),
         cameras_count = VALUES(cameras_count),
         dvr_type = VALUES(dvr_type),
         contract_value = VALUES(contract_value),
         total_amount = VALUES(total_amount),
         hardware_cost = VALUES(hardware_cost),
         labor_cost = VALUES(labor_cost),
         other_expenses = VALUES(other_expenses),
         total_cost = VALUES(total_cost),
         net_profit = VALUES(net_profit),
         paid_amount = VALUES(paid_amount),
         status = VALUES(status),
         start_date = VALUES(start_date),
         end_date = VALUES(end_date)`,
      [
        finalId,
        project_name || 'مشروع كاميرات مراقبة جديد',
        customer_name || 'عميل',
        customer_phone || '',
        location || '',
        Number(cameras_count) || 4,
        dvr_type || 'DVR 8-CH',
        cVal,
        cVal,
        hCost,
        lCost,
        oCost,
        totalCost,
        netProfit,
        Number(paid_amount) || 0,
        status || 'PLANNING',
        start_date || new Date().toISOString().slice(0, 10),
        end_date || null
      ]
    );

    res.json({ success: true, message: 'تم حفظ مشروع كاميرات المراقبة بنجاح', id: finalId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/services/cctv/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM cctv_projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف مشروع الكاميرات بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Network Projects
app.get('/api/services/networks', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [cnt]: any = await pool.query('SELECT COUNT(*) as cnt FROM network_projects');
    if (cnt[0]?.cnt === 0) {
      for (const n of defaultSeedNetworks) {
        await pool.query(
          `INSERT INTO network_projects (id, project_name, customer_name, client_name, location, scope_description, hardware_cost, labor_cost, other_expenses, installation_fees, contract_value, total_value, total_cost, net_profit, paid_amount, status, start_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [n.id, n.project_name, n.customer_name, n.client_name, n.location, n.scope_description, n.hardware_cost, n.labor_cost, n.other_expenses, n.installation_fees, n.contract_value, n.total_value, n.total_cost, n.net_profit, n.paid_amount, n.status, n.start_date]
        );
      }
    }
    const [rows]: any = await pool.query('SELECT * FROM network_projects ORDER BY start_date DESC, id DESC');
    const mapped = rows.map((r: any) => ({
      ...r,
      customer_name: r.customer_name || r.client_name || '',
      contract_value: Number(r.contract_value || r.total_value) || 0,
      hardware_cost: Number(r.hardware_cost) || 0,
      labor_cost: Number(r.labor_cost) || 0,
      other_expenses: Number(r.other_expenses) || 0,
      total_cost: Number(r.total_cost) || (Number(r.hardware_cost || 0) + Number(r.labor_cost || 0) + Number(r.other_expenses || 0)),
      net_profit: Number(r.net_profit) || ((Number(r.contract_value || r.total_value || 0)) - (Number(r.hardware_cost || 0) + Number(r.labor_cost || 0) + Number(r.other_expenses || 0))),
      paid_amount: Number(r.paid_amount) || 0
    }));
    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/services/networks', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const {
      id,
      project_name,
      customer_name,
      location,
      scope_description,
      contract_value,
      hardware_cost,
      labor_cost,
      other_expenses,
      paid_amount,
      status,
      start_date
    } = req.body;

    const finalId = id || `net_${Date.now()}`;
    const cVal = Number(contract_value) || 0;
    const hCost = Number(hardware_cost) || 0;
    const lCost = Number(labor_cost) || 0;
    const oCost = Number(other_expenses) || 0;
    const totalCost = hCost + lCost + oCost;
    const netProfit = cVal - totalCost;

    await pool.query(
      `INSERT INTO network_projects (id, project_name, customer_name, client_name, location, scope_description, hardware_cost, labor_cost, other_expenses, installation_fees, contract_value, total_value, total_cost, net_profit, paid_amount, status, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         project_name = VALUES(project_name),
         customer_name = VALUES(customer_name),
         client_name = VALUES(client_name),
         location = VALUES(location),
         scope_description = VALUES(scope_description),
         hardware_cost = VALUES(hardware_cost),
         labor_cost = VALUES(labor_cost),
         other_expenses = VALUES(other_expenses),
         installation_fees = VALUES(installation_fees),
         contract_value = VALUES(contract_value),
         total_value = VALUES(total_value),
         total_cost = VALUES(total_cost),
         net_profit = VALUES(net_profit),
         paid_amount = VALUES(paid_amount),
         status = VALUES(status),
         start_date = VALUES(start_date)`,
      [
        finalId,
        project_name || 'مشروع شبكة جديد',
        customer_name || 'عميل',
        customer_name || 'عميل',
        location || '',
        scope_description || '',
        hCost,
        lCost,
        oCost,
        lCost,
        cVal,
        cVal,
        totalCost,
        netProfit,
        Number(paid_amount) || 0,
        status || 'IN_PROGRESS',
        start_date || new Date().toISOString().slice(0, 10)
      ]
    );

    res.json({ success: true, message: 'تم حفظ مشروع الشبكة بنجاح', id: finalId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/services/networks/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM network_projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف مشروع الشبكة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Internet Subscribers
app.get('/api/services/subscribers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [cnt]: any = await pool.query('SELECT COUNT(*) as cnt FROM internet_subscribers');
    if (cnt[0]?.cnt === 0) {
      for (const s of defaultSeedSubscribers) {
        await pool.query(
          `INSERT INTO internet_subscribers (id, subscriber_name, phone, ip_address, mac_address, router_mac, package_name, monthly_fee, line_cost, profit, due_day_of_month, due_day, last_payment_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.subscriber_name, s.phone, s.ip_address, s.mac_address, s.router_mac, s.package_name, s.monthly_fee, s.line_cost, s.profit, s.due_day_of_month, s.due_day, s.last_payment_date, s.status]
        );
      }
    }
    const [rows]: any = await pool.query('SELECT * FROM internet_subscribers ORDER BY id DESC');
    const mapped = rows.map((r: any) => ({
      ...r,
      mac_address: r.mac_address || r.router_mac || '',
      due_day_of_month: Number(r.due_day_of_month || r.due_day) || 1,
      monthly_fee: Number(r.monthly_fee) || 0,
      line_cost: Number(r.line_cost) || 0,
      profit: Number(r.profit) || ((Number(r.monthly_fee) || 0) - (Number(r.line_cost) || 0))
    }));
    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/services/subscribers', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const {
      id,
      subscriber_name,
      phone,
      ip_address,
      mac_address,
      package_name,
      monthly_fee,
      line_cost,
      due_day_of_month,
      last_payment_date,
      status
    } = req.body;

    const finalId = id || `sub_${Date.now()}`;
    const mFee = Number(monthly_fee) || 0;
    const lCost = Number(line_cost) || 0;
    const profit = mFee - lCost;
    const dueDay = Number(due_day_of_month) || 1;

    await pool.query(
      `INSERT INTO internet_subscribers (id, subscriber_name, phone, ip_address, mac_address, router_mac, package_name, monthly_fee, line_cost, profit, due_day_of_month, due_day, last_payment_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         subscriber_name = VALUES(subscriber_name),
         phone = VALUES(phone),
         ip_address = VALUES(ip_address),
         mac_address = VALUES(mac_address),
         router_mac = VALUES(router_mac),
         package_name = VALUES(package_name),
         monthly_fee = VALUES(monthly_fee),
         line_cost = VALUES(line_cost),
         profit = VALUES(profit),
         due_day_of_month = VALUES(due_day_of_month),
         due_day = VALUES(due_day),
         last_payment_date = VALUES(last_payment_date),
         status = VALUES(status)`,
      [
        finalId,
        subscriber_name || 'مشترك جديد',
        phone || '',
        ip_address || '',
        mac_address || '',
        mac_address || '',
        package_name || 'باقة منزلية',
        mFee,
        lCost,
        profit,
        dueDay,
        dueDay,
        last_payment_date || new Date().toISOString().slice(0, 10),
        status || 'ACTIVE'
      ]
    );

    res.json({ success: true, message: 'تم حفظ المشترك بنجاح', id: finalId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/services/subscribers/:id/toggle-payment', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT status, last_payment_date FROM internet_subscribers WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Subscriber not found' });

    const currentStatus = rows[0].status;
    const nextStatus = currentStatus === 'ACTIVE' ? 'OVERDUE' : 'ACTIVE';
    const nextDate = nextStatus === 'ACTIVE' ? new Date().toISOString().slice(0, 10) : rows[0].last_payment_date;

    await pool.query('UPDATE internet_subscribers SET status = ?, last_payment_date = ? WHERE id = ?', [nextStatus, nextDate, id]);
    res.json({ success: true, status: nextStatus, last_payment_date: nextDate });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/services/subscribers/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM internet_subscribers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف المشترك بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================================
// Freelance Software Development Projects (CRUD & Persistence)
// =============================================================
app.get('/api/freelance/projects', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const [cnt]: any = await pool.query('SELECT COUNT(*) as cnt FROM freelance_projects');
    if (cnt[0]?.cnt === 0) {
      for (const f of defaultSeedFreelance) {
        await pool.query(
          `INSERT INTO freelance_projects (id, project_name, title, client_id, client_name, client_country, contract_value, contract_amount, paid_amount, remaining_amount, direct_expenses, net_profit, currency, status, start_date, expected_end_date, milestones)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [f.id, f.project_name, f.title, f.client_id, f.client_name, f.client_country, f.contract_value, f.contract_amount, f.paid_amount, f.remaining_amount, f.direct_expenses, f.net_profit, f.currency, f.status, f.start_date, (f as any).expected_end_date || null, f.milestones]
        );
      }
    }
    const [rows]: any = await pool.query('SELECT * FROM freelance_projects ORDER BY start_date DESC, id DESC');
    const parsed = rows.map((r: any) => {
      const milestones = typeof r.milestones === 'string' ? JSON.parse(r.milestones) : (r.milestones || []);
      const cVal = Number(r.contract_value || r.contract_amount) || 0;
      const pAmt = Number(r.paid_amount) || 0;
      const rAmt = Number(r.remaining_amount !== undefined ? r.remaining_amount : (cVal - pAmt)) || 0;
      const dExp = Number(r.direct_expenses) || 0;
      const nProf = Number(r.net_profit !== undefined ? r.net_profit : (cVal - dExp)) || 0;

      return {
        ...r,
        project_name: r.project_name || r.title || 'مشروع برمجي',
        client_name: r.client_name || '',
        contract_value: cVal,
        paid_amount: pAmt,
        remaining_amount: rAmt,
        direct_expenses: dExp,
        net_profit: nProf,
        milestones
      };
    });
    res.json({ success: true, data: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/freelance/projects', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const {
      id,
      project_name,
      client_id,
      client_name,
      contract_value,
      direct_expenses,
      status,
      start_date,
      expected_end_date,
      milestones
    } = req.body;

    const finalId = id || `flp_${Date.now()}`;
    const mList = Array.isArray(milestones) ? milestones : (typeof milestones === 'string' ? JSON.parse(milestones) : []);
    const cVal = Number(contract_value) || 0;
    const paidAmount = mList.filter((m: any) => m.is_paid).reduce((s: number, m: any) => s + Number(m.amount || 0), 0);
    const remAmount = Math.max(0, cVal - paidAmount);
    const dExp = Number(direct_expenses) || 0;
    const netProf = cVal - dExp;
    const mJson = JSON.stringify(mList);

    await pool.query(
      `INSERT INTO freelance_projects (id, project_name, title, client_id, client_name, client_country, contract_value, contract_amount, paid_amount, remaining_amount, direct_expenses, net_profit, currency, status, start_date, expected_end_date, milestones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         project_name = VALUES(project_name),
         title = VALUES(title),
         client_id = VALUES(client_id),
         client_name = VALUES(client_name),
         contract_value = VALUES(contract_value),
         contract_amount = VALUES(contract_amount),
         paid_amount = VALUES(paid_amount),
         remaining_amount = VALUES(remaining_amount),
         direct_expenses = VALUES(direct_expenses),
         net_profit = VALUES(net_profit),
         status = VALUES(status),
         start_date = VALUES(start_date),
         expected_end_date = VALUES(expected_end_date),
         milestones = VALUES(milestones)`,
      [
        finalId,
        project_name || 'مشروع برمجي جديد',
        project_name || 'مشروع برمجي جديد',
        client_id || 'c_direct',
        client_name || 'عميل',
        'مصر',
        cVal,
        cVal,
        paidAmount,
        remAmount,
        dExp,
        netProf,
        'EGP',
        status || 'IN_PROGRESS',
        start_date || new Date().toISOString().slice(0, 10),
        expected_end_date || new Date().toISOString().slice(0, 10),
        mJson
      ]
    );

    res.json({ success: true, message: 'تم حفظ المشروع البرمجي بنجاح', id: finalId });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/freelance/projects/:id/milestones/:index/toggle', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { id, index } = req.params;
    const idx = parseInt(index, 10);
    const [rows]: any = await pool.query('SELECT * FROM freelance_projects WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

    const proj = rows[0];
    const milestones = typeof proj.milestones === 'string' ? JSON.parse(proj.milestones) : (proj.milestones || []);
    if (!milestones[idx]) return res.status(400).json({ success: false, message: 'Invalid milestone index' });

    milestones[idx].is_paid = !milestones[idx].is_paid;
    const contractVal = Number(proj.contract_value || proj.contract_amount) || 0;
    const newPaid = milestones.filter((m: any) => m.is_paid).reduce((s: number, m: any) => s + Number(m.amount || 0), 0);
    const newRemaining = Math.max(0, contractVal - newPaid);

    await pool.query(
      `UPDATE freelance_projects SET milestones = ?, paid_amount = ?, remaining_amount = ? WHERE id = ?`,
      [JSON.stringify(milestones), newPaid, newRemaining, id]
    );

    res.json({ success: true, milestones, paid_amount: newPaid, remaining_amount: newRemaining });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/freelance/projects/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    await pool.query('DELETE FROM freelance_projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'تم حذف المشروع البرمجي بنجاح' });
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
    // 1. Fetch low stock items from MySQL products table (EXCLUDING non-physical items like SERVICE and DIGITAL)
    const [lowRows]: any = await pool.query(
      "SELECT * FROM products WHERE (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock <= min_stock"
    );
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
  if (!pool) return res.json({ success: true, message: 'Simulated locally' });
  try {
    const { code, delta, name } = req.body || {};
    if (code) {
      await pool.query(
        "UPDATE products SET current_stock = GREATEST(0, current_stock + ?) WHERE code = ? AND (product_type = 'PHYSICAL' OR product_type IS NULL)",
        [Number(delta || -1), code]
      );
    } else if (name) {
      await pool.query(
        "UPDATE products SET current_stock = GREATEST(0, min_stock - 1) WHERE name LIKE ? AND (product_type = 'PHYSICAL' OR product_type IS NULL) LIMIT 1",
        [`%${name}%`]
      );
    }
    const [lowRows]: any = await pool.query(
      "SELECT * FROM products WHERE (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock <= min_stock"
    );
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
      description: `الرصيد في (${item.warehouse}) هو ${item.current_stock} ${item.unit} فقط.`,
      targetTab: 'products',
      actionLabel: 'إصدار أمر شراء وتوريد',
      isRead: false
    }));

    res.json({
      success: true,
      audit: {
        counts: { total: lowStockAlerts.length, unread: lowStockAlerts.length, lowStock: lowStockAlerts.length, overdueMilestones: 0 },
        alerts: lowStockAlerts,
        lowStockItems: lowStockAlerts,
        overdueMilestones: []
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/alerts/simulate-overdue', async (req, res) => {
  const { projectName, clientName, amount } = req.body || {};
  const alert = {
    id: `ALERT-MLS-${Date.now()}`,
    title: `استحقاق دفعة متأخرة: ${projectName || 'مشروع سحابي'}`,
    description: `العميل: ${clientName || 'عميل'}، القيمة المتأخرة: ${Number(amount || 0).toLocaleString()} ج.م`,
    category: 'OVERDUE_MILESTONE',
    severity: 'CRITICAL',
    timeAgo: 'الآن',
    timestamp: new Date().toISOString(),
    targetTab: 'freelance',
    actionLabel: 'متابعة التحصيل',
    isRead: false
  };
  res.json({
    success: true,
    audit: {
      counts: { total: 1, unread: 1, lowStock: 0, overdueMilestones: 1 },
      alerts: [alert],
      lowStockItems: [],
      overdueMilestones: [alert]
    }
  });
});

// Real-time Server-Sent Events (SSE) for system alerts & notifications
app.get('/api/alerts/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendAuditData = async () => {
    const pool = getPool();
    if (!pool) return;
    try {
      const [lowRows]: any = await pool.query(
        "SELECT * FROM products WHERE (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock <= min_stock"
      );
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

      const payload = {
        success: true,
        source: 'MySQL 8.0+ Enterprise Core',
        timestamp: new Date().toISOString(),
        counts: {
          total: lowStockAlerts.length,
          unread: lowStockAlerts.length,
          lowStock: lowStockAlerts.length,
          overdueMilestones: 0
        },
        alerts: lowStockAlerts,
        lowStockItems: lowStockAlerts,
        overdueMilestones: []
      };

      res.write(`event: alert_update\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      // Ignore query errors during heartbeat
    }
  };

  // Initial push
  await sendAuditData();

  // Periodic heartbeat / update push every 30 seconds
  const interval = setInterval(sendAuditData, 30000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// -------------------------------------------------------------
// Sales Invoices & Quotations API
// -------------------------------------------------------------

// Get Sales Invoices / Quotations
app.get('/api/sales', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });
  try {
    const { status, customerId, fromDate, toDate } = req.query;
    let query = 'SELECT * FROM sales_invoices WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
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

    query += ' ORDER BY created_at DESC LIMIT 200';
    const [rows]: any = await pool.query(query, params);
    
    // Parse items JSON safely
    const data = rows.map((r: any) => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || [])
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create Sales Invoice or Quotation
app.post('/api/sales', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

  const conn = await pool.getConnection();
  try {
    const {
      id,
      invoice_number,
      customer_id,
      customer_name,
      date,
      items,
      subtotal,
      discount,
      net_total,
      cogs_total,
      gross_profit,
      payment_type, // 'CASH', 'CREDIT', 'BANK', 'INSTAPAY'
      account_id, // Treasury / Bank Account
      paid_amount,
      remaining_amount,
      status, // 'COMPLETED' (فاتورة مبيعات) or 'QUOTATION' (عرض أسعار)
      warehouse,
      notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'قائمة الأصناف فارغة' });
    }

    const invId = id || `inv-${Date.now()}`;
    const invNumber = invoice_number || (status === 'QUOTATION' ? `QUO-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}` : `INV-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`);
    const invDate = date || new Date().toISOString().slice(0, 10);
    const isQuotation = status === 'QUOTATION';

    await conn.beginTransaction();

    // 1. Insert Sales Invoice / Quotation record
    await conn.query(
      `INSERT INTO sales_invoices (
        id, invoice_number, date, customer_id, customer_name,
        business_unit_id, items, subtotal, discount, net_total,
        cogs_total, gross_profit, payment_type, paid_amount,
        remaining_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status), items = VALUES(items), net_total = VALUES(net_total),
        paid_amount = VALUES(paid_amount), remaining_amount = VALUES(remaining_amount)`,
      [
        invId,
        invNumber,
        invDate,
        customer_id || 'WALK_IN',
        customer_name || 'عميل نقدي / عام',
        JSON.stringify(items),
        Number(subtotal || net_total || 0),
        Number(discount || 0),
        Number(net_total || 0),
        Number(cogs_total || 0),
        Number(gross_profit || (net_total - cogs_total) || 0),
        payment_type || 'CASH',
        Number(paid_amount || 0),
        Number(remaining_amount || 0),
        status || 'COMPLETED'
      ]
    );

    // If it's a real sale (NOT quotation), update stock, treasuries, customer balance, and log movement
    if (!isQuotation) {
      // 2. Deduct quantities from products and record stock movements
      for (const item of items) {
        const qty = Number(item.quantity || 1);
        const prodId = item.product_id || item.id;
        const unitPrice = Number(item.unit_price || item.sale_price || 0);
        const unitCost = Number(item.unit_cost || item.purchase_price || 0);

        // Deduct stock (PHYSICAL products only)
        if (prodId) {
          await conn.query(
            "UPDATE products SET current_stock = current_stock - ? WHERE id = ? AND (product_type = 'PHYSICAL' OR product_type IS NULL)",
            [qty, prodId]
          );

          // Insert stock movement record
          const movId = `mov-sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await conn.query(
            `INSERT INTO stock_movements (
              id, reference_no, movement_type, product_id, product_name, 
              quantity, unit_price, total_price, source_warehouse, target_warehouse, notes, created_by
            ) VALUES (?, ?, 'OUT', ?, ?, ?, ?, ?, ?, NULL, ?, 'المدير العام')`,
            [
              movId,
              invNumber,
              prodId,
              item.product_name || item.name || 'صنف مباع',
              qty,
              unitPrice,
              qty * unitPrice,
              warehouse || 'مخزن المتجر الرئيسي',
              `فاتورة مبيعات رقم ${invNumber} للعميل: ${customer_name}`
            ]
          );
        }
      }

      // 3. Update Treasury / Account Balance if paid amount > 0
      const actualPaid = Number(paid_amount || 0);
      const splitPayments = req.body.split_payments; // Array<{ account_id: string; amount: number; method?: string }>

      if (Array.isArray(splitPayments) && splitPayments.length > 0) {
        for (const sp of splitPayments) {
          const spAmt = Number(sp.amount || 0);
          if (spAmt > 0 && sp.account_id) {
            const [accRows]: any = await conn.query('SELECT balance, name FROM accounts WHERE id = ?', [sp.account_id]);
            if (accRows.length > 0) {
              const newAccBalance = Number(accRows[0].balance || 0) + spAmt;
              await conn.query('UPDATE accounts SET balance = ? WHERE id = ?', [newAccBalance, sp.account_id]);

              const ftxId = `ftx-sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              await conn.query(
                `INSERT INTO financial_transactions (
                  id, reference_no, date, transaction_type, account_id, account_name,
                  flow, amount, balance_after, category, party_type, party_name, payment_method, notes
                ) VALUES (?, ?, ?, 'RECEIPT', ?, ?, 'IN', ?, ?, 'مبيعات نقدية', 'CUSTOMER', ?, ?, ?)`,
                [
                  ftxId,
                  invNumber,
                  invDate,
                  sp.account_id,
                  accRows[0].name,
                  spAmt,
                  newAccBalance,
                  customer_name || 'عميل نقدي',
                  sp.method || 'دفعة مقسمة',
                  `تحصيل مبيعات (${sp.method || 'دفعة مقسمة'}) فاتورة رقم: ${invNumber}`
                ]
              );
            }
          }
        }
      } else if (actualPaid > 0 && account_id) {
        const [accRows]: any = await conn.query('SELECT balance, name FROM accounts WHERE id = ?', [account_id]);
        if (accRows.length > 0) {
          const newAccBalance = Number(accRows[0].balance || 0) + actualPaid;
          await conn.query('UPDATE accounts SET balance = ? WHERE id = ?', [newAccBalance, account_id]);

          // Insert financial transaction
          const ftxId = `ftx-sale-${Date.now()}`;
          await conn.query(
            `INSERT INTO financial_transactions (
              id, reference_no, date, transaction_type, account_id, account_name,
              flow, amount, balance_after, category, party_type, party_name, payment_method, notes
            ) VALUES (?, ?, ?, 'RECEIPT', ?, ?, 'IN', ?, ?, 'مبيعات نقدية', 'CUSTOMER', ?, ?, ?)`,
            [
              ftxId,
              invNumber,
              invDate,
              account_id,
              accRows[0].name,
              actualPaid,
              newAccBalance,
              customer_name || 'عميل نقدي',
              payment_type || 'CASH',
              `تحصيل مبيعات فاتورة رقم: ${invNumber}`
            ]
          );
        }
      }

      // 4. Update Customer Balance if credit / remaining > 0
      const remaining = Number(remaining_amount || 0);
      if (customer_id && customer_id !== 'WALK_IN' && (remaining > 0 || payment_type === 'CREDIT')) {
        const [custRows]: any = await conn.query('SELECT balance, name, total_invoices FROM customers WHERE id = ?', [customer_id]);
        if (custRows.length > 0) {
          const currentCustBal = Number(custRows[0].balance || 0);
          // Credit sale increases debt owed to us
          const newCustBal = currentCustBal + remaining;
          await conn.query(
            'UPDATE customers SET balance = ?, total_invoices = total_invoices + 1 WHERE id = ?',
            [newCustBal, customer_id]
          );

          // Insert customer transaction
          const ctxId = `ctx-sale-${Date.now()}`;
          await conn.query(
            `INSERT INTO customer_transactions (
              id, customer_id, customer_name, transaction_type, reference_no,
              date, debit, credit, balance_after, payment_method, notes
            ) VALUES (?, ?, ?, 'INVOICE', ?, ?, ?, 0, ?, ?, ?)`,
            [
              ctxId,
              customer_id,
              custRows[0].name,
              invNumber,
              invDate,
              remaining,
              newCustBal,
              payment_type,
              `متبقي فاتورة مبيعات رقم ${invNumber}`
            ]
          );
        }
      }

      // 5. Audit Log
      await conn.query(
        `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
         VALUES (?, NOW(), 'المدير العام', 'فاتورة مبيعات', 'المبيعات والكاشير', 'sales_invoices', ?, ?)`,
        [`log-${Date.now()}`, String(invNumber), `إصدار فاتورة مبيعات رقم ${invNumber} بقيمة ${net_total} ج.م للعميل ${customer_name}`]
      );
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      id: invId,
      invoice_number: invNumber,
      message: isQuotation ? 'تم حفظ عرض السعر بنجاح' : 'تم إصدار وحفظ فاتورة المبيعات بنجاح'
    });
  } catch (err: any) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// Return Sales Invoice
app.post('/api/sales/:id/return', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows]: any = await conn.query('SELECT * FROM sales_invoices WHERE id = ? OR invoice_number = ?', [id, id]);
    if (!rows || rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }

    const inv = rows[0];
    if (inv.status === 'RETURNED') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'هذه الفاتورة تم إرجاعها مسبقاً' });
    }

    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []);

    // 1. Restore product stock and record stock movement
    for (const item of items) {
      const prodId = item.product_id || item.id;
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);

      await conn.query(
        "UPDATE products SET current_stock = current_stock + ? WHERE (id = ? OR code = ?) AND (product_type = 'PHYSICAL' OR product_type IS NULL)",
        [qty, prodId, prodId]
      );

      const movId = `mov-ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await conn.query(
        `INSERT INTO stock_movements (
          id, reference_no, movement_type, product_id, product_name,
          quantity, unit_price, total_price, source_warehouse, target_warehouse, notes, created_by
        ) VALUES (?, ?, 'IN', ?, ?, ?, ?, ?, NULL, ?, ?, 'المدير العام')`,
        [
          movId,
          inv.invoice_number,
          prodId,
          item.name || item.product_name || 'مرتجع صنف',
          qty,
          unitPrice,
          qty * unitPrice,
          inv.warehouse || 'مخزن المتجر الرئيسي',
          `مرتجع مبيعات فاتورة رقم ${inv.invoice_number}`
        ]
      );
    }

    // 2. Refund treasury/bank if paid amount > 0
    const paidAmt = Number(inv.paid_amount || 0);
    if (paidAmt > 0 && inv.account_id) {
      const [accRows]: any = await conn.query('SELECT balance, name FROM accounts WHERE id = ?', [inv.account_id]);
      if (accRows.length > 0) {
        const newBal = Number(accRows[0].balance || 0) - paidAmt;
        await conn.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBal, inv.account_id]);

        const ftxId = `ftx-ret-${Date.now()}`;
        await conn.query(
          `INSERT INTO financial_transactions (
            id, reference_no, date, transaction_type, account_id, account_name,
            flow, amount, balance_after, category, party_type, party_name, payment_method, notes
          ) VALUES (?, ?, CURDATE(), 'PAYMENT', ?, ?, 'OUT', ?, ?, 'مرتجع مبيعات', 'CUSTOMER', ?, 'CASH', ?)`,
          [
            ftxId,
            inv.invoice_number,
            inv.account_id,
            accRows[0].name,
            paidAmt,
            newBal,
            inv.customer_name || 'عميل نقدي',
            `رد قيمة مرتجع مبيعات فاتورة رقم ${inv.invoice_number}`
          ]
        );
      }
    }

    // 3. Deduct debt from customer if remaining amount > 0
    const remAmt = Number(inv.remaining_amount || 0);
    if (remAmt > 0 && inv.customer_id && inv.customer_id !== 'WALK_IN') {
      const [custRows]: any = await conn.query('SELECT balance, name FROM customers WHERE id = ?', [inv.customer_id]);
      if (custRows.length > 0) {
        const newCustBal = Math.max(0, Number(custRows[0].balance || 0) - remAmt);
        await conn.query('UPDATE customers SET balance = ? WHERE id = ?', [newCustBal, inv.customer_id]);

        const ctxId = `ctx-ret-${Date.now()}`;
        await conn.query(
          `INSERT INTO customer_transactions (
            id, customer_id, customer_name, transaction_type, reference_no,
            date, debit, credit, balance_after, payment_method, notes
          ) VALUES (?, ?, ?, 'RETURN', ?, CURDATE(), 0, ?, ?, 'مرتجع', ?)`,
          [
            ctxId,
            inv.customer_id,
            custRows[0].name,
            inv.invoice_number,
            remAmt,
            newCustBal,
            `تسوية مرتجع مبيعات فاتورة رقم ${inv.invoice_number}`
          ]
        );
      }
    }

    // 4. Update status of invoice to RETURNED
    await conn.query('UPDATE sales_invoices SET status = "RETURNED" WHERE id = ?', [inv.id]);

    // 5. Audit Log
    await conn.query(
      `INSERT INTO audit_logs (id, timestamp, user, action, module, table_name, record_id, details)
       VALUES (?, NOW(), 'المدير العام', 'مرتجع مبيعات', 'المبيعات والكاشير', 'sales_invoices', ?, ?)`,
      [`log-ret-${Date.now()}`, String(inv.invoice_number), `عمل مرتجع كامل لفاتورة مبيعات رقم ${inv.invoice_number} بقيمة ${inv.net_total} ج.م`]
    );

    await conn.commit();
    conn.release();

    res.json({ success: true, message: `تم عمل مرتجع للفاتورة رقم (${inv.invoice_number}) بنجاح وإعادة البضاعة للمخزن` });
  } catch (err: any) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// Real-time Dashboard KPI & Analytics API
// -------------------------------------------------------------
app.get('/api/dashboard/stats', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const firstDayOfMonth = today.slice(0, 7) + '-01';

    // 1. Sales & Revenue KPIs
    const [salesToday]: any = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(net_total), 0) as total, COALESCE(SUM(paid_amount), 0) as paid, COALESCE(SUM(gross_profit), 0) as profit
       FROM sales_invoices WHERE status = 'COMPLETED' AND date = ?`,
      [today]
    );

    const [salesMonth]: any = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(net_total), 0) as total, COALESCE(SUM(gross_profit), 0) as profit
       FROM sales_invoices WHERE status = 'COMPLETED' AND date >= ?`,
      [firstDayOfMonth]
    );

    const [quotations]: any = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(net_total), 0) as total FROM sales_invoices WHERE status = 'QUOTATION'`
    );

    // 2. Inventory & Stock Valuation (Physical inventory items only)
    const [products]: any = await pool.query(
      `SELECT COUNT(*) as total_items,
              COALESCE(SUM(current_stock), 0) as total_units,
              COALESCE(SUM(current_stock * buy_price), 0) as inventory_cost_valuation,
              COALESCE(SUM(current_stock * sell_price), 0) as inventory_sell_valuation,
              COALESCE(SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END), 0) as low_stock_count,
              COALESCE(SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock_count
       FROM products
       WHERE (product_type = 'PHYSICAL' OR product_type IS NULL)`
    );

    // 3. Treasuries & Accounts Cash
    const [accounts]: any = await pool.query(
      `SELECT id, name, account_code, COALESCE(balance, 0) as balance, type FROM accounts ORDER BY id ASC`
    );
    const totalLiquidity = accounts.reduce((acc: number, a: any) => acc + Number(a.balance || 0), 0);

    // 4. Receivables (Customers Debt) & Payables (Suppliers Debt)
    const [customers]: any = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total_receivables FROM customers`
    );

    const [suppliers]: any = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total_payables FROM suppliers`
    );

    // 5. Recent 7-days sales trend for chart
    const [recentDays]: any = await pool.query(
      `SELECT date, COALESCE(SUM(net_total), 0) as daily_sales, COALESCE(SUM(gross_profit), 0) as daily_profit, COUNT(*) as count
       FROM sales_invoices WHERE status = 'COMPLETED' AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY date ORDER BY date ASC`
    );

    // 6. Recent Sales Invoices
    const [recentSales]: any = await pool.query(
      `SELECT id, invoice_number, date, customer_name, net_total, payment_type, status, created_at
       FROM sales_invoices ORDER BY created_at DESC LIMIT 5`
    );

    // 7. Recent System Activity
    const [recentLogs]: any = await pool.query(
      `SELECT id, timestamp, user, action, module, details FROM audit_logs ORDER BY created_at DESC LIMIT 6`
    );

    // 8. Low stock alert items list (Physical products only)
    const [lowStockItems]: any = await pool.query(
      `SELECT id, code, name, category, current_stock, min_stock, buy_price, sell_price, warehouse
       FROM products 
       WHERE (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock <= min_stock 
       ORDER BY current_stock ASC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        salesToday: salesToday[0] || { count: 0, total: 0, paid: 0, profit: 0 },
        salesMonth: salesMonth[0] || { count: 0, total: 0, profit: 0 },
        quotations: quotations[0] || { count: 0, total: 0 },
        inventory: products[0] || { total_items: 0, total_units: 0, inventory_cost_valuation: 0, inventory_sell_valuation: 0, low_stock_count: 0, out_of_stock_count: 0 },
        accounts,
        totalLiquidity,
        customers: customers[0] || { count: 0, total_receivables: 0 },
        suppliers: suppliers[0] || { count: 0, total_payables: 0 },
        recentDaysTrend: recentDays || [],
        recentSales: recentSales || [],
        recentLogs: recentLogs || [],
        lowStockItems: lowStockItems || []
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// Advanced Comprehensive Reports Engine API
// -------------------------------------------------------------
app.get('/api/reports', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(500).json({ success: false, message: 'قاعدة البيانات غير متصلة' });

  try {
    const { 
      type = 'sales', 
      startDate, 
      endDate, 
      category, 
      warehouse, 
      paymentType, 
      partyId, 
      unit = 'all',
      status 
    } = req.query as Record<string, string>;

    let resultData: any = {};

    if (type === 'sales') {
      // 1. Sales Report
      let query = `
        SELECT id, invoice_number, date, customer_id, customer_name, business_unit_id,
               subtotal, discount, net_total, cogs_total, gross_profit, payment_type, paid_amount, remaining_amount, status, created_at, items
        FROM sales_invoices
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
      }
      if (paymentType && paymentType !== 'all') {
        query += ' AND payment_type = ?';
        params.push(paymentType);
      }
      if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
      }
      if (partyId && partyId !== 'all') {
        query += ' AND (customer_id = ? OR customer_name LIKE ?)';
        params.push(partyId, `%${partyId}%`);
      }
      if (unit && unit !== 'all') {
        const uId = unit === 'shop' ? 1 : 2;
        query += ' AND business_unit_id = ?';
        params.push(uId);
      }

      query += ' ORDER BY date DESC, created_at DESC';
      const [rows]: any = await pool.query(query, params);

      // Compute aggregated totals
      const totals = rows.reduce(
        (acc: any, row: any) => {
          acc.count += 1;
          acc.subtotal += Number(row.subtotal || 0);
          acc.discount += Number(row.discount || 0);
          acc.netTotal += Number(row.net_total || 0);
          acc.cogsTotal += Number(row.cogs_total || 0);
          acc.grossProfit += Number(row.gross_profit || 0);
          acc.paidAmount += Number(row.paid_amount || 0);
          acc.remainingAmount += Number(row.remaining_amount || 0);
          return acc;
        },
        { count: 0, subtotal: 0, discount: 0, netTotal: 0, cogsTotal: 0, grossProfit: 0, paidAmount: 0, remainingAmount: 0 }
      );

      resultData = { rows, totals };
    } 
    else if (type === 'inventory') {
      // 2. Inventory & Stock Valuation Report
      let query = `
        SELECT id, code, barcode, name, category, product_type, unit, buy_price, sell_price,
               current_stock, min_stock, warehouse, business_unit,
               (current_stock * buy_price) as stock_cost_value,
               (current_stock * sell_price) as stock_sell_value,
               (current_stock * (sell_price - buy_price)) as potential_profit
        FROM products
        WHERE 1=1
      `;
      const params: any[] = [];

      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }
      if (warehouse && warehouse !== 'all') {
        query += ' AND warehouse = ?';
        params.push(warehouse);
      }
      if (status === 'low_stock') {
        query += " AND (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock <= min_stock AND current_stock > 0";
      } else if (status === 'out_of_stock') {
        query += " AND (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock <= 0";
      } else if (status === 'available') {
        query += " AND (product_type = 'PHYSICAL' OR product_type IS NULL) AND current_stock > min_stock";
      }

      query += ' ORDER BY current_stock ASC, name ASC';
      const [rows]: any = await pool.query(query, params);

      const totals = rows.reduce(
        (acc: any, row: any) => {
          const isPhysical = !row.product_type || row.product_type === 'PHYSICAL';
          acc.totalItems += 1;
          acc.totalUnits += isPhysical ? Number(row.current_stock || 0) : 0;
          acc.totalCostValue += Number(row.stock_cost_value || 0);
          acc.totalSellValue += Number(row.stock_sell_value || 0);
          acc.totalPotentialProfit += Number(row.potential_profit || 0);
          if (isPhysical && Number(row.current_stock || 0) <= Number(row.min_stock || 0)) acc.lowStockCount += 1;
          return acc;
        },
        { totalItems: 0, totalUnits: 0, totalCostValue: 0, totalSellValue: 0, totalPotentialProfit: 0, lowStockCount: 0 }
      );

      resultData = { rows, totals };
    }
    else if (type === 'treasury') {
      // 3. Treasury & Financial Transactions Report
      let query = `
        SELECT id, reference_no, date, transaction_type, account_id, account_name,
               to_account_id, to_account_name, flow, amount, balance_after, category,
               party_type, party_name, payment_method, notes, created_at
        FROM financial_transactions
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
      }
      if (paymentType && paymentType !== 'all') {
        query += ' AND transaction_type = ?';
        params.push(paymentType);
      }
      if (partyId && partyId !== 'all') {
        query += ' AND account_id = ?';
        params.push(partyId);
      }

      query += ' ORDER BY date DESC, created_at DESC';
      const [rows]: any = await pool.query(query, params);

      const totals = rows.reduce(
        (acc: any, row: any) => {
          acc.count += 1;
          if (row.flow === 'IN' || row.transaction_type === 'RECEIPT') {
            acc.totalIn += Number(row.amount || 0);
          } else if (row.flow === 'OUT' || row.transaction_type === 'PAYMENT' || row.transaction_type === 'EXPENSE') {
            acc.totalOut += Number(row.amount || 0);
          }
          acc.netCashFlow = acc.totalIn - acc.totalOut;
          return acc;
        },
        { count: 0, totalIn: 0, totalOut: 0, netCashFlow: 0 }
      );

      resultData = { rows, totals };
    }
    else if (type === 'customers') {
      // 4. Customers Balances & Aging Report
      let query = `
        SELECT id, name, phone, email, type, balance, credit_limit, total_invoices, address, business_unit, created_at
        FROM customers
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status === 'debtors') {
        query += ' AND balance > 0';
      } else if (status === 'creditors') {
        query += ' AND balance < 0';
      } else if (status === 'settled') {
        query += ' AND balance = 0';
      }

      query += ' ORDER BY balance DESC, name ASC';
      const [rows]: any = await pool.query(query, params);

      const totals = rows.reduce(
        (acc: any, row: any) => {
          acc.count += 1;
          acc.totalBalance += Number(row.balance || 0);
          if (row.balance > 0) acc.totalDebit += Number(row.balance);
          if (row.balance < 0) acc.totalCredit += Math.abs(Number(row.balance));
          return acc;
        },
        { count: 0, totalBalance: 0, totalDebit: 0, totalCredit: 0 }
      );

      resultData = { rows, totals };
    }
    else if (type === 'suppliers') {
      // 5. Suppliers Balances & Payables Report
      let query = `
        SELECT id, name, company, phone, email, category, balance, total_purchases, payment_terms, address, created_at
        FROM suppliers
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status === 'creditors') {
        query += ' AND balance > 0';
      } else if (status === 'settled') {
        query += ' AND balance = 0';
      }

      query += ' ORDER BY balance DESC, name ASC';
      const [rows]: any = await pool.query(query, params);

      const totals = rows.reduce(
        (acc: any, row: any) => {
          acc.count += 1;
          acc.totalBalance += Number(row.balance || 0);
          acc.totalPurchases += Number(row.total_purchases || 0);
          return acc;
        },
        { count: 0, totalBalance: 0, totalPurchases: 0 }
      );

      resultData = { rows, totals };
    }
    else if (type === 'expenses') {
      // 6. Expenses Breakdown Report (unified query)
      let query = `
        SELECT id, title, category, date, amount, type, allocation_ratio, shop_portion, freelance_portion, payment_account, created_at
        FROM (
          SELECT id, title, category, date, amount, type, allocation_ratio, shop_portion, freelance_portion, payment_account, created_at 
          FROM expenses
          UNION ALL
          SELECT id, notes AS title, COALESCE(NULLIF(category, ''), 'مصروفات تشغيلية') AS category, date, amount, 'SHARED_DEFAULT' AS type, '70_30' AS allocation_ratio, amount AS shop_portion, 0.00 AS freelance_portion, account_name AS payment_account, created_at
          FROM financial_transactions
          WHERE transaction_type = 'EXPENSE' AND id NOT IN (SELECT id FROM expenses)
        ) AS combined_expenses
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
      }
      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY date DESC, created_at DESC';
      const [rows]: any = await pool.query(query, params);

      // Compute category breakdown
      const categoryMap: { [cat: string]: { category: string; total: number; count: number; percentage: number } } = {};
      let overallTotal = 0;

      for (const row of rows) {
        const amt = Number(row.amount || 0);
        overallTotal += amt;
        const cat = (row.category && row.category.trim()) || 'أخرى / متنوعة';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, total: 0, count: 0, percentage: 0 };
        }
        categoryMap[cat].total += amt;
        categoryMap[cat].count += 1;
      }

      for (const cat in categoryMap) {
        categoryMap[cat].percentage = overallTotal > 0 ? Number(((categoryMap[cat].total / overallTotal) * 100).toFixed(1)) : 0;
      }

      const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total);
      const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

      const totals = rows.reduce(
        (acc: any, row: any) => {
          acc.count += 1;
          acc.totalAmount += Number(row.amount || 0);
          acc.shopPortion += Number(row.shop_portion || 0);
          acc.freelancePortion += Number(row.freelance_portion || 0);
          return acc;
        },
        { count: 0, totalAmount: 0, shopPortion: 0, freelancePortion: 0 }
      );

      const averageExpense = totals.count > 0 ? Number((totals.totalAmount / totals.count).toFixed(2)) : 0;

      resultData = { 
        rows, 
        totals, 
        categoryBreakdown, 
        topCategory,
        averageExpense,
        selectedCategory: category || 'all'
      };
    }
    else if (type === 'pnl') {
      // 7. Standard P&L Statement calculated from actual tables
      let salesWhere = "WHERE status = 'COMPLETED'";
      let expenseWhere = "WHERE 1=1";
      const sParams: any[] = [];
      const eParams: any[] = [];

      if (startDate) {
        salesWhere += ' AND date >= ?';
        expenseWhere += ' AND date >= ?';
        sParams.push(startDate);
        eParams.push(startDate);
      }
      if (endDate) {
        salesWhere += ' AND date <= ?';
        expenseWhere += ' AND date <= ?';
        sParams.push(endDate);
        eParams.push(endDate);
      }

      const [salesAgg]: any = await pool.query(
        `SELECT 
           COALESCE(SUM(net_total), 0) as total_sales,
           COALESCE(SUM(cogs_total), 0) as total_cogs,
           COALESCE(SUM(gross_profit), 0) as total_gross_profit,
           COALESCE(SUM(CASE WHEN business_unit_id = 1 THEN net_total ELSE 0 END), 0) as shop_sales,
           COALESCE(SUM(CASE WHEN business_unit_id = 1 THEN cogs_total ELSE 0 END), 0) as shop_cogs,
           COALESCE(SUM(CASE WHEN business_unit_id = 2 THEN net_total ELSE 0 END), 0) as freelance_sales,
           COALESCE(SUM(CASE WHEN business_unit_id = 2 THEN cogs_total ELSE 0 END), 0) as freelance_cogs
         FROM sales_invoices ${salesWhere}`,
        sParams
      );

      const [expenseAgg]: any = await pool.query(
        `SELECT 
           COALESCE(SUM(amount), 0) as total_expenses,
           COALESCE(SUM(shop_portion), 0) as shop_expenses,
           COALESCE(SUM(freelance_portion), 0) as freelance_expenses
         FROM expenses ${expenseWhere}`,
        eParams
      );

      const [salaryAgg]: any = await pool.query(
        `SELECT COALESCE(SUM(net_payable), 0) as total_salaries FROM employees WHERE status = 'ACTIVE'`
      );

      const s = salesAgg[0] || {};
      const e = expenseAgg[0] || {};
      const totalSalaries = Number(salaryAgg[0]?.total_salaries || 0);

      const totalSales = Number(s.total_sales || 0);
      const totalCogs = Number(s.total_cogs || 0);
      const grossProfit = Number(s.total_gross_profit || (totalSales - totalCogs));
      const totalExpenses = Number(e.total_expenses || 0) + totalSalaries;
      const netProfit = grossProfit - totalExpenses;

      resultData = {
        sales: totalSales,
        cogs: totalCogs,
        grossProfit,
        expenses: totalExpenses,
        operatingExpenses: Number(e.total_expenses || 0),
        salaries: totalSalaries,
        netProfit,
        shop: {
          sales: Number(s.shop_sales || 0),
          cogs: Number(s.shop_cogs || 0),
          grossProfit: Number(s.shop_sales || 0) - Number(s.shop_cogs || 0),
          expenses: Number(e.shop_expenses || 0)
        },
        freelance: {
          sales: Number(s.freelance_sales || 0),
          cogs: Number(s.freelance_cogs || 0),
          grossProfit: Number(s.freelance_sales || 0) - Number(s.freelance_cogs || 0),
          expenses: Number(e.freelance_expenses || 0)
        }
      };
    } else if (type === 'physical') {
      // 8. Physical Goods Sales & Profit Report
      let invQuery = "SELECT * FROM sales_invoices WHERE status = 'COMPLETED'";
      const invParams: any[] = [];
      if (startDate) { invQuery += ' AND date >= ?'; invParams.push(startDate); }
      if (endDate) { invQuery += ' AND date <= ?'; invParams.push(endDate); }
      invQuery += ' ORDER BY date DESC';
      const [invoices]: any = await pool.query(invQuery, invParams);

      const [products]: any = await pool.query("SELECT id, name, category, product_type, buy_price, sell_price FROM products WHERE product_type = 'PHYSICAL'");
      const physicalIds = new Set(products.map((p: any) => p.id));
      const productMap = new Map<string, any>(products.map((p: any) => [p.id, p]));

      let totalSales = 0;
      let totalCogs = 0;
      const itemsSummary: { [key: string]: { name: string; category: string; quantity: number; salesTotal: number; cogsTotal: number; profit: number } } = {};

      for (const inv of invoices) {
        let invItems: any[] = [];
        try { invItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []); } catch (e) { invItems = []; }

        for (const itm of invItems) {
          const prodId = itm.productId || itm.id;
          const prod = productMap.get(prodId);
          const isPhysical = physicalIds.has(prodId) || (!itm.type || itm.type === 'PHYSICAL');

          if (isPhysical) {
            const qty = Number(itm.quantity || itm.qty || 1);
            const price = Number(itm.unitPrice || itm.price || 0);
            const buyPrice = Number(prod ? prod.buy_price : (itm.buyPrice || itm.costPrice || 0));
            const lineTotal = Number(itm.total || (qty * price));
            const lineCogs = qty * buyPrice;
            const lineProfit = lineTotal - lineCogs;

            totalSales += lineTotal;
            totalCogs += lineCogs;

            const key = prodId || itm.name;
            if (!itemsSummary[key]) {
              itemsSummary[key] = {
                name: itm.name || (prod ? prod.name : 'منتج غير معروف'),
                category: prod ? prod.category : 'عام',
                quantity: 0,
                salesTotal: 0,
                cogsTotal: 0,
                profit: 0
              };
            }
            itemsSummary[key].quantity += qty;
            itemsSummary[key].salesTotal += lineTotal;
            itemsSummary[key].cogsTotal += lineCogs;
            itemsSummary[key].profit += lineProfit;
          }
        }
      }

      const netProfit = totalSales - totalCogs;
      const rows = Object.values(itemsSummary).sort((a, b) => b.profit - a.profit);
      resultData = {
        summary: {
          totalSales,
          totalCogs,
          netProfit,
          margin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0',
          totalItemsCount: rows.length
        },
        rows
      };
    } else if (type === 'maintenance') {
      // 9. Maintenance Profit Report
      let query = "SELECT * FROM maintenance_orders WHERE 1=1";
      const params: any[] = [];
      if (startDate) { query += ' AND received_date >= ?'; params.push(startDate); }
      if (endDate) { query += ' AND received_date <= ?'; params.push(endDate); }
      query += ' ORDER BY received_date DESC';

      const [orders]: any = await pool.query(query, params);

      let totalRevenue = 0;
      let totalPartsCost = 0;
      let totalLabor = 0;

      const rows = orders.map((ord: any) => {
        const total = Number(ord.total_amount) || 0;
        const labor = Number(ord.labor_cost) || 0;
        let partsCost = 0;

        try {
          const parts = typeof ord.parts_used === 'string' ? JSON.parse(ord.parts_used) : (ord.parts_used || []);
          if (Array.isArray(parts)) {
            partsCost = parts.reduce((acc: number, p: any) => acc + (Number(p.cost || p.buy_price || 0) * Number(p.quantity || 1)), 0);
          }
        } catch (e) { partsCost = 0; }

        const profit = total - partsCost;
        totalRevenue += total;
        totalPartsCost += partsCost;
        totalLabor += labor;

        return {
          id: ord.id,
          order_number: ord.order_number,
          customer_name: ord.customer_name,
          device_type: ord.device_type,
          brand_model: ord.brand_model,
          status: ord.status,
          date: ord.received_date,
          totalAmount: total,
          partsCost,
          laborCost: labor,
          netProfit: profit
        };
      });

      const netProfit = totalRevenue - totalPartsCost;
      resultData = {
        summary: {
          totalRevenue,
          totalPartsCost,
          totalLabor,
          netProfit,
          margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
          ordersCount: orders.length
        },
        rows
      };
    } else if (type === 'software') {
      // 10. Software Sales & Development Report
      let invQuery = "SELECT * FROM sales_invoices WHERE status = 'COMPLETED'";
      const invParams: any[] = [];
      if (startDate) { invQuery += ' AND date >= ?'; invParams.push(startDate); }
      if (endDate) { invQuery += ' AND date <= ?'; invParams.push(endDate); }
      const [invoices]: any = await pool.query(invQuery, invParams);

      const [digitalProducts]: any = await pool.query("SELECT id, name, category, product_type, buy_price, sell_price FROM products WHERE product_type = 'DIGITAL'");
      const digitalIds = new Set(digitalProducts.map((p: any) => p.id));
      const digitalMap = new Map<string, any>(digitalProducts.map((p: any) => [p.id, p]));

      let softwareProductSales = 0;
      let softwareProductCost = 0;
      const rows: any[] = [];

      for (const inv of invoices) {
        let items: any[] = [];
        try { items = typeof inv.items === 'string' ? JSON.parse(inv.items) : (inv.items || []); } catch (e) { items = []; }

        for (const itm of items) {
          const prodId = itm.productId || itm.id;
          const prod = digitalMap.get(prodId);
          if (digitalIds.has(prodId) || itm.type === 'DIGITAL' || itm.category?.includes('برمج') || itm.name?.includes('برنامج') || itm.name?.includes('سيرفر')) {
            const qty = Number(itm.quantity || itm.qty || 1);
            const price = Number(itm.unitPrice || itm.price || 0);
            const cost = Number(prod ? prod.buy_price : (itm.buyPrice || 0));
            const lineTotal = Number(itm.total || (qty * price));
            const lineCost = qty * cost;
            const lineProfit = lineTotal - lineCost;

            softwareProductSales += lineTotal;
            softwareProductCost += lineCost;

            rows.push({
              id: `${inv.id}-${rows.length}`,
              date: inv.date,
              reference: inv.invoice_number,
              customer_name: inv.customer_name,
              item_name: itm.name,
              quantity: qty,
              revenue: lineTotal,
              cost: lineCost,
              profit: lineProfit
            });
          }
        }
      }

      let projQuery = "SELECT * FROM freelance_projects WHERE 1=1";
      const projParams: any[] = [];
      if (startDate) { projQuery += ' AND start_date >= ?'; projParams.push(startDate); }
      if (endDate) { projQuery += ' AND start_date <= ?'; projParams.push(endDate); }
      const [projects]: any = await pool.query(projQuery, projParams);

      let projectsTotalRevenue = 0;
      for (const p of projects) {
        const amt = Number(p.contract_amount) || 0;
        projectsTotalRevenue += amt;
        rows.push({
          id: p.id,
          date: p.start_date,
          reference: `PROJ-${p.id}`,
          customer_name: `${p.client_name} (${p.client_country})`,
          item_name: `مشروع برمجي: ${p.title}`,
          quantity: 1,
          revenue: amt,
          cost: 0,
          profit: amt
        });
      }

      const totalRevenue = softwareProductSales + projectsTotalRevenue;
      const netProfit = totalRevenue - softwareProductCost;

      resultData = {
        summary: {
          totalRevenue,
          productSales: softwareProductSales,
          projectsRevenue: projectsTotalRevenue,
          cost: softwareProductCost,
          netProfit,
          margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '100',
          count: rows.length
        },
        rows: rows.sort((a, b) => b.profit - a.profit)
      };
    } else if (type === 'network') {
      // 11. Network P&L Report
      await ensureNetworkTable();
      let query = "SELECT * FROM network_transactions WHERE 1=1";
      const params: any[] = [];
      if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
      if (endDate) { query += ' AND date <= ?'; params.push(endDate); }
      query += ' ORDER BY date DESC, created_at DESC';

      const [transactions]: any = await pool.query(query, params);

      let totalIncome = 0;
      let totalExpense = 0;
      for (const t of transactions) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'INCOME') totalIncome += amt;
        else totalExpense += amt;
      }
      const netProfit = totalIncome - totalExpense;

      const rows = transactions.map((t: any) => ({
        id: t.id,
        date: t.date,
        type: t.type === 'INCOME' ? 'استلام دفعة / اشتراك' : 'مصروف شبكة',
        subscriber_name: t.subscriber_name || '—',
        phone: t.phone || '—',
        reason: t.reason,
        treasury_name: t.treasury_name,
        amount: Number(t.amount) || 0,
        net_effect: t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount)
      }));

      resultData = {
        summary: {
          totalIncome,
          totalExpense,
          netProfit,
          margin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0',
          count: rows.length
        },
        rows
      };
    }

    res.json({
      success: true,
      reportType: type,
      timestamp: new Date().toISOString(),
      data: resultData
    });
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(500).json({ success: false, message: 'فشل استخراج التقرير: ' + err.message });
  }
});

// Setup Vite development or production/preview static files
async function startServer() {
  const isPreview = process.env.NODE_ENV === 'production' || process.argv.includes('--production') || process.argv.includes('--preview');
  if (!isPreview) {
    console.log('⚡ Starting in DEVELOPMENT mode (Vite HMR)');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: { 
        middlewareMode: true,
        allowedHosts: true,
        watch: {
          ignored: [
            '**/db_config.json',
            '**/*.json',
            '**/dist/**'
          ]
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('🚀 Starting in PREVIEW / PRODUCTION mode (Serving optimized dist bundle)');
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Ensure all database tables exist and are up to date
  try {
    const config = loadConfigFile();
    if (config.isInstalled && config.dbConfig) {
      const pool = getPool();
      if (pool) {
        const statements = INIT_MYSQL_TABLES_SQL.split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        for (const sql of statements) {
          await pool.query(sql);
        }
        // Ensure salary_cycle column exists
        try {
          const [cols]: any = await pool.query("SHOW COLUMNS FROM employees LIKE 'salary_cycle'");
          if (cols.length === 0) {
            await pool.query("ALTER TABLE employees ADD COLUMN salary_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY' AFTER base_salary");
          }
        } catch {}

        // Ensure keeper_name column exists in accounts
        try {
          const [cols]: any = await pool.query("SHOW COLUMNS FROM accounts LIKE 'keeper_name'");
          if (cols.length === 0) {
            await pool.query("ALTER TABLE accounts ADD COLUMN keeper_name VARCHAR(150) NULL DEFAULT 'المدير المالي' AFTER balance");
          }
        } catch {}

        // Ensure maintenance_orders delivery_date exists
        try {
          const [mntCols]: any = await pool.query("SHOW COLUMNS FROM maintenance_orders LIKE 'delivery_date'");
          if (mntCols.length === 0) {
            await pool.query("ALTER TABLE maintenance_orders ADD COLUMN delivery_date DATE NULL AFTER received_date");
          }
        } catch {}

        // Ensure cctv_projects has all needed columns
        try {
          const [cctvCols]: any = await pool.query("SHOW COLUMNS FROM cctv_projects");
          const names = cctvCols.map((c: any) => c.Field);
          if (!names.includes('location')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN location VARCHAR(255) NULL AFTER customer_phone");
          if (!names.includes('contract_value')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN contract_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER dvr_type");
          if (!names.includes('hardware_cost')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN hardware_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER total_amount");
          if (!names.includes('labor_cost')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN labor_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER hardware_cost");
          if (!names.includes('other_expenses')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN other_expenses DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER labor_cost");
          if (!names.includes('total_cost')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER other_expenses");
          if (!names.includes('net_profit')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN net_profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER total_cost");
          if (!names.includes('end_date')) await pool.query("ALTER TABLE cctv_projects ADD COLUMN end_date DATE NULL AFTER start_date");
        } catch {}

        // Ensure network_projects has all needed columns
        try {
          const [netCols]: any = await pool.query("SHOW COLUMNS FROM network_projects");
          const names = netCols.map((c: any) => c.Field);
          if (!names.includes('customer_name')) await pool.query("ALTER TABLE network_projects ADD COLUMN customer_name VARCHAR(200) NULL AFTER project_name");
          if (!names.includes('location')) await pool.query("ALTER TABLE network_projects ADD COLUMN location VARCHAR(255) NULL AFTER customer_name");
          if (!names.includes('contract_value')) await pool.query("ALTER TABLE network_projects ADD COLUMN contract_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER installation_fees");
          if (!names.includes('labor_cost')) await pool.query("ALTER TABLE network_projects ADD COLUMN labor_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER hardware_cost");
          if (!names.includes('other_expenses')) await pool.query("ALTER TABLE network_projects ADD COLUMN other_expenses DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER labor_cost");
          if (!names.includes('total_cost')) await pool.query("ALTER TABLE network_projects ADD COLUMN total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER other_expenses");
          if (!names.includes('net_profit')) await pool.query("ALTER TABLE network_projects ADD COLUMN net_profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER total_cost");
          if (!names.includes('start_date')) await pool.query("ALTER TABLE network_projects ADD COLUMN start_date DATE NULL AFTER status");
        } catch {}

        // Ensure internet_subscribers has all needed columns
        try {
          const [subCols]: any = await pool.query("SHOW COLUMNS FROM internet_subscribers");
          const names = subCols.map((c: any) => c.Field);
          if (!names.includes('mac_address')) await pool.query("ALTER TABLE internet_subscribers ADD COLUMN mac_address VARCHAR(50) NULL AFTER ip_address");
          if (!names.includes('line_cost')) await pool.query("ALTER TABLE internet_subscribers ADD COLUMN line_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER monthly_fee");
          if (!names.includes('profit')) await pool.query("ALTER TABLE internet_subscribers ADD COLUMN profit DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER line_cost");
          if (!names.includes('due_day_of_month')) await pool.query("ALTER TABLE internet_subscribers ADD COLUMN due_day_of_month INT NOT NULL DEFAULT 1 AFTER due_day");
          if (!names.includes('last_payment_date')) await pool.query("ALTER TABLE internet_subscribers ADD COLUMN last_payment_date DATE NULL AFTER due_day_of_month");
        } catch {}

        // Ensure freelance_projects has all needed columns
        try {
          const [flCols]: any = await pool.query("SHOW COLUMNS FROM freelance_projects");
          const names = flCols.map((c: any) => c.Field);
          if (!names.includes('project_name')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN project_name VARCHAR(200) NULL AFTER id");
          if (!names.includes('client_id')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN client_id VARCHAR(50) NULL AFTER project_name");
          if (!names.includes('contract_value')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN contract_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER client_country");
          if (!names.includes('paid_amount')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER contract_value");
          if (!names.includes('remaining_amount')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN remaining_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER paid_amount");
          if (!names.includes('direct_expenses')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN direct_expenses DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER remaining_amount");
          if (!names.includes('net_profit')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN net_profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER direct_expenses");
          if (!names.includes('expected_end_date')) await pool.query("ALTER TABLE freelance_projects ADD COLUMN expected_end_date DATE NULL AFTER start_date");
        } catch {}
        // Ensure non-physical products (SERVICE, DIGITAL) have min_stock = 0 and current_stock = 0 so they never trigger stock alerts
        try {
          await pool.query("UPDATE products SET current_stock = 0, min_stock = 0 WHERE product_type IN ('SERVICE', 'DIGITAL')");
        } catch {}
      }
    }
  } catch (schemaErr: any) {
    console.warn('⚠️ Automated schema sync notice:', schemaErr.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);

    // List all active IPv4 interfaces
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          const label = name.toLowerCase().includes('tailscale') 
            ? 'VPN (Tailscale)' 
            : name.toLowerCase().includes('ethernet') 
            ? 'LAN (Ethernet)' 
            : name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless')
            ? 'Wi-Fi'
            : name;
          console.log(`  ➜  ${label.padEnd(15)}: http://${net.address}:${PORT}/`);
        }
      }
    }

    console.log(`  ➜  ${'Cloudflare'.padEnd(15)}: Connected via background Cloudflare Tunnel (Custom Domain)`);
    console.log(`\nEnterprise System running with MySQL Core on port ${PORT}`);
  });
}

startServer();
