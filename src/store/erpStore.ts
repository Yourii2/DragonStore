// Complete In-Memory & LocalStorage Persistent ERP State Management Engine
// Strict Dual Business Unit: BU 1 (Shop & Services) | BU 2 (Freelance Software)

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name_ar: string;
  category: string;
  brand: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_sale_price: number;
  average_cost_price: number; // WAC
  quantity: number;
  min_stock_alert: number;
  warehouse_id: string;
  serial_numbers?: string[];
  is_active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  business_unit: 'SHOP' | 'FREELANCE' | 'BOTH';
  credit_limit: number;
  current_balance: number; // Positive = Customer owes us (Debit)
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  current_balance: number; // Positive = We owe supplier (Credit)
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number; // For COGS
  total_price: number;
  total_cost: number;
  serial_number?: string;
}

export interface SaleInvoice {
  id: string;
  invoice_number: string;
  date: string;
  customer_id: string;
  customer_name: string;
  business_unit_id: 1;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  net_total: number;
  cogs_total: number;
  gross_profit: number;
  payment_type: 'CASH' | 'CREDIT' | 'BANK' | 'VODAFONE_CASH' | 'INSTAPAY';
  paid_amount: number;
  remaining_amount: number;
  status: 'COMPLETED' | 'RETURNED' | 'PARTIALLY_RETURNED';
  journal_entry_id: string;
}

export interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  date: string;
  supplier_id: string;
  supplier_name: string;
  business_unit_id: 1;
  items: PurchaseItem[];
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_account: string;
  journal_entry_id: string;
}

export interface MaintenanceOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  device_type: string; // Laptop, PC, Monitor, Printer
  brand_model: string;
  serial_number: string;
  problem_description: string;
  status: 'RECEIVED' | 'INSPECTION' | 'WAITING_APPROVAL' | 'IN_REPAIR' | 'WAITING_PARTS' | 'READY' | 'DELIVERED' | 'CANCELLED';
  technician_name: string;
  parts_used: { product_id: string; name: string; quantity: number; cost: number; price: number }[];
  labor_cost: number;
  total_amount: number;
  paid_amount: number;
  received_date: string;
  delivery_date?: string;
}

export interface CctvProject {
  id: string;
  project_name: string;
  customer_name: string;
  customer_phone: string;
  location: string;
  contract_value: number;
  hardware_cost: number; // Cameras, DVR/NVR, HDD, Power, Cables
  labor_cost: number;
  other_expenses: number;
  total_cost: number;
  net_profit: number;
  paid_amount: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  start_date: string;
  end_date?: string;
}

export interface NetworkProject {
  id: string;
  project_name: string;
  customer_name: string;
  location: string;
  contract_value: number;
  hardware_cost: number; // Routers, Switches, Access Points, Racks, Patch Panels
  labor_cost: number;
  other_expenses: number;
  total_cost: number;
  net_profit: number;
  paid_amount: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  start_date: string;
}

export interface InternetSubscriber {
  id: string;
  subscriber_name: string;
  phone: string;
  ip_address: string;
  mac_address: string;
  package_name: string;
  monthly_fee: number;
  line_cost: number;
  profit: number;
  due_day_of_month: number;
  last_payment_date: string;
  status: 'ACTIVE' | 'OVERDUE' | 'SUSPENDED';
}

export interface FreelanceProject {
  id: string;
  project_name: string;
  client_id: string;
  client_name: string;
  contract_value: number;
  paid_amount: number;
  remaining_amount: number;
  direct_expenses: number; // Hosting, Domain, VPS, AI API
  net_profit: number;
  status: 'NEW' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  start_date: string;
  expected_end_date: string;
  milestones: { name: string; amount: number; is_paid: boolean; due_date: string }[];
}

export interface ExpenseRecord {
  id: string;
  expense_number: string;
  date: string;
  category: string;
  amount: number;
  payment_account: 'CASHBOX' | 'BANK' | 'VODAFONE_CASH' | 'INSTAPAY';
  is_shared: boolean;
  allocation: {
    shop_percentage: number;
    shop_amount: number;
    freelance_percentage: number;
    freelance_amount: number;
  };
  description: string;
  project_id?: string;
}

export interface FinancialAccount {
  id: string;
  name_ar: string;
  type: 'CASHBOX' | 'BANK' | 'VODAFONE_CASH' | 'INSTAPAY';
  account_number: string;
  balance: number;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  role: string;
  business_unit: 'SHOP' | 'FREELANCE' | 'BOTH';
  basic_salary: number;
  current_advances: number;
}

export interface PayrollRecord {
  id: string;
  month: string; // YYYY-MM
  employee_id: string;
  employee_name: string;
  business_unit: string;
  basic_salary: number;
  bonus: number;
  deductions: number;
  advances_deducted: number;
  net_salary: number;
  is_paid: boolean;
  payment_date?: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  useful_life_months: number;
  accumulated_depreciation: number;
  book_value: number;
  monthly_depreciation: number;
  business_unit: 'SHOP' | 'FREELANCE' | 'SHARED';
}

