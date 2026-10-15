export interface RoadmapPhase {
  phaseNumber: number;
  titleAr: string;
  titleEn: string;
  durationWeeks: string;
  goalAr: string;
  deliverables: string[];
  databaseTasks: string[];
  testCriteria: string[];
  status: 'planned' | 'ready_for_dev' | 'completed';
}

export const IMPLEMENTATION_ROADMAP: RoadmapPhase[] = [
  {
    phaseNumber: 1,
    titleAr: "المرحلة الأولى: الأساس الهيكلي، بنية MySQL ونواة عزل وحدات الأعمال",
    titleEn: "Phase 1: Database Foundation, Business Unit Scoping & RBAC Security",
    durationWeeks: "2-3 أسابيع",
    goalAr: "تجهيز بيئة قاعدة بيانات MySQL 8.0+، ضبط الجداول الأساسية لوحدات الأعمال، إعداد نظام الصلاحيات RBAC، وسجل التدقيق الأمني غير القابل للتعديل.",
    deliverables: [
      "تنفيذ سكريبت إنشاء جداول MySQL مع ضبط المحرك InnoDB وترميز utf8mb4_unicode_ci.",
      "تطبيق منطق عزل وحدات الأعمال (Business Unit Context Middleware).",
      "بناء هيكل الصلاحيات الدقيقة (Users, Roles, Permissions).",
      "تفعيل محرك تسجيل التدقيق الأمني الشامل (Audit Logging Engine)."
    ],
    databaseTasks: [
      "إنشاء جداول business_units, users, roles, user_roles, audit_logs, system_settings.",
      "إنشاء الفهارس الأساسية والمفاتيح الأجنبية وقواعد التحقق (Constraints)."
    ],
    testCriteria: [
      "نجاح عزل مستخدم متجر الحواسيب عن بيانات البرمجيات الحرة والعكس.",
      "التحقق من تسجيل كل حركة إدراج وتعديل في جدول audit_logs مع القيم القديمة والجديدة."
    ],
    status: "ready_for_dev"
  },
  {
    phaseNumber: 2,
    titleAr: "المرحلة الثانية: محرك القيود المحاسبية المركزية وشجرة الحسابات",
    titleEn: "Phase 2: Chart of Accounts & Automated Double-Entry Ledger Engine",
    durationWeeks: "3-4 أسابيع",
    goalAr: "تأسيس شجرة الحسابات المالية الموحدة، ومحرك القيود اليومية المزدوجة الآلي، ومراكز التكلفة للفصل والدمج المالي.",
    deliverables: [
      "شجرة حسابات عربية خماسية المستويات تغطي قطاعي المتجر والبرمجيات والمصروفات المشتركة.",
      "محرك ترحيل القيود (Posting Engine) الذي يضمن توازن القيد ذرياً (Total Debit = Total Credit).",
      "إمكانية إدخال القيود اليدوية وإقفال الفترات المحاسبية."
    ],
    databaseTasks: [
      "إنشاء جداول accounts, cost_centers, journal_entries, journal_entry_lines, financial_periods.",
      "بناء Views لاستخراج أرصدة الحسابات وميزان المراجعة اللحظي."
    ],
    testCriteria: [
      "رفض أي قيد غير متوازن برمجياً وقاعدياً.",
      "استخراج ميزان مراجعة تجريبي متوازن 100% لكل وحدة على حدة ومجمعاً."
    ],
    status: "planned"
  },
  {
    phaseNumber: 3,
    titleAr: "المرحلة الثالثة: إدارة المخزون، تقييم التكلفة وتتبع الأرقام التسلسلية",
    titleEn: "Phase 3: Inventory Management, Serial Tracking & Perpetual Valuation",
    durationWeeks: "3 أسابيع",
    goalAr: "بناء سجل المنتجات وقطع الغيار مع تتبع أرقام السيريال للأجهزة الفردية (لابتوبات، شاشات، كاميرات) واحتساب متوسط التكلفة المرجح آلياً.",
    deliverables: [
      "دليل المنتجات، الفئات، ووحدات القياس وسياسة تتبع السيريال نمر.",
      "وحدة تسجيل حركات المخزون (وارد، صادر، تسوية جردية، تالف).",
      "محرك حساب تكلفة البضاعة المباعة (COGS) وتوليد قيد المخزون التلقائي."
    ],
    databaseTasks: [
      "إنشاء جداول product_categories, products, product_serials, inventory_transactions.",
      "تطبيق Triggers لتحديث متوسط التكلفة والكمية المتاحة عند كل حركة شراء أو بيع."
    ],
    testCriteria: [
      "منع بيع أي جهاز مشروط بسيريال دون تحديد رقم تسلسلي متاح وحقيقي في المخزن.",
      "منع رصيد المخزون السالب واحتساب دقيق لقيمة المخزون الإجمالية."
    ],
    status: "planned"
  },
  {
    phaseNumber: 4,
    titleAr: "المرحلة الرابعة: إدارة العملاء، الموردين والخزينة والبنوك",
    titleEn: "Phase 4: CRM, Vendors & Multi-Account Treasury Engine",
    durationWeeks: "2-3 أسابيع",
    goalAr: "إدارة ملفات العملاء والموردين ومتابعة الذمم المدينة والدائنة، مع ربط حسابات الخزينة النقدية ودرج الكاشير والحسابات المصرفية والمحافظ الرقمية.",
    deliverables: [
      "دليل العملاء والموردين وتحديد سقوف الائتمان وسياسات السداد.",
      "إدارة سندات القبض (Payment Receipts) وسندات الصرف (Payment Vouchers).",
      "إدارة حسابات الخزينة والتحويلات الداخلية ومطابقة درج الكاشير اليومي."
    ],
    databaseTasks: [
      "إنشاء جداول customers, suppliers, treasury_accounts, treasury_transactions, payment_receipts, payment_vouchers.",
      "ربط حركات التحصيل والصرف آلياً بالقيود المحاسبية في الأستاذ العام."
    ],
    testCriteria: [
      "تحديث فوري لرصيد العميل أو المورد عند إصدار الفاتورة أو تحصيل السند.",
      "تطابق رصيد حسابات الخزينة مع أرصدة حسابات الأستاذ العام المقابلة."
    ],
    status: "planned"
  },
  {
    phaseNumber: 5,
    titleAr: "المرحلة الخامسة: نقطة بيع التجزئة والمبيعات والمشتريات",
    titleEn: "Phase 5: Retail POS Terminal, Sales Invoicing & Procurement Flow",
    durationWeeks: "3-4 أسابيع",
    goalAr: "تطوير واجهة نقطة بيع سريعة (POS) للمحل، الفواتير الضريبية، عروض الأسعار، دورة المشتريات وفواتير الموردين مع طباعة الباركود وQR.",
    deliverables: [
      "شاشة نقطة بيع سريعة تدعم قارئ الباركود، الخصومات، والمدفوعات المتعددة.",
      "إصدار فواتير المبيعات والمرتجعات مع خصم المخزون والتحقق من السيريالات.",
      "إدارة فواتير المشتريات وتحديث التكاليف وتسجيل السيريالات الواردة."
    ],
    databaseTasks: [
      "إنشاء جداول sales_invoices, sales_invoice_items, purchase_invoices, purchase_invoice_items.",
      "إعداد قيود الإيرادات وتكلفة المبيعات وضريبة القيمة المضافة التلقائية."
    ],
    testCriteria: [
      "إصدار فاتورة بيع لابتوب وتحديث حالته إلى SOLD وخصم المخزون وترحيل قيدي المبيعات وCOGS في أجزاء من الثانية."
    ],
    status: "planned"
  },
  {
    phaseNumber: 6,
    titleAr: "المرحلة السادسة: ورشة الصيانة والإصلاح وقطع الغيار والضمانات",
    titleEn: "Phase 6: Computer Repair Workshop, Spare Parts & Warranty Hub",
    durationWeeks: "2-3 أسابيع",
    goalAr: "أتمتة ورشة صيانة الحواسيب واللابتوبات من تذاكر الاستلام والتشخيص الفني، صرف قطع الغيار، احتساب أجور اليد والضمانات وعمولات الفنيين.",
    deliverables: [
      "دورة تذكرة الصيانة المتكاملة (استلام، تشخيص، انتظار موافقة، إصلاح، تسليم).",
      "صرف قطع الغيار المستهلكة من المستودع وربطها بالتذكرة.",
      "إصدار فاتورة الصيانة وبطاقة الضمان واحتساب عمولة الفني."
    ],
    databaseTasks: [
      "إنشاء جداول maintenance_tickets, maintenance_spare_parts, employees, technician_commissions.",
      "فصل إيرادات أجور اليد (خدمة) عن إيرادات بيع قطع الغيار في القيود المحاسبية."
    ],
    testCriteria: [
      "خصم قطع الغيار من المخزون بالسعر التكليفي وتحميلها للعميل بسعر البيع المعتمد.",
      "تتبع سريان فترة الضمان برقم التذكرة أو سيريال الجهاز."
    ],
    status: "planned"
  },
  {
    phaseNumber: 7,
    titleAr: "المرحلة السابعة: مشاريع أنظمة المراقبة (CCTV) وتمديدات الشبكات",
    titleEn: "Phase 7: CCTV & Structured Cabling Projects Management",
    durationWeeks: "3 أسابيع",
    goalAr: "إدارة مشاريع كاميرات المراقبة وتمديد شبكات البنية التحتية، إعداد قوائم المواد (BoM)، حجز وصرف المعدات، والفوترة المرحلية.",
    deliverables: [
      "إنشاء ومتابعة عقود مشاريع CCTV والشبكات ومخططات الـ IP.",
      "صرف مواد المشروع وحجز الأجهزة بالسيريال من المخزون.",
      "إصدار فواتير الدفعات المرحلية ومحاضر الاستلام الفني."
    ],
    databaseTasks: [
      "إنشاء جداول cctv_projects, cctv_project_items, network_projects, network_project_items.",
      "حساب تكلفة المشروع المباشرة (مواد + عمالة) والاعتراف بالإيراد."
    ],
    testCriteria: [
      "حجز وصرف 16 كاميرا وجهاز NVR لمشروع دون إمكانية إعادة بيعها في نقطة البيع.",
      "مطابقة تكاليف المشروع الفعلية مع الميزانية التقديرية (Variance Analysis)."
    ],
    status: "planned"
  },
  {
    phaseNumber: 8,
    titleAr: "المرحلة الثامنة: منظومة توزيع واشتراكات الإنترنت الشهرية",
    titleEn: "Phase 8: WISP & Internet Subscription Management Engine",
    durationWeeks: "2-3 أسابيع",
    goalAr: "إدارة باقات الإنترنت للمشتركين، توليد فواتير الاشتراك الشهري التلقائي (Cron)، متابعة تأمين أجهزة الاستقبال (CPE)، وتتبع تكلفة السعات الرئيسية.",
    deliverables: [
      "إدارة باقات وسرعات الإنترنت وأبراج ومنافذ التوزيع.",
      "محرك الفوترة الدورية وتوليد فواتير الاشتراكات في بداية الشهر تلقائياً.",
      "تجديد الاشتراك فور التحصيل وتنبيهات انتهاء فترة السماح.",
      "تتبع تكلفة الحزمة المغذية الرئيسية من المزود الرئيسي."
    ],
    databaseTasks: [
      "إنشاء جداول internet_packages, internet_subscriptions, subscription_invoices.",
      "ربط فواتير الاشتراكات الشهرية تلقائياً بحسابات الذمم المدينة وإيراد الإنترنت."
    ],
    testCriteria: [
      "توليد فواتير الشهر الجديد لكافة المشتركين وتحديث تاريخ الاستحقاق دون تكرار.",
      "إثبات قيد إيراد الاشتراكات وحساب نسبة التحصيل الشهري."
    ],
    status: "planned"
  },
  {
    phaseNumber: 9,
    titleAr: "المرحلة التاسعة: إدارة عقود ومشاريع تطوير البرمجيات والعمل الحر",
    titleEn: "Phase 9: Freelance Software Projects, Milestones & Direct Costs",
    durationWeeks: "3 أسابيع",
    goalAr: "بناء منصة إدارة مشاريع البرمجيات الحرة، العقود الثابتة وبالساعة، مراحل التسليم (Milestones)، مصاريف السيرفرات والتراخيص، وحساب ربحية كل مشروع مستقل.",
    deliverables: [
      "سجل المشاريع البرمجية، العملاء، ومواصفات العقود ونماذج التسعير.",
      "إدارة مراحل التسليم وفواتير المراحل عند الاعتماد.",
      "تسجيل المصاريف السحابية المباشرة (Hosting, APIs, Tools) المخصصة لكل مشروع.",
      "تقرير ربحية المشروع الفردي ومعدل العائد بالساعة."
    ],
    databaseTasks: [
      "إنشاء جداول freelance_projects, project_milestones, project_direct_expenses, freelance_time_logs.",
      "تخصيص قيود إيرادات البرمجيات ومصاريفها المباشرة لقطاع العمل الحر حصراً."
    ],
    testCriteria: [
      "حساب ربح مشروع برمجيات: (فواتير معتمدة) - (تكاليف سيرفرات وأدوات) بدقة 100%.",
      "استقلال إيرادات البرمجيات تماماً عن مبيعات متجر الحاسوب."
    ],
    status: "planned"
  },
  {
    phaseNumber: 10,
    titleAr: "المرحلة العاشرة: التقارير الختامية، القوائم الموحدة، النسخ الاحتياطي والتدشين",
    titleEn: "Phase 10: Financial Statements, Multi-Unit Consolidation & Production Launch",
    durationWeeks: "3-4 أسابيع",
    goalAr: "تطوير لوحات المعلومات الشاملة، قوائم الدخل المنفصلة والموحدة، الميزانية العمومية، إدارة الأصول والإهلاك، وجدولة النسخ الاحتياطي والتعافي من الكوارث.",
    deliverables: [
      "لوحات تحكم تفاعلية للمتجر، للبرمجيات، وللأداء المالي المجمع.",
      "استخراج قائمة الدخل (P&L)، الميزانية العمومية (Balance Sheet)، وميزان المراجعة بصيغ PDF/Excel.",
      "نظام إهلاك الأصول الثابتة التلقائي.",
      "سكريبتات النسخ الاحتياطي الآلي لـ MySQL والاختبارات الشاملة (E2E Testing)."
    ],
    databaseTasks: [
      "إنشاء جداول fixed_assets, asset_depreciation_logs, report_templates, backup_logs.",
      "ضبط وتأمين قواعد بيانات MySQL، تحسين الفهارس، ومراجعة أداء الاستعلامات المعقدة."
    ],
    testCriteria: [
      "تطابق قائمة الدخل الموحدة مع مجموع قائمتي المتجر والبرمجيات مع المصاريف المشتركة.",
      "نجاح عملية استرجاع قاعدة البيانات كاملة من نسخة احتياطية مشفرة خلال أقل من 5 دقائق."
    ],
    status: "planned"
  }
];
