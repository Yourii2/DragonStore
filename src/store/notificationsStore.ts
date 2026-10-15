export interface SystemNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  category: 'STOCK_LOW' | 'PAYMENT_OVERDUE' | 'ISP_RENEWAL' | 'JOURNAL_AUDIT';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  targetTab: string;
  actionText?: string;
  isRead: boolean;
  metadata?: {
    itemCode?: string;
    currentStock?: number;
    minStock?: number;
    amount?: number;
    dueDate?: string;
    projectName?: string;
    clientName?: string;
  };
}

export const initialNotifications: SystemNotification[] = [
  {
    id: 'NOTIF-STK-01',
    title: 'تنبيه مخزون حرج: راوترات MikroTik hEX',
    desc: 'الرصيد الحالي بالمخزن 4 قطع فقط، وهو أقل من حد إعادة الطلب الأدنى (5 قطع). يرجى إصدار أمر شراء.',
    time: 'منذ 5 دقائق',
    category: 'STOCK_LOW',
    severity: 'WARNING',
    targetTab: 'products',
    actionText: 'عرض الصنف والطلب',
    isRead: false,
    metadata: {
      itemCode: 'ROUT-MIK-HEX',
      currentStock: 4,
      minStock: 5
    }
  },
  {
    id: 'NOTIF-STK-02',
    title: 'تنبيه مخزون: كابلات شبكات Schneider Cat6',
    desc: 'المتبقي بمخزن المتجر 3 لفات فقط (الحد الأدنى 4 لفات). استهلاك سريع في مشاريع الـ CCTV الحالية.',
    time: 'منذ 20 دقيقة',
    category: 'STOCK_LOW',
    severity: 'WARNING',
    targetTab: 'warehouses',
    actionText: 'تحويل أو توريد',
    isRead: false,
    metadata: {
      itemCode: 'NET-CAB-CAT6',
      currentStock: 3,
      minStock: 4
    }
  },
  {
    id: 'NOTIF-PAY-01',
    title: 'دفعة مشروع متأخرة: نظام إدارة اللوجستيات ERP',
    desc: 'استحقت دفعة المرحلة الثانية (25,000 ج.م) لعميل البرمجيات "م/ طارق الزيات" منذ 3 أيام ولم يتم تحصيلها.',
    time: 'متأخرة 3 أيام',
    category: 'PAYMENT_OVERDUE',
    severity: 'CRITICAL',
    targetTab: 'sales',
    actionText: 'متابعة العقد والدفعات',
    isRead: false,
    metadata: {
      projectName: 'نظام ERP اللوجستي السحابي (BU 2)',
      clientName: 'م/ طارق الزيات',
      amount: 25000,
      dueDate: '2026-09-20'
    }
  },
  {
    id: 'NOTIF-PAY-02',
    title: 'استحقاق دفعة نهائية: تطبيق المتجر الإلكتروني React Native',
    desc: 'تم تسليم المشروع بنجاح وتبقى الدفعة النهائية وقيمتها (15,000 ج.م) مستحقة اليوم.',
    time: 'مستحقة اليوم',
    category: 'PAYMENT_OVERDUE',
    severity: 'WARNING',
    targetTab: 'sales',
    actionText: 'إصدار مطالبة مالية',
    isRead: false,
    metadata: {
      projectName: 'تطبيق متجر الهواتف الذكية (iOS/Android)',
      clientName: 'شركة النور للتجارة',
      amount: 15000,
      dueDate: '2026-09-23'
    }
  },
  {
    id: 'NOTIF-ISP-01',
    title: 'تجديد اشتراكات شبكة الإنترنت (ISP)',
    desc: 'يوجد 8 مشتركين تنتهي باقاتهم خلال الـ 48 ساعة القادمة. إجمالي القيمة المتوقعة 3,200 ج.م.',
    time: 'منذ ساعتين',
    category: 'ISP_RENEWAL',
    severity: 'INFO',
    targetTab: 'sales',
    actionText: 'عرض المشتركين',
    isRead: false
  },
  {
    id: 'NOTIF-AUDIT-01',
    title: 'موازنة قيود اليومية العامة (Double-Entry Balanced)',
    desc: 'تم ترحيل كافة قيود اليومية لليوم وتطابق المدين مع الدائن بنسبة 100% (توازن تام).',
    time: 'منذ 4 ساعات',
    category: 'JOURNAL_AUDIT',
    severity: 'INFO',
    targetTab: 'finance',
    actionText: 'مراجعة الدفتر',
    isRead: true
  }
];