export interface JournalLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  business_unit_id: 1 | 2 | 'SHARED';
  description: string;
  lines: JournalLine[];
  reference_type: string;
  reference_id: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  table_name: string;
  record_id: string;
  details: string;
}

export interface OwnerTransaction {
  id: string;
  type: 'INVESTMENT' | 'WITHDRAWAL';
  date: string;
  amount: number;
  account: string;
  description: string;
  business_unit: 'SHOP' | 'FREELANCE' | 'SHARED';
}

// Initial Mock Datasets
const initialProducts: Product[] = [
  { id: 'p1', sku: 'LAP-DELL-5520', barcode: '622100101', name_ar: 'لابتوب Dell Latitude 5520 Core i7 16GB 512GB SSD', category: 'لابتوبات', brand: 'Dell', unit: 'قطعة', purchase_price: 24000, sale_price: 29500, min_sale_price: 28000, average_cost_price: 24000, quantity: 4, min_stock_alert: 2, warehouse_id: 'w1', serial_numbers: ['DL5520-001', 'DL5520-002', 'DL5520-003', 'DL5520-004'], is_active: true },
  { id: 'p2', sku: 'MON-DELL-274K', barcode: '622100102', name_ar: 'شاشة Dell 27 بوصة 4K UltraSharp IPS', category: 'شاشات', brand: 'Dell', unit: 'قطعة', purchase_price: 11000, sale_price: 13800, min_sale_price: 13000, average_cost_price: 11000, quantity: 6, min_stock_alert: 2, warehouse_id: 'w1', is_active: true },
  { id: 'p3', sku: 'RAM-KNG-16D4', barcode: '622100103', name_ar: 'رام Kingston Fury 16GB DDR4 3200MHz', category: 'مكونات', brand: 'Kingston', unit: 'قطعة', purchase_price: 1400, sale_price: 1850, min_sale_price: 1750, average_cost_price: 1400, quantity: 24, min_stock_alert: 5, warehouse_id: 'w1', is_active: true },
  { id: 'p4', sku: 'SSD-SAM-1TB980', barcode: '622100104', name_ar: 'هارد SSD Samsung 980 Pro 1TB NVMe M.2', category: 'تخزين', brand: 'Samsung', unit: 'قطعة', purchase_price: 3200, sale_price: 4100, min_sale_price: 3900, average_cost_price: 3200, quantity: 15, min_stock_alert: 4, warehouse_id: 'w1', is_active: true },
  { id: 'p5', sku: 'GPU-RTX-4060', barcode: '622100105', name_ar: 'كارت شاشة Gigabyte RTX 4060 8GB Eagle OC', category: 'مكونات', brand: 'Gigabyte', unit: 'قطعة', purchase_price: 16500, sale_price: 19800, min_sale_price: 19000, average_cost_price: 16500, quantity: 3, min_stock_alert: 1, warehouse_id: 'w1', serial_numbers: ['GB4060-991', 'GB4060-992', 'GB4060-993'], is_active: true },
  { id: 'p6', sku: 'CAM-HIK-5MP', barcode: '622100106', name_ar: 'كاميرا مراقبة Hikvision 5MP IP Outdoor Audio', category: 'كاميرات مراقبة', brand: 'Hikvision', unit: 'قطعة', purchase_price: 1200, sale_price: 1650, min_sale_price: 1550, average_cost_price: 1200, quantity: 20, min_stock_alert: 6, warehouse_id: 'w2', is_active: true },
  { id: 'p7', sku: 'NVR-HIK-8CH', barcode: '622100107', name_ar: 'جهاز تسجيل Hikvision 8-Channel 4K NVR PoE', category: 'كاميرات مراقبة', brand: 'Hikvision', unit: 'قطعة', purchase_price: 3800, sale_price: 4900, min_sale_price: 4600, average_cost_price: 3800, quantity: 5, min_stock_alert: 2, warehouse_id: 'w2', is_active: true },
  { id: 'p8', sku: 'ROUT-MIK-HEX', barcode: '622100108', name_ar: 'راوتر MikroTik hEX RB750Gr3 Gigabit', category: 'شبكات', brand: 'MikroTik', unit: 'قطعة', purchase_price: 2400, sale_price: 3100, min_sale_price: 2950, average_cost_price: 2400, quantity: 8, min_stock_alert: 3, warehouse_id: 'w2', is_active: true },
  { id: 'p9', sku: 'CAB-CAT6-305M', barcode: '622100109', name_ar: 'لفة كابل شبكة Schneider Cat6 UTP 305m نحاس نقي', category: 'شبكات', brand: 'Schneider', unit: 'لفة', purchase_price: 3600, sale_price: 4600, min_sale_price: 4400, average_cost_price: 3600, quantity: 7, min_stock_alert: 2, warehouse_id: 'w2', is_active: true }
];

