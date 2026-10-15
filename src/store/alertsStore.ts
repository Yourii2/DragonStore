// Alerts Store - Enterprise Real-Time Polling & SSE Event-Listener Engine

export type AlertCategory = 'LOW_STOCK' | 'OVERDUE_MILESTONE' | 'ISP_RENEWAL' | 'JOURNAL_AUDIT';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  timeAgo: string;
  timestamp: string;
  targetTab: 'products' | 'warehouses' | 'sales' | 'finance' | 'reports';
  actionLabel: string;
  isRead: boolean;
  metadata: {
    // Inventory low-stock fields
    itemCode?: string;
    itemName?: string;
    warehouseName?: string;
    currentStock?: number;
    minStock?: number;
    deficit?: number;
    // Freelance milestone fields
    projectName?: string;
    clientName?: string;
    milestoneName?: string;
    amount?: number;
    dueDate?: string;
    daysOverdue?: number;
  };
}

export interface BackendAuditResponse {
  source: string;
  timestamp: string;
  counts: {
    total: number;
    unread: number;
    lowStock: number;
    overdueMilestones: number;
  };
  alerts: any[];
}

class AlertsStore {
  private alerts: SystemAlert[] = [];
  private listeners: Array<() => void> = [];
  private pollingIntervalId: any = null;
  private eventSource: EventSource | null = null;
  private isConnectedToBackend: boolean = false;
  private lastSyncTime: string = new Date().toLocaleTimeString('ar-EG');

  constructor() {
    this.initLocalInitialData();
    this.setupBackendConnections();
  }

