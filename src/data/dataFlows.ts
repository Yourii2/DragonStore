export interface DataFlowStep {
  stepNumber: number;
  actor: string;
  sourceModule: string;
  targetModule: string;
  actionAr: string;
  dataPayload: string;
  databaseTablesAffected: string[];
  accountingImpact: string;
}

export interface BusinessLifecycleFlow {
  id: string;
  titleAr: string;
  titleEn: string;
  unit: 'store' | 'freelance' | 'shared';
  description: string;
  steps: DataFlowStep[];
}

export const BUSINESS_LIFECYCLE_FLOWS: BusinessLifecycleFlow[] = [
  {
    id: "retail_sale_flow",
    titleAr: "1. دورة مبيعات التجزئة وتسليم الأجهزة بالأرقام التسلسلية",
    titleEn: "Retail Sale & Serial Number Fulfillment Flow",
    unit: "store",
    description: "تتبع رحلة العميل عند شراء حاسوب محمول أو شاشة من نقطة البيع (POS) حتى تسليم الفاتورة والضمان وخصم المخزون وترحيل القيود.",
    steps: [
      {
        stepNumber: 1,
        actor: "الكاشير / البائع",
        sourceModule: "نقطة البيع (POS)",
        targetModule: "المخزون (Inventory)",
        actionAr: "مسح باركود المنتج والتحقق من الرقم التسلسلي (Serial Number)",
        dataPayload: "product_id, serial_number, unit_price",
        databaseTablesAffected: ["products", "product_serials"],
        accountingImpact: "لا يوجد قيد مالي في هذه اللحظة (تحقق فني ومخزني فقط)."
      },
      {
        stepNumber: 2,
        actor: "النظام الآلي",
        sourceModule: "المبيعات (Sales)",
        targetModule: "العملاء (Customers)",
        actionAr: "تحديد العميل (نقدي أو آجل) وفحص الحد الائتماني",
        dataPayload: "customer_id, payment_type, credit_limit_check",
        databaseTablesAffected: ["customers"],
        accountingImpact: "التحقق من أهلية البيع الآجل إن وجدت مديونية سابقة."
      },
      {
        stepNumber: 3,
        actor: "الكاشير",
        sourceModule: "المبيعات (Sales)",
        targetModule: "الخزينة (Treasury)",
        actionAr: "استلام المبلغ نقداً أو عبر بطاقة مصرفية وتأكيد الفاتورة",
        dataPayload: "invoice_total, cash_received, discount_amount",
        databaseTablesAffected: ["sales_invoices", "sales_invoice_items", "treasury_transactions"],
        accountingImpact: "مدين: الصندوق/البنك (المقبوض) + مدين: الذمم المدينة (المتبقي الآجل) | دائن: إيرادات مبيعات المتجر (4100)."
      },
      {
        stepNumber: 4,
        actor: "محرك المخزون والقيود",
        sourceModule: "المخزون (Inventory)",
        targetModule: "الأستاذ العام (General Ledger)",
        actionAr: "تغيير حالة السيريال إلى (SOLD) وخصم الكمية وتوليد قيد تكلفة المبيعات",
        dataPayload: "serial_status = 'SOLD', inventory_qty - 1, weighted_avg_cost",
        databaseTablesAffected: ["product_serials", "products", "inventory_transactions", "journal_entries", "journal_entry_lines"],
        accountingImpact: "مدين: تكلفة البضاعة المباعة COGS (5100) | دائن: مخزون البضائع (1200) بسعر التكلفة."
      },
      {
        stepNumber: 5,
        actor: "طابعة الفواتير",
        sourceModule: "الضمانات (Warranty)",
        targetModule: "العميل (Customer)",
        actionAr: "طباعة فاتورة ضريبية QR + بطاقة ضمان بالسيريال نمر وتاريخ الانتهاء",
        dataPayload: "invoice_pdf, warranty_slip_with_qr",
        databaseTablesAffected: ["audit_logs"],
        accountingImpact: "توثيق العملية في سجل التدقيق الأمني."
      }
    ]
  },
  {
    id: "maintenance_ticket_flow",
    titleAr: "2. دورة ورشة الصيانة والإصلاح وقطع الغيار",
    titleEn: "Maintenance Ticket, Diagnostics & Spare Parts Flow",
    unit: "store",
    description: "دورة تتبع جهاز معطل (حاسوب مكتبي أو لابتوب) من الاستلام والتشخيص حتى تركيب قطع الغيار وتسليم الجهاز.",
    steps: [
      {
        stepNumber: 1,
        actor: "موظف الاستقبال",
        sourceModule: "ورشة الصيانة",
        targetModule: "العملاء والمخزن",
        actionAr: "استلام الجهاز، فحص الملحقات، وتسجيل تذكرة صيانة برقم فريد وباركود",
        dataPayload: "customer_id, device_model, serial, accessories, issue_text",
        databaseTablesAffected: ["maintenance_tickets"],
        accountingImpact: "لا يوجد قيد مالي (إثبات أمانة استلام جهاز عميل)."
      },
      {
        stepNumber: 2,
        actor: "فني الصيانة",
        sourceModule: "ورشة الصيانة",
        targetModule: "المخزون والعميل",
        actionAr: "التشخيص الفني، تحديد القطع المطلوبة (مثلاً: SSD 1TB + رام)، وإرسال تكلفة الصيانة للعميل",
        dataPayload: "ticket_id, required_parts, estimated_labor_cost",
        databaseTablesAffected: ["maintenance_tickets", "maintenance_spare_parts"],
        accountingImpact: "حجز قطع الغيار من المستودع لحين موافقة العميل."
      },
      {
        stepNumber: 3,
        actor: "العميل والفني",
        sourceModule: "ورشة الصيانة",
        targetModule: "المخزون (Inventory)",
        actionAr: "موافقة العميل -> صرف قطع الغيار من المستودع وتركيبها وضبط النظام",
        dataPayload: "parts_dispatched, technician_hours_logged",
        databaseTablesAffected: ["maintenance_spare_parts", "inventory_transactions", "product_serials"],
        accountingImpact: "مدين: تكلفة قطع صيانة (5200) | دائن: مخزون قطع الغيار (1200) بالتكلفة."
      },
      {
        stepNumber: 4,
        actor: "المحاسب / الكاشير",
        sourceModule: "ورشة الصيانة",
        targetModule: "المحاسبة والرواتب",
        actionAr: "تسليم الجهاز للعميل، تحصيل الفاتورة، واحتساب عمولة الفني المكتسبة",
        dataPayload: "total_invoice = labor_fee + parts_price, technician_commission",
        databaseTablesAffected: ["maintenance_tickets", "sales_invoices", "employees", "journal_entries"],
        accountingImpact: "مدين: الصندوق | دائن: إيراد خدمات صيانة (4200) + دائن: إيراد بيع قطع غيار (4100). تسجيل عمولة الفني في مسير رواتبه."
      }
    ]
  },
  {
    id: "cctv_network_project_flow",
    titleAr: "3. دورة مشاريع كاميرات المراقبة وتمديد الشبكات",
    titleEn: "CCTV & Structured Cabling Project Lifecycle",
    unit: "store",
    description: "إدارة مشروع ميداني لتركيب كاميرات وشبكة لشركة من المعاينة وحتى الفحص النهائي وإقفال التكاليف.",
    steps: [
      {
        stepNumber: 1,
        actor: "مهندس المشاريع",
        sourceModule: "مشاريع CCTV والشبكات",
        targetModule: "عروض الأسعار (Quotations)",
        actionAr: "المعاينة الميدانية وتوليد قائمة المواد (BoM) وتكلفة التمديدات وعرض السعر",
        dataPayload: "site_address, cameras_count, switches, cable_meters, labor_days",
        databaseTablesAffected: ["cctv_projects", "cctv_project_items"],
        accountingImpact: "عرض سعر غير مقيد محاسبياً."
      },
      {
        stepNumber: 2,
        actor: "العميل والمحاسب",
        sourceModule: "المشاريع (Projects)",
        targetModule: "الخزينة (Treasury)",
        actionAr: "توقيع العقد واستلام الدفعة المقدمة (30%-50%) بسند قبض",
        dataPayload: "contract_id, advance_amount, payment_voucher",
        databaseTablesAffected: ["payment_receipts", "customers", "journal_entries"],
        accountingImpact: "مدين: البنك/الصندوق | دائن: دفعات عملاء مشاريع مقدمة (الخصوم المتداولة 2300)."
      },
      {
        stepNumber: 3,
        actor: "فريق التركيبات",
        sourceModule: "المخزون (Inventory)",
        targetModule: "المشاريع (Projects)",
        actionAr: "صرف الكابلات، الكاميرات، والسويتشات بالسيريال من المستودع لموقع العمل",
        dataPayload: "project_id, items_issued, serial_numbers",
        databaseTablesAffected: ["cctv_project_items", "inventory_transactions", "product_serials"],
        accountingImpact: "مدين: تكلفة مشروع CCTV قيد التنفيذ (WIP) | دائن: المخزون."
      },
      {
        stepNumber: 4,
        actor: "مدير المشاريع والعميل",
        sourceModule: "المشاريع (Projects)",
        targetModule: "الأستاذ العام (General Ledger)",
        actionAr: "التشغيل، تسليم كلمات مرور الأجهزة، توقيع محضر الاستلام وإصدار الفاتورة النهائية",
        dataPayload: "handover_signoff, final_invoice_amount",
        databaseTablesAffected: ["cctv_projects", "sales_invoices", "journal_entries"],
        accountingImpact: "مدين: دفعات مقدمة (2300) + مدين: ذمم العميل المتبقية (1300) | دائن: إيرادات مشاريع كاميرات وشبكات (4300). إقفال WIP إلى COGS."
      }
    ]
  },
  {
    id: "isp_subscription_billing_flow",
    titleAr: "4. دورة اشتراكات وتوزيع الإنترنت الشهرية",
    titleEn: "ISP Monthly Subscription & Recurring Billing Cycle",
    unit: "store",
    description: "دورة تجديد اشتراكات الإنترنت، الفوترة الدورية في بداية كل شهر، فترة السماح، وقطع/تجديد الخدمة مع تكلفة الحزم الرئيسية.",
    steps: [
      {
        stepNumber: 1,
        actor: "محرك الفوترة الآلي (Cron)",
        sourceModule: "اشتراكات الإنترنت (ISP)",
        targetModule: "العملاء والحسابات",
        actionAr: "توليد فواتير الشهر الجديد لكافة المشتركين النشطين في يوم 1 من الشهر",
        dataPayload: "billing_month, subscription_id, monthly_rate, grace_period_days",
        databaseTablesAffected: ["subscription_invoices", "internet_subscriptions", "customers"],
        accountingImpact: "مدين: الذمم المدينة لمشتركي الإنترنت (1310) | دائن: إيرادات اشتراكات الإنترنت (4400)."
      },
      {
        stepNumber: 2,
        actor: "المشترك / المحصل",
        sourceModule: "التحصيل وسندات القبض",
        targetModule: "الخزينة (Treasury)",
        actionAr: "سداد الاشتراك الشهري نقداً أو عبر محفظة إلكترونية",
        dataPayload: "receipt_id, invoice_id, amount_paid, paid_at",
        databaseTablesAffected: ["payment_receipts", "subscription_invoices", "internet_subscriptions"],
        accountingImpact: "مدين: الصندوق / المحفظة الرقمية | دائن: الذمم المدينة لمشتركي الإنترنت (1310)."
      },
      {
        stepNumber: 3,
        actor: "نظام إدارة المشتركين",
        sourceModule: "اشتراكات الإنترنت (ISP)",
        targetModule: "أجهزة التوجيه / البوابة",
        actionAr: "تمديد تاريخ نهاية الاشتراك لشهر إضافي أو إيقاف الخدمة آلياً للمتأخرين بعد انتهاء السماح",
        dataPayload: "new_expiry_date = expiry_date + 30 days, status = 'ACTIVE'",
        databaseTablesAffected: ["internet_subscriptions"],
        accountingImpact: "لا يوجد أثر مالي (تحديث تشغيلي للشبكة)."
      },
      {
        stepNumber: 4,
        actor: "المحاسب",
        sourceModule: "المشتريات والمصاريف",
        targetModule: "مورد السعات الرئيسية",
        actionAr: "إثبات وسداد فاتورة حزمة الإنترنت الإجمالية (Upstream Bandwidth) للشبكة المغذية",
        dataPayload: "isp_vendor_invoice, bandwidth_cost",
        databaseTablesAffected: ["purchase_invoices", "suppliers", "journal_entries"],
        accountingImpact: "مدين: مصاريف حزم الإنترنت الرئيسية (6310) | دائن: الذمم الدائنة لمزود الإنترنت / البنك."
      }
    ]
  },
  {
    id: "freelance_software_flow",
    titleAr: "5. دورة عقود ومشاريع تطوير البرمجيات الحرة",
    titleEn: "Freelance Software Contract & Milestone Delivery Flow",
    unit: "freelance",
    description: "تتبع المشروع البرمجي من إبرام العقد وتحديد المراحل (Milestones) حتى إنجاز الكود، استلام التحويل البنكي الدولي، وتحميل مصاريف السيرفرات والتراخيص.",
    steps: [
      {
        stepNumber: 1,
        actor: "المطور / مدير المشروع",
        sourceModule: "مشاريع البرمجيات",
        targetModule: "العملاء (Clients)",
        actionAr: "تسجيل العقد البرمجي، تحديد نطاق العمل، وجدول المراحل والدفعات (Milestones)",
        dataPayload: "project_title, client_id, contract_value, milestones_list, repo_url",
        databaseTablesAffected: ["freelance_projects", "project_milestones"],
        accountingImpact: "توثيق العقد والمراحل (الالتزام التعاقدي)."
      },
      {
        stepNumber: 2,
        actor: "المطور",
        sourceModule: "المصاريف المباشرة",
        targetModule: "الخزينة والبنوك",
        actionAr: "شراء سيرفر تجريبي (Cloud VPS) وتراخيص واجهات برمجة (APIs) مخصصة للمشروع",
        dataPayload: "expense_name, vendor_name, amount, project_id",
        databaseTablesAffected: ["project_direct_expenses", "expenses", "journal_entries"],
        accountingImpact: "مدين: تكاليف مشاريع البرمجيات المباشرة (5400) | دائن: الحساب البنكي / البطاقة الرقمية."
      },
      {
        stepNumber: 3,
        actor: "المطور والعميل",
        sourceModule: "مراحل المشاريع",
        targetModule: "الفواتير (Invoicing)",
        actionAr: "تسليم المرحلة البرمجية، المراجعة، واعتماد العميل للمخرجات (Deliverables)",
        dataPayload: "milestone_id, is_approved = true, invoice_generated",
        databaseTablesAffected: ["project_milestones", "sales_invoices"],
        accountingImpact: "مدين: الذمم المدينة لعملاء البرمجيات (1320) | دائن: إيرادات تطوير البرمجيات (4500)."
      },
      {
        stepNumber: 4,
        actor: "العميل والبنك",
        sourceModule: "التحصيل الإلكتروني",
        targetModule: "البنك والأستاذ العام",
        actionAr: "استلام الحوالة البنكية الدولية أو السداد عبر Stripe/PayPal وخصم عمولة البوابة",
        dataPayload: "payment_receipt, gross_amount, gateway_fee, net_received",
        databaseTablesAffected: ["treasury_transactions", "payment_receipts", "journal_entries"],
        accountingImpact: "مدين: الحساب البنكي/المحفظة (الصافي) + مدين: عمولات بوابات الدفع (مصروف) | دائن: الذمم المدينة لعميل البرمجيات."
      },
      {
        stepNumber: 5,
        actor: "النظام المالي",
        sourceModule: "تقارير الربحية",
        targetModule: "لوحة تحكم البرمجيات",
        actionAr: "احتساب ربحية المشروع الفردية ومعدل العائد لكل ساعة عمل برمجية",
        dataPayload: "project_revenue - project_direct_expenses = project_net_margin",
        databaseTablesAffected: ["freelance_projects"],
        accountingImpact: "تحديث شاشة أرباح قطاع البرمجيات اللحظية."
      }
    ]
  },
  {
    id: "operating_expense_treasury_flow",
    titleAr: "6. دورة المصاريف التشغيلية والمشتركة والتسويات النقدية",
    titleEn: "OPEX, Shared Expense Allocation & Treasury Settlement Flow",
    unit: "shared",
    description: "إدارة المصاريف المشتركة (كإيجار المقر والكهرباء) وتوزيعها بين المتجر ونشاط البرمجيات، وجرد درج الكاشير اليومي.",
    steps: [
      {
        stepNumber: 1,
        actor: "المدير المالي",
        sourceModule: "المصاريف (Expenses)",
        targetModule: "قواعد التوزيع (Allocation Engine)",
        actionAr: "تسجيل فاتورة إيجار المقر المشترك (مثلاً 1,000$) وتطبيق قاعدة التوزيع (70% متجر / 30% برمجيات)",
        dataPayload: "amount = 1000, shop_share = 700, freelance_share = 300",
        databaseTablesAffected: ["expenses", "expense_allocation_rules", "journal_entries"],
        accountingImpact: "مدين: مصاريف إيجار المتجر (6100) بـ 700$ + مدين: مصاريف إيجار البرمجيات (6200) بـ 300$ | دائن: البنك بـ 1000$."
      },
      {
        stepNumber: 2,
        actor: "الكاشير",
        sourceModule: "الخزينة (Treasury)",
        targetModule: "الخزينة الرئيسية",
        actionAr: "إغلاق درج الكاشير في نهاية اليوم وتحويل الفائض النقدي للخزينة الرئيسية أو البنك",
        dataPayload: "cash_drawer_count, system_expected_cash, transferred_amount",
        databaseTablesAffected: ["treasury_transactions", "journal_entries"],
        accountingImpact: "مدين: الخزينة الرئيسية (1112) | دائن: درج كاشير المتجر (1111). مع إثبات أي عجز أو زيادة في حساب مستقل."
      }
    ]
  },
  {
    id: "financial_closing_flow",
    titleAr: "7. دورة الإقفال الشهري والسنوي واستخراج القوائم الموحدة",
    titleEn: "Month-End Closing & Consolidated P&L Generation Flow",
    unit: "shared",
    description: "خطوات الإقفال المحاسبي، احتساب إهلاك الأصول الثابتة، مطابقة ميزان المراجعة، وترحيل الأرباح للمالك.",
    steps: [
      {
        stepNumber: 1,
        actor: "محرك الإهلاك الآلي",
        sourceModule: "الأصول الثابتة (Fixed Assets)",
        targetModule: "دفتر اليومية (Journal)",
        actionAr: "احتساب قسط الإهلاك الشهري لمعدات المتجر وأجهزة التطوير وتوليد القيود",
        dataPayload: "depreciation_schedule_run",
        databaseTablesAffected: ["asset_depreciation_logs", "journal_entries"],
        accountingImpact: "مدين: مصروف إهلاك الأصول (6400) | دائن: مجمع إهلاك الأصول الثابتة (1490)."
      },
      {
        stepNumber: 2,
        actor: "المدير المالي",
        sourceModule: "الأستاذ العام (General Ledger)",
        targetModule: "ميزان المراجعة",
        actionAr: "التحقق من توازن ميزان المراجعة لكل وحدة على حدة والميزان المجمع العام",
        dataPayload: "check: Total Debits == Total Credits",
        databaseTablesAffected: ["financial_periods", "accounts"],
        accountingImpact: "التأكد من سلامة القيود 100% قبل إغلاق الفترة."
      },
      {
        stepNumber: 3,
        actor: "محرك التقارير المالية",
        sourceModule: "التقارير الختامية",
        targetModule: "لوحة تحكم المالك",
        actionAr: "توليد قائمة دخل المتجر، قائمة دخل البرمجيات، وقائمة الدخل والميزانية العمومية الموحدة",
        dataPayload: "store_profit, freelance_profit, combined_profit, balance_sheet_snapshot",
        databaseTablesAffected: ["financial_periods"],
        accountingImpact: "ترحيل صافي الدخل إلى حقوق الملكية وإقفال الفترة المالية لمنع أي تعديلات لاحقة."
      }
    ]
  }
];