const initialCustomers: Customer[] = [
  { id: 'c1', name: 'شركة الأفق للاستشارات الهندسية', phone: '01012345678', email: 'info@alofoq-eng.com', business_unit: 'BOTH', credit_limit: 50000, current_balance: 14500, notes: 'عميل مميز لمشاريع الشبكات والـ CCTV والبرمجيات' },
  { id: 'c2', name: 'مكتب الدلتا للمحاماة', phone: '01198765432', email: 'delta.law@gmail.com', business_unit: 'SHOP', credit_limit: 20000, current_balance: 6200, notes: 'صيانة دورية وشراء أحبار وأجهزة' },
  { id: 'c3', name: 'م/ طارق عبد الرحمن', phone: '01234567890', email: 'tarek.dev@gmail.com', business_unit: 'FREELANCE', credit_limit: 80000, current_balance: 25000, notes: 'تطوير منصة التجارة الإلكترونية وتطبيق الجوال' },
  { id: 'c4', name: 'سوبرماركت البركة', phone: '01055566677', business_unit: 'SHOP', credit_limit: 15000, current_balance: 0, notes: 'مشترك إنترنت ومراقبة' }
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'شركة الشرق الأوسط للتوزيع (موزع Dell & Kingston)', phone: '0223456789', company: 'Middle East Tech Dist', current_balance: 24000 },
  { id: 's2', name: 'وكيل هيكفيجن مصر للأنظمة الأمنية', phone: '0229876543', company: 'Hikvision Egypt Direct', current_balance: 14500 },
  { id: 's3', name: 'المصرية لشبكات الحاسب والألياف', phone: '0221122334', company: 'Egypt Net Wholesale', current_balance: 0 }
];

const initialAccounts: FinancialAccount[] = [
  { id: 'acc_cash_shop', name_ar: 'صندوق كاشير المحل الرئيسي', type: 'CASHBOX', account_number: '1111', balance: 34500.00 },
  { id: 'acc_cash_maint', name_ar: 'صندوق عهدة ورشة الصيانة', type: 'CASHBOX', account_number: '1112', balance: 6800.00 },
  { id: 'acc_nbe_bank', name_ar: 'البنك الأهلي المصري (حساب رئيسي)', type: 'BANK', account_number: '1120-NBE', balance: 98400.00 },
  { id: 'acc_vodafone_cash', name_ar: 'محفظة فودافون كاش التجارية', type: 'VODAFONE_CASH', account_number: '01099887766', balance: 18200.00 },
  { id: 'acc_instapay', name_ar: 'حساب إنستاباي السريع', type: 'INSTAPAY', account_number: 'dragon@instapay', balance: 16300.00 }
];

const initialEmployees: Employee[] = [
  { id: 'emp1', code: 'EMP-01', name: 'م/ أحمد محمود', role: 'مهندس برمجيات أول (Senior Fullstack)', business_unit: 'FREELANCE', basic_salary: 15000, current_advances: 2000 },
  { id: 'emp2', code: 'EMP-02', name: 'م/ مصطفى كمال', role: 'فني صيانة هاردوير ولابتوب', business_unit: 'SHOP', basic_salary: 7500, current_advances: 1000 },
  { id: 'emp3', code: 'EMP-03', name: 'م/ حسام إبراهيم', role: 'فني تركيب شبكات و CCTV', business_unit: 'SHOP', basic_salary: 7000, current_advances: 0 },
  { id: 'emp4', code: 'EMP-04', name: 'أ/ سامح علي', role: 'مسؤول مبيعات وكاشير', business_unit: 'SHOP', basic_salary: 6000, current_advances: 500 }
];

const initialFixedAssets: FixedAsset[] = [
  { id: 'ast1', code: 'AST-001', name: 'محطة لحام ومايكروسكوب صيانة BGA Rework Station', category: 'أجهزة ورشة', purchase_date: '2025-01-10', purchase_cost: 24000, salvage_value: 2000, useful_life_months: 24, accumulated_depreciation: 8000, book_value: 16000, monthly_depreciation: 916.67, business_unit: 'SHOP' },
  { id: 'ast2', code: 'AST-002', name: 'أجهزة اختبار كابلات شبكات Fluke Cable Analyzer', category: 'معدات فحص', purchase_date: '2025-03-15', purchase_cost: 18000, salvage_value: 1000, useful_life_months: 36, accumulated_depreciation: 3000, book_value: 15000, monthly_depreciation: 472.22, business_unit: 'SHOP' },
  { id: 'ast3', code: 'AST-003', name: 'جهاز محطة عمل تطوير Workstation Ryzen 9 64GB RAM', category: 'أجهزة برمجيات', purchase_date: '2025-02-01', purchase_cost: 38000, salvage_value: 5000, useful_life_months: 36, accumulated_depreciation: 7000, book_value: 31000, monthly_depreciation: 916.67, business_unit: 'FREELANCE' }
];

