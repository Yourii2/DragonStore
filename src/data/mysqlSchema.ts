export interface TableDefinition {
  name: string;
  nameAr: string;
  category: string;
  descriptionAr: string;
  columns: {
    name: string;
    type: string;
    isPrimary?: boolean;
    isNullable?: boolean;
    foreignKey?: string;
    descriptionAr: string;
  }[];
  indexes: string[];
}

export const MYSQL_COMPLETE_DDL = `-- ========================================================================
-- نظام الإدارة المحاسبية والتشغيلية المزدوجة (متجر التقنية والبرمجيات الحرة)
-- DATABASE: MySQL 8.0+ | Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO";

-- ------------------------------------------------------------------------
-- 1. جدول وحدات الأعمال (Business Units)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`business_units\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(20) NOT NULL UNIQUE COMMENT 'SHOP, FREELANCE',
  \`name_ar\` VARCHAR(100) NOT NULL,
  \`name_en\` VARCHAR(100) NOT NULL,
  \`description\` TEXT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='وحدات الأعمال المعزولة مالياً';

-- ------------------------------------------------------------------------
-- 2. دليل الحسابات الموحد (Chart of Accounts)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`accounts\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`account_code\` VARCHAR(30) NOT NULL UNIQUE COMMENT 'رمز الحساب الشجري مثل 1110',
  \`name_ar\` VARCHAR(150) NOT NULL,
  \`name_en\` VARCHAR(150) NULL,
  \`account_type\` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'DIRECT_COST', 'OPERATING_EXPENSE', 'OTHER') NOT NULL,
  \`level\` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'مستوى الحساب في الشجرة',
  \`parent_id\` INT UNSIGNED NULL COMMENT 'الحساب الأب',
  \`unit_scope\` ENUM('SHOP', 'FREELANCE', 'BOTH', 'SHARED') NOT NULL DEFAULT 'BOTH',
  \`current_balance\` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  \`is_reconcilable\` TINYINT(1) NOT NULL DEFAULT 0,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_accounts_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`accounts\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='شجرة الحسابات المالية العامة';

-- ------------------------------------------------------------------------
-- 3. مراكز التكلفة (Cost Centers)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`cost_centers\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`unit_id\` INT UNSIGNED NOT NULL,
  \`code\` VARCHAR(30) NOT NULL UNIQUE,
  \`name_ar\` VARCHAR(100) NOT NULL,
  \`parent_id\` INT UNSIGNED NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT \`fk_cost_centers_unit\` FOREIGN KEY (\`unit_id\`) REFERENCES \`business_units\`(\`id\`),
  CONSTRAINT \`fk_cost_centers_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`cost_centers\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='مراكز التكلفة لتحليل الربحية';

-- ------------------------------------------------------------------------
-- 4. رؤوس قيود اليومية المحاسبية (Journal Entries)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`journal_entries\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`entry_number\` VARCHAR(50) NOT NULL UNIQUE COMMENT 'رقم القيد التسلسلي الآلي',
  \`entry_date\` DATE NOT NULL,
  \`unit_id\` INT UNSIGNED NOT NULL,
  \`reference_type\` VARCHAR(50) NULL COMMENT 'SALES_INVOICE, PURCHASE, MAINTENANCE, EXPENSE, PAYROLL...',
  \`reference_id\` BIGINT UNSIGNED NULL,
  \`description\` TEXT NOT NULL,
  \`is_posted\` TINYINT(1) NOT NULL DEFAULT 1,
  \`is_reversed\` TINYINT(1) NOT NULL DEFAULT 0,
  \`reversed_entry_id\` BIGINT UNSIGNED NULL,
  \`created_by\` INT UNSIGNED NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_journal_unit\` FOREIGN KEY (\`unit_id\`) REFERENCES \`business_units\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='رؤوس قيود اليومية العامة';

-- ------------------------------------------------------------------------
-- 5. أسطر قيود اليومية (Journal Entry Lines)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`journal_entry_lines\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`entry_id\` BIGINT UNSIGNED NOT NULL,
  \`account_id\` INT UNSIGNED NOT NULL,
  \`cost_center_id\` INT UNSIGNED NULL,
  \`debit_amount\` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  \`credit_amount\` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  \`narration\` VARCHAR(255) NULL,
  CONSTRAINT \`fk_jel_entry\` FOREIGN KEY (\`entry_id\`) REFERENCES \`journal_entries\`(\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_jel_account\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`),
  CONSTRAINT \`fk_jel_cost_center\` FOREIGN KEY (\`cost_center_id\`) REFERENCES \`cost_centers\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تفاصيل المدين والدائن للقيود';

-- ------------------------------------------------------------------------
-- 6. جدول العملاء (Customers)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`customer_code\` VARCHAR(30) NOT NULL UNIQUE,
  \`name_ar\` VARCHAR(150) NOT NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`email\` VARCHAR(100) NULL,
  \`customer_type\` ENUM('RETAIL', 'CORPORATE', 'MAINTENANCE', 'ISP_SUBSCRIBER', 'FREELANCE_CLIENT') NOT NULL,
  \`tax_number\` VARCHAR(50) NULL,
  \`address\` TEXT NULL,
  \`credit_limit\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`current_balance\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'الرصيد المدين القائم',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='دليل العملاء ومتابعة المديونيات';

