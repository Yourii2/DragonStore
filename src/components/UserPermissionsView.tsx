import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  UserCheck, 
  Warehouse, 
  Landmark, 
  DollarSign, 
  Lock, 
  Unlock, 
  Printer, 
  FileSpreadsheet, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Package, 
  Users, 
  Truck, 
  ShoppingCart, 
  FileSpreadsheet as FileSpreadsheetIcon, 
  Receipt, 
  CircleDollarSign, 
  Coins, 
  Settings, 
  Radio, 
  Building, 
  CheckCircle, 
  Download, 
  Boxes, 
  Globe, 
  Wrench, 
  Code, 
  Home, 
  History, 
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CreditCard,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { CurrentUser, PagePermission, FinancialPermissions, systemAuthStore } from '../store/systemAuthStore';
import SearchableSelect from './SearchableSelect';
import { showSuccess, showError, showToast } from '../utils/swal';

// User record from API
interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  role_title_ar: string;
  is_active: number;
  assigned_warehouse: string;
  assigned_treasury: string;
  permissions?: Record<string, PagePermission>;
  financial_permissions?: FinancialPermissions;
}

interface AccountItem {
  id: string;
  account_code: string;
  name: string;
}

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
}

// Definition of all modules matching Sidebar 1:1
export interface CustomActionDef {
  key: string;
  label: string;
  icon?: any;
  color?: string;
  tooltip?: string;
}

interface PermissionPageDef {
  id: string;
  label: string;
  icon: any;
  hasAdd?: boolean;
  hasEdit?: boolean;
  hasDelete?: boolean;
  hasPrint?: boolean;
  hasExport?: boolean;
  addLabel?: string;
  customActions?: CustomActionDef[];
}

interface PermissionGroupDef {
  id: string;
  label: string;
  icon: any;
  pages: PermissionPageDef[];
}