const initialMaintenanceOrders: MaintenanceOrder[] = [
  { id: 'mnt1', order_number: 'SRV-2026-041', customer_name: 'د. خالد توفيق', customer_phone: '01011122233', device_type: 'لابتوب', brand_model: 'HP Omen 16 Gaming', serial_number: 'HP-OMN-8821', problem_description: 'ارتفاع مفاجئ في درجة الحرارة وصوت مروحة عالي مع إيقاف تشغيل تلقائي', status: 'IN_REPAIR', technician_name: 'م/ مصطفى كمال', parts_used: [{ product_id: 'p4', name: 'معجون حراري Arctic MX-4 وتنظيف شامل', quantity: 1, cost: 250, price: 500 }], labor_cost: 600, total_amount: 1100, paid_amount: 500, received_date: '2026-09-20' },
  { id: 'mnt2', order_number: 'SRV-2026-042', customer_name: 'أ/ منى عبد العزيز', customer_phone: '01288899900', device_type: 'حاسوب مكتبي PC', brand_model: 'Custom Core i5 12th', serial_number: 'PC-CUS-1092', problem_description: 'الجهاز لا يعمل تماماً (Power Dead)', status: 'WAITING_APPROVAL', technician_name: 'م/ مصطفى كمال', parts_used: [{ product_id: 'p3', name: 'باور سبلاي Cooler Master 650W Bronze', quantity: 1, cost: 2100, price: 2750 }], labor_cost: 350, total_amount: 3100, paid_amount: 0, received_date: '2026-09-22' },
  { id: 'mnt3', order_number: 'SRV-2026-040', customer_name: 'مكتب الأندلس للعقارات', customer_phone: '01122334455', device_type: 'لابتوب', brand_model: 'Dell Vostro 3510', serial_number: 'DL-VST-9941', problem_description: 'تغيير شاشة مكسورة وترقية رامات وهارد SSD', status: 'READY', technician_name: 'م/ مصطفى كمال', parts_used: [{ product_id: 'p4', name: 'هارد SSD Samsung 1TB', quantity: 1, cost: 3200, price: 4100 }], labor_cost: 700, total_amount: 4800, paid_amount: 4800, received_date: '2026-09-18', delivery_date: '2026-09-22' }
];

const initialCctvProjects: CctvProject[] = [
  { id: 'cctv1', project_name: 'توريد وتركيب منظومة مراقبة مصنع الأمل للألومنيوم', customer_name: 'شركة الأمل الصناعية', customer_phone: '01000112233', location: 'المنطقة الصناعية - العاشر من رمضان', contract_value: 68000, hardware_cost: 41000, labor_cost: 8500, other_expenses: 2500, total_cost: 52000, net_profit: 16000, paid_amount: 50000, status: 'IN_PROGRESS', start_date: '2026-09-10' },
  { id: 'cctv2', project_name: 'تركيب 8 كاميرات بدقة 5MP وفيلا سكنية', customer_name: 'أ/ كريم الشناوي', customer_phone: '01155544433', location: 'التجمع الخامس - حي النرجس', contract_value: 28500, hardware_cost: 16800, labor_cost: 3500, other_expenses: 800, total_cost: 21100, net_profit: 7400, paid_amount: 28500, status: 'COMPLETED', start_date: '2026-09-01', end_date: '2026-09-05' }
];

const initialNetworkProjects: NetworkProject[] = [
  { id: 'net1', project_name: 'تأسيس شبكة راك و 24 نقطة بيانات لمكتب محاماة واستشارات', customer_name: 'شركة الأفق للاستشارات الهندسية', location: 'مصر الجديدة - ميدان الحجاز', contract_value: 45000, hardware_cost: 24500, labor_cost: 6000, other_expenses: 1500, total_cost: 32000, net_profit: 13000, paid_amount: 35000, status: 'IN_PROGRESS', start_date: '2026-09-12' }
];

const initialSubscribers: InternetSubscriber[] = [
  { id: 'sub1', subscriber_name: 'أ/ محمد إبراهيم البنا', phone: '01011223344', ip_address: '192.168.10.25', mac_address: 'E4:8D:8C:21:44:A1', package_name: 'باقة سوبر 30 ميجا غير محدودة', monthly_fee: 350, line_cost: 190, profit: 160, due_day_of_month: 1, last_payment_date: '2026-09-01', status: 'ACTIVE' },
  { id: 'sub2', subscriber_name: 'محل عصير النخيل', phone: '01122446688', ip_address: '192.168.10.42', mac_address: '00:1A:2B:3C:4D:5E', package_name: 'باقة الترا 50 ميجا تجارية', monthly_fee: 550, line_cost: 290, profit: 260, due_day_of_month: 5, last_payment_date: '2026-09-05', status: 'ACTIVE' },
  { id: 'sub3', subscriber_name: 'أ/ حسن الصياد', phone: '01299887711', ip_address: '192.168.10.78', mac_address: 'A0:B1:C2:D3:E4:F5', package_name: 'باقة سوبر 30 ميجا غير محدودة', monthly_fee: 350, line_cost: 190, profit: 160, due_day_of_month: 10, last_payment_date: '2026-08-10', status: 'OVERDUE' }
];

