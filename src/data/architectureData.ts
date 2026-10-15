export interface ArchitectureModule {
  id: number;
  slug: string;
  title: string;
  titleEn: string;
  category: 'core' | 'store' | 'freelance' | 'finance' | 'admin';
  icon: string;
  summary: string;
  businessRules: string[];
  keyEntities: {
    name: string;
    table: string;
    description: string;
    columns: string[];
  }[];
  accountingImpact: {
    debit: string;
    credit: string;
    notes: string;
  }[];
  dataFlowDescription: string;
  integrationPoints: string[];
}

export const SYSTEM_OVERVIEW = {
  systemName: "نظام الإدارة المحاسبية والتشغيلية المزدوجة (Dual-Unit ERP & Accounting System)",
  databaseEngine: "MySQL 8.0+ (InnoDB Engine, utf8mb4_unicode_ci, Strict SQL Mode)",
  architecturePattern: "Modular Service-Agnostic Core with Unit-Level Cost Centers & Multi-Ledger Isolation",
  uiDirection: "Arabic RTL First (واجهة عربية أصيلة من اليمين لليسار)",
  businessUnits: [
    {
      code: "SHOP",
      id: 1,
      name: "متجر الحواسيب والشبكات والخدمات الميدانية (Computer Shop & Field Services)",
      scope: [
        "مبيعات الحواسيب المكتبية والمحمولة والشاشات وملحقاتها",
        "مبيعات قطع الغيار ومعدات الشبكات وكاميرات المراقبة (CCTV)",
        "قسم الصيانة والإصلاح وورشة الفحص الفني والضمانات",
        "مشاريع تمديد وتركيب كاميرات المراقبة للشركات والمنازل",
        "مشاريع شبكات البنية التحتية، السيرفرات والتمديدات الهيكلية",
        "إدارة شبكة وتوزيع اشتراكات الإنترنت للمشتركين والفواتير الشهرية"
      ]
    },
    {
      code: "FREELANCE",
      id: 2,
      name: "نشاط تطوير البرمجيات والحلول الرقمية الحرة (Freelance Software Development)",
      scope: [
        "عقود ومشاريع تطوير البرمجيات وتطبيقات الويب والموبايل",
        "خدمات الاستشارات البرمجية والدعم الفني السحابي",
        "إدارة دفعات ومراحل المشاريع (Milestone-based Invoicing)",
        "تتبع مصاريف المشاريع البرمجية (سيرفرات، أدوات، API، تراخيص)",
        "حساب ربحية كل مشروع برمجيات على حدة والربحية المجمعة"
      ]
    }
  ]
};