const SIDEBAR_MODULE_GROUPS: PermissionGroupDef[] = [
  {
    id: 'dashboard_group',
    label: 'الصفحة الرئيسية',
    icon: Home,
    pages: [
      { id: 'dashboard', label: 'لوحة التحكم والمؤشرات الرئيسية', icon: Home, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'products_group',
    label: 'إدارة المنتجات والأصناف',
    icon: Package,
    pages: [
      { id: 'warehouses', label: 'إدارة المخازن والفروع', icon: Warehouse, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'categories', label: 'إدارة التصنيفات والمجموعات', icon: Layers, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'products', label: 'دليل المنتجات والأصناف والخدمات', icon: Package, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'customers_group',
    label: 'إدارة العملاء',
    icon: Users,
    pages: [
      { id: 'customers', label: 'دليل وبيانات العملاء', icon: Users, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'customer_transactions', label: 'كشف حساب ومعاملات العملاء', icon: Receipt, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'suppliers_group',
    label: 'إدارة الموردين',
    icon: Truck,
    pages: [
      { id: 'suppliers', label: 'دليل وبيانات الموردين', icon: Truck, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'supplier_transactions', label: 'كشف حساب ومعاملات الموردين', icon: Receipt, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'employees_group',
    label: 'إدارة الموظفين',
    icon: UserCheck,
    pages: [
      { id: 'employees', label: 'دليل الموظفين والرواتب', icon: UserCheck, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'employee_transactions', label: 'مسيرات ومعاملات الموظفين', icon: CircleDollarSign, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'sales_group',
    label: 'إدارة المبيعات ونقاط البيع',
    icon: ShoppingCart,
    pages: [
      { 
        id: 'sales_pos', 
        label: 'إدارة المبيعات ونقاط البيع POS', 
        icon: ShoppingCart, 
        customActions: [
          { key: 'sale', label: 'بيع', icon: ShoppingCart, color: 'text-emerald-500', tooltip: 'صلاحية إصدار فواتير البيع' },
          { key: 'return', label: 'مرتجع', icon: RotateCcw, color: 'text-amber-500', tooltip: 'صلاحية عمل مرتجع مبيعات' },
          { key: 'credit', label: 'آجل', icon: CreditCard, color: 'text-purple-500', tooltip: 'صلاحية البيع بالآجل وعلى الحساب' }
        ]
      },
      { id: 'quotations', label: 'عروض الأسعار', icon: Receipt, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { 
        id: 'network_page', 
        label: 'خدمات وباقات الشبكة', 
        icon: Globe, 
        customActions: [
          { key: 'receive_payment', label: 'استلام دفعة', icon: PlusCircle, color: 'text-emerald-500', tooltip: 'صلاحية استلام دفعات واشتراكات المشتركين' },
          { key: 'pay_expense', label: 'دفع مصروف', icon: MinusCircle, color: 'text-rose-500', tooltip: 'صلاحية تسجيل ودفع مصروفات الشبكة' }
        ]
      }
    ]
  },
  {
    id: 'reports_group',
    label: 'إدارة التقارير المحاسبية',
    icon: FileSpreadsheetIcon,
    pages: [
      { id: 'reports_sales', label: 'تقرير المبيعات والأرباح', icon: Receipt, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_physical', label: 'تقرير مبيعات السلع المادية', icon: Boxes, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_maintenance', label: 'تقرير أرباح الصيانة والخدمات', icon: Wrench, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_software', label: 'تقرير مبيعات البرمجيات', icon: Code, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_network', label: 'تقرير أرباح وخسائر الشبكة', icon: Globe, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_inventory', label: 'تقرير تقييم المخزون والنواقص', icon: Warehouse, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_treasury', label: 'تقرير حركات الخزائن والسيولة', icon: Coins, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_customers', label: 'تقرير أرصدة العملاء والديون', icon: Users, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_suppliers', label: 'تقرير أرصدة ومستحقات الموردين', icon: Truck, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_expenses', label: 'تقرير سجل وتحليل المصروفات', icon: CircleDollarSign, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'reports_pnl', label: 'قائمة الأرباح والخسائر (P&L)', icon: DollarSign, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'finance_group',
    label: 'إدارة الماليات والخزائن',
    icon: Landmark,
    pages: [
      { id: 'treasury', label: 'إدارة الخزائن والحسابات البنكية', icon: Landmark, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'financial_transactions', label: 'سجل المعاملات والتحويلات المالية', icon: Coins, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'finance', label: 'المصروفات والإيرادات والمقبوضات', icon: CircleDollarSign, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'stock_movement_group',
    label: 'حركة المخزون',
    icon: ArrowLeftRight,
    pages: [
      { id: 'stock_in', label: 'استلام بضائع من مورد', icon: ArrowDownLeft, hasAdd: true, addLabel: 'إذن جديد', hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'stock_return', label: 'ارتجاع بضائع إلى مورد', icon: ArrowUpRight, hasAdd: true, addLabel: 'إذن جديد', hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'stock_transfer', label: 'نقل بضائع بين المخازن', icon: RefreshCw, hasAdd: true, addLabel: 'إذن جديد', hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'users_group',
    label: 'إدارة المستخدمين والصلاحيات',
    icon: ShieldCheck,
    pages: [
      { id: 'profile', label: 'الملف الشخصي وكلمة المرور', icon: UserCheck, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: false, hasExport: false },
      { id: 'users_management', label: 'إدارة المستخدمين والحسابات', icon: Users, hasAdd: true, hasEdit: true, hasDelete: true, hasPrint: true, hasExport: true },
      { id: 'user_permissions', label: 'مصفوفة صلاحيات المستخدمين', icon: Key, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: true, hasExport: true },
      { id: 'activity_log', label: 'سجل حركات النظام والرقابة', icon: History, hasAdd: false, hasEdit: false, hasDelete: false, hasPrint: true, hasExport: true }
    ]
  },
  {
    id: 'settings_group',
    label: 'الإعدادات العامة للنظام',
    icon: Settings,
    pages: [
      { id: 'settings_connection', label: 'إعدادات الاتصال بقاعدة البيانات', icon: Radio, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: false, hasExport: false },
      { id: 'settings_company', label: 'إعدادات الشركة والفروع والضريبة', icon: Building, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: false, hasExport: false },
      { id: 'settings_print', label: 'إعدادات الطابعات وتصميم الفواتير', icon: Printer, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: false, hasExport: false },
      { id: 'settings_activation', label: 'إعدادات الترخيص وتفعيل النظام', icon: CheckCircle, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: false, hasExport: false },
      { id: 'settings_update', label: 'إعدادات التحديث والنسخ الاحتياطي', icon: Download, hasAdd: false, hasEdit: true, hasDelete: false, hasPrint: false, hasExport: false }
    ]
  }
];

export const UserPermissionsView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected User
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Current Working State for selected user
  const [assignedWarehouse, setAssignedWarehouse] = useState<string>('ALL');
  const [assignedTreasury, setAssignedTreasury] = useState<string>('ALL');
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, PagePermission>>({});
  const [financialPermissions, setFinancialPermissions] = useState<FinancialPermissions>({
    can_deposit: true,
    can_withdraw: true,
    can_transfer: true,
    can_customer_receipt: true,
    can_supplier_payment: true,
    can_employee_advance: true,
    can_view_all_balances: true
  });

  // Collapsed group sections
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load: Users, Accounts, Warehouses
  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, aRes, wRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/accounts'),
        fetch('/api/warehouses')
      ]);

      const [uData, aData, wData] = await Promise.all([
        uRes.json(),
        aRes.json(),
        wRes.json()
      ]);

      if (uData.success && Array.isArray(uData.data)) {
        setUsers(uData.data);
        if (uData.data.length > 0 && selectedUserId === null) {
          // Select first user
          loadUserIntoState(uData.data[0]);
        }
      }

      if (aData.success && Array.isArray(aData.data)) {
        setAccounts(aData.data);
      }

      if (wData.success && Array.isArray(wData.data)) {
        setWarehouses(wData.data);
      }
    } catch (err) {
      console.error('Failed to load permissions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Load user into local editing state
  const loadUserIntoState = (u: UserItem) => {
    setSelectedUserId(u.id);
    setAssignedWarehouse(u.assigned_warehouse || 'ALL');
    setAssignedTreasury(u.assigned_treasury || 'ALL');

    // Build permissions matrix, defaulting to true if none set yet
    const perms: Record<string, PagePermission> = {};
    SIDEBAR_MODULE_GROUPS.forEach(grp => {
      grp.pages.forEach(pg => {
        if (u.permissions && u.permissions[pg.id]) {
          perms[pg.id] = { ...u.permissions[pg.id] };
        } else {
          // Default: If SUPER_ADMIN all true, else default view/print true
          const isSuper = u.role === 'SUPER_ADMIN';
          perms[pg.id] = {
            view: true,
            add: isSuper,
            edit: isSuper,
            delete: isSuper,
            print: true,
            export: isSuper
          };
        }
      });
    });
    setPermissionsMatrix(perms);

    // Financial permissions
    if (u.financial_permissions) {
      setFinancialPermissions({
        can_deposit: u.financial_permissions.can_deposit ?? true,
        can_withdraw: u.financial_permissions.can_withdraw ?? true,
        can_transfer: u.financial_permissions.can_transfer ?? true,
        can_customer_receipt: u.financial_permissions.can_customer_receipt ?? true,
        can_supplier_payment: u.financial_permissions.can_supplier_payment ?? true,
        can_employee_advance: u.financial_permissions.can_employee_advance ?? true,
        can_view_all_balances: u.financial_permissions.can_view_all_balances ?? true
      });
    } else {
      const isSuper = u.role === 'SUPER_ADMIN';
      setFinancialPermissions({
        can_deposit: true,
        can_withdraw: isSuper,
        can_transfer: isSuper,
        can_customer_receipt: true,
        can_supplier_payment: isSuper,
        can_employee_advance: isSuper,
        can_view_all_balances: isSuper
      });
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const isSelectedSuperAdmin = selectedUser?.role === 'SUPER_ADMIN';

  // Toggle single permission checkbox
  const togglePermission = (pageId: string, action: string) => {
    setPermissionsMatrix(prev => {
      const current = prev[pageId] || { view: false, add: false, edit: false, delete: false, print: false, export: false };
      const nextVal = !current[action];
      const updated: PagePermission = { ...current, [action]: nextVal };

      // Logical tie: If any sub-action is checked, view must automatically be true
      if (nextVal && action !== 'view') {
        updated.view = true;
      }
      // If view is unchecked, all actions must be turned off
      if (!nextVal && action === 'view') {
        Object.keys(updated).forEach(k => {
          if (k !== 'view') {
            (updated as any)[k] = false;
          }
        });
      }

      return {
        ...prev,
        [pageId]: updated
      };
    });
  };

  // Toggle all permissions for a specific page row
  const toggleRowAll = (pageId: string) => {
    const pageDef = SIDEBAR_MODULE_GROUPS.flatMap(g => g.pages).find(p => p.id === pageId);
    setPermissionsMatrix(prev => {
      const current = prev[pageId] || { view: false, add: false, edit: false, delete: false, print: false, export: false };

      if (pageDef?.customActions && pageDef.customActions.length > 0) {
        const allActive = Boolean(current.view && pageDef.customActions.every(ca => current[ca.key]));
        const target = !allActive;
        const updated: PagePermission = { ...current, view: target };
        pageDef.customActions.forEach(ca => {
          (updated as any)[ca.key] = target;
        });
        return {
          ...prev,
          [pageId]: updated
        };
      } else {
        const activeKeys: (keyof PagePermission)[] = ['view'];
        if (pageDef?.hasAdd !== false) activeKeys.push('add');
        if (pageDef?.hasEdit !== false) activeKeys.push('edit');
        if (pageDef?.hasDelete !== false) activeKeys.push('delete');
        if (pageDef?.hasPrint !== false) activeKeys.push('print');
        if (pageDef?.hasExport !== false) activeKeys.push('export');

        const allActive = activeKeys.every(k => Boolean(current[k]));
        const target = !allActive;

        return {
          ...prev,
          [pageId]: {
            ...current,
            view: target,
            add: pageDef?.hasAdd !== false ? target : false,
            edit: pageDef?.hasEdit !== false ? target : false,
            delete: pageDef?.hasDelete !== false ? target : false,
            print: pageDef?.hasPrint !== false ? target : false,
            export: pageDef?.hasExport !== false ? target : false
          }
        };
      }
    });
  };

  // Toggle all permissions for an entire Group
  const toggleGroupAll = (group: PermissionGroupDef, enable: boolean) => {
    setPermissionsMatrix(prev => {
      const next = { ...prev };
      group.pages.forEach(pg => {
        const current = next[pg.id] || { view: false, add: false, edit: false, delete: false, print: false, export: false };
        const updated: PagePermission = {
          ...current,
          view: enable,
          add: pg.hasAdd !== false ? enable : false,
          edit: pg.hasEdit !== false ? enable : false,
          delete: pg.hasDelete !== false ? enable : false,
          print: pg.hasPrint !== false ? enable : false,
          export: pg.hasExport !== false ? enable : false
        };
        if (pg.customActions && pg.customActions.length > 0) {
          pg.customActions.forEach(ca => {
            (updated as any)[ca.key] = enable;
          });
        }
        next[pg.id] = updated;
      });
      return next;
    });
  };

  // Toggle entire Column across all pages (e.g. all delete or all export)
  const toggleColumnAll = (action: keyof PagePermission, enable: boolean) => {
    setPermissionsMatrix(prev => {
      const next = { ...prev };
      SIDEBAR_MODULE_GROUPS.forEach(grp => {
        grp.pages.forEach(pg => {
          // If page has custom actions instead of standard columns, skip standard columns
          if (pg.customActions && pg.customActions.length > 0 && action !== 'view') {
            return;
          }
          const current = next[pg.id] || { view: false, add: false, edit: false, delete: false, print: false, export: false };
          const updated = { ...current, [action]: enable };
          if (enable && action !== 'view') {
            updated.view = true;
          }
          if (!enable && action === 'view') {
            Object.keys(updated).forEach(k => {
              if (k !== 'view') {
                (updated as any)[k] = false;
              }
            });
          }
          next[pg.id] = updated;
        });
      });
      return next;
    });
  };

  // Presets
  const applyPreset = (preset: 'FULL' | 'VIEW_PRINT' | 'DATA_ENTRY' | 'NONE') => {
    setPermissionsMatrix(prev => {
      const next: Record<string, PagePermission> = {};
      SIDEBAR_MODULE_GROUPS.forEach(grp => {
        grp.pages.forEach(pg => {
          if (pg.customActions && pg.customActions.length > 0) {
            const customPerms: PagePermission = {
              view: preset !== 'NONE',
              add: false,
              edit: false,
              delete: false,
              print: false,
              export: false
            };
            pg.customActions.forEach(ca => {
              if (preset === 'FULL' || preset === 'DATA_ENTRY') {
                (customPerms as any)[ca.key] = true;
              } else {
                (customPerms as any)[ca.key] = false;
              }
            });
            next[pg.id] = customPerms;
          } else {
            if (preset === 'FULL') {
              next[pg.id] = {
                view: true,
                add: pg.hasAdd !== false,
                edit: pg.hasEdit !== false,
                delete: pg.hasDelete !== false,
                print: pg.hasPrint !== false,
                export: pg.hasExport !== false
              };
            } else if (preset === 'VIEW_PRINT') {
              next[pg.id] = {
                view: true,
                add: false,
                edit: false,
                delete: false,
                print: pg.hasPrint !== false,
                export: pg.hasExport !== false
              };
            } else if (preset === 'DATA_ENTRY') {
              next[pg.id] = {
                view: true,
                add: pg.hasAdd !== false,
                edit: false,
                delete: false,
                print: pg.hasPrint !== false,
                export: false
              };
            } else {
              next[pg.id] = { view: false, add: false, edit: false, delete: false, print: false, export: false };
            }
          }
        });
      });
      return next;
    });

    // Also adjust financial permissions preset
    if (preset === 'FULL') {
      setFinancialPermissions({
        can_deposit: true,
        can_withdraw: true,
        can_transfer: true,
        can_customer_receipt: true,
        can_supplier_payment: true,
        can_employee_advance: true,
        can_view_all_balances: true
      });
    } else if (preset === 'VIEW_PRINT') {
      setFinancialPermissions({
        can_deposit: false,
        can_withdraw: false,
        can_transfer: false,
        can_customer_receipt: false,
        can_supplier_payment: false,
        can_employee_advance: false,
        can_view_all_balances: true
      });
    } else if (preset === 'DATA_ENTRY') {
      setFinancialPermissions({
        can_deposit: true,
        can_withdraw: false,
        can_transfer: false,
        can_customer_receipt: true,
        can_supplier_payment: false,
        can_employee_advance: false,
        can_view_all_balances: false
      });
    }
    showToast('تم تطبيق القالب بنجاح على الصلاحيات');
  };

  // Save changes to MySQL backend
  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const payload = {
        permissions: permissionsMatrix,
        assigned_warehouse: assignedWarehouse,
        assigned_treasury: assignedTreasury,
        financial_permissions: financialPermissions
      };

      const res = await fetch(`/api/users/${selectedUserId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast('تم حفظ الصلاحيات وتخصيص الخزينة والمخزن بنجاح في قاعدة البيانات');
        
        // Update SPA user in users list
        setUsers(prev => prev.map(u => u.id === selectedUserId ? {
          ...u,
          assigned_warehouse: assignedWarehouse,
          assigned_treasury: assignedTreasury,
          permissions: permissionsMatrix,
          financial_permissions: financialPermissions
        } : u));

        // If the current logged in user was modified, live update their session!
        const sessionUser = systemAuthStore.currentUser;
        if (sessionUser && (sessionUser.id === `usr_${selectedUserId}` || (sessionUser as any).db_id === selectedUserId)) {
          const updatedCurrentUser: CurrentUser = {
            ...sessionUser,
            assignedWarehouse: assignedWarehouse,
            assignedTreasury: assignedTreasury,
            permissions: permissionsMatrix,
            financialPermissions: financialPermissions
          };
          systemAuthStore.login(updatedCurrentUser, true);
        }
        showSuccess('تم حفظ الصلاحيات', 'تم حفظ وتحديث صلاحيات المستخدم بنجاح');
      } else {
        showError('فشل الحفظ', data.message || 'حدث خطأ أثناء حفظ الصلاحيات');
      }
    } catch (err: any) {
      console.error(err);
      showError('خطأ في الاتصال بالخادم', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        <span className="text-sm font-bold text-slate-400">جاري تحميل مصفوفة الصلاحيات وبيانات المستخدمين...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>إدارة مصفوفة الصلاحيات وتخصيص الخزائن والمخازن</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                {users.length} مستخدم مسجل
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تحكم دقيق في عمليات كل شاشة (عرض، إضافة، تعديل، حذف، طباعة، تصدير) مع حظر أرصدة الخزائن وعزل المخازن
            </p>
          </div>
        </div>

        {/* User Selector Dropdown & Save Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-500">اختر المستخدم:</span>
            <SearchableSelect
              value={selectedUserId || ''}
              onChange={e => {
                const u = users.find(x => x.id === Number(e.target.value));
                if (u) loadUserIntoState(u);
              }}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {u.full_name} ({u.username}) - {u.role_title_ar || u.role}
                </option>
              ))}
            </SearchableSelect>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات في النظام'}</span>
          </button>
        </div>
      </div>

      {/* Selected User Notice Banner */}
      {selectedUser && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
          isSelectedSuperAdmin 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-900 dark:text-cyan-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Info className="w-4 h-4 text-cyan-500" />
            <span>أنت تقوم حالياً بضبط صلاحيات المستخدم:</span>
            <strong className="underline underline-offset-4">{selectedUser.full_name}</strong>
            <span className="opacity-75">({selectedUser.role_title_ar})</span>
          </div>

          {isSelectedSuperAdmin && (
            <div className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ملاحظة: المدير العام والمالك يمتلك كل الصلاحيات بشكل دائم وتلقائي</span>
            </div>
          )}
        </div>
      )}

      {/* Top Section: Warehouse, Treasury, & Financial Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Box 1: Assigned Warehouse & Treasury (العزل والتقييد) */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm border-b border-slate-200 dark:border-slate-800 pb-3">
            <Warehouse className="w-5 h-5 text-cyan-500" />
            <span>نطاق العمل المحدد (المخزن والخزينة)</span>
          </div>

          {/* Warehouse Restriction */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-blue-500" />
                <span>المخزن المصرح به للمستخدم:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {assignedWarehouse === 'ALL' ? 'مفتوح لكافة المخازن' : 'مقيد بمخزن واحد فقط'}
              </span>
            </label>
            <SearchableSelect
              value={assignedWarehouse}
              onChange={e => setAssignedWarehouse(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">🌐 كل المخازن والفروع (بدون تقييد)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.name}>
                  📦 {w.name} ({w.code})
                </option>
              ))}
            </SearchableSelect>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              * في حال تحديد مخزن معين: لن يتمكن المستخدم من البيع إلا من هذا المخزن فقط، ولن تظهر له حركات أي مخزن آخر.
            </p>
          </div>

          {/* Treasury Restriction */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                <span>الخزينة / الحساب المصرح به:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {assignedTreasury === 'ALL' ? 'مفتوح لكافة الخزائن' : 'مقيد بخزينة واحدة فقط'}
              </span>
            </label>
            <SearchableSelect
              value={assignedTreasury}
              onChange={e => setAssignedTreasury(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">🌐 كل الخزائن والحسابات البنكية (بدون تقييد)</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  💰 {a.name} ({a.account_code})
                </option>
              ))}
            </SearchableSelect>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              * في حال تحديد خزينة معينة: <strong className="text-rose-500">لن يرى المستخدم رصيد أو معاملات أي خزينة أخرى</strong> وستكون معاملاته محصورة بها فقط.
            </p>
          </div>
        </div>

        {/* Box 2: Financial Operations Allowed (العمليات المالية المصرح بها) */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-black text-sm">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>صلاحيات العمليات المالية المسموح بها للمستخدم</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">تحديد دقيق للإيداع والسحب والتحويل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. Deposit */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">إيداع نقدي في الخزينة</div>
                  <div className="text-[10px] text-slate-400">سند قبض وإيداع أموال بالخزينة</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_deposit)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_deposit: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            {/* 2. Withdrawal */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">سحب نقدي وصرف</div>
                  <div className="text-[10px] text-slate-400">سحب أموال وتسجيل مصروفات عادية</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_withdraw)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_withdraw: e.target.checked }))}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
              />
            </label>

            {/* 3. Transfer */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">تحويل بين الخزائن والبنوك</div>
                  <div className="text-[10px] text-slate-400">مناقلة الأموال بين حسابات الشركة</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_transfer)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_transfer: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* 4. Customer Receipt */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">سند قبض من عميل</div>
                  <div className="text-[10px] text-slate-400">تحصيل دفعات المديونيات من العملاء</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_customer_receipt)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_customer_receipt: e.target.checked }))}
                className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
              />
            </label>

            {/* 5. Supplier Payment */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">سند صرف وسداد لمورد</div>
                  <div className="text-[10px] text-slate-400">دفع مستحقات وفواتير الموردين</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_supplier_payment)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_supplier_payment: e.target.checked }))}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
            </label>

            {/* 6. Employee Advance */}
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">صرف سلف ورواتب موظفين</div>
                  <div className="text-[10px] text-slate-400">صرف المستحقات والمسيرات الشهرية</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_employee_advance)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_employee_advance: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
            </label>

            {/* 7. View All Balances */}
            <label className="sm:col-span-2 flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">رؤية إجمالي أرصدة الخزائن الأخرى</div>
                  <div className="text-[10px] text-slate-400">إذا كانت معطلة، لن تظهر بطاقات إجمالي السيولة ورصيد الخزائن الأخرى للمستخدم</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(financialPermissions.can_view_all_balances)}
                onChange={e => setFinancialPermissions(prev => ({ ...prev, can_view_all_balances: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </label>

          </div>
        </div>
      </div>

      {/* Preset Action Buttons & Column Mass Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">أزرار سريعة لتطبيق القوالب والتحكم الجماعي:</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => applyPreset('FULL')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-black hover:bg-emerald-100 cursor-pointer transition-all"
            >
              ⭐ صلاحيات كاملة (تحديد الكل)
            </button>

            <button
              onClick={() => applyPreset('VIEW_PRINT')}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-[11px] font-black hover:bg-blue-100 cursor-pointer transition-all"
            >
              👁️ للقراءة والطباعة فقط (بدون إضافة/تعديل/حذف)
            </button>

            <button
              onClick={() => applyPreset('DATA_ENTRY')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-black hover:bg-amber-100 cursor-pointer transition-all"
            >
              ✍️ مدخل بيانات (عرض + إضافة فقط)
            </button>

            <button
              onClick={() => applyPreset('NONE')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-black hover:bg-rose-100 cursor-pointer transition-all"
            >
              🚫 إلغاء وتصفير الكل
            </button>
          </div>
        </div>

        {/* Mass Column Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {/* Column: View */}
          <div className="p-2.5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/50 dark:border-cyan-800/40 flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-800 dark:text-cyan-300">عمود: عرض</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleColumnAll('view', true)} 
                className="p-1 rounded bg-cyan-600 text-white hover:bg-cyan-500 cursor-pointer text-[10px] px-1.5 font-bold"
                title="تفعيل عمود العرض للكل"
              >
                كل
              </button>
              <button 
                onClick={() => toggleColumnAll('view', false)} 
                className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white cursor-pointer text-[10px] px-1.5 font-bold"
                title="تعطيل عمود العرض للكل"
              >
                لا
              </button>
            </div>
          </div>

          {/* Column: Add */}
          <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">عمود: إضافة</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleColumnAll('add', true)} 
                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer text-[10px] px-1.5 font-bold"
                title="تفعيل عمود الإضافة للكل"
              >
                كل
              </button>
              <button 
                onClick={() => toggleColumnAll('add', false)} 
                className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white cursor-pointer text-[10px] px-1.5 font-bold"
                title="تعطيل عمود الإضافة للكل"
              >
                لا
              </button>
            </div>
          </div>

          {/* Column: Edit */}
          <div className="p-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-300">عمود: تعديل</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleColumnAll('edit', true)} 
                className="p-1 rounded bg-amber-600 text-white hover:bg-amber-500 cursor-pointer text-[10px] px-1.5 font-bold"
                title="تفعيل عمود التعديل للكل"
              >
                كل
              </button>
              <button 
                onClick={() => toggleColumnAll('edit', false)} 
                className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white cursor-pointer text-[10px] px-1.5 font-bold"
                title="تعطيل عمود التعديل للكل"
              >
                لا
              </button>
            </div>
          </div>

          {/* Column: Delete */}
          <div className="p-2.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 flex items-center justify-between text-xs">
            <span className="font-bold text-rose-800 dark:text-rose-300">عمود: حذف</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleColumnAll('delete', true)} 
                className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer text-[10px] px-1.5 font-bold"
                title="تفعيل عمود الحذف للكل"
              >
                كل
              </button>
              <button 
                onClick={() => toggleColumnAll('delete', false)} 
                className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white cursor-pointer text-[10px] px-1.5 font-bold"
                title="تعطيل عمود الحذف للكل"
              >
                لا
              </button>
            </div>
          </div>

          {/* Column: Print */}
          <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-300">عمود: طباعة</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleColumnAll('print', true)} 
                className="p-1 rounded bg-slate-700 text-white hover:bg-slate-600 cursor-pointer text-[10px] px-1.5 font-bold"
                title="تفعيل عمود الطباعة للكل"
              >
                كل
              </button>
              <button 
                onClick={() => toggleColumnAll('print', false)} 
                className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white cursor-pointer text-[10px] px-1.5 font-bold"
                title="تعطيل عمود الطباعة للكل"
              >
                لا
              </button>
            </div>
          </div>

          {/* Column: Export */}
          <div className="p-2.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-between text-xs">
            <span className="font-bold text-purple-800 dark:text-purple-300">عمود: تصدير</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleColumnAll('export', true)} 
                className="p-1 rounded bg-purple-600 text-white hover:bg-purple-500 cursor-pointer text-[10px] px-1.5 font-bold"
                title="تفعيل عمود التصدير للكل"
              >
                كل
              </button>
              <button 
                onClick={() => toggleColumnAll('export', false)} 
                className="p-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white cursor-pointer text-[10px] px-1.5 font-bold"
                title="تعطيل عمود التصدير للكل"
              >
                لا
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Permissions Matrix Table (Divided by Groups identical to Sidebar) */}
      <div className="space-y-4">
        {SIDEBAR_MODULE_GROUPS.map((group, grpIdx) => {
          const GroupIcon = group.icon;
          const isCollapsed = Boolean(collapsedGroups[group.id]);

          // Calculate statistics for this group
          let totalActive = 0;
          let totalPossible = 0;
          group.pages.forEach(p => {
            const cur = permissionsMatrix[p.id];
            if (p.customActions && p.customActions.length > 0) {
              totalPossible += 1 + p.customActions.length;
              if (cur?.view) totalActive++;
              p.customActions.forEach(ca => {
                if (cur?.[ca.key]) totalActive++;
              });
            } else {
              const activeCols = [
                true, // view
                p.hasAdd !== false,
                p.hasEdit !== false,
                p.hasDelete !== false,
                p.hasPrint !== false,
                p.hasExport !== false
              ].filter(Boolean).length;
              totalPossible += activeCols;
              if (cur) {
                if (cur.view) totalActive++;
                if (p.hasAdd !== false && cur.add) totalActive++;
                if (p.hasEdit !== false && cur.edit) totalActive++;
                if (p.hasDelete !== false && cur.delete) totalActive++;
                if (p.hasPrint !== false && cur.print) totalActive++;
                if (p.hasExport !== false && cur.export) totalActive++;
              }
            }
          });

          return (
            <div 
              key={group.id} 
              className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
            >
              {/* Group Header */}
              <div className="p-4 sm:px-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div 
                  className="flex items-center gap-3 cursor-pointer select-none"
                  onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                >
                  <div className="p-2 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400">
                    <GroupIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{group.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        {group.pages.length} صفحات
                      </span>
                    </h3>
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {totalActive} من {totalPossible} صلاحية مفعلة
                    </div>
                  </div>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>

                {/* Quick group buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleGroupAll(group, true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black hover:bg-emerald-100 cursor-pointer"
                  >
                    تحديد القسم كاملاً
                  </button>
                  <button
                    onClick={() => toggleGroupAll(group, false)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10px] font-black hover:bg-rose-100 cursor-pointer"
                  >
                    تعطيل القسم
                  </button>
                </div>
              </div>

              {/* Group Pages Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3.5 pr-6 font-black w-2/5">اسم الصفحة والشاشة</th>
                        <th className="p-3.5 text-center font-black text-cyan-600 dark:text-cyan-400">
                          <span className="flex items-center justify-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </span>
                        </th>
                        <th className="p-3.5 text-center font-black text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center justify-center gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة</span>
                          </span>
                        </th>
                        <th className="p-3.5 text-center font-black text-amber-600 dark:text-amber-400">
                          <span className="flex items-center justify-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </span>
                        </th>
                        <th className="p-3.5 text-center font-black text-rose-600 dark:text-rose-400">
                          <span className="flex items-center justify-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </span>
                        </th>
                        <th className="p-3.5 text-center font-black text-slate-700 dark:text-slate-300">
                          <span className="flex items-center justify-center gap-1">
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة</span>
                          </span>
                        </th>
                        <th className="p-3.5 text-center font-black text-purple-600 dark:text-purple-400">
                          <span className="flex items-center justify-center gap-1">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>تصدير</span>
                          </span>
                        </th>
                        <th className="p-3.5 text-center font-black text-slate-400 pl-6">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {group.pages.map(page => {
                        const PageIcon = page.icon;
                        const perms = permissionsMatrix[page.id] || {
                          view: false,
                          add: false,
                          edit: false,
                          delete: false,
                          print: false,
                          export: false
                        };

                        const isRowAllActive = () => {
                          if (page.customActions && page.customActions.length > 0) {
                            return Boolean(perms.view && page.customActions.every(ca => perms[ca.key]));
                          }
                          const keysToCheck: (keyof PagePermission)[] = ['view'];
                          if (page.hasAdd !== false) keysToCheck.push('add');
                          if (page.hasEdit !== false) keysToCheck.push('edit');
                          if (page.hasDelete !== false) keysToCheck.push('delete');
                          if (page.hasPrint !== false) keysToCheck.push('print');
                          if (page.hasExport !== false) keysToCheck.push('export');
                          return keysToCheck.every(k => Boolean(perms[k]));
                        };
                        const allChecked = isRowAllActive();

                        return (
                          <tr 
                            key={page.id} 
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              !perms.view ? 'opacity-40 bg-slate-50/30 dark:bg-slate-900/30' : ''
                            }`}
                          >
                            {/* Page Name and Icon */}
                            <td className="p-3.5 pr-6">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${
                                  perms.view 
                                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400' 
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                }`}>
                                  <PageIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-black text-slate-800 dark:text-slate-100 text-xs flex items-center gap-2">
                                    <span>{page.label}</span>
                                    {!perms.view && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
                                        محجوبة
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    ID: {page.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 1. View Checkbox */}
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={perms.view}
                                onChange={() => togglePermission(page.id, 'view')}
                                className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                                title="السماح بعرض ودخول هذه الصفحة"
                              />
                            </td>

                            {/* Custom Actions OR Standard 5 Columns */}
                            {page.customActions && page.customActions.length > 0 ? (
                              <td colSpan={5} className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                  {page.customActions.map(action => {
                                    const ActionIcon = action.icon;
                                    const isChecked = Boolean(perms[action.key]);
                                    return (
                                      <label
                                        key={action.key}
                                        title={action.tooltip}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                          isChecked
                                            ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 shadow-sm'
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 opacity-70 hover:opacity-100'
                                        } ${!perms.view ? 'pointer-events-none opacity-30' : ''}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          disabled={!perms.view}
                                          onChange={() => togglePermission(page.id, action.key)}
                                          className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer disabled:opacity-30"
                                        />
                                        {ActionIcon && <ActionIcon className={`w-3.5 h-3.5 ${action.color || 'text-cyan-500'}`} />}
                                        <span>{action.label}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                            ) : (
                              <>
                                {/* 2. Add Checkbox */}
                                <td className="p-3.5 text-center">
                                  {page.hasAdd !== false ? (
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <input
                                        type="checkbox"
                                        checked={perms.add}
                                        disabled={!perms.view}
                                        onChange={() => togglePermission(page.id, 'add')}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                                        title={page.addLabel ? `السماح بعمل ${page.addLabel}` : "السماح بإضافة عناصر وسجلات جديدة"}
                                      />
                                      {page.addLabel && (
                                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                                          {page.addLabel}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">—</span>
                                  )}
                                </td>

                                {/* 3. Edit Checkbox */}
                                <td className="p-3.5 text-center">
                                  {page.hasEdit !== false ? (
                                    <input
                                      type="checkbox"
                                      checked={perms.edit}
                                      disabled={!perms.view}
                                      onChange={() => togglePermission(page.id, 'edit')}
                                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer disabled:opacity-30"
                                      title="السماح بتعديل السجلات"
                                    />
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">—</span>
                                  )}
                                </td>

                                {/* 4. Delete Checkbox */}
                                <td className="p-3.5 text-center">
                                  {page.hasDelete !== false ? (
                                    <input
                                      type="checkbox"
                                      checked={perms.delete}
                                      disabled={!perms.view}
                                      onChange={() => togglePermission(page.id, 'delete')}
                                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer disabled:opacity-30"
                                      title="السماح بحذف السجلات"
                                    />
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">—</span>
                                  )}
                                </td>

                                {/* 5. Print Checkbox */}
                                <td className="p-3.5 text-center">
                                  {page.hasPrint !== false ? (
                                    <input
                                      type="checkbox"
                                      checked={perms.print}
                                      disabled={!perms.view}
                                      onChange={() => togglePermission(page.id, 'print')}
                                      className="w-4 h-4 text-slate-800 dark:text-slate-300 rounded focus:ring-slate-500 cursor-pointer disabled:opacity-30"
                                      title="السماح بالطباعة"
                                    />
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">—</span>
                                  )}
                                </td>

                                {/* 6. Export Checkbox */}
                                <td className="p-3.5 text-center">
                                  {page.hasExport !== false ? (
                                    <input
                                      type="checkbox"
                                      checked={perms.export}
                                      disabled={!perms.view}
                                      onChange={() => togglePermission(page.id, 'export')}
                                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer disabled:opacity-30"
                                      title="السماح بتصدير البيانات إلى إكسيل و PDF"
                                    />
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-700 text-xs font-mono">—</span>
                                  )}
                                </td>
                              </>
                            )}

                            {/* Row Action: Toggle Row All */}
                            <td className="p-3.5 text-center pl-6">
                              <button
                                onClick={() => toggleRowAll(page.id)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                  allChecked
                                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-cyan-50 hover:text-cyan-600'
                                }`}
                                title={allChecked ? 'إلغاء الكل لهذه الصفحة' : 'تحديد كل صلاحيات هذه الصفحة'}
                              >
                                {allChecked ? 'إلغاء الكل' : 'تحديد الكل'}
                              </button>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar for Fast Saving */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-950/95 text-white px-6 py-3.5 rounded-3xl border border-slate-700 shadow-2xl flex items-center gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300">
            المستخدم: <strong className="text-white">{selectedUser?.full_name}</strong>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات في النظام'}</span>
        </button>
      </div>

    </div>
  );
};