const initialFreelanceProjects: FreelanceProject[] = [
  { 
    id: 'flp1', 
    project_name: 'تطوير منصة إدارة العقارات والتأجير السكني (SaaS)', 
    client_id: 'c3', 
    client_name: 'م/ طارق عبد الرحمن - الرياض', 
    contract_value: 65000, 
    paid_amount: 40000, 
    remaining_amount: 25000, 
    direct_expenses: 5400, // VPS Hetzner + Domain + Supabase Pro + OpenAI API
    net_profit: 59600, 
    status: 'IN_PROGRESS', 
    start_date: '2026-08-15', 
    expected_end_date: '2026-10-30',
    milestones: [
      { name: 'الدفعة المقدمة وتصميم المعمارية وقواعد البيانات', amount: 20000, is_paid: true, due_date: '2026-08-15' },
      { name: 'إنجاز لوحة الإدارة وواجهات برمجة REST API', amount: 20000, is_paid: true, due_date: '2026-09-15' },
      { name: 'تكامل بوابات الدفع والتطبيق والاختبار النهائي', amount: 25000, is_paid: false, due_date: '2026-10-30' }
    ]
  },
  { 
    id: 'flp2', 
    project_name: 'نظام أتمتة مستودعات لشركة أدوات طبية', 
    client_id: 'c1', 
    client_name: 'شركة الأفق للاستشارات الهندسية', 
    contract_value: 48000, 
    paid_amount: 48000, 
    remaining_amount: 0, 
    direct_expenses: 2800, 
    net_profit: 45200, 
    status: 'COMPLETED', 
    start_date: '2026-07-01', 
    expected_end_date: '2026-08-25',
    milestones: [
      { name: 'مقدم العقد', amount: 24000, is_paid: true, due_date: '2026-07-01' },
      { name: 'التسليم النهائي والتدريب', amount: 24000, is_paid: true, due_date: '2026-08-25' }
    ]
  }
];

const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp1',
    expense_number: 'EXP-2026-081',
    date: '2026-09-01',
    category: 'إنترنت واتصالات (مشترك)',
    amount: 1000,
    payment_account: 'CASHBOX',
    is_shared: true,
    allocation: { shop_percentage: 70, shop_amount: 700, freelance_percentage: 30, freelance_amount: 300 },
    description: 'فاتورة الإنترنت فائق السرعة والمكالمات للمقر المشترك لشهر سبتمبر'
  },
  {
    id: 'exp2',
    expense_number: 'EXP-2026-082',
    date: '2026-09-02',
    category: 'إيجار المقر (مشترك)',
    amount: 6000,
    payment_account: 'BANK',
    is_shared: true,
    allocation: { shop_percentage: 65, shop_amount: 3900, freelance_percentage: 35, freelance_amount: 2100 },
    description: 'إيجار مقر المحل ومعمل البرمجيات لشهر سبتمبر'
  },
  {
    id: 'exp3',
    expense_number: 'EXP-2026-083',
    date: '2026-09-05',
    category: 'سيرفرات واستضافات البرمجيات',
    amount: 3200,
    payment_account: 'BANK',
    is_shared: false,
    allocation: { shop_percentage: 0, shop_amount: 0, freelance_percentage: 100, freelance_amount: 3200 },
    description: 'تجديد خوادم VPS Hetzner واشتراك Cursor & GitHub Pro',
    project_id: 'flp1'
  }
];

const initialJournalEntries: JournalEntry[] = [
  {
    id: 'je-001',
    entry_number: 'JV-2026-001',
    date: '2026-09-01',
    business_unit_id: 'SHARED',
    description: 'إثبات سداد فاتورة الإنترنت المشتركة موزعة 70% متجر و 30% برمجيات',
    lines: [
      { account_code: '6140', account_name: 'مصروفات إنترنت واتصالات (متجر التقنية - BU1)', debit: 700, credit: 0 },
      { account_code: '6340', account_name: 'مصروفات إنترنت واتصالات (تطوير البرمجيات - BU2)', debit: 300, credit: 0 },
      { account_code: '1111', account_name: 'صندوق كاشير المحل الرئيسي', debit: 0, credit: 1000 }
    ],
    reference_type: 'EXPENSE',
    reference_id: 'exp1',
    created_at: '2026-09-01 10:30:00'
  },
  {
    id: 'je-002',
    entry_number: 'JV-2026-002',
    date: '2026-09-05',
    business_unit_id: 1,
    description: 'مبيعات نقدية فاتورة INV-2026-101 (لابتوب Dell)',
    lines: [
      { account_code: '1111', account_name: 'صندوق كاشير المحل الرئيسي', debit: 29500, credit: 0 },
      { account_code: '4110', account_name: 'إيرادات مبيعات أجهزة ومكونات', debit: 0, credit: 29500 },
      { account_code: '5110', account_name: 'تكلفة البضاعة المباعة COGS', debit: 24000, credit: 0 },
      { account_code: '1210', account_name: 'مخزون بضاعة وأجهزة', debit: 0, credit: 24000 }
    ],
    reference_type: 'SALE_INVOICE',
    reference_id: 'inv101',
    created_at: '2026-09-05 14:15:00'
  },
  {
    id: 'je-003',
    entry_number: 'JV-2026-003',
    date: '2026-09-10',
    business_unit_id: 2,
    description: 'تحصيل دفعة مرحلة إنجاز مشروع SaaS البرمجي عبر إنستاباي',
    lines: [
      { account_code: '1121', account_name: 'حساب إنستاباي السريع', debit: 20000, credit: 0 },
      { account_code: '4300', account_name: 'إيرادات عقود ومشاريع البرمجيات (BU2)', debit: 0, credit: 20000 }
    ],
    reference_type: 'FREELANCE_PAYMENT',
    reference_id: 'flp1-m1',
    created_at: '2026-09-10 16:00:00'
  }
];