  // Subscribe to store updates
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getIsConnected(): boolean {
    return this.isConnectedToBackend;
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  // Setup SSE Event-Listener and Periodic Polling
  private setupBackendConnections() {
    // 1. Initial Fetch
    this.fetchAlertsFromBackend();

    // 2. Setup Server-Sent Events (SSE) for Real-time push updates
    this.initEventSource();

    // 3. Setup Fallback Polling Mechanism (Every 60 seconds instead of 6s)
    if (typeof window !== 'undefined') {
      this.pollingIntervalId = setInterval(() => {
        this.fetchAlertsFromBackend();
      }, 60000);
    }
  }

  private initEventSource() {
    if (typeof window === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/alerts/stream');

      this.eventSource.addEventListener('initial', (e: MessageEvent) => {
        try {
          const data: BackendAuditResponse = JSON.parse(e.data);
          this.processBackendData(data);
          this.isConnectedToBackend = true;
          this.lastSyncTime = new Date().toLocaleTimeString('ar-EG');
          this.notify();
        } catch (err) {
          console.error('Failed to parse SSE initial data:', err);
        }
      });

      this.eventSource.addEventListener('alert_update', (e: MessageEvent) => {
        try {
          const data: BackendAuditResponse = JSON.parse(e.data);
          this.processBackendData(data);
          this.isConnectedToBackend = true;
          this.lastSyncTime = new Date().toLocaleTimeString('ar-EG');
          this.notify();
        } catch (err) {
          console.error('Failed to parse SSE update data:', err);
        }
      });

      this.eventSource.onopen = () => {
        this.isConnectedToBackend = true;
        this.notify();
      };

      this.eventSource.onerror = () => {
        this.isConnectedToBackend = false;
        // The browser will automatically attempt reconnects
      };
    } catch (e) {
      console.warn('SSE not available in current environment, relying on polling mechanism.');
    }
  }

  // Fetch from MySQL Backend via Polling
  public async fetchAlertsFromBackend(): Promise<void> {
    try {
      const res = await fetch('/api/alerts/audit');
      if (res.ok) {
        const json: BackendAuditResponse = await res.json();
        this.processBackendData(json);
        this.isConnectedToBackend = true;
        this.lastSyncTime = new Date().toLocaleTimeString('ar-EG');
        this.notify();
      }
    } catch (e) {
      // Offline / fallback mode
      this.isConnectedToBackend = false;
    }
  }

  private processBackendData(json: BackendAuditResponse) {
    if (!json.alerts || !Array.isArray(json.alerts)) return;

    // Keep track of locally read IDs so backend poll doesn't revert them to unread
    const currentlyReadIds = new Set(this.alerts.filter(a => a.isRead).map(a => a.id));

    const transformed: SystemAlert[] = json.alerts.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category as AlertCategory,
      severity: item.severity as AlertSeverity,
      timeAgo: item.timeAgo || 'الآن',
      timestamp: item.timestamp || new Date().toISOString(),
      targetTab: item.targetTab || 'products',
      actionLabel: item.actionLabel || 'معاينة التفاصيل',
      isRead: currentlyReadIds.has(item.id) ? true : !!item.isRead,
      metadata: {
        itemCode: item.code || item.metadata?.itemCode,
        itemName: item.name || item.metadata?.itemName,
        warehouseName: item.warehouse || item.metadata?.warehouseName,
        currentStock: item.currentStock !== undefined ? item.currentStock : item.metadata?.currentStock,
        minStock: item.minStock !== undefined ? item.minStock : item.metadata?.minStock,
        deficit: item.deficit !== undefined ? item.deficit : item.metadata?.deficit,
        projectName: item.projectName || item.metadata?.projectName,
        clientName: item.clientName || item.metadata?.clientName,
        milestoneName: item.milestoneName || item.metadata?.milestoneName,
        amount: item.amount !== undefined ? item.amount : item.metadata?.amount,
        dueDate: item.dueDate || item.metadata?.dueDate,
        daysOverdue: item.daysOverdue !== undefined ? item.daysOverdue : item.metadata?.daysOverdue,
      }
    }));

    this.alerts = transformed;
  }

  // Initial local fallback data
  private initLocalInitialData() {
    this.alerts = [
      {
        id: 'ALERT-STK-ROUT-MIK-HEX',
        title: 'نقص مخزون حرج: راوتر بورد MikroTik hEX RB750Gr3',
        description: 'الرصيد الحالي في (مخزن المتجر الرئيسي) هو 2 قطعة فقط (الحد الأدنى 5 قطعة). العجز: 3 قطعة.',
        category: 'LOW_STOCK',
        severity: 'WARNING',
        timeAgo: 'مباشر من MySQL',
        timestamp: new Date().toISOString(),
        targetTab: 'products',
        actionLabel: 'إصدار أمر شراء وتوريد',
        isRead: false,
        metadata: {
          itemCode: 'ROUT-MIK-HEX',
          itemName: 'راوتر بورد MikroTik hEX RB750Gr3',
          warehouseName: 'مخزن المتجر الرئيسي',
          currentStock: 2,
          minStock: 5,
          deficit: 3
        }
      },
      {
        id: 'ALERT-STK-NET-CAB-CAT6',
        title: 'نقص مخزون: لفة كابل شبكات Schneider Cat6 UTP 305m',
        description: 'الرصيد الحالي في (مخزن ورشة الصيانة) هو 3 لفة فقط (الحد الأدنى 4 لفة). العجز: 1 لفة.',
        category: 'LOW_STOCK',
        severity: 'WARNING',
        timeAgo: 'مباشر من MySQL',
        timestamp: new Date().toISOString(),
        targetTab: 'warehouses',
        actionLabel: 'تحويل مخزني أو توريد',
        isRead: false,
        metadata: {
          itemCode: 'NET-CAB-CAT6',
          itemName: 'لفة كابل شبكات Schneider Cat6 UTP 305m',
          warehouseName: 'مخزن ورشة الصيانة والتركيبات',
          currentStock: 3,
          minStock: 4,
          deficit: 1
        }
      },
      {
        id: 'ALERT-MLS-MLS-01',
        title: 'دفعة مشروع متأخرة: نظام ERP اللوجستي وإدارة الأسطول',
        description: 'استحقت دفعة "تسليم مرحلة الـ Backend API ومزامنة الشاحنات" بقيمة 25,000 ج.م للعميل (م/ طارق الزيات) منذ 5 أيام.',
        category: 'OVERDUE_MILESTONE',
        severity: 'CRITICAL',
        timeAgo: 'متأخرة 5 أيام',
        timestamp: new Date().toISOString(),
        targetTab: 'sales',
        actionLabel: 'إرسال مطالبة مالية للعميل',
        isRead: false,
        metadata: {
          projectName: 'نظام ERP اللوجستي السحابي وإدارة الأسطول',
          clientName: 'م/ طارق الزيات (Fintech Solutions)',
          milestoneName: 'تسليم مرحلة الـ Backend API ومزامنة الشاحنات',
          amount: 25000,
          dueDate: '2026-09-18',
          daysOverdue: 5
        }
      },
      {
        id: 'ALERT-MLS-MLS-02',
        title: 'دفعة مشروع متأخرة: تطبيق متجر الهواتف الذكية (React Native)',
        description: 'استحقت دفعة "الدفعة النهائية وإطلاق التطبيق على المتاجر" بقيمة 15,000 ج.م للعميل (شركة النور للتجارة) منذ 1 يوم.',
        category: 'OVERDUE_MILESTONE',
        severity: 'WARNING',
        timeAgo: 'متأخرة 1 يوم',
        timestamp: new Date().toISOString(),
        targetTab: 'sales',
        actionLabel: 'متابعة العقد والدفعة',
        isRead: false,
        metadata: {
          projectName: 'تطبيق متجر الهواتف الذكية (React Native / iOS & Android)',
          clientName: 'شركة النور للتجارة والمقاولات',
          milestoneName: 'الدفعة النهائية وإطلاق التطبيق على المتاجر',
          amount: 15000,
          dueDate: '2026-09-22',
          daysOverdue: 1
        }
      },
      {
        id: 'ALERT-ISP-01',
        title: 'تجديد باقات الإنترنت (ISP Networks)',
        description: 'يوجد 8 مشتركين تنتهي باقاتهم خلال الـ 48 ساعة القادمة بقيمة متوقعة 3,200 ج.م.',
        category: 'ISP_RENEWAL',
        severity: 'INFO',
        timeAgo: 'منذ ساعتين',
        timestamp: new Date().toISOString(),
        targetTab: 'sales',
        actionLabel: 'عرض المشتركين',
        isRead: false,
        metadata: {}
      }
    ];
  }

  // Public Getters
  public getAlerts(): SystemAlert[] {
    return this.alerts;
  }

  public getUnreadCount(): number {
    return this.alerts.filter(a => !a.isRead).length;
  }

  public getLowStockCount(): number {
    return this.alerts.filter(a => a.category === 'LOW_STOCK' && !a.isRead).length;
  }

  public getOverdueMilestonesCount(): number {
    return this.alerts.filter(a => a.category === 'OVERDUE_MILESTONE' && !a.isRead).length;
  }

  // Public Actions with Backend Synchronization
  public async markAsRead(id: string): Promise<void> {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, isRead: true } : a);
    this.notify();

    try {
      await fetch('/api/alerts/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (e) {
      // Local update already applied
    }
  }

  public async markAllAsRead(): Promise<void> {
    this.alerts = this.alerts.map(a => ({ ...a, isRead: true }));
    this.notify();

    try {
      await fetch('/api/alerts/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
    } catch (e) {
      // Local update already applied
    }
  }

  // Triggers that call the MySQL Backend Simulator
  public async simulateRandomLowStockAlert(): Promise<void> {
    const names = [
      { name: 'سويتش Cisco Catalyst 24-Port Gigabit', wh: 'مخزن المتجر الرئيسي' },
      { name: 'كاميرا Dahua WizSense 4K IP 8MP', wh: 'مخزن عهدة المشاريع' },
      { name: 'راوتر TP-Link Omada ER605 Multi-WAN', wh: 'مخزن المتجر الرئيسي' }
    ];
    const pick = names[Math.floor(Math.random() * names.length)];

    try {
      const res = await fetch('/api/alerts/simulate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pick.name, warehouse: pick.wh })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.audit) {
          this.processBackendData(json.audit);
          this.notify();
        }
      }
    } catch (e) {
      // Fallback local addition
      const newId = `ALERT-STK-${Date.now()}`;
      this.alerts.unshift({
        id: newId,
        title: `نقص مخزون حرج: ${pick.name}`,
        description: `الرصيد في (${pick.wh}) هو 1 قطعة فقط (الحد الأدنى 4 قطعة).`,
        category: 'LOW_STOCK',
        severity: 'WARNING',
        timeAgo: 'الآن',
        timestamp: new Date().toISOString(),
        targetTab: 'products',
        actionLabel: 'إصدار أمر شراء',
        isRead: false,
        metadata: {
          itemName: pick.name,
          warehouseName: pick.wh,
          currentStock: 1,
          minStock: 4,
          deficit: 3
        }
      });
      this.notify();
    }
  }

  // Trigger direct stock drop for a specific code
  public async triggerStockDrop(code: string, delta: number = 1): Promise<void> {
    try {
      const res = await fetch('/api/alerts/simulate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, delta: -Math.abs(delta) })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.audit) {
          this.processBackendData(json.audit);
          this.notify();
        }
      }
    } catch (e) {
      // Local fallback
      const alert = this.alerts.find(a => a.metadata.itemCode === code);
      if (alert && alert.metadata.currentStock !== undefined) {
        alert.metadata.currentStock = Math.max(0, alert.metadata.currentStock - delta);
        this.notify();
      }
    }
  }

  public async simulateRandomOverdueMilestoneAlert(): Promise<void> {
    const projects = [
      { prj: 'تطبيق التوصيل السريع وإدارة المناديب', client: 'شركة الفرسان اللوجستية', amount: 32000 },
      { prj: 'نظام إدارة الصيدليات والروشتة الموحدة', client: 'مجموعة صيدليات الشفاء', amount: 21000 },
      { prj: 'منصة المزادات والعقود الذكية Web3', client: 'مؤسسة الرياض للاستثمار', amount: 45000 }
    ];
    const pick = projects[Math.floor(Math.random() * projects.length)];

    try {
      const res = await fetch('/api/alerts/simulate-overdue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: pick.prj, clientName: pick.client, amount: pick.amount })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.audit) {
          this.processBackendData(json.audit);
          this.notify();
        }
      }
    } catch (e) {
      // Fallback local addition
      const newId = `ALERT-MLS-${Date.now()}`;
      this.alerts.unshift({
        id: newId,
        title: `دفعة مشروع متأخرة: ${pick.prj}`,
        description: `استحقت دفعة المرحلة النهائية بقيمة ${pick.amount.toLocaleString()} ج.م للعميل (${pick.client}) منذ 4 أيام.`,
        category: 'OVERDUE_MILESTONE',
        severity: 'CRITICAL',
        timeAgo: 'متأخرة 4 أيام',
        timestamp: new Date().toISOString(),
        targetTab: 'sales',
        actionLabel: 'إرسال مطالبة مالية للعميل',
        isRead: false,
        metadata: {
          projectName: pick.prj,
          clientName: pick.client,
          amount: pick.amount,
          daysOverdue: 4
        }
      });
      this.notify();
    }
  }

  public destroy() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

export const alertsStore = new AlertsStore();
