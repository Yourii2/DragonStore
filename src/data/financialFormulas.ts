export interface FinancialMetric {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'income' | 'balance_sheet' | 'unit_profit';
  unitScope: 'store' | 'freelance' | 'both' | 'combined';
  formula: string;
  description: string;
  accountingLogic: {
    debitCreditImpact: string;
    accountCodes: string;
  };
  sqlQuerySample: string;
  exampleValues: {
    store: number;
    freelance: number;
    combined: number;
    unit: string;
  };
}

export const FINANCIAL_METRICS: FinancialMetric[] = [
  {
    id: "revenue",
    nameAr: "1. إجمالي الإيرادات (Total Revenue)",
    nameEn: "Total Revenue / Turnover",
    category: "income",
    unitScope: "both",
    formula: "الإيرادات المجمعة = إيرادات مبيعات المتجر + إيرادات خدمات الصيانة + إيرادات مشاريع CCTV والشبكات + إيرادات اشتراكات الإنترنت + إيرادات عقود وتطوير البرمجيات الحرة",
    description: "مجموع التدفقات النقدية والآجلة الناتجة عن بيع البضائع وتقديم الخدمات الفنية والبرمجية خلال الفترة المالية المحددة.",
    accountingLogic: {
      debitCreditImpact: "تزيد بالجانب الدائن (Credit) عند إصدار الفاتورة أو تقديم الخدمة.",
      accountCodes: "الحسابات 4100 (مبيعات متجر)، 4200 (صيانة)، 4300 (مشاريع)، 4400 (إنترنت)، 4500 (تطوير برمجيات)"
    },
    sqlQuerySample: `SELECT 
    bu.code AS unit_code,
    SUM(jel.credit_amount - jel.debit_amount) AS total_revenue
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
JOIN business_units bu ON je.unit_id = bu.id
WHERE a.account_type = 'REVENUE' 
  AND je.is_posted = 1 
  AND je.entry_date BETWEEN :start_date AND :end_date
GROUP BY bu.code;`,
    exampleValues: {
      store: 45000,
      freelance: 32000,
      combined: 77000,
      unit: "USD"
    }
  },
  {
    id: "cogs",
    nameAr: "2. تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)",
    nameEn: "Cost of Goods Sold (Direct Costs)",
    category: "income",
    unitScope: "both",
    formula: "COGS للمتجر = (مخزون أول المدة + المشتريات الصافية - مخزون آخر المدة) + تكلفة قطع الغيار ومعدات المشاريع المنصرفة.\nCOGS للبرمجيات = التكاليف المباشرة للمشاريع البرمجية (سيرفرات سحابية + تراخيص واجهات API + أجور مبرمجين متعاونين).",
    description: "التكلفة المباشرة للسلع المشتراة والمباعة والمعدات والمصاريف التقنية المباشرة المرتبطة بتسليم المشاريع.",
    accountingLogic: {
      debitCreditImpact: "تزيد بالجانب المدين (Debit) وتنقص بالجانب الدائن.",
      accountCodes: "الحسابات 5100 (تكلفة بضاعة مباعة)، 5200 (تكلفة قطع صيانة)، 5300 (تكلفة مشاريع CCTV وشبكات)، 5400 (تكلفة مشاريع برمجية مباشرة)"
    },
    sqlQuerySample: `SELECT 
    bu.code AS unit_code,
    SUM(jel.debit_amount - jel.credit_amount) AS total_cogs
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
JOIN business_units bu ON je.unit_id = bu.id
WHERE a.account_type = 'DIRECT_COST' 
  AND je.is_posted = 1 
  AND je.entry_date BETWEEN :start_date AND :end_date
GROUP BY bu.code;`,
    exampleValues: {
      store: 28000,
      freelance: 4500,
      combined: 32500,
      unit: "USD"
    }
  },
  {
    id: "gross_profit",
    nameAr: "3. إجمالي الربح (Gross Profit)",
    nameEn: "Gross Profit & Gross Margin",
    category: "income",
    unitScope: "both",
    formula: "إجمالي الربح = إجمالي الإيرادات (Revenue) - تكلفة البضاعة والتكاليف المباشرة (COGS)",
    description: "الفائض المالي الناتج عن النشاط التجاري والبرمجي قبل خصم المصاريف الإدارية والتشغيلية العامة.",
    accountingLogic: {
      debitCreditImpact: "فارق حسابات الإيرادات (4xxx) مطروحاً منها حسابات التكاليف المباشرة (5xxx).",
      accountCodes: "المعادلة المحاسبية: Revenue - COGS"
    },
    sqlQuerySample: `SELECT 
    bu.code AS unit_code,
    SUM(CASE WHEN a.account_type = 'REVENUE' THEN (jel.credit_amount - jel.debit_amount) ELSE 0 END) -
    SUM(CASE WHEN a.account_type = 'DIRECT_COST' THEN (jel.debit_amount - jel.credit_amount) ELSE 0 END) AS gross_profit
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
JOIN business_units bu ON je.unit_id = bu.id
WHERE je.is_posted = 1 AND je.entry_date BETWEEN :start_date AND :end_date
GROUP BY bu.code;`,
    exampleValues: {
      store: 17000,
      freelance: 27500,
      combined: 44500,
      unit: "USD"
    }
  },
  {
    id: "opex",
    nameAr: "4. المصاريف التشغيلية (Operating Expenses - OPEX)",
    nameEn: "Operating Expenses (OPEX)",
    category: "income",
    unitScope: "both",
    formula: "المصاريف التشغيلية = مصاريف الرواتب الأساسية + إيجار المقر + الكهرباء والمياه + اشتراك حزمة الإنترنت الرئيسية + التسويق + إهلاك الأصول + المصاريف الإدارية والعمومية",
    description: "كافة النفقات غير المباشرة اللازمة لتشغيل المحل ومكتب البرمجيات بغض النظر عن حجم المبيعات.",
    accountingLogic: {
      debitCreditImpact: "تزيد بالجانب المدين (Debit).",
      accountCodes: "حسابات الفئة 6xxx (مصاريف تشغيلية وإدارية وعمومية)"
    },
    sqlQuerySample: `SELECT 
    COALESCE(bu.code, 'SHARED') AS unit_code,
    SUM(jel.debit_amount - jel.credit_amount) AS total_opex
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
LEFT JOIN business_units bu ON je.unit_id = bu.id
WHERE a.account_type = 'OPERATING_EXPENSE' 
  AND je.is_posted = 1 
  AND je.entry_date BETWEEN :start_date AND :end_date
GROUP BY bu.code;`,
    exampleValues: {
      store: 6500,
      freelance: 3200,
      combined: 9700,
      unit: "USD"
    }
  },
  {
    id: "net_profit",
    nameAr: "5. صافي الربح (Net Profit)",
    nameEn: "Net Profit / Net Income",
    category: "income",
    unitScope: "combined",
    formula: "صافي الربح = إجمالي الربح (Gross Profit) - المصاريف التشغيلية (OPEX) + الإيرادات الأخرى - المصاريف الأخرى والضرائب",
    description: "الربح الفعلي النهائي المتبقي للمنشأة ومالكها بعد تغطية كافة التكاليف والمصاريف والإهلاكات.",
    accountingLogic: {
      debitCreditImpact: "الفائض المرحل إلى حساب الأرباح المبقاة (Retained Earnings) في حقوق الملكية.",
      accountCodes: "إجمالي فئة 4xxx - إجمالي فئات (5xxx + 6xxx + 7xxx)"
    },
    sqlQuerySample: `SELECT 
    SUM(CASE WHEN a.account_type = 'REVENUE' THEN (jel.credit_amount - jel.debit_amount) ELSE 0 END) -
    SUM(CASE WHEN a.account_type IN ('DIRECT_COST', 'OPERATING_EXPENSE', 'TAX_EXPENSE') THEN (jel.debit_amount - jel.credit_amount) ELSE 0 END) AS net_profit
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
WHERE je.is_posted = 1 AND je.entry_date BETWEEN :start_date AND :end_date;`,
    exampleValues: {
      store: 10500,
      freelance: 24300,
      combined: 34800,
      unit: "USD"
    }
  },
  {
    id: "inventory_value",
    nameAr: "6. قيمة المخزون السلعي (Inventory Valuation)",
    nameEn: "Inventory Asset Value",
    category: "balance_sheet",
    unitScope: "store",
    formula: "قيمة المخزون = مجموع (الكمية المتوفرة في المخزن لكل صنف × متوسط التكلفة المرجح للصنف Weighted Average Cost)",
    description: "القيمة النقدية الحالية لكافة الحواسيب، اللابتوبات، الكاميرات، الشاشات، الملحقات وقطع الغيار الموجودة في مستودع المتجر.",
    accountingLogic: {
      debitCreditImpact: "أصل متداول (Current Asset) ذو رصيد طبيعي مدين (Debit).",
      accountCodes: "حساب 1200 (مخزون البضائع الجاهزة وقطع الغيار)"
    },
    sqlQuerySample: `SELECT 
    SUM(current_stock_quantity * average_cost_price) AS total_inventory_valuation
FROM products
WHERE is_active = 1;`,
    exampleValues: {
      store: 38450,
      freelance: 0,
      combined: 38450,
      unit: "USD"
    }
  },
  {
    id: "accounts_receivable",
    nameAr: "7. الذمم المدينة / مديونيات العملاء (Accounts Receivable - AR)",
    nameEn: "Accounts Receivable (Customer Balances)",
    category: "balance_sheet",
    unitScope: "both",
    formula: "الذمم المدينة = إجمالي الفواتير الآجلة غير المسددة لمبيعات المتجر + فواتير الاشتراكات المستحقة + فواتير مراحل البرمجيات المعتمدة غير المحصلة",
    description: "المبالغ المالية المستحقة للمنشأة طرف العملاء ومطوري البرمجيات ومشاريع التمديدات ولم يتم تحصيلها بعد.",
    accountingLogic: {
      debitCreditImpact: "أصل متداول (Current Asset) برصيد مدين يزيد بالفواتير الآجلة وينقص بسندات القبض.",
      accountCodes: "الحساب 1300 (الذمم المدينة - العملاء)"
    },
    sqlQuerySample: `SELECT 
    c.customer_type,
    SUM(c.current_balance) AS total_receivables
FROM customers c
WHERE c.current_balance > 0
GROUP BY c.customer_type;`,
    exampleValues: {
      store: 9200,
      freelance: 12500,
      combined: 21700,
      unit: "USD"
    }
  },
  {
    id: "accounts_payable",
    nameAr: "8. الذمم الدائنة / مستحقات الموردين (Accounts Payable - AP)",
    nameEn: "Accounts Payable (Vendor Balances)",
    category: "balance_sheet",
    unitScope: "both",
    formula: "الذمم الدائنة = فواتير مشتريات الأجهزة غير المسددة للموردين + مستحقات مزود الإنترنت بالجملة + مستحقات موردي الخدمات السحابية",
    description: "الالتزامات والديون المالية المستحقة على المنشأة لصالح الموردين والشركات الموردة الواجب سدادها.",
    accountingLogic: {
      debitCreditImpact: "التزام متداول (Current Liability) ذو رصيد طبيعي دائن (Credit) يزيد بالفواتير وينقص بسندات الصرف.",
      accountCodes: "الحساب 2100 (الذمم الدائنة - الموردين)"
    },
    sqlQuerySample: `SELECT 
    s.category,
    SUM(s.current_balance) AS total_payables
FROM suppliers s
WHERE s.current_balance > 0
GROUP BY s.category;`,
    exampleValues: {
      store: 14200,
      freelance: 1800,
      combined: 16000,
      unit: "USD"
    }
  },
  {
    id: "cash_balance",
    nameAr: "9. رصيد الصندوق والنقدية (Cash in Hand / Petty Cash)",
    nameEn: "Cash Balance & Physical Drawers",
    category: "balance_sheet",
    unitScope: "both",
    formula: "رصيد النقدية = النقدية الفعلية في درج كاشير المحل + النقدية في الخزينة الرئيسية + عهد الصيانة التشغيلية",
    description: "الأموال السائلة المتوفرة ورقياً ونقدياً داخل مقر المحل والمكتب.",
    accountingLogic: {
      debitCreditImpact: "أصل متداول (Current Asset) مدين يزيد بالمقبوضات النقدية وينقص بالمدفوعات والمصاريف.",
      accountCodes: "الحساب 1110 (الصندوق ودرج الكاشير والعهد)"
    },
    sqlQuerySample: `SELECT 
    account_name_ar,
    current_balance
FROM treasury_accounts
WHERE account_type IN ('CASH_DRAWER', 'PETTY_CASH', 'VAULT');`,
    exampleValues: {
      store: 5400,
      freelance: 600,
      combined: 6000,
      unit: "USD"
    }
  },
  {
    id: "bank_balance",
    nameAr: "10. رصيد البنوك والمحافظ الرقمية (Bank & Digital Wallets Balance)",
    nameEn: "Bank & Digital Payment Balances",
    category: "balance_sheet",
    unitScope: "both",
    formula: "رصيد البنوك = الحساب البنكي التجاري للمتجر + الحساب البنكي للعمل الحر + المحافظ الإلكترونية (Stripe, PayPal, Payoneer)",
    description: "الأرصدة المصرفية والإلكترونية المتاحة في الحسابات البنكية وبوابات تحصيل مدفوعات البرمجيات الدولية والمحلية.",
    accountingLogic: {
      debitCreditImpact: "أصل متداول (Current Asset) مدين يزيد بالتحويلات البنكية والإيداعات وينقص بسندات الصرف والتحويلات.",
      accountCodes: "الحساب 1120 (البنوك والمحافظ الإلكترونية)"
    },
    sqlQuerySample: `SELECT 
    account_name_ar,
    account_type,
    currency,
    current_balance
FROM treasury_accounts
WHERE account_type IN ('BANK_ACCOUNT', 'DIGITAL_WALLET', 'PAYMENT_GATEWAY');`,
    exampleValues: {
      store: 12800,
      freelance: 28400,
      combined: 41200,
      unit: "USD"
    }
  },
  {
    id: "owner_investment",
    nameAr: "11. استثمارات المالك / رأس المال المدفوع (Owner's Capital & Investment)",
    nameEn: "Owner Capital & Equity Injections",
    category: "balance_sheet",
    unitScope: "combined",
    formula: "رأس مال المالك = رأس المال التأسيسي الأولي + أي حقن مالي أو تمويل إضافي قام به المالك لدعم النشاط أو شراء أصول ومخزون",
    description: "إجمالي الأموال الشخصية التي ضخها مالك المشروع في المتجر ونشاط البرمجيات لتمويل التأسيس والتوسع.",
    accountingLogic: {
      debitCreditImpact: "حقوق ملكية (Equity) برصيد دائن (Credit).",
      accountCodes: "الحساب 3100 (رأس مال المالك المدفوع)"
    },
    sqlQuerySample: `SELECT 
    SUM(jel.credit_amount - jel.debit_amount) AS total_owner_capital
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id
WHERE a.account_code = '3100';`,
    exampleValues: {
      store: 30000,
      freelance: 5000,
      combined: 35000,
      unit: "USD"
    }
  },
  {
    id: "owner_withdrawal",
    nameAr: "12. مسحوبات المالك الشخصية (Owner's Drawings / Withdrawals)",
    nameEn: "Owner Withdrawals / Drawings",
    category: "balance_sheet",
    unitScope: "combined",
    formula: "مسحوبات المالك = إجمالي المبالغ النقدية والمصرفية أو الأجهزة التي سحبها المالك للاستخدام الشخصي من أرباح أو سيولة النشاطين",
    description: "الأموال المقتطعة لحساب المالك الخاص والتي تخفض من إجمالي حقوق الملكية التراكمية في الميزانية.",
    accountingLogic: {
      debitCreditImpact: "حساب حقوق ملكية مدين عكسي (Contra-Equity) برصيد طبيعي مدين (Debit) يخفض حقوق الملكية.",
      accountCodes: "الحساب 3200 (مسحوبات المالك الشخصية)"
    },
    sqlQuerySample: `SELECT 
    SUM(jel.debit_amount - jel.credit_amount) AS total_owner_drawings
FROM journal_entry_lines jel
JOIN accounts a ON jel.account_id = a.id
WHERE a.account_code = '3200';`,
    exampleValues: {
      store: 4500,
      freelance: 8000,
      combined: 12500,
      unit: "USD"
    }
  },
  {
    id: "store_profit",
    nameAr: "13. أرباح متجر التقنية والخدمات الميدانية (Store Net Profit)",
    nameEn: "Computer Shop & Field Services Profit",
    category: "unit_profit",
    unitScope: "store",
    formula: "أرباح المتجر = (إيرادات مبيعات الأجهزة + صيانة + تمديد CCTV + شبكات + اشتراكات نت) - (تكلفة البضاعة المباعة + تكاليف المواد المنصرفة) - (مصاريف المتجر التشغيلية + حصة المتجر من المصاريف المشتركة)",
    description: "صافي الأداء المالي الحقيقي لقطاع الحواسيب والشبكات والخدمات الميدانية مستقلاً.",
    accountingLogic: {
      debitCreditImpact: "استخراج تقرير الأرباح والخسائر مع فلترة unit_id = 1 (المتجر).",
      accountCodes: "مركز تكلفة المتجر (Store Cost Center P&L)"
    },
    sqlQuerySample: `SELECT 
    SUM(CASE WHEN a.account_type = 'REVENUE' THEN (jel.credit_amount - jel.debit_amount) ELSE 0 END) -
    SUM(CASE WHEN a.account_type IN ('DIRECT_COST', 'OPERATING_EXPENSE') THEN (jel.debit_amount - jel.credit_amount) ELSE 0 END) AS store_net_profit
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
WHERE je.unit_id = 1 AND je.is_posted = 1 AND je.entry_date BETWEEN :start_date AND :end_date;`,
    exampleValues: {
      store: 10500,
      freelance: 0,
      combined: 10500,
      unit: "USD"
    }
  },
  {
    id: "freelance_profit",
    nameAr: "14. أرباح نشاط تطوير البرمجيات الحرة (Freelance Net Profit)",
    nameEn: "Freelance Software Development Profit",
    category: "unit_profit",
    unitScope: "freelance",
    formula: "أرباح البرمجيات = (إيرادات عقود المشاريع + الاستشارات البرمجية) - (مصاريف السيرفرات والأدوات والتراخيص المباشرة) - (مصاريف البرمجيات التشغيلية + حصة البرمجيات من المصاريف المشتركة)",
    description: "صافي العائد الاستثماري والربحي لنشاط العمل الحر في تطوير البرمجيات والأنظمة مستقلاً.",
    accountingLogic: {
      debitCreditImpact: "استخراج تقرير الأرباح والخسائر مع فلترة unit_id = 2 (البرمجيات).",
      accountCodes: "مركز تكلفة البرمجيات (Freelance Cost Center P&L)"
    },
    sqlQuerySample: `SELECT 
    SUM(CASE WHEN a.account_type = 'REVENUE' THEN (jel.credit_amount - jel.debit_amount) ELSE 0 END) -
    SUM(CASE WHEN a.account_type IN ('DIRECT_COST', 'OPERATING_EXPENSE') THEN (jel.debit_amount - jel.credit_amount) ELSE 0 END) AS freelance_net_profit
FROM journal_entry_lines jel
JOIN journal_entries je ON jel.entry_id = je.id
JOIN accounts a ON jel.account_id = a.id
WHERE je.unit_id = 2 AND je.is_posted = 1 AND je.entry_date BETWEEN :start_date AND :end_date;`,
    exampleValues: {
      store: 0,
      freelance: 24300,
      combined: 24300,
      unit: "USD"
    }
  },
  {
    id: "combined_profit",
    nameAr: "15. الأرباح الموحدة الإجمالية (Consolidated Combined Profit)",
    nameEn: "Consolidated Total Business Profit",
    category: "unit_profit",
    unitScope: "combined",
    formula: "الربح الموحد = أرباح متجر التقنية (Store Profit) + أرباح نشاط البرمجيات (Freelance Profit) - أي مصاريف إدارية مشتركة غير موزعة",
    description: "الرقم الجوهري النهائي للمالك الذي يعبر عن مجمل الأرباح الصافية المحققة من كافة الأعمال مجتمعة.",
    accountingLogic: {
      debitCreditImpact: "تجميع نتائج قطاعي الأعمال وإظهار العائد الكلي على حقوق الملكية (ROE).",
      accountCodes: "قائمة الدخل الموحدة (Consolidated Income Statement)"
    },
    sqlQuerySample: `SELECT 
    (SELECT SUM(CASE WHEN a.account_type = 'REVENUE' THEN (jel.credit_amount - jel.debit_amount) ELSE -(jel.debit_amount - jel.credit_amount) END)
     FROM journal_entry_lines jel JOIN journal_entries je ON jel.entry_id = je.id JOIN accounts a ON jel.account_id = a.id WHERE je.unit_id = 1 AND je.is_posted = 1)
    +
    (SELECT SUM(CASE WHEN a.account_type = 'REVENUE' THEN (jel.credit_amount - jel.debit_amount) ELSE -(jel.debit_amount - jel.credit_amount) END)
     FROM journal_entry_lines jel JOIN journal_entries je ON jel.entry_id = je.id JOIN accounts a ON jel.account_id = a.id WHERE je.unit_id = 2 AND je.is_posted = 1)
    AS consolidated_net_profit;`,
    exampleValues: {
      store: 10500,
      freelance: 24300,
      combined: 34800,
      unit: "USD"
    }
  }
];