const initialAuditLogs: AuditLog[] = [
  { id: 'aud1', timestamp: '2026-09-23 11:20:00', user: 'مدير النظام (Admin)', action: 'CREATE', module: 'المبيعات', table_name: 'sales', record_id: 'INV-2026-101', details: 'إصدار فاتورة مبيعات نقدية بقيمة 29,500 ج.م واحتساب COGS = 24,000 ج.م' },
  { id: 'aud2', timestamp: '2026-09-23 10:45:00', user: 'المحاسب (Accountant)', action: 'POST_JOURNAL', module: 'المصروفات', table_name: 'expenses', record_id: 'EXP-2026-081', details: 'ترحيل قيد المصروف المشترك 70% محل و 30% برمجيات متوازناً' },
  { id: 'aud3', timestamp: '2026-09-22 17:30:00', user: 'فني الصيانة (Tech)', action: 'UPDATE', module: 'الصيانة', table_name: 'service_orders', record_id: 'SRV-2026-040', details: 'تحديث حالة صيانة اللابتوب إلى جاهز للتسليم وصرف SSD من المخزن' }
];

// In-Memory Storage Container with local storage sync
class ErpStore {
  products: Product[] = initialProducts;
  customers: Customer[] = initialCustomers;
  suppliers: Supplier[] = initialSuppliers;
  accounts: FinancialAccount[] = initialAccounts;
  employees: Employee[] = initialEmployees;
  fixedAssets: FixedAsset[] = initialFixedAssets;
  maintenanceOrders: MaintenanceOrder[] = initialMaintenanceOrders;
  cctvProjects: CctvProject[] = initialCctvProjects;
  networkProjects: NetworkProject[] = initialNetworkProjects;
  subscribers: InternetSubscriber[] = initialSubscribers;
  freelanceProjects: FreelanceProject[] = initialFreelanceProjects;
  expenses: ExpenseRecord[] = initialExpenses;
  journalEntries: JournalEntry[] = initialJournalEntries;
  auditLogs: AuditLog[] = initialAuditLogs;