-- ------------------------------------------------------------------------
-- 7. جدول الموردين (Suppliers)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`suppliers\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`supplier_code\` VARCHAR(30) NOT NULL UNIQUE,
  \`name_ar\` VARCHAR(150) NOT NULL,
  \`category\` ENUM('HARDWARE_DISTRIBUTOR', 'ISP_UPSTREAM', 'CLOUD_SOFTWARE_PROVIDER', 'GENERAL') NOT NULL,
  \`contact_person\` VARCHAR(100) NULL,
  \`phone\` VARCHAR(30) NOT NULL,
  \`email\` VARCHAR(100) NULL,
  \`current_balance\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'الرصيد الدائن القائم',
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='دليل الموردين والشركات الموردة';

-- ------------------------------------------------------------------------
-- 8. تصنيفات المنتجات (Product Categories)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`product_categories\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(30) NOT NULL UNIQUE,
  \`name_ar\` VARCHAR(100) NOT NULL,
  \`parent_id\` INT UNSIGNED NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 9. جدول المنتجات والأصناف (Products)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`category_id\` INT UNSIGNED NOT NULL,
  \`barcode\` VARCHAR(50) NULL UNIQUE,
  \`sku\` VARCHAR(50) NOT NULL UNIQUE,
  \`name_ar\` VARCHAR(200) NOT NULL,
  \`product_type\` ENUM('PHYSICAL_GOODS', 'SPARE_PART', 'CCTV_EQUIPMENT', 'NETWORK_EQUIPMENT', 'SERVICE') NOT NULL,
  \`unit_of_measure\` VARCHAR(20) NOT NULL DEFAULT 'PCS',
  \`cost_price\` DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  \`average_cost_price\` DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  \`selling_price\` DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  \`current_stock_quantity\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`reorder_level\` DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  \`requires_serial\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'هل يتطلب تتبع السيريال نمر',
  \`warranty_period_months\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_products_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`product_categories\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='دليل الأصناف والمنتجات والمخزون';