export const ARCHITECTURE_MODULES: ArchitectureModule[] = [
  {
    id: 1,
    slug: "system-architecture",
    title: "1. المعمارية الهيكلية العامة للنظام (System Architecture)",
    titleEn: "System Architecture & Decoupled Tier Design",
    category: "core",
    icon: "Layers",
    summary: "معمارية معيارية متعددة الطبقات منفصلة تماماً عن أي لغة برمجة، ترتكز على محرك قاعدة بيانات MySQL عالي الأداء مع طبقة وسيطة موحدة لمعالجة منطق الأعمال (Business Logic Layer) تخدم واجهة مستخدم عربية RTL.",
    businessRules: [
      "فصل طبقة منطق الأعمال وقواعد الحسابات المالية بالكامل عن طبقة العرض وقواعد البيانات لتمكين بناء الباكيند بأي لغة دون المساس بالهيكل.",
      "اعتماد الترميز الشامل utf8mb4_unicode_ci في MySQL لضمان دعم متكامل وسلس للغة العربية في البحث والفرز.",
      "استخدام المعاملات البنكية المحكمة (ACID Transactions) لجميع الحركات المالية وحركات المخزون لمنع أي تعارض بيانات.",
      "فصل الجلسات والصلاحيات بحسب وحدة العمل (Business Unit) مع إمكانية التبديل للمدير العام صاحب الصلاحية المزدوجة."
    ],
    keyEntities: [
      {
        name: "وحدات الأعمال (Business Units)",
        table: "business_units",
        description: "السجل الرئيسي لتعريف وتخصيص وحدتي العمل (المتجر والبرمجيات).",
        columns: ["id", "code", "name_ar", "name_en", "is_active", "created_at"]
      },
      {
        name: "إعدادات النظام العامة (System Settings)",
        table: "system_settings",
        description: "المعاملات المالية والعملة الافتراضية والضرائب لكل وحدة.",
        columns: ["id", "unit_id", "setting_key", "setting_value", "updated_at"]
      }
    ],
    accountingImpact: [
      {
        debit: "حسب نوع الحركة",
        credit: "حسب نوع الحركة",
        notes: "كل حركة تسجل مع معرّف وحدة العمل (unit_id) ومركز التكلفة لضمان استخراج ميزانية مستقلة لكل قطاع."
      }
    ],
    dataFlowDescription: "تستقبل طبقة الواجهة طلب المستخدم، يتم التحقق من صحة المدخلات وتطبيق صلاحيات RBAC، ثم تبدأ المعاملة في MySQL عبر إنشاء القيد المزدوج في دفتر اليومية وتحديث الجداول التشغيلية ذات الصلة ذرياً (Atomic Execution).",
    integrationPoints: ["جميع الوحدات 23 تعتمد على الهيكل الأساسي ووحدات الأعمال."]
  },
  {
    id: 2,
    slug: "business-modules",
    title: "2. مصفوفة الوحدات الوظيفية (Business Modules Architecture)",
    titleEn: "Business Modules Matrix & Component Boundaries",
    category: "core",
    icon: "Grid",
    summary: "تقسيم النظام إلى وحدات وظيفية مستقلة منطقياً (Modular Components) ذات مسؤولية محددة تتواصل عبر واجهات بيانات واضحة المعالم لمنع التداخل بين نشاط التجزئة التقنية ونشاط البرمجيات.",
    businessRules: [
      "كل وحدة وظيفية تمتلك جداول مخصصة في قاعدة البيانات مع مفاتيح أجنبية (Foreign Keys) دقيقة.",
      "حظر التعديل المباشر على الحسابات العامة؛ يتم إرسال أوامر توليد قيود محاسبية تلقائية عبر محرك القيود المركزي (Posting Engine).",
      "إمكانية تفعيل أو تعطيل وحدات فرعية (مثل تمديدات كاميرات المراقبة أو اشتراكات الإنترنت) دون التأثير على عمل باقي أقسام المتجر أو البرمجيات."
    ],
    keyEntities: [
      {
        name: "دليل الوحدات الوظيفية (System Modules)",
        table: "system_modules",
        description: "فهرس الوحدات الوظيفية المتاحة وصلاحياتها وحالتها التشغيلية.",
        columns: ["id", "code", "name_ar", "category", "is_enabled"]
      }
    ],
    accountingImpact: [
      {
        debit: "محرك الربط المالي",
        credit: "شجرة الحسابات الموحدة",
        notes: "توحيد مسميات الحسابات الأساسية في شجرة الحسابات مع تمييز فروعها بمراكز التكلفة."
      }
    ],
    dataFlowDescription: "تتكامل الوحدات التشغيلية (مبيعات، مشتريات، مشاريع، صيانة) عبر تمرير أحداث مالية لمولد القيود العامة لضمان عدم وجود أي حركة غير مقيدة محاسبياً.",
    integrationPoints: ["شجرة الحسابات", "محرك الصلاحيات", "سجل التدقيق"]
  },
  {
    id: 3,
    slug: "business-units-architecture",
    title: "3. معمارية عزل وتكامل وحدات الأعمال (Business Units Architecture)",
    titleEn: "Multi-Unit Isolation & Consolidated Financial Layer",
    category: "core",
    icon: "Split",
    summary: "هيكلية متقدمة تضمن العزل المالي والتشغيلي التام بين متجر الحواسيب والشبكات ونشاط تطوير البرمجيات الحرة، مع توفير محرك دمج مالي (Consolidation Engine) يعطي المالك نظرة موحدة وشاملة للثروة وصافي الأرباح.",
    businessRules: [
      "كل مستند مالي (فاتورة بيع، شراء، سند صرف، قيد يومية، راتب، أصل) يحمل إجبارياً حقل unit_id.",
      "فصل كامل لحسابات النقدية والبنوك الافتراضية لكل وحدة، أو تخصيص حساب مشترك بنسب تخصيص دقيقة.",
      "المصاريف المشتركة (كإيجار المقر أو الكهرباء إذا تشاركوا المكان) تقسم عبر قيود توزيع تكاليف (Cost Allocation Rules) محددة مسبقاً.",
      "إمكانية استخراج ميزان مراجعة وقائمة دخل وميزانية عمومية مستقلة للمتجر، ومستقلة للبرمجيات، ومجمعة للمنشأة ككل."
    ],
    keyEntities: [
      {
        name: "مراكز التكلفة ووحدات الأعمال (Cost Centers)",
        table: "cost_centers",
        description: "مراكز التكلفة الفرعية التابعة لكل وحدة عمل لتحليل هوامش الربحية.",
        columns: ["id", "unit_id", "code", "name_ar", "parent_id", "is_active"]
      },
      {
        name: "قواعد توزيع المصاريف المشتركة (Expense Allocation Rules)",
        table: "expense_allocation_rules",
        description: "نسب التوزيع التلقائي للمصاريف المشتركة بين المتجر والبرمجيات.",
        columns: ["id", "expense_category_id", "shop_percentage", "freelance_percentage", "notes"]
      }
    ],
    accountingImpact: [
      {
        debit: "مصروف المتجر (حسب النسبة) + مصروف البرمجيات (حسب النسبة)",
        credit: "النقدية / البنك المشترك",
        notes: "يضمن التوزيع الدقيق للربحية الفعلية لكل نشاط على حدة."
      }
    ],
    dataFlowDescription: "عند إنشاء أي حركة، يفرض النظام اختيار وحدة العمل المناسبة. إذا كانت الحركة مشتركة يوزعها النظام محاسبياً بناءً على مصفوفة التوزيع المعتمدة في جدول expense_allocation_rules.",
    integrationPoints: ["دفتر الأستاذ العام", "شجرة الحسابات", "التقارير المالية"]
  },
  {
    id: 4,
    slug: "chart-of-accounts-gl",
    title: "4. معمارية المحاسبة وشجرة الحسابات (Accounting & General Ledger)",
    titleEn: "Double-Entry General Ledger & Multi-Level Chart of Accounts",
    category: "finance",
    icon: "BookOpen",
    summary: "نظام قيد مزدوج صارم (Double-Entry Accounting) يرتكز على شجرة حسابات هرمية خماسية المستوى تغطي الأصول، الخصوم، حقوق الملكية، الإيرادات، والمصروفات مع التمييز بين المتجر والبرمجيات.",
    businessRules: [
      "مبدأ توازن القيد الصارم: يجب أن يتساوى مجموع المدين مع مجموع الدائن في كل حركة بدقة سنت/قرش (Total Debit = Total Credit).",
      "القيود المرحلة (Posted Entries) تصبح غير قابلة للحذف أو التعديل المباشر؛ التعديل يتم فقط عبر قيود عكسية (Reversal Entries) لضمان الشفافية القانونية.",
      "فترات مالية مقفلة (Financial Periods) تمنع إدراج قيود بتاريخ قديم بعد إقفال الشهر أو السنة المالية.",
      "ترقيم تسلسلي آلي للقيد المحاسبي لا يقبل الفجوات (Gapless Journal Sequence)."
    ],
    keyEntities: [
      {
        name: "دليل الحسابات (Chart of Accounts)",
        table: "accounts",
        description: "الهيكل الشجري للحسابات الرئيسية والفرعية مع تصنيف طبيعة الحساب.",
        columns: ["id", "account_code", "name_ar", "account_type", "level", "parent_id", "unit_scope", "current_balance"]
      },
      {
        name: "رؤوس قيود اليومية (Journal Entries)",
        table: "journal_entries",
        description: "سجل القيد الرئيسي الذي يربط المستند الأصلي بالحركات المالية.",
        columns: ["id", "entry_number", "entry_date", "unit_id", "reference_type", "reference_id", "description", "is_posted"]
      },
      {
        name: "أسطر قيود اليومية (Journal Entry Lines)",
        table: "journal_entry_lines",
        description: "تفاصيل المدين والدائن لكل حساب داخل القيد الواحد.",
        columns: ["id", "entry_id", "account_id", "cost_center_id", "debit_amount", "credit_amount", "narration"]
      }
    ],
    accountingImpact: [
      {
        debit: "الحساب المتأثر (أصل / مصروف / تخفيض التزام)",
        credit: "الحساب المقابل (إيراد / التزام / تخفيض أصل)",
        notes: "الأساس الذي تبنى عليه جميع التقارير الختامية وميزان المراجعة."
      }
    ],
    dataFlowDescription: "أي حدث في المبيعات، المشتريات، الصيانة، الاشتراكات، أو المشاريع يمرر كائن المعاملة إلى مولد القيود (Posting Engine) الذي ينشئ رأس القيد وأسطره ويتحقق من توازنه قبل الحفظ في MySQL داخل Transaction محكمة.",
    integrationPoints: ["كافة الوحدات الفرعية ومحرك التقارير المالية"]
  },
  {
    id: 5,
    slug: "inventory-architecture",
    title: "5. معمارية إدارة المخزون والمستودعات (Inventory & Serial Tracking)",
    titleEn: "Inventory Architecture, Valuation & Serial Number Tracking",
    category: "store",
    icon: "Package",
    summary: "نظام جرد مستمر (Perpetual Inventory System) يدعم تتبع السيريال نمر (Serial Numbers) للحواسيب، اللابتوبات، كاميرات المراقبة والشاشات، مع تقييم المخزون بطريقة المتوسط المرجح والتنبيه بنقاط إعادة الطلب.",
    businessRules: [
      "الأصناف عالية القيمة (لابتوبات، شاشات، كاميرات، NVR، أجهزة توجيه Mikrotik) تتطلب إلزامياً تتبع الرقم التسلسلي الفريد (Unique Serial Number Tracking).",
      "الأصناف الاستهلاكية (كابلات شبكة بالمتر، كونكترات RJ45، براغي، حوامل) تتتبع بالكمية والوزن/الطول مع دعم تحويل الوحدات.",
      "تحديث تكلفة البضاعة المباعة (COGS) وقيمة المخزون لحظياً عند كل حركة بيع أو شراء أو مرتجع.",
      "منع رصيد المخزون السالب (Strict Anti-Negative Stock) مع دعم إشعارات الوصول للحد الأدنى (Reorder Point Alerts)."
    ],
    keyEntities: [
      {
        name: "دليل المنتجات والأصناف (Products)",
        table: "products",
        description: "بيانات المنتجات، الباركود، الفئات، والتسعير وسياسة السيريال.",
        columns: ["id", "barcode", "sku", "name_ar", "category_id", "unit_of_measure", "cost_price", "selling_price", "requires_serial", "reorder_level"]
      },
      {
        name: "الأرقام التسلسلية للأجهزة (Product Serials)",
        table: "product_serials",
        description: "تتبع حالة وموقع كل جهاز عبر رقمه التسلسلي الفريد (متوفر، مباع، تحت الصيانة، تالف).",
        columns: ["id", "product_id", "serial_number", "status", "purchase_invoice_item_id", "sale_invoice_item_id", "warranty_expiry_date"]
      },
      {
        name: "حركات المخزون التفصيلية (Inventory Transactions)",
        table: "inventory_transactions",
        description: "سجل كامل ودقيق لكل حركة دخول أو خروج أو تحويل أو تسوية مخزنية.",
        columns: ["id", "product_id", "transaction_type", "quantity", "unit_cost", "total_cost", "reference_type", "reference_id", "created_at"]
      }
    ],
    accountingImpact: [
      {
        debit: "تكلفة البضاعة المباعة (COGS) [عند البيع]",
        credit: "حساب المخزون (Inventory Asset)",
        notes: "يخفض قيمة الأصل ويثبت تكلفة المبيعات في نفس لحظة إصدار فاتورة المبيعات."
      },
      {
        debit: "حساب المخزون (Inventory Asset) [عند الشراء]",
        credit: "الذمم الدائنة / الموردين أو الصندوق",
        notes: "يزيد أصل المخزون بالتكلفة الفعلية الواردة في فاتورة المشتريات."
      }
    ],
    dataFlowDescription: "عند الشراء: تسجيل المنتجات وتوليد/إدخال السيريالات وزيادة كمية المخزون وتحديث متوسط التكلفة. عند البيع أو الصيانة: اختيار السيريال أو الصنف، خصم الكمية، وتوليد قيد COGS تلقائياً.",
    integrationPoints: ["المبيعات", "المشتريات", "الصيانة", "مشاريع CCTV", "مشاريع الشبكات"]
  },
  {
    id: 6,
    slug: "sales-architecture",
    title: "6. معمارية المبيعات ونقاط البيع (Sales & POS Architecture)",
    titleEn: "Sales Invoicing, Point-of-Sale & Revenue Recognition",
    category: "store",
    icon: "ShoppingCart",
    summary: "محرك مبيعات شامل يدعم نقاط البيع المباشرة في المحل (POS) والفواتير الضريبية للشركات، عروض الأسعار، الخصومات المعتمدة، المرتجعات، وتعدد وسائل الدفع الفوري والآجل.",
    businessRules: [
      "دعم إصدار فواتير مبيعات سريعة (POS) وفواتير مفصلة للمؤسسات مع طباعة باركود وQR فوري.",
      "فحص توافر المخزون وصحة الأرقام التسلسلية لحظياً قبل تأكيد الفاتورة.",
      "البيع الآجل مشروط بعدم تجاوز العميل للحد الائتماني (Credit Limit) المعتمد.",
      "المرتجعات تتطلب إثبات الفاتورة الأصلية أو فحص حالة السيريال المباع لمنع مرتجعات وهمية."
    ],
    keyEntities: [
      {
        name: "فواتير المبيعات (Sales Invoices)",
        table: "sales_invoices",
        description: "رأس فاتورة المبيعات (نقدية، آجلة، مختلطة) مع الإجماليات والضرائب والخصومات.",
        columns: ["id", "invoice_number", "customer_id", "invoice_date", "subtotal", "tax_amount", "discount_amount", "grand_total", "paid_amount", "payment_status"]
      },
      {
        name: "بنود فاتورة المبيعات (Sales Invoice Items)",
        table: "sales_invoice_items",
        description: "الأصناف، الكميات، أسعار البيع، التكلفة، والأرقام التسلسلية المرفقة.",
        columns: ["id", "invoice_id", "product_id", "quantity", "unit_price", "unit_cost", "total_price", "discount", "net_amount"]
      }
    ],
    accountingImpact: [
      {
        debit: "النقدية / البنك (المسدد) + الذمم المدينة للعملاء (المتبقي)",
        credit: "إيرادات مبيعات المتجر (Store Sales Revenue)",
        notes: "إثبات الإيراد مع توزيع المبالغ بين المقبوض فوراً والمستحق على العميل."
      },
      {
        debit: "تكلفة البضاعة المباعة (COGS)",
        credit: "مخزون بضاعة المتجر",
        notes: "قيد متزامن لإثبات تكلفة المنتجات المنصرفة من المستودع."
      }
    ],
    dataFlowDescription: "يقوم الكاشير بمسح الباركود/السيريال، يحدد العميل ونوع الدفع، يولد النظام الفاتورة، يخصم المخزون، يولد قيدي الإيراد وتكلفة المبيعات، ويحدث كشف حساب العميل إذا كان هناك جزء آجل.",
    integrationPoints: ["المخزون", "العملاء", "الصندوق والبنك", "دفتر اليومية"]
  },
  {
    id: 7,
    slug: "purchases-architecture",
    title: "7. معمارية المشتريات والتوريد (Purchases & Procurement Architecture)",
    titleEn: "Procurement, Vendor Invoices & Goods Receipt (GRN)",
    category: "store",
    icon: "Truck",
    summary: "إدارة دورة المشتريات من أوامر الشراء (Purchase Orders) إلى إشعار استلام البضائع (GRN)، وفواتير الموردين، وتسجيل الأرقام التسلسلية للأجهزة الواردة مع إدارة دفعات الموردين.",
    businessRules: [
      "مطابقة الفاتورة مع البضاعة المستلمة فعلياً (Three-Way Matching) لضمان عدم سداد مبالغ دون استلام أصناف.",
      "تحديث متوسط التكلفة المرجح (Weighted Average Cost) للأصناف المخزنية عند كل عملية شراء جديدة.",
      "تسجيل أرقام فواتير المورد الخارجية وتواريخ الاستحقاق وجداول الدفعات لمنع التأخير وتراكم الذمم الدائنة."
    ],
    keyEntities: [
      {
        name: "فواتير المشتريات (Purchase Invoices)",
        table: "purchase_invoices",
        description: "بيانات فواتير الموردين ومواعيد الاستحقاق وطرق الدفع.",
        columns: ["id", "invoice_number", "supplier_id", "supplier_invoice_ref", "invoice_date", "subtotal", "tax_amount", "grand_total", "paid_amount", "payment_status"]
      },
      {
        name: "بنود فاتورة الشراء (Purchase Invoice Items)",
        table: "purchase_invoice_items",
        description: "المنتجات المشتراة وتكلفتها والكميات والضمان الممنوح من المورد.",
        columns: ["id", "purchase_id", "product_id", "quantity", "unit_cost", "total_cost", "warranty_months"]
      }
    ],
    accountingImpact: [
      {
        debit: "حساب المخزون (Inventory Asset)",
        credit: "الذمم الدائنة / الموردين (أو النقدية/البنك إذا كان السداد نقداً)",
        notes: "زيادة أصول المخزون مع إثبات الالتزام المالي المستحق للمورد."
      }
    ],
    dataFlowDescription: "استلام البضاعة -> مطابقة الأسعار -> إدخال بيانات الأصناف وسيريالات الأجهزة -> توليد حركة دخول المخزون -> تحديث متوسط تكلفة الصنف -> إصدار القيد المحاسبي في دفتر اليومية.",
    integrationPoints: ["المخزون", "الموردين", "الخزينة والبنوك", "دفتر اليومية"]
  },
  {
    id: 8,
    slug: "customer-architecture",
    title: "8. معمارية إدارة العملاء والذمم المدينة (Customer Architecture & CRM)",
    titleEn: "Customer Profiles, Credit Control & Accounts Receivable",
    category: "core",
    icon: "Users",
    summary: "سجل موحد للعملاء يصنفهم حسب نوع التعامل (عملاء متجر تجزئة، عملاء شركات، مشتركو إنترنت، عملاء مشاريع CCTV وشبكات، عملاء مشاريع برمجية حرة) مع متابعة دقيقة للأرصدة وكشوف الحسابات والحدود الائتمانية.",
    businessRules: [
      "رمز موحد للعميل مع تحديد نوع نشاطه (Retail, Corporate, ISP Subscriber, Freelance Client).",
      "تتبع سقف الائتمان (Credit Limit) وأيام السداد المسموح بها مع منع إصدار فواتير آجلة في حال وجود فواتير متعثرة متجاوزة المدة.",
      "كشف حساب تفصيلي باللغة العربية يوضح جميع الفواتير، الدفعات، سندات القبض، ورصيد الذمم المدينة القائم لحظياً."
    ],
    keyEntities: [
      {
        name: "العملاء (Customers)",
        table: "customers",
        description: "بيانات العميل، أرقام التواصل، العنوان، النوع، والحد الائتماني.",
        columns: ["id", "customer_code", "name_ar", "phone", "email", "tax_number", "customer_type", "credit_limit", "current_balance", "is_active"]
      },
      {
        name: "سندات القبض (Payment Receipts)",
        table: "payment_receipts",
        description: "سندات تحصيل المبالغ من العملاء مع ربطها بالفواتير المسددة.",
        columns: ["id", "receipt_number", "customer_id", "unit_id", "amount", "payment_method", "bank_account_id", "receipt_date", "notes"]
      }
    ],
    accountingImpact: [
      {
        debit: "الصندوق أو الحساب البنكي",
        credit: "الذمم المدينة / العملاء (Accounts Receivable)",
        notes: "تخفيض رصيد مديونية العميل وزيادة السيولة النقدية أو المصرفية عند التحصيل."
      }
    ],
    dataFlowDescription: "عند قيام العميل بأي معاملة آجلة (شراء، اشتراك، دفعة مشروع) تزيد مديونيته في الذمم المدينة. وعند سداد دفعة بسند قبض، يخصم الرصيد وتزيد النقدية فوراً.",
    integrationPoints: ["المبيعات", "اشتراكات الإنترنت", "مشاريع البرمجيات", "مشاريع CCTV والشبكات"]
  },
  {
    id: 9,
    slug: "supplier-architecture",
    title: "9. معمارية الموردين والذمم الدائنة (Supplier Architecture & Accounts Payable)",
    titleEn: "Suppliers, Hardware Vendors & Tech Subscription Providers",
    category: "core",
    icon: "Building2",
    summary: "إدارة شاملة لكافة الموردين بما يشمل موردي قطع الغيار والحواسيب، شركات توزيع الإنترنت بالجملة (Bandwidth Providers)، ومزودي الخدمات السحابية والأدوات البرمجية (AWS, GitHub, APIs).",
    businessRules: [
      "تصنيف الموردين وفق طبيعة التوريد (Hardware Vendor, ISP Upstream Provider, Software SaaS/Cloud Provider).",
      "إدارة سندات الصرف وربطها بفواتير الموردين المحددة لإقفال الذمم الدائنة حسب الأقدمية (FIFO Payment Matching).",
      "تنبيهات بمواعيد سداد التزامات الموردين لتجنب انقطاع خطوط الإنترنت أو توقف الخدمات السحابية."
    ],
    keyEntities: [
      {
        name: "الموردين (Suppliers)",
        table: "suppliers",
        description: "بيانات الموردين، جهات الاتصال، نوع الخدمات وشروط الدفع.",
        columns: ["id", "supplier_code", "name_ar", "category", "contact_person", "phone", "email", "current_balance", "is_active"]
      },
      {
        name: "سندات الصرف للموردين (Payment Vouchers)",
        table: "payment_vouchers",
        description: "سندات سداد مستحقات الموردين من الخزينة أو الحسابات البنكية.",
        columns: ["id", "voucher_number", "supplier_id", "unit_id", "amount", "payment_method", "bank_account_id", "voucher_date", "notes"]
      }
    ],
    accountingImpact: [
      {
        debit: "الذمم الدائنة / الموردين (Accounts Payable)",
        credit: "الصندوق / البنك",
        notes: "تخفيض التزام المورد وتخفيض النقدية بالسداد الفعلي."
      }
    ],
    dataFlowDescription: "تسجيل فاتورة التوريد يزيد حساب الذمم الدائنة، وعند استحقاق الدفع يُصدر سند صرف يخصم من الخزينة ويخفض رصيد المورد مع توثيق رقم التحويل البنكي أو الشيك.",
    integrationPoints: ["المشتريات", "مصاريف الإنترنت", "مصاريف المشاريع البرمجية", "الخزينة والبنوك"]
  },
  {
    id: 10,
    slug: "maintenance-architecture",
    title: "10. معمارية ورشة الصيانة والإصلاح (Computer Maintenance & Repair)",
    titleEn: "Work Orders, Repair Diagnostics, Spare Parts & Warranty Tracking",
    category: "store",
    icon: "Wrench",
    summary: "نظام متكامل لإدارة ورشة صيانة الحواسيب واللابتوبات، يبدأ باستلام الجهاز وإصدار إيصال استلام باركود، الفحص الفني والتشخيص، موافقة العميل على التكلفة، استهلاك قطع الغيار، واحتساب أجور اليد والضمان.",
    businessRules: [
      "إصدار إيصال استلام رسمي يحمل باركود وبيانات الجهاز ومواصفاته وملاحظات العميل مع تصوير حالة الجهاز الأولية.",
      "مرحلة التشخيص الفني (Diagnostic Phase) تحدد القطع التالفة وتكلفة الصيانة المقدرة للحصول على موافقة العميل المسبقة.",
      "صرف قطع الغيار (مثل: شاشات لابتوب، رامات، SSD، بطاريات) من المخزون وخصمها فوراً بسعر التكلفة وإضافتها لفاتورة الصيانة بسعر البيع.",
      "تسجيل أجور اليد (Labor / Service Fee) كإيراد خدمات صيانة صافي.",
      "إصدار بطاقة ضمان صيانة بفترة محددة (مثل 30 يوماً على الإصلاح) يتم تتبعها آلياً برقم تذكرة الصيانة."
    ],
    keyEntities: [
      {
        name: "تذاكر الصيانة (Maintenance Job Tickets)",
        table: "maintenance_tickets",
        description: "تذكرة صيانة الجهاز وحالته ومراحل الإصلاح حتى التسليم.",
        columns: ["id", "ticket_number", "customer_id", "device_type", "brand_model", "serial_number", "issue_description", "status", "technician_id", "received_at", "delivered_at"]
      },
      {
        name: "قطع الغيار المستهلكة في الصيانة (Maintenance Spare Parts)",
        table: "maintenance_spare_parts",
        description: "القطع المستهلكة من المستودع في صيانة الجهاز.",
        columns: ["id", "ticket_id", "product_id", "quantity", "unit_cost", "unit_price", "total_price"]
      }
    ],
    accountingImpact: [
      {
        debit: "النقدية / الذمم المدينة (المبلغ الكلي للصيانة)",
        credit: "إيرادات خدمات الصيانة (أجور اليد) + إيرادات مبيعات قطع الغيار",
        notes: "فصل إيراد الخدمة النقية عن إيراد مبيعات القطع لتحليل هوامش الربحية بدقة."
      },
      {
        debit: "تكلفة البضاعة المباعة (تكلفة قطع الغيار المستخدمة)",
        credit: "مخزون قطع الغيار",
        notes: "إثبات خروج القطع من المستودع واستخدامها في الإصلاح."
      }
    ],
    dataFlowDescription: "استلام الجهاز -> فحص وتشخيص -> موافقة العميل -> صرف قطع الغيار من المخزون -> إنهاء الصيانة واختبار الجودة -> إصدار فاتورة الصيانة وتحصيل المبلغ -> تسليم الجهاز وتفعيل الضمان.",
    integrationPoints: ["المخزون", "العملاء", "الموظفين والفنيين", "المبيعات", "دفتر اليومية"]
  },
  {
    id: 11,
    slug: "cctv-project-architecture",
    title: "11. معمارية مشاريع أنظمة المراقبة (CCTV Projects Architecture)",
    titleEn: "CCTV Engineering, Site Survey, BoM & Installation Lifecycle",
    category: "store",
    icon: "Video",
    summary: "إدارة دورة حياة مشاريع كاميرات المراقبة الأمنية من المعاينة الميدانية وعرض السعر (Quotation & BoM)، إلى صرف المعدات (كاميرات، NVR/DVR، أقراص صلبة، كابلات، لوازم تثبيت)، ومراحل التركيب والبرمجة والتسليم النهائي والضمان.",
    businessRules: [
      "إعداد قائمة المواد (Bill of Materials - BoM) متضمنة الأجهزة الرئيسية والمواد الاستهلاكية وتكلفة التمديد والعمالة.",
      "صرف المواد على دفعات للمشروع وحجزها من المخزون لمنع تكرار بيعها.",
      "ربط سيريالات الكاميرات وأجهزة التسجيل بالمشروع لضمان حقوق الضمان والصيانة المستقبلية.",
      "دعم الدفعات المرحلية للمشروع: دفعة مقدمة، دفعة عند التمديد، دفعة عند التشغيل، دفعة ختامية عند التسليم والتوقيع على محضر الاستلام."
    ],
    keyEntities: [
      {
        name: "مشاريع كاميرات المراقبة (CCTV Projects)",
        table: "cctv_projects",
        description: "بيانات المشروع، موقع التركيب، عدد القنوات، وحالة الإنجاز.",
        columns: ["id", "project_code", "project_name", "customer_id", "site_address", "channels_count", "contract_value", "start_date", "handover_date", "status"]
      },
      {
        name: "قائمة مواد مشروع CCTV (CCTV Project BoM)",
        table: "cctv_project_items",
        description: "الأجهزة والمواد والكابلات المخصصة للمشروع مع تكلفتها وسعر بيعها للعميل.",
        columns: ["id", "project_id", "product_id", "quantity", "unit_cost", "unit_price", "is_installed"]
      }
    ],
    accountingImpact: [
      {
        debit: "النقدية / البنك (الدفعات المستلمة) أو ذمم عملاء المشاريع",
        credit: "إيرادات مشاريع كاميرات المراقبة (CCTV Project Revenue)",
        notes: "الاعتراف بالإيراد وفق نسب الإنجاز أو الفاتورة المرحلية."
      },
      {
        debit: "تكلفة مشاريع CCTV (تكلفة المواد + العمالة المباشرة)",
        credit: "المخزون (المواد والأجهزة المصروفة)",
        notes: "تحميل تكلفة المعدات مباشرة على مركز تكلفة المشروع."
      }
    ],
    dataFlowDescription: "معاينة ميدانية -> إنشاء BoM وعرض سعر -> توقيع العقد واستلام الدفعة الأولى -> صرف الأجهزة برقم السيريال من المخزون -> إتمام التركيب والبرمجة -> إصدار محضر الاستلام والفاتورة النهائية -> تحصيل المتبقي.",
    integrationPoints: ["المخزون", "المبيعات", "العملاء", "سندات القبض", "سجل الضمانات"]
  },
  {
    id: 12,
    slug: "network-project-architecture",
    title: "12. معمارية مشاريع شبكات البنية التحتية (Network Infrastructure Projects)",
    titleEn: "Network Cabling, Active Devices, IP Planning & Handover",
    category: "store",
    icon: "Network",
    summary: "نظام هندسي وإداري لمشاريع الشبكات السلكية واللاسلكية للمنازل والشركات؛ يشمل تمديد الكابلات النحاسية والضوئية، تركيب خزائن الشبكة (Racks)، أجهزة السويتشات والموجهات ونقاط الوصول (APs)، وتوثيق مخطط الـ IP وخريطة المنافذ.",
    businessRules: [
      "توثيق تفاصيل البنية التحتية: عدد النقاط (Data Points)، نوع الكابلات (Cat6/Cat6a/Fiber)، وتوزيع خزائن الشبكة.",
      "تسجيل ومتابعة الأجهزة النشطة (Managed Switches, Routers, APs) بأرقامها التسلسلية وعناوين MAC.",
      "إدارة تكاليف العمالة الخارجية أو ساعات عمل الفنيين الداخليين وتضمينها في تكلفة المشروع الإجمالية.",
      "إصدار تقرير فحص الشبكة (Testing & Certification Report) ومحضر التسليم الفني المعتمد."
    ],
    keyEntities: [
      {
        name: "مشاريع الشبكات (Network Projects)",
        table: "network_projects",
        description: "بيانات عقد تركيب وتمديد الشبكة والبيانات الفنية.",
        columns: ["id", "project_code", "project_name", "customer_id", "total_points", "contract_value", "status", "start_date", "completion_date"]
      },
      {
        name: "معدات ومواد مشروع الشبكة (Network Project Items)",
        table: "network_project_items",
        description: "الكابلات، الروابط، السويتشات والراوترات المصروفة للمشروع.",
        columns: ["id", "project_id", "product_id", "quantity", "unit_cost", "unit_price"]
      }
    ],
    accountingImpact: [
      {
        debit: "الخزينة / الذمم المدينة",
        credit: "إيرادات مشاريع الشبكات والبنية التحتية",
        notes: "إثبات قيمة العقد والأعمال المنفذة."
      },
      {
        debit: "تكلفة مشاريع الشبكات (مواد + عمالة)",
        credit: "مخزون معدات الشبكات والأسلاك",
        notes: "إخراج المواد من المخزون واحتسابها كتكلفة مباشرة على المشروع."
      }
    ],
    dataFlowDescription: "دراسة المخطط -> حساب الأمتار والأجهزة -> تجهيز عرض السعر -> تحصيل الدفعة المقدمة -> صرف الكابلات والأجهزة -> التركيب والترقيم والفحص -> تسليم المشروع وتحصيل الفاتورة النهائية.",
    integrationPoints: ["المخزون", "العملاء", "المبيعات", "الموردين (المواد المخصصة)"]
  },
  {
    id: 13,
    slug: "internet-subscriber-architecture",
    title: "13. معمارية إدارة وتوزيع اشتراكات الإنترنت (ISP & Internet Subscriptions)",
    titleEn: "WISP/FTTH Subscriptions, Bandwidth Packages & Monthly Billing",
    category: "store",
    icon: "Wifi",
    summary: "إدارة منظومة توزيع الإنترنت للمشتركين (WISP / برج التوزيع / FTTH)؛ تشمل باقات السرعات، دورات الفوترة الشهرية التلقائية، تتبع أجهزة المشتركين المستعارة (CPE / Routers)، إيقاف الخدمة عند انتهاء الاشتراك وتجديدها فور التحصيل.",
    businessRules: [
      "تعريف باقات الإنترنت (السرعة، الحصة، السعر الشهري، نوع الاشتراك).",
      "توليد فواتير الاشتراكات الشهرية تلقائياً لكل مشترك نشط في بداية دورة الفوترة مع فترة سماح (Grace Period) محددة بالأيام.",
      "تتبع أجهزة التوجيه والاستقبال (NanoStation, Mikrotik, Router) المعارة أو المباعة للمشترك مع تسجيل أرقام السيريال وتأمين الأجهزة (Security Deposits).",
      "الربط التلقائي بين سداد الفاتورة الشهرية وتمديد تاريخ صلاحية الاشتراك لشهر إضافي.",
      "احتساب تكلفة خط الإنترنت الإجمالي المغذي للشبكة (Upstream Bandwidth Cost) كمصروف تشغيلي دوري لقطاع الإنترنت."
    ],
    keyEntities: [
      {
        name: "باقات الإنترنت (Internet Packages)",
        table: "internet_packages",
        description: "بيانات الباقات والسرعات والأسعار الشهرية.",
        columns: ["id", "package_name", "download_speed_mbps", "upload_speed_mbps", "monthly_fee", "is_active"]
      },
      {
        name: "اشتراكات المستخدمين (Internet Subscriptions)",
        table: "internet_subscriptions",
        description: "بيانات اشتراك العميل، البرج/المنفذ، المودم، تاريخ التجديد والحالة.",
        columns: ["id", "subscription_code", "customer_id", "package_id", "tower_node_id", "ip_address", "cpe_serial_number", "start_date", "expiry_date", "status", "monthly_fee"]
      },
      {
        name: "فواتير الاشتراكات الدورية (Subscription Invoices)",
        table: "subscription_invoices",
        description: "الفواتير الشهرية المتولدة تلقائياً لكل دورة اشتراك.",
        columns: ["id", "invoice_number", "subscription_id", "billing_month", "amount", "due_date", "paid_date", "payment_status"]
      }
    ],
    accountingImpact: [
      {
        debit: "الذمم المدينة لمشتركي الإنترنت (عند استحقاق الفاتورة)",
        credit: "إيرادات اشتراكات الإنترنت (ISP Subscription Revenue)",
        notes: "إثبات الاستحقاق الشهري مع بداية كل دورة اشتراك."
      },
      {
        debit: "الصندوق / المحفظة الإلكترونية (عند التحصيل)",
        credit: "الذمم المدينة لمشتركي الإنترنت",
        notes: "إقفال مديونية المشترك وتأكيد تجديد الاشتراك."
      },
      {
        debit: "مصروف حزم الإنترنت الرئيسية (Upstream Bandwidth Expense)",
        credit: "الذمم الدائنة لمزود الإنترنت الرئيسي / البنك",
        notes: "إثبات التكلفة الشهرية للخط الرئيسي المغذي لشبكة التوزيع."
      }
    ],
    dataFlowDescription: "توليد فواتير الشهر الجديد آلياً -> إشعار المشتركين -> تحصيل الاشتراك بسند قبض -> تمديد تاريخ الصلاحية -> تسجيل القيد المحاسبي في دفتر اليومية.",
    integrationPoints: ["العملاء", "سندات القبض", "الخزينة", "دفتر اليومية", "إدارة أجهزة المخزون المعارة"]
  },
  {
    id: 14,
    slug: "freelance-project-architecture",
    title: "14. معمارية مشاريع البرمجيات والعمل الحر (Freelance Software Projects)",
    titleEn: "Software Projects, Milestones, Contracts & Tech Profitability",
    category: "freelance",
    icon: "Code",
    summary: "نظام إدارة مشاريع البرمجيات المستقلة؛ يدعم عقود المشاريع الثابتة (Fixed Price) أو القائمة على الساعات (Hourly T&M)، تتبع مراحل التسليم (Milestones)، مصاريف الاستضافة والأدوات المخصصة لكل مشروع، وحساب صافي ربحية كل مشروع برمجيات بدقة متناهية.",
    businessRules: [
      "تسجيل العقد البرمجي مع تحديد نطاق العمل (Scope of Work)، المراحل (Milestones)، والتقنيات المستخدمة.",
      "ربط الفواتير بالمراحل المنجزة (Milestone Completion Invoicing) ولا يتم تحرير الفاتورة إلا بعد اعتماد المرحلة.",
      "تتبع ساعات العمل البرمجية (Time Tracking) للمشاريع التي تعتمد على المحاسبة بالساعة.",
      "تحميل المصاريف السحابية والأدوات الخارجية (AWS, Firebase, Domain, Theme, API Credits) مباشرة على المشروع كـ (Direct Project Expenses).",
      "حساب ربح المشروع = (إجمالي إيراد الفواتير المقبوضة) - (المصاريف المباشرة للمشروع + أجور المطورين أو المستقلين المساعدين)."
    ],
    keyEntities: [
      {
        name: "مشاريع البرمجيات (Freelance Projects)",
        table: "freelance_projects",
        description: "بيانات المشروع البرمجي، العميل، قيمة العقد، النموذج السعري، وتواريخ التسليم.",
        columns: ["id", "project_code", "title", "client_id", "pricing_model", "contract_amount", "currency", "start_date", "deadline", "status", "github_repo"]
      },
      {
        name: "مراحل المشروع البرمجي (Project Milestones)",
        table: "project_milestones",
        description: "مراحل التسليم، نسبة الدفعة من العقد، المخرجات، وتاريخ الاعتماد.",
        columns: ["id", "project_id", "title", "deliverables", "amount", "due_date", "is_approved", "invoice_id"]
      },
      {
        name: "مصاريف المشروع البرمجي المباشرة (Project Direct Expenses)",
        table: "project_direct_expenses",
        description: "المصاريف المخصصة حصراً للمشروع البرمجي (سيرفرات، تراخيص، قوالب).",
        columns: ["id", "project_id", "expense_name", "category", "amount", "payment_method", "receipt_url", "expense_date"]
      }
    ],
    accountingImpact: [
      {
        debit: "البنك / المحفظة الرقمية / ذمم عملاء البرمجيات",
        credit: "إيرادات تطوير البرمجيات الحرة (Freelance Software Revenue)",
        notes: "إثبات الإيراد عند اعتماد المرحلة البرمجية وإصدار الفاتورة الخاصة بها."
      },
      {
        debit: "مصاريف مشاريع البرمجيات المباشرة (Direct Software Project Costs)",
        credit: "البنك / البطاقة الائتمانية / الصندوق",
        notes: "خصم تكاليف السيرفرات والأدوات المشتراة خصيصاً لتشغيل المشروع."
      }
    ],
    dataFlowDescription: "توقيع العقد البرمجي -> إنشاء المراحل -> إنجاز الكود والمخرجات -> اعتماد العميل للمرحلة -> إصدار فاتورة المرحلة -> استلام الدفعة في الحساب البنكي -> تسجيل المصاريف السحابية للمشروع -> استخراج تقرير ربحية المشروع.",
    integrationPoints: ["عملاء العمل الحر", "البنوك والمحافظ الرقمية", "سندات القبض", "المصاريف", "دفتر اليومية"]
  },
  {
    id: 15,
    slug: "expense-architecture",
    title: "15. معمارية إدارة المصاريف والتكاليف (Expense & Cost Allocation Architecture)",
    titleEn: "OPEX, CAPEX, Unit-Specific vs Shared Expense Allocation",
    category: "finance",
    icon: "Receipt",
    summary: "نظام تصنيف وتتبع المصاريف التشغيلية (OPEX) والرأسمالية (CAPEX) مع تصنيف إجباري للمصروف يحدد تبعيته (متجر فقط، برمجيات حرة فقط، أو مصروف مشترك يتم تقسيمه وفق نسب عادلة).",
    businessRules: [
      "تصنيف المصروف إجبارياً إلى: مصروف متجر مباشر، مصروف برمجيات مباشر، أو مصروف مشترك عام.",
      "المصاريف المشتركة (كإيجار المقر، فواتير الكهرباء والإنترنت العام، بوفيه وضيافة) تخضع لقواعد التوزيع التلقائي (Allocation Engine).",
      "إرفاق صور الإيصالات والفواتير الضريبية إلكترونياً مع كل سند مصروف.",
      "مستويات اعتماد للمصاريف (Expense Approval Workflow) حسب قيمة المبلغ المالي."
    ],
    keyEntities: [
      {
        name: "فئات وتصنيفات المصاريف (Expense Categories)",
        table: "expense_categories",
        description: "دليل بنود المصاريف (إيجار، كهرباء، تراخيص، بوفيه، إعلانات).",
        columns: ["id", "category_code", "name_ar", "account_id", "default_scope", "is_active"]
      },
      {
        name: "سجلات المصاريف وسندات الصرف (Expenses)",
        table: "expenses",
        description: "حركات الصرف التفصيلية وطريقة الدفع والوحدة المستفيدة.",
        columns: ["id", "expense_number", "category_id", "unit_scope", "amount", "shop_allocated_amount", "freelance_allocated_amount", "paid_from_account_id", "expense_date", "notes"]
      }
    ],
    accountingImpact: [
      {
        debit: "حساب المصروف المعني (مصاريف إيجار، كهرباء، تراخيص برمجية...)",
        credit: "الصندوق / الحساب البنكي / العهدة المالية",
        notes: "إثبات تخفيض السيولة مقابل زيادة المصاريف التشغيلية لتلك الفترة."
      }
    ],
    dataFlowDescription: "طلب صرف مصروف -> تحديد البند والوحدة -> إرفاق الفاتورة -> اعتماد الصرف -> خصم المبلغ من الخزينة/البنك -> توليد قيد اليومية وتوزيع التكلفة على مراكز التكلفة.",
    integrationPoints: ["الخزينة والبنوك", "مراكز التكلفة", "شجرة الحسابات", "المشاريع"]
  },
  {
    id: 16,
    slug: "cash-bank-architecture",
    title: "16. معمارية الخزينة والبنوك والمحافظ الإلكترونية (Cash, Bank & Treasury)",
    titleEn: "Multi-Account Treasury, Petty Cash, Bank Accounts & Transfers",
    category: "finance",
    icon: "Landmark",
    summary: "إدارة الخزائن النقدية (درج الكاشير في المتجر)، العهد المالية (Petty Cash)، الحسابات البنكية المحلية، والمحافظ الرقمية وحسابات الدفع الإلكتروني (PayPal, Stripe, Payoneer) مع متابعة التسويات والتحويلات الداخلية.",
    businessRules: [
      "دعم عدة حسابات مالية: درج كاشير المحل، الخزينة الرئيسية، الحساب البنكي للشركة، حسابات الدفع الرقمية للمستقلين (Stripe / PayPal).",
      "التحويلات بين الخزائن والحسابات (Inter-Account Transfers) تتم عبر قيد تحويل مزدوج فوري دون التأثير على قائمة الأرباح والخسائر.",
      "جرد يومي لدرج الكاشير (End-of-Day Cash Drawer Closing) ومطابقة العجز والزيادة (Cash Over/Short).",
      "إجراء التسويات البنكية الدورية (Bank Reconciliation) لمطابقة كشف حساب البنك مع قيود النظام."
    ],
    keyEntities: [
      {
        name: "الحسابات المالية والخزائن (Treasury Accounts)",
        table: "treasury_accounts",
        description: "سجل الخزائن والبنوك والمحافظ الرقمية وأرصدتها الحالية.",
        columns: ["id", "account_name_ar", "account_type", "account_id", "currency", "current_balance", "is_active"]
      },
      {
        name: "حركات الخزينة والتحويلات (Treasury Transactions)",
        table: "treasury_transactions",
        description: "سجل إيداعات وسحوبات وتحويلات الأموال بين الحسابات.",
        columns: ["id", "transaction_type", "from_account_id", "to_account_id", "amount", "fee_amount", "reference_type", "reference_id", "created_at"]
      }
    ],
    accountingImpact: [
      {
        debit: "الحساب المالي المستلم (مثلاً: الحساب البنكي)",
        credit: "الحساب المالي المحول منه (مثلاً: درج الكاشير)",
        notes: "تحويل داخلي بدون أرباح أو خسائر سوى عمولة التحويل البنكي إن وجدت."
      }
    ],
    dataFlowDescription: "استلام الإيرادات من المبيعات والمشاريع والاشتراكات في الحساب المعني -> تسجيل التحويلات والإيداعات البنكية -> مطابقة الأرصدة وإجراء التسويات الدورية.",
    integrationPoints: ["المبيعات", "المشتريات", "المشاريع", "الاشتراكات", "المصاريف", "سندات القبض والصرف"]
  },
  {
    id: 17,
    slug: "employee-payroll-architecture",
    title: "17. معمارية الموظفين والرواتب والعمولات (Employee & Payroll Architecture)",
    titleEn: "Staff Profiles, Technicians, Dev Freelancers, Commissions & Payroll",
    category: "finance",
    icon: "UserCheck",
    summary: "إدارة بيانات الموظفين وفنيي الصيانة ومهندسي الشبكات والمطورين؛ تشمل عقود العمل، مسيرات الرواتب الشهرية، البدلات، الاستقطاعات، وعمولات الفنيين على تذاكر الصيانة ومشاريع الكاميرات.",
    businessRules: [
      "احتساب الراتب الشهري = (الراتب الأساسي + البدلات + العمولات والحوافز) - (الغياب والخصومات والسلف المستردة).",
      "دعم عمولات الفنيين التلقائية: نسبة مئوية محددة من أجور يد الصيانة أو نسبة من قيمة أتعاب تركيب كاميرات المراقبة.",
      "تتبع سلف الموظفين وخصم أقساطها الشهرية آلياً عند إعداد مسير الرواتب.",
      "تخصيص راتب كل موظف على وحدة العمل المستفيدة (فني المتجر على تكاليف المتجر، المطور على نشاط البرمجيات)."
    ],
    keyEntities: [
      {
        name: "الموظفين (Employees)",
        table: "employees",
        description: "بيانات الموظف، المسمى الوظيفي، وحدة العمل، الراتب الأساسي والبدلات.",
        columns: ["id", "employee_code", "name_ar", "role", "unit_id", "base_salary", "maintenance_commission_rate", "is_active", "hire_date"]
      },
      {
        name: "مسيرات الرواتب الشهرية (Payroll Runs)",
        table: "payroll_runs",
        description: "مسير الرواتب الشهري المعتمد والتفاصيل المالية لكل موظف.",
        columns: ["id", "employee_id", "month", "year", "base_salary", "commissions", "allowances", "deductions", "net_salary", "payment_status", "paid_at"]
      }
    ],
    accountingImpact: [
      {
        debit: "مصروف الرواتب والأجور (متجر) + مصروف الرواتب (برمجيات)",
        credit: "الرواتب المستحقة (Accrued Payroll) [عند إثبات المسير]",
        notes: "إثبات استحقاق الرواتب للشهر في حسابات الخصوم المتداولة."
      },
      {
        debit: "الرواتب المستحقة (Accrued Payroll)",
        credit: "البنك / الصندوق [عند التحويل الفعلي للموظف]",
        notes: "إقفال الالتزام بالسداد الفعلي لحساب الموظف."
      }
    ],
    dataFlowDescription: "تجميع عمولات الصيانة والمشاريع للشهر -> مراجعة الغياب والخصومات والسلف -> توليد مسير الرواتب -> اعتماد الصرف -> تحويل الرواتب وتسجيل القيد في دفتر اليومية.",
    integrationPoints: ["الصيانة", "مشاريع CCTV والشبكات", "الخزينة والبنوك", "شجرة الحسابات"]
  },
  {
    id: 18,
    slug: "asset-architecture",
    title: "18. معمارية الأصول الثابتة والإهلاك (Fixed Assets & Depreciation)",
    titleEn: "Fixed Assets Registry, Tooling, Hardware & Depreciation Schedules",
    category: "finance",
    icon: "ShieldAlert",
    summary: "حصر وإدارة الأصول والمعدات المملوكة للنشاطين (أجهزة الفحص واللحام، أجهزة فحص الألياف الضوئية، أجهزة ومعدات السيرفرات في المتجر، أجهزة الماك والحواسيب المتطورة للتطوير البرمجي)، واحتساب الإهلاك الدوري تلقائياً.",
    businessRules: [
      "تسجيل الأصل مع تكلفة الشراء، تاريخ البدء، العمر الإنتاجي المتوقع، وقيمة الخردة المتبقية (Salvage Value).",
      "احتساب الإهلاك بطريقة القسط الثابت (Straight-Line Depreciation) شهرياً أو سنوياً.",
      "تخصيص الأصل على وحدة العمل التي تستخدمه لتحميل قسط إهلاكه على مركز التكلفة الصحيح.",
      "تسجيل عمليات صيانة الأصول الرأسمالية والتصرف في الأصول بالبيع أو التكهين."
    ],
    keyEntities: [
      {
        name: "سجل الأصول الثابتة (Fixed Assets)",
        table: "fixed_assets",
        description: "بيانات الأصول ومواقعها ووحدات تشغيلها وتكلفتها التاريخية.",
        columns: ["id", "asset_code", "name_ar", "unit_id", "purchase_date", "purchase_cost", "salvage_value", "useful_life_months", "accumulated_depreciation", "status"]
      },
      {
        name: "سجلات الإهلاك الدوري (Asset Depreciation Logs)",
        table: "asset_depreciation_logs",
        description: "أقساط الإهلاك الدورية المحتسبة آلياً لكل أصل.",
        columns: ["id", "asset_id", "period_month", "period_year", "depreciation_amount", "journal_entry_id", "created_at"]
      }
    ],
    accountingImpact: [
      {
        debit: "مصروف إهلاك الأصول (Depreciation Expense)",
        credit: "مجمع إهلاك الأصول الثابتة (Accumulated Depreciation)",
        notes: "تخفيض القيمة الدفترية للأصل وإثبات المصروف دون خروج نقدية مباشرة."
      }
    ],
    dataFlowDescription: "شراء الأصل وتوثيقه -> تحديد جدول الإهلاك -> تشغيل معالج الإهلاك الشهري التلقائي -> توليد قيود الإهلاك في دفتر اليومية وتحديث صافي القيمة الدفترية للأصل.",
    integrationPoints: ["المشتريات", "شجرة الحسابات", "الميزانية العمومية"]
  },
  {
    id: 19,
    slug: "financial-statements-architecture",
    title: "19. معمارية القوائم والتقارير المالية الختامية (Financial Statements)",
    titleEn: "Income Statement, Balance Sheet, Trial Balance & Cash Flow",
    category: "finance",
    icon: "BarChart3",
    summary: "محرك توليد القوائم المالية الختامية وفق معايير المحاسبة المعتمدة؛ يتيح استخراج قائمة الدخل (P&L)، الميزانية العمومية (Balance Sheet)، ميزان المراجعة (Trial Balance)، وقائمة التدفقات النقدية (Cash Flow) لكل وحدة على حدة ومجمعة.",
    businessRules: [
      "قائمة الدخل للمتجر: مبيعات السلع والخدمات - تكلفة البضاعة المباعة = إجمالي الربح - المصاريف التشغيلية = صافي ربح المتجر.",
      "قائمة الدخل للعمل الحر: إيرادات البرمجيات والاستشارات - تكلفة المشاريع المباشرة = إجمالي ربح البرمجيات - المصاريف التشغيلية = صافي ربح البرمجيات.",
      "قائمة الدخل الموحدة: دمج إيرادات وتكاليف ومصاريف النشاطين مع خصم المصاريف المشتركة الموزعة للوصول لصافي الربح الإجمالي للمالك.",
      "الميزانية العمومية المجمعة: الأصول = الخصوم + حقوق الملكية (رأس المال + الأرباح المبقاة + مسحوبات واستثمارات المالك)."
    ],
    keyEntities: [
      {
        name: "الفترات المالية والإقفالات (Financial Periods & Closings)",
        table: "financial_periods",
        description: "سجل الفترات المحاسبية الشهرية والسنوية وحالة الإقفال.",
        columns: ["id", "period_name", "start_date", "end_date", "is_closed", "closed_by", "closed_at", "retained_earnings_entry_id"]
      }
    ],
    accountingImpact: [
      {
        debit: "حساب ملخص الدخل (Income Summary)",
        credit: "الأرباح المبقاة / حقوق الملكية (Retained Earnings)",
        notes: "ترحيل صافي الأرباح في نهاية السنة المالية إلى حقوق الملكية."
      }
    ],
    dataFlowDescription: "تجميع كافة قيود اليومية المرحلة -> احتساب أرصدة الحسابات الختامية -> توليد ميزان المراجعة المطابق -> بناء قائمة الدخل والميزانية العمومية اللحظية.",
    integrationPoints: ["دفتر الأستاذ العام", "شجرة الحسابات", "جميع الوحدات التشغيلية"]
  },
  {
    id: 20,
    slug: "reporting-architecture",
    title: "20. معمارية التقارير التشغيلية والتحليلية (Reporting & Analytics Architecture)",
    titleEn: "Operational Dashboards, Aging Reports & Business Intelligence",
    category: "admin",
    icon: "PieChart",
    summary: "منظومة تقارير ذكية ولوحات معلومات تفاعلية تشمل تقارير أعمار الديون (AR/AP Aging)، مبيعات وربحية الأصناف، كفاءة الفنيين، معدل تجديد الاشتراكات، وتحليل هوامش أرباح المشاريع البرمجية.",
    businessRules: [
      "تقارير أعمار الذمم المدينة للعملاء (30، 60، 90، +120 يوماً) لتسريع التحصيل وتقليل الديون المعدومة.",
      "تقرير الأصناف الأكثر مبيعاً والأعلى ربحية ومعدل دوران المخزون (Inventory Turnover Ratio).",
      "تقرير أداء شبكة الإنترنت ومعدل تحصيل الاشتراكات ونسبة التسرب (Churn Rate).",
      "تقرير استغلال الوقت ومعدل السعر بالساعة الفعلي لمشاريع البرمجيات الحرة."
    ],
    keyEntities: [
      {
        name: "التقارير المخزنة والمفضلة (Report Templates)",
        table: "report_templates",
        description: "قوالب التقارير المخصصة وخيارات التصفية للمدير.",
        columns: ["id", "report_code", "title_ar", "filters_json", "is_pinned"]
      }
    ],
    accountingImpact: [
      {
        debit: "قراءة فقط (Read-Only Views)",
        credit: "محرك الاستعلامات والتحليل",
        notes: "التقارير مبنية على استعلامات SQL مجمعة عبر الفهارس (Indexed Views) لتحقيق أعلى سرعة دون التأثير على عمليات الإدخال."
      }
    ],
    dataFlowDescription: "استعلامات مجمعة وقراءات سريعة من جداول MySQL عبر فهارس محسنة لتقديم الإحصائيات الفورية والرسوم البيانية للمالك والإدارة.",
    integrationPoints: ["جميع الوحدات الـ 23"]
  },
  {
    id: 21,
    slug: "user-permission-architecture",
    title: "21. معمارية المستخدمين والصلاحيات (User & RBAC Architecture)",
    titleEn: "Role-Based Access Control, Granular Permissions & Unit Scoping",
    category: "admin",
    icon: "KeyRound",
    summary: "نظام تحكم في الوصول قائم على الأدوار والصلاحيات الدقيقة (Granular RBAC)؛ يتيح تحديد الأدوار (مدير عام، كاشير متجر، فني صيانة، مهندس شبكات، مدير اشتراكات، مطور برمجيات) مع تقييد الوصول حسب وحدة العمل.",
    businessRules: [
      "عزل الصلاحيات جغرافياً ووظيفياً: لا يمكن لكاشير المتجر رؤية عقود أو أرباح المشاريع البرمجية.",
      "فني الصيانة يمتلك فقط صلاحية استعراض وتحديث تذاكر الصيانة وطلب قطع الغيار.",
      "المدير العام يمتلك صلاحية التحويل والاطلاع على كلا الوحدتين واستخراج القوائم المالية المجمعة.",
      "حماية كلمات المرور بتشفير قياسي مع دعم جلسات آمنة وتسجيل الخروج التلقائي عند الخمول."
    ],
    keyEntities: [
      {
        name: "المستخدمين (Users)",
        table: "users",
        description: "بيانات المستخدمين، البريد، كلمة المرور المشفرة، والوحدة الافتراضية.",
        columns: ["id", "username", "full_name_ar", "email", "password_hash", "default_unit_id", "is_active", "last_login_at"]
      },
      {
        name: "الأدوار والصلاحيات (Roles & Permissions)",
        table: "roles",
        description: "الأدوار الوظيفية وقائمة الصلاحيات الدقيقة الممنوحة لكل دور.",
        columns: ["id", "role_code", "name_ar", "description", "permissions_json"]
      }
    ],
    accountingImpact: [
      {
        debit: "حماية أمنية",
        credit: "فصل المهام (Segregation of Duties)",
        notes: "منع أي مستخدم غير مفوض من إنشاء أو ترحيل أو عكس قيود محاسبية أو تعديل أسعار بيع دون تفويض."
      }
    ],
    dataFlowDescription: "تسجيل الدخول -> التحقق من الهوية -> جلب مصفوفة الصلاحيات ووحدات العمل المصرح بها -> تطبيق الفلترة على الواجهة والـ API ومنع العمليات غير المصرح بها.",
    integrationPoints: ["كافة الشاشات، العمليات، وسجلات التدقيق"]
  },
  {
    id: 22,
    slug: "audit-logging-architecture",
    title: "22. معمارية سجلات التدقيق والمراقبة (Audit Logging & Compliance)",
    titleEn: "Immutable Audit Trails, Activity Logs & Change History",
    category: "admin",
    icon: "History",
    summary: "سجل تدقيق آمن وغير قابل للتعديل (Immutable Audit Trail) يسجل كل حركة إنشاء، تعديل، حذف، تسجيل دخول، أو استعراض مستندات مالية مع تتبع القيمة السابقة والجديدة ومعرف المستخدم والوقت وعنوان IP.",
    businessRules: [
      "جداول سجل التدقيق للقراءة والإدراج فقط (Append-Only)؛ لا يمكن تعديلها أو حذف سجلاتها حتى من قبل المشرف.",
      "تسجيل التغييرات على مستوى الحقول الحساسة (تغيير سعر صنف، منح خصم، حذف بند فاتورة، تعديل قيد).",
      "تسجيل محاولات الدخول الفاشلة والعمليات المشبوهة لإرسال تنبيهات فورية لمالك النظام."
    ],
    keyEntities: [
      {
        name: "سجل التدقيق والمراقبة (Audit Logs)",
        table: "audit_logs",
        description: "سجل الحركات الشامل مع تتبع تفاصيل التغيير القديمة والجديدة.",
        columns: ["id", "user_id", "unit_id", "action_type", "entity_type", "entity_id", "old_values_json", "new_values_json", "ip_address", "user_agent", "created_at"]
      }
    ],
    accountingImpact: [
      {
        debit: "الامتثال والشفافية",
        credit: "الحماية من التلاعب",
        notes: "توفير مسار مراجعة قانوني ومحاسبي كامل يثبت هوية ووقت ومسؤولية كل حركة مالية أو مخزنية."
      }
    ],
    dataFlowDescription: "تلقائياً عند تنفيذ أي عملية على قاعدة البيانات، يتم إدراج سجل تدقيق يحتوي على تفاصيل الحدث وحالة البيانات قبل وبعد التعديل في جدول audit_logs.",
    integrationPoints: ["كافة العمليات والمعاملات في النظام"]
  },
  {
    id: 23,
    slug: "backup-dr-architecture",
    title: "23. معمارية النسخ الاحتياطي والتعافي من الكوارث (Backup & Disaster Recovery)",
    titleEn: "Automated Backups, Point-in-Time Recovery & Data Integrity",
    category: "admin",
    icon: "DatabaseBackup",
    summary: "استراتيجية نسخ احتياطي متقدمة لقواعد بيانات MySQL تضمن الحفاظ على البيانات وحمايتها من التلف والضياع، تشمل النسخ اليومي الكامل، والنسخ التزايدي عبر Binary Logs، والتشفير والتخزين السحابي الآمن.",
    businessRules: [
      "نسخ احتياطي يومي آلي كامل (Automated Daily mysqldump) مع ضغط الملفات وتشفيرها بمفتاح AES-256.",
      "تفعيل سجل العمليات الثنائي (MySQL Binary Logging) لتمكين استرجاع البيانات لأي نقطة زمنية محددة (Point-in-Time Recovery - PITR).",
      "حفظ نسخة محلية مشفرة في الخادم ورفع نسخة مشفرة إضافية إلى مساحة تخزين سحابية معزولة (Off-site Cloud Storage).",
      "إجراء اختبار استعادة دوري (Restoration Drill) شهرياً للتحقق من سلامة وصلاحية ملفات النسخ الاحتياطي."
    ],
    keyEntities: [
      {
        name: "سجل النسخ الاحتياطية (Backup Logs)",
        table: "backup_logs",
        description: "توثيق عمليات النسخ الاحتياطي، حجم الملف، حالتها، وموقع التخزين.",
        columns: ["id", "backup_type", "file_name", "file_size_bytes", "storage_location", "status", "started_at", "completed_at", "checksum"]
      }
    ],
    accountingImpact: [
      {
        debit: "استمرارية الأعمال",
        credit: "الأمان المالي الشامل",
        notes: "ضمان عدم فقدان أي قيد محاسبي أو فاتورة أو سجل عميل في حال حدوث أي عطل بالعتاد."
      }
    ],
    dataFlowDescription: "وظيفة مجدولة (Cron/Scheduled Task) -> تشغيل أداة النسخ الاحتياطي -> فحص السلامة وتوليد Checksum -> التشفير -> الرفع للتخزين الآمن -> تسجيل النتيجة في backup_logs.",
    integrationPoints: ["قاعدة بيانات MySQL", "نظام التشغيل ومساحة التخزين"]
  }
];