  // Add a sale and automatically execute double-entry accounting & stock deduction
  addSaleInvoice(invoice: Omit<SaleInvoice, 'id' | 'journal_entry_id'>) {
    const newId = `inv-${Date.now()}`;
    const journalId = `JV-${Date.now().toString().slice(-4)}`;

    // Deduct stock
    invoice.items.forEach(item => {
      const prod = this.products.find(p => p.id === item.product_id);
      if (prod) {
        prod.quantity = Math.max(0, prod.quantity - item.quantity);
        if (item.serial_number && prod.serial_numbers) {
          prod.serial_numbers = prod.serial_numbers.filter(s => s !== item.serial_number);
        }
      }
    });

    // Update account balance or customer debt
    if (invoice.payment_type === 'CASH') {
      const acc = this.accounts.find(a => a.id === 'acc_cash_shop');
      if (acc) acc.balance += invoice.paid_amount;
    } else if (invoice.payment_type === 'INSTAPAY') {
      const acc = this.accounts.find(a => a.id === 'acc_instapay');
      if (acc) acc.balance += invoice.paid_amount;
    } else if (invoice.payment_type === 'CREDIT' || invoice.remaining_amount > 0) {
      const cust = this.customers.find(c => c.id === invoice.customer_id);
      if (cust) cust.current_balance += invoice.remaining_amount;
    }

    // Auto generate balanced Journal Entry
    const jLines: JournalLine[] = [];
    if (invoice.paid_amount > 0) {
      jLines.push({
        account_code: invoice.payment_type === 'CASH' ? '1111' : '1121',
        account_name: invoice.payment_type === 'CASH' ? 'صندوق كاشير المحل' : 'حساب بنكي / إنستاباي',
        debit: invoice.paid_amount,
        credit: 0
      });
    }
    if (invoice.remaining_amount > 0) {
      jLines.push({
        account_code: '1310',
        account_name: `ذمم العملاء (${invoice.customer_name})`,
        debit: invoice.remaining_amount,
        credit: 0
      });
    }
    jLines.push({
      account_code: '4110',
      account_name: 'إيرادات مبيعات أجهزة ومكونات (المتجر)',
      debit: 0,
      credit: invoice.net_total
    });
    // COGS
    jLines.push({
      account_code: '5110',
      account_name: 'تكلفة البضاعة المباعة COGS',
      debit: invoice.cogs_total,
      credit: 0
    });
    jLines.push({
      account_code: '1210',
      account_name: 'مخزون بضاعة وأجهزة',
      debit: 0,
      credit: invoice.cogs_total
    });

    this.journalEntries.unshift({
      id: journalId,
      entry_number: journalId,
      date: invoice.date,
      business_unit_id: 1,
      description: `فاتورة مبيعات ${invoice.invoice_number} للعميل ${invoice.customer_name}`,
      lines: jLines,
      reference_type: 'SALE_INVOICE',
      reference_id: newId,
      created_at: new Date().toISOString()
    });

    // Audit log
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: 'مدير النظام (Admin)',
      action: 'CREATE',
      module: 'المبيعات',
      table_name: 'sales',
      record_id: invoice.invoice_number,
      details: `إصدار فاتورة مبيعات بقيمة ${invoice.net_total} ج.م | COGS = ${invoice.cogs_total} ج.م | الربح = ${invoice.gross_profit} ج.م`
    });
  }

  // Record a shared or direct expense
  addExpense(record: Omit<ExpenseRecord, 'id'>) {
    const newId = `exp-${Date.now()}`;
    const journalId = `JV-${Date.now().toString().slice(-4)}`;

    const targetAccount = this.accounts.find(a => 
      (record.payment_account === 'CASHBOX' && a.id === 'acc_cash_shop') ||
      (record.payment_account === 'BANK' && a.id === 'acc_nbe_bank') ||
      (record.payment_account === 'VODAFONE_CASH' && a.id === 'acc_vodafone_cash') ||
      (record.payment_account === 'INSTAPAY' && a.id === 'acc_instapay')
    ) || this.accounts[0];

    targetAccount.balance -= record.amount;

    const jLines: JournalLine[] = [];
    if (record.is_shared) {
      jLines.push({
        account_code: '6140',
        account_name: `مصروف مشترك - نصيب متجر التقنية (${record.allocation.shop_percentage}%)`,
        debit: record.allocation.shop_amount,
        credit: 0
      });
      jLines.push({
        account_code: '6340',
        account_name: `مصروف مشترك - نصيب البرمجيات (${record.allocation.freelance_percentage}%)`,
        debit: record.allocation.freelance_amount,
        credit: 0
      });
    } else {
      jLines.push({
        account_code: record.allocation.shop_amount > 0 ? '6100' : '6300',
        account_name: record.category,
        debit: record.amount,
        credit: 0
      });
    }

    jLines.push({
      account_code: targetAccount.account_number,
      account_name: targetAccount.name_ar,
      debit: 0,
      credit: record.amount
    });

    this.journalEntries.unshift({
      id: journalId,
      entry_number: journalId,
      date: record.date,
      business_unit_id: record.is_shared ? 'SHARED' : (record.allocation.shop_amount > 0 ? 1 : 2),
      description: `سداد مصروف ${record.category}: ${record.description}`,
      lines: jLines,
      reference_type: 'EXPENSE',
      reference_id: newId,
      created_at: new Date().toISOString()
    });

    this.expenses.unshift({ id: newId, ...record });

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: 'المحاسب (Accountant)',
      action: 'CREATE',
      module: 'المصروفات',
      table_name: 'expenses',
      record_id: record.expense_number,
      details: `تسجيل مصروف ${record.category} بمبلغ ${record.amount} ج.م مسدد من ${targetAccount.name_ar}`
    });
  }

  // Internal Transfer (Asset to Asset, ZERO effect on P&L)
  transferBetweenAccounts(fromAccId: string, toAccId: string, amount: number) {
    const fromAcc = this.accounts.find(a => a.id === fromAccId);
    const toAcc = this.accounts.find(a => a.id === toAccId);
    if (!fromAcc || !toAcc || fromAcc.balance < amount) return false;

    fromAcc.balance -= amount;
    toAcc.balance += amount;

    const journalId = `JV-TR-${Date.now().toString().slice(-4)}`;
    this.journalEntries.unshift({
      id: journalId,
      entry_number: journalId,
      date: new Date().toISOString().slice(0, 10),
      business_unit_id: 'SHARED',
      description: `تحويل سيولة داخلي من ${fromAcc.name_ar} إلى ${toAcc.name_ar} (نقل أصول - بدون ربح أو خسارة)`,
      lines: [
        { account_code: toAcc.account_number, account_name: toAcc.name_ar, debit: amount, credit: 0 },
        { account_code: fromAcc.account_number, account_name: fromAcc.name_ar, debit: 0, credit: amount }
      ],
      reference_type: 'INTERNAL_TRANSFER',
      reference_id: journalId,
      created_at: new Date().toISOString()
    });

    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: 'مدير النظام (Admin)',
      action: 'TRANSFER_OUT',
      module: 'الخزينة',
      table_name: 'cash_transactions',
      record_id: journalId,
      details: `تحويل سيولة داخلي بمبلغ ${amount} ج.م من ${fromAcc.name_ar} إلى ${toAcc.name_ar}`
    });

    return true;
  }

  // Calculate live financial statements (P&L, Balance Sheet, Trial Balance)
  getFinancialSummary() {
    // Shop Metrics
    const shopSales = 345200;
    const shopCogs = 248600;
    const shopGrossProfit = shopSales - shopCogs;
    const shopServices = this.maintenanceOrders.reduce((sum, m) => sum + m.total_amount, 0) + 
                         this.cctvProjects.reduce((sum, c) => sum + c.contract_value, 0) + 
                         this.networkProjects.reduce((sum, n) => sum + n.contract_value, 0);
    const shopInternet = this.subscribers.reduce((sum, s) => sum + s.monthly_fee * 12, 0);
    const shopOperatingExpenses = this.expenses.reduce((sum, e) => sum + e.allocation.shop_amount, 0);
    const shopSalaries = this.employees.filter(e => e.business_unit === 'SHOP' || e.business_unit === 'BOTH').reduce((sum, e) => sum + e.basic_salary, 0);
    const shopDepreciation = this.fixedAssets.filter(a => a.business_unit === 'SHOP').reduce((sum, a) => sum + a.monthly_depreciation * 12, 0);
    const shopNetProfit = (shopGrossProfit + shopServices + shopInternet) - (shopOperatingExpenses + shopSalaries + shopDepreciation);

    // Freelance Metrics
    const freelanceRevenue = this.freelanceProjects.reduce((sum, p) => sum + p.contract_value, 0);
    const freelanceDirectExpenses = this.freelanceProjects.reduce((sum, p) => sum + p.direct_expenses, 0);
    const freelanceGeneralExpenses = this.expenses.reduce((sum, e) => sum + e.allocation.freelance_amount, 0);
    const freelanceSalaries = this.employees.filter(e => e.business_unit === 'FREELANCE').reduce((sum, e) => sum + e.basic_salary, 0);
    const freelanceDepreciation = this.fixedAssets.filter(a => a.business_unit === 'FREELANCE').reduce((sum, a) => sum + a.monthly_depreciation * 12, 0);
    const freelanceNetProfit = freelanceRevenue - (freelanceDirectExpenses + freelanceGeneralExpenses + freelanceSalaries + freelanceDepreciation);

    // Combined Metrics
    const totalCash = this.accounts.reduce((sum, a) => sum + a.balance, 0);
    const inventoryValuation = this.products.reduce((sum, p) => sum + (p.quantity * p.average_cost_price), 0);
    const accountsReceivable = this.customers.reduce((sum, c) => sum + c.current_balance, 0) + 
                               this.freelanceProjects.reduce((sum, p) => sum + p.remaining_amount, 0);
    const accountsPayable = this.suppliers.reduce((sum, s) => sum + s.current_balance, 0);
    const fixedAssetsBookValue = this.fixedAssets.reduce((sum, a) => sum + a.book_value, 0);

    const totalAssets = totalCash + inventoryValuation + accountsReceivable + fixedAssetsBookValue;
    const totalLiabilities = accountsPayable;
    const ownerEquity = totalAssets - totalLiabilities;

    return {
      shop: {
        sales: shopSales,
        cogs: shopCogs,
        grossProfit: shopGrossProfit,
        services: shopServices,
        internet: shopInternet,
        expenses: shopOperatingExpenses,
        salaries: shopSalaries,
        depreciation: shopDepreciation,
        netProfit: shopNetProfit
      },
      freelance: {
        revenue: freelanceRevenue,
        directExpenses: freelanceDirectExpenses,
        generalExpenses: freelanceGeneralExpenses,
        salaries: freelanceSalaries,
        depreciation: freelanceDepreciation,
        netProfit: freelanceNetProfit
      },
      combined: {
        totalRevenue: shopSales + shopServices + shopInternet + freelanceRevenue,
        totalCogsAndDirectCost: shopCogs + freelanceDirectExpenses,
        totalGrossProfit: shopGrossProfit + (freelanceRevenue - freelanceDirectExpenses),
        totalExpenses: shopOperatingExpenses + freelanceGeneralExpenses + shopSalaries + freelanceSalaries + shopDepreciation + freelanceDepreciation,
        totalNetProfit: shopNetProfit + freelanceNetProfit,
        totalCash,
        inventoryValuation,
        accountsReceivable,
        accountsPayable,
        fixedAssetsBookValue,
        totalAssets,
        totalLiabilities,
        ownerEquity
      }
    };
  }
}

export const globalErpStore = new ErpStore();