-- ------------------------------------------------------------------------
-- 10. الأرقام التسلسلية للأجهزة (Product Serials)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`product_serials\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`serial_number\` VARCHAR(100) NOT NULL UNIQUE,
  \`status\` ENUM('IN_STOCK', 'SOLD', 'IN_REPAIR', 'DEFECTIVE', 'RESERVED_PROJECT', 'RETURNED') NOT NULL DEFAULT 'IN_STOCK',
  \`purchase_item_id\` BIGINT UNSIGNED NULL,
  \`sale_item_id\` BIGINT UNSIGNED NULL,
  \`warranty_start_date\` DATE NULL,
  \`warranty_expiry_date\` DATE NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_serials_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تتبع السيريال نمر للأجهزة الفردية';

-- ------------------------------------------------------------------------
-- 11. حركات المخزون التفصيلية (Inventory Transactions)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`inventory_transactions\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`serial_id\` BIGINT UNSIGNED NULL,
  \`transaction_type\` ENUM('PURCHASE_IN', 'SALE_OUT', 'MAINTENANCE_OUT', 'PROJECT_OUT', 'RETURN_IN', 'ADJUSTMENT') NOT NULL,
  \`quantity\` DECIMAL(10, 2) NOT NULL,
  \`unit_cost\` DECIMAL(12, 4) NOT NULL,
  \`total_cost\` DECIMAL(14, 4) NOT NULL,
  \`reference_type\` VARCHAR(50) NOT NULL,
  \`reference_id\` BIGINT UNSIGNED NOT NULL,
  \`notes\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_inv_trans_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`),
  CONSTRAINT \`fk_inv_trans_serial\` FOREIGN KEY (\`serial_id\`) REFERENCES \`product_serials\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='حركات المخزون اللحظية';

-- ------------------------------------------------------------------------
-- 12. فواتير المبيعات ونقاط البيع (Sales Invoices)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`sales_invoices\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`invoice_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`unit_id\` INT UNSIGNED NOT NULL DEFAULT 1,
  \`customer_id\` INT UNSIGNED NOT NULL,
  \`invoice_type\` ENUM('POS_RETAIL', 'MAINTENANCE_INVOICE', 'PROJECT_INVOICE', 'FREELANCE_MILESTONE', 'SUBSCRIPTION_MONTHLY') NOT NULL,
  \`invoice_date\` DATE NOT NULL,
  \`subtotal\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`tax_amount\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`discount_amount\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`grand_total\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`paid_amount\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`payment_status\` ENUM('PAID', 'PARTIALLY_PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
  \`notes\` TEXT NULL,
  \`created_by\` INT UNSIGNED NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_sales_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`),
  CONSTRAINT \`fk_sales_unit\` FOREIGN KEY (\`unit_id\`) REFERENCES \`business_units\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='فواتير المبيعات والخدمات';

-- ------------------------------------------------------------------------
-- 13. بنود فواتير المبيعات (Sales Invoice Items)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`sales_invoice_items\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`invoice_id\` BIGINT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NULL,
  \`description_custom\` VARCHAR(255) NULL,
  \`quantity\` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  \`unit_cost\` DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  \`unit_price\` DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  \`discount\` DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  \`total_price\` DECIMAL(12, 2) NOT NULL,
  CONSTRAINT \`fk_sii_invoice\` FOREIGN KEY (\`invoice_id\`) REFERENCES \`sales_invoices\`(\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_sii_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 14. ورشة وتذاكر الصيانة (Maintenance Tickets)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`maintenance_tickets\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`ticket_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_id\` INT UNSIGNED NOT NULL,
  \`technician_id\` INT UNSIGNED NULL,
  \`device_type\` ENUM('LAPTOP', 'DESKTOP_PC', 'MONITOR', 'PRINTER', 'NETWORKING_DEVICE', 'OTHER') NOT NULL,
  \`brand_model\` VARCHAR(100) NOT NULL,
  \`serial_number\` VARCHAR(100) NULL,
  \`reported_problem\` TEXT NOT NULL,
  \`diagnostic_notes\` TEXT NULL,
  \`labor_cost\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`parts_total_cost\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`total_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('RECEIVED', 'IN_DIAGNOSIS', 'WAITING_APPROVAL', 'IN_REPAIR', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'RECEIVED',
  \`warranty_days\` INT UNSIGNED NOT NULL DEFAULT 30,
  \`received_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`delivered_at\` TIMESTAMP NULL,
  CONSTRAINT \`fk_maint_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تذاكر صيانة الأجهزة واللابتوبات';

-- ------------------------------------------------------------------------
-- 15. مشاريع كاميرات المراقبة (CCTV Projects)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`cctv_projects\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`project_code\` VARCHAR(30) NOT NULL UNIQUE,
  \`project_name\` VARCHAR(150) NOT NULL,
  \`customer_id\` INT UNSIGNED NOT NULL,
  \`site_address\` TEXT NOT NULL,
  \`channels_count\` INT UNSIGNED NOT NULL DEFAULT 4,
  \`contract_value\` DECIMAL(12, 2) NOT NULL,
  \`start_date\` DATE NOT NULL,
  \`target_handover_date\` DATE NULL,
  \`actual_handover_date\` DATE NULL,
  \`status\` ENUM('SURVEY_QUOTATION', 'APPROVED', 'IN_INSTALLATION', 'TESTING', 'COMPLETED_HANDED_OVER', 'CANCELLED') NOT NULL DEFAULT 'SURVEY_QUOTATION',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_cctv_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='مشاريع تمديد وتركيب كاميرات المراقبة';

-- ------------------------------------------------------------------------
-- 16. اشتراكات وتوزيع الإنترنت (Internet Subscriptions)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`internet_packages\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`package_name\` VARCHAR(100) NOT NULL,
  \`download_speed_mbps\` INT UNSIGNED NOT NULL,
  \`upload_speed_mbps\` INT UNSIGNED NOT NULL,
  \`monthly_fee\` DECIMAL(10, 2) NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`internet_subscriptions\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`subscription_code\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_id\` INT UNSIGNED NOT NULL,
  \`package_id\` INT UNSIGNED NOT NULL,
  \`cpe_serial_number\` VARCHAR(100) NULL,
  \`cpe_deposit_amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`ip_address\` VARCHAR(45) NULL,
  \`tower_node_name\` VARCHAR(100) NULL,
  \`start_date\` DATE NOT NULL,
  \`expiry_date\` DATE NOT NULL,
  \`monthly_fee\` DECIMAL(10, 2) NOT NULL,
  \`status\` ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED_OVERDUE', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_sub_cust\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`),
  CONSTRAINT \`fk_sub_pkg\` FOREIGN KEY (\`package_id\`) REFERENCES \`internet_packages\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='اشتراكات الإنترنت للمستخدمين';

-- ------------------------------------------------------------------------
-- 17. مشاريع البرمجيات والعمل الحر (Freelance Projects)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`freelance_projects\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`project_code\` VARCHAR(30) NOT NULL UNIQUE,
  \`title\` VARCHAR(200) NOT NULL,
  \`client_id\` INT UNSIGNED NOT NULL,
  \`pricing_model\` ENUM('FIXED_PRICE', 'HOURLY_RATE', 'MONTHLY_RETAINER') NOT NULL DEFAULT 'FIXED_PRICE',
  \`contract_amount\` DECIMAL(12, 2) NOT NULL,
  \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
  \`start_date\` DATE NOT NULL,
  \`deadline\` DATE NULL,
  \`github_repo\` VARCHAR(255) NULL,
  \`status\` ENUM('PROPOSAL', 'ACTIVE', 'IN_QA', 'DELIVERED', 'MAINTENANCE_SUPPORT', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_freelance_client\` FOREIGN KEY (\`client_id\`) REFERENCES \`customers\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='مشاريع البرمجيات الحرة';

-- ------------------------------------------------------------------------
-- 18. مراحل المشاريع البرمجية (Project Milestones)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`project_milestones\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`project_id\` INT UNSIGNED NOT NULL,
  \`title\` VARCHAR(150) NOT NULL,
  \`deliverables\` TEXT NOT NULL,
  \`amount\` DECIMAL(12, 2) NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`is_approved\` TINYINT(1) NOT NULL DEFAULT 0,
  \`approved_at\` TIMESTAMP NULL,
  \`invoice_id\` BIGINT UNSIGNED NULL,
  CONSTRAINT \`fk_milestone_proj\` FOREIGN KEY (\`project_id\`) REFERENCES \`freelance_projects\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- 19. الحسابات المالية والخزينة (Treasury Accounts)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`treasury_accounts\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`account_name_ar\` VARCHAR(100) NOT NULL,
  \`account_type\` ENUM('CASH_DRAWER', 'VAULT', 'PETTY_CASH', 'BANK_ACCOUNT', 'DIGITAL_WALLET', 'PAYMENT_GATEWAY') NOT NULL,
  \`gl_account_id\` INT UNSIGNED NOT NULL,
  \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
  \`current_balance\` DECIMAL(14, 4) NOT NULL DEFAULT 0.0000,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT \`fk_treasury_gl\` FOREIGN KEY (\`gl_account_id\`) REFERENCES \`accounts\`(\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='حسابات الخزينة والبنوك والمحافظ الإلكترونية';

-- ------------------------------------------------------------------------
-- 20. سجل تدقيق العمليات والأمان (Audit Logs)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT UNSIGNED NULL,
  \`unit_id\` INT UNSIGNED NULL,
  \`action_type\` VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, EXPORT, CLOSE_PERIOD',
  \`entity_type\` VARCHAR(50) NOT NULL COMMENT 'INVOICE, PRODUCT, JOURNAL_ENTRY, TICKET, USER...',
  \`entity_id\` BIGINT UNSIGNED NOT NULL,
  \`old_values_json\` JSON NULL,
  \`new_values_json\` JSON NULL,
  \`ip_address\` VARCHAR(45) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل تدقيق أمني غير قابل للتعديل';

SET FOREIGN_KEY_CHECKS = 1;
`;

export const SCHEMA_TABLE_LIST: TableDefinition[] = [
  {
    name: "business_units",
    nameAr: "وحدات الأعمال",
    category: "الهيكل العام",
    descriptionAr: "تعريف قطاعي النشاط (متجر التقنية والخدمات الميدانية vs تطوير البرمجيات الحرة).",
    columns: [
      { name: "id", type: "INT UNSIGNED", isPrimary: true, descriptionAr: "المعرف الفريد" },
      { name: "code", type: "VARCHAR(20)", isNullable: false, descriptionAr: "كود الوحدة (SHOP / FREELANCE)" },
      { name: "name_ar", type: "VARCHAR(100)", isNullable: false, descriptionAr: "الاسم بالعربية" },
      { name: "is_active", type: "TINYINT(1)", descriptionAr: "حالة التفعيل" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (code)"]
  },
  {
    name: "accounts",
    nameAr: "دليل الحسابات (شجرة الحسابات)",
    category: "المحاسبة العامة",
    descriptionAr: "دليل الحسابات المالي الشجري المزدوج لكل من الأصول، الخصوم، حقوق الملكية، الإيرادات والمصاريف.",
    columns: [
      { name: "id", type: "INT UNSIGNED", isPrimary: true, descriptionAr: "معرف الحساب" },
      { name: "account_code", type: "VARCHAR(30)", isNullable: false, descriptionAr: "الرمز المحاسبي (مثال 1110)" },
      { name: "name_ar", type: "VARCHAR(150)", isNullable: false, descriptionAr: "اسم الحساب بالعربية" },
      { name: "account_type", type: "ENUM", isNullable: false, descriptionAr: "طبيعة الحساب (أصل، التزام، إيراد...)" },
      { name: "unit_scope", type: "ENUM", isNullable: false, descriptionAr: "تبعية الحساب (SHOP/FREELANCE/BOTH)" },
      { name: "current_balance", type: "DECIMAL(14,4)", descriptionAr: "الرصيد الدفتري الحالي" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (account_code)", "INDEX (parent_id)", "INDEX (account_type)"]
  },
  {
    name: "journal_entries",
    nameAr: "رؤوس قيود اليومية",
    category: "المحاسبة العامة",
    descriptionAr: "القيود المحاسبية التلقائية الناتجة عن كافة الحركات التشغيلية والمالية.",
    columns: [
      { name: "id", type: "BIGINT UNSIGNED", isPrimary: true, descriptionAr: "معرف القيد" },
      { name: "entry_number", type: "VARCHAR(50)", isNullable: false, descriptionAr: "رقم القيد التسلسلي" },
      { name: "entry_date", type: "DATE", isNullable: false, descriptionAr: "تاريخ القيد" },
      { name: "unit_id", type: "INT UNSIGNED", foreignKey: "business_units(id)", descriptionAr: "وحدة العمل" },
      { name: "reference_type", type: "VARCHAR(50)", descriptionAr: "المستند المصدري" },
      { name: "is_posted", type: "TINYINT(1)", descriptionAr: "حالة الترحيل" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (entry_number)", "INDEX (entry_date)", "INDEX (unit_id)"]
  },
  {
    name: "products",
    nameAr: "المنتجات والمخزون",
    category: "المخزون والمتجر",
    descriptionAr: "سجل المنتجات والأجهزة وقطع الغيار مع الأسعار ومتوسط التكلفة وسياسة السيريال.",
    columns: [
      { name: "id", type: "INT UNSIGNED", isPrimary: true, descriptionAr: "معرف الصنف" },
      { name: "sku", type: "VARCHAR(50)", isNullable: false, descriptionAr: "رمز التخزين الفريد" },
      { name: "barcode", type: "VARCHAR(50)", descriptionAr: "باركود الصنف الدولي" },
      { name: "name_ar", type: "VARCHAR(200)", isNullable: false, descriptionAr: "اسم المنتج" },
      { name: "cost_price", type: "DECIMAL(12,4)", descriptionAr: "سعر آخر شراء" },
      { name: "average_cost_price", type: "DECIMAL(12,4)", descriptionAr: "متوسط التكلفة المرجح" },
      { name: "selling_price", type: "DECIMAL(12,4)", descriptionAr: "سعر البيع الافتراضي" },
      { name: "current_stock_quantity", type: "DECIMAL(10,2)", descriptionAr: "الكمية المتاحة في المخزن" },
      { name: "requires_serial", type: "TINYINT(1)", descriptionAr: "هل الصنف يتطلب سيريال نمر؟" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (sku)", "INDEX (barcode)", "INDEX (category_id)"]
  },
  {
    name: "product_serials",
    nameAr: "الأرقام التسلسلية للأجهزة",
    category: "المخزون والمتجر",
    descriptionAr: "تتبع حالة الأجهزة الفردية (لابتوب، كاميرا، NVR، شاشة) عبر السيريال الفريد والضمان.",
    columns: [
      { name: "id", type: "BIGINT UNSIGNED", isPrimary: true, descriptionAr: "معرف السيريال" },
      { name: "product_id", type: "INT UNSIGNED", foreignKey: "products(id)", descriptionAr: "المنتج التابع له" },
      { name: "serial_number", type: "VARCHAR(100)", isNullable: false, descriptionAr: "الرقم التسلسلي الفريد" },
      { name: "status", type: "ENUM", isNullable: false, descriptionAr: "الحالة (IN_STOCK / SOLD / IN_REPAIR...)" },
      { name: "warranty_expiry_date", type: "DATE", descriptionAr: "تاريخ انتهاء الضمان" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (serial_number)", "INDEX (product_id)", "INDEX (status)"]
  },
  {
    name: "maintenance_tickets",
    nameAr: "تذاكر ورشة الصيانة",
    category: "المتجر والخدمات",
    descriptionAr: "سجل صيانة الأجهزة واللابتوبات، التشخيص الفني، أجور اليد، وقطع الغيار المركبة.",
    columns: [
      { name: "id", type: "BIGINT UNSIGNED", isPrimary: true, descriptionAr: "معرف التذكرة" },
      { name: "ticket_number", type: "VARCHAR(50)", isNullable: false, descriptionAr: "رقم تذكرة الصيانة" },
      { name: "customer_id", type: "INT UNSIGNED", foreignKey: "customers(id)", descriptionAr: "العميل" },
      { name: "device_type", type: "ENUM", isNullable: false, descriptionAr: "نوع الجهاز (LAPTOP, DESKTOP...)" },
      { name: "status", type: "ENUM", isNullable: false, descriptionAr: "حالة التذكرة (RECEIVED, IN_REPAIR, READY...)" },
      { name: "labor_cost", type: "DECIMAL(10,2)", descriptionAr: "أجور يد الصيانة (إيراد نقي)" },
      { name: "parts_total_cost", type: "DECIMAL(10,2)", descriptionAr: "تكلفة قطع الغيار المستهلكة" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (ticket_number)", "INDEX (customer_id)", "INDEX (status)"]
  },
  {
    name: "internet_subscriptions",
    nameAr: "اشتراكات الإنترنت",
    category: "المتجر والشبكات",
    descriptionAr: "إدارة المشتركين في شبكة الإنترنت، الباقات، دورات الفوترة، وتأمين الأجهزة.",
    columns: [
      { name: "id", type: "BIGINT UNSIGNED", isPrimary: true, descriptionAr: "معرف الاشتراك" },
      { name: "subscription_code", type: "VARCHAR(50)", isNullable: false, descriptionAr: "كود الاشتراك" },
      { name: "customer_id", type: "INT UNSIGNED", foreignKey: "customers(id)", descriptionAr: "العميل المشترك" },
      { name: "package_id", type: "INT UNSIGNED", foreignKey: "internet_packages(id)", descriptionAr: "باقة الإنترنت" },
      { name: "expiry_date", type: "DATE", isNullable: false, descriptionAr: "تاريخ نهاية الاشتراك" },
      { name: "status", type: "ENUM", isNullable: false, descriptionAr: "الحالة (نشط، منتهي، معلق)" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (subscription_code)", "INDEX (customer_id)", "INDEX (expiry_date)"]
  },
  {
    name: "freelance_projects",
    nameAr: "مشاريع البرمجيات الحرة",
    category: "تطوير البرمجيات",
    descriptionAr: "عقود ومشاريع البرمجة الحرة والمراحل والتكاليف المباشرة وحساب صافي الربحية.",
    columns: [
      { name: "id", type: "INT UNSIGNED", isPrimary: true, descriptionAr: "معرف المشروع" },
      { name: "project_code", type: "VARCHAR(30)", isNullable: false, descriptionAr: "كود المشروع" },
      { name: "title", type: "VARCHAR(200)", isNullable: false, descriptionAr: "عنوان المشروع البرمجي" },
      { name: "client_id", type: "INT UNSIGNED", foreignKey: "customers(id)", descriptionAr: "عميل البرمجيات" },
      { name: "contract_amount", type: "DECIMAL(12,2)", isNullable: false, descriptionAr: "قيمة العقد الإجمالية" },
      { name: "pricing_model", type: "ENUM", isNullable: false, descriptionAr: "نموذج التسعير (سعر ثابت / بالساعة)" },
      { name: "status", type: "ENUM", isNullable: false, descriptionAr: "حالة المشروع" }
    ],
    indexes: ["PRIMARY (id)", "UNIQUE (project_code)", "INDEX (client_id)", "INDEX (status)"]
  }
];
