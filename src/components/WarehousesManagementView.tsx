import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Search, 
  Plus, 
  Boxes, 
  Printer, 
  FileDown, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  MapPin, 
  User, 
  Package, 
  ArrowLeftRight, 
  History, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/swal';

interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  keeper_name: string;
  location: string;
  type: string;
  products_count: number;
  total_pieces: number;
  total_valuation: number;
  created_at: string;
}

interface ProductRecord {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  buy_price: number;
  sell_price: number;
  current_stock: number;
  warehouse: string;
}

interface StockMovementRecord {
  id: string;
  reference_no: string;
  movement_type: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  source_warehouse: string | null;
  target_warehouse: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export const WarehousesManagementView: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseRecord | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  // Product Inspection Modal
  const [selectedWarehouseForProducts, setSelectedWarehouseForProducts] = useState<WarehouseRecord | null>(null);
  const [warehouseProducts, setWarehouseProducts] = useState<ProductRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Stock Movement History Modal for a specific product
  const [selectedProductForMovements, setSelectedProductForMovements] = useState<ProductRecord | null>(null);
  const [productMovements, setProductMovements] = useState<StockMovementRecord[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movFromDate, setMovFromDate] = useState('');
  const [movToDate, setMovToDate] = useState('');
  const [movShortcut, setMovShortcut] = useState<DateShortcut>('ALL');

  // Single Movement Detail / Receipt Modal
  const [inspectingMovement, setInspectingMovement] = useState<StockMovementRecord | null>(null);

  // Fetch warehouses from MySQL
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWarehouses(data.data);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Filtered warehouses
  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.keeper_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Add or Edit Warehouse
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم المخزن');
      return;
    }

    try {
      const payload = {
        id: editingWarehouse ? editingWarehouse.id : undefined,
        code: editingWarehouse ? editingWarehouse.code : undefined,
        name: formData.name.trim(),
        keeper_name: editingWarehouse?.keeper_name || 'أمين المخزن',
        location: editingWarehouse?.location || 'المقر الرئيسي',
        type: editingWarehouse?.type || 'MAIN_STORE'
      };

      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setShowAddEditModal(false);
        setEditingWarehouse(null);
        setFormData({ name: '' });
        showToast(editingWarehouse ? 'تم تحديث بيانات المخزن بنجاح' : 'تمت إضافة المخزن بنجاح');
        await fetchWarehouses();
      } else {
        showError('فشل الحفظ', result.message || 'فشل حفظ المخزن');
      }
    } catch (err: any) {
      showError('خطأ في الاتصال بالخادم', err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (w: WarehouseRecord) => {
    setEditingWarehouse(w);
    setFormData({
      name: w.name
    });
    setShowAddEditModal(true);
  };

  // Delete Warehouse (only if empty)
  const handleDeleteWarehouse = async (w: WarehouseRecord) => {
    if (w.products_count > 0 || w.total_pieces > 0) {
      showWarning(
        'لا يمكن حذف المخزن',
        `لا يمكن حذف المخزن (${w.name}) لأنه يحتوي على ${w.products_count} أصناف بعدد ${w.total_pieces} قطعة. يجب تفريغ المخزن أولاً.`
      );
      return;
    }

    const confirmed = await showConfirm(
      'تأكيد حذف المخزن',
      `هل أنت متأكد من رغبتك في حذف المخزن (${w.name}) نهائياً؟`,
      { isDanger: true, confirmText: 'نعم، حذف المخزن', cancelText: 'إلغاء' }
    );
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/warehouses/${w.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast('تم حذف المخزن بنجاح');
        await fetchWarehouses();
      } else {
        showError('فشل الحذف', result.message || 'فشل حذف المخزن');
      }
    } catch (err: any) {
      showError('خطأ أثناء الحذف', err.message);
    }
  };

  // Open Products Inspection Modal
  const handleOpenProductsModal = async (w: WarehouseRecord) => {
    setSelectedWarehouseForProducts(w);
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const filtered = data.data.filter((p: any) => p.warehouse === w.name || p.warehouse === w.code);
        setWarehouseProducts(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Open Stock Movement Modal for Product
  const fetchMovements = async (productId: string, from = movFromDate, to = movToDate) => {
    setLoadingMovements(true);
    try {
      let url = `/api/stock-movements?productId=${encodeURIComponent(productId)}`;
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let filtered = data.data;
        if (from) filtered = filtered.filter((m: any) => m.created_at.slice(0, 10) >= from);
        if (to) filtered = filtered.filter((m: any) => m.created_at.slice(0, 10) <= to);
        setProductMovements(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleOpenMovementsModal = async (p: ProductRecord) => {
    setSelectedProductForMovements(p);
    setMovFromDate('');
    setMovToDate('');
    setMovShortcut('ALL');
    await fetchMovements(p.id, '', '');
  };

  // Print Movement Voucher
  const handlePrintMovement = (m: StockMovementRecord) => {
    const html = `
      <div style="padding: 10px; font-family: 'Cairo', sans-serif;">
        <div style="border: 2px solid #0891b2; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; color: #0891b2; font-size: 18px;">إشعار حركة مخزنية رسمية</h2>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span><strong>رقم الإذن:</strong> ${m.reference_no}</span>
            <span><strong>تاريخ المعاملة:</strong> ${new Date(m.created_at).toLocaleString('ar-EG')}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span><strong>نوع الحركة:</strong> ${
              m.movement_type === 'IN' ? 'توريد واستلام بضاعة' :
              m.movement_type === 'OUT' ? 'صرف بضاعة / مبيعات' :
              m.movement_type === 'TRANSFER' ? 'تحويل بين المخازن' :
              m.movement_type === 'RETURN' ? 'ارتجاع لمورد' : m.movement_type
            }</span>
            <span><strong>المسؤول:</strong> ${m.created_by}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
          <thead>
            <tr style="background-color: #0891b2; color: #fff;">
              <th style="padding: 8px; border: 1px solid #ccc;">كود الصنف</th>
              <th style="padding: 8px; border: 1px solid #ccc;">اسم المنتج</th>
              <th style="padding: 8px; border: 1px solid #ccc;">الكمية</th>
              <th style="padding: 8px; border: 1px solid #ccc;">سعر الوحدة</th>
              <th style="padding: 8px; border: 1px solid #ccc;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${m.product_id}</td>
              <td style="padding: 8px; border: 1px solid #ccc;">${m.product_name}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">${m.quantity}</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${Number(m.unit_price).toLocaleString()} ج.م</td>
              <td style="padding: 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">${Number(m.total_price).toLocaleString()} ج.م</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 13px; background: #f8fafc; padding: 10px; border-radius: 8px;">
          <div><strong>المخزن المصدر:</strong> ${m.source_warehouse || 'غير محدد (توريد خارجي)'}</div>
          <div><strong>المخزن المستلم:</strong> ${m.target_warehouse || 'غير محدد (صرف خارجي)'}</div>
          <div><strong>ملاحظات وبيان:</strong> ${m.notes || 'لا توجد ملاحظات'}</div>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-around; font-size: 13px;">
          <div>توقيع أمين المخزن: ............................</div>
          <div>توقيع المستلم: ............................</div>
          <div>اعتماد الإدارة: ............................</div>
        </div>
      </div>
    `;
    printTableOrReceipt(`سند حركة مخزنية ${m.reference_no}`, html);
  };

  // Export Main Warehouses Table to Excel
  const handleExportExcel = () => {
    const headers = ['كود المخزن', 'اسم المخزن', 'أمين المخزن', 'موقع المخزن', 'نوع المخزن', 'عدد المنتجات', 'عدد القطع الكلية', 'إجمالي القيمة التقديرية'];
    const rows = filteredWarehouses.map(w => [
      w.code,
      w.name,
      w.keeper_name,
      w.location,
      w.type,
      w.products_count,
      w.total_pieces,
      `${Number(w.total_valuation).toLocaleString()} ج.م`
    ]);
    exportToExcel('تقرير_المخازن_دراجون', headers, rows);
  };

  // Print Main Warehouses Table
  const handlePrintTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #0891b2; color: #fff;">
            <th>كود المخزن</th>
            <th>اسم المخزن</th>
            <th>أمين المخزن</th>
            <th>الموقع</th>
            <th>عدد الأصناف</th>
            <th>إجمالي القطع</th>
            <th>إجمالي التقييم</th>
          </tr>
        </thead>
        <tbody>
          ${filteredWarehouses.map(w => `
            <tr>
              <td style="text-align: center;">${w.code}</td>
              <td><strong>${w.name}</strong></td>
              <td>${w.keeper_name}</td>
              <td>${w.location}</td>
              <td style="text-align: center; font-weight: bold;">${w.products_count}</td>
              <td style="text-align: center; font-weight: bold;">${w.total_pieces}</td>
              <td style="text-align: center;">${Number(w.total_valuation).toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('تقرير جرد وأرصدة المخازن', tableHtml);
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Top Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Warehouse className="w-6 h-6 text-cyan-500" />
            <span>إدارة المخازن والمستودعات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة أرصدة المخازن، حركات التوريد والتحويل، وجرد القطع الفعلي المربوط بقاعدة بيانات MySQL
          </p>
        </div>

        {/* Global Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrintTable}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
            title="طباعة الجدول"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-500" />
            <span>طباعة</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handlePrintTable}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer transition-all"
            title="تصدير بصيغة PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-500" />
            <span>تصدير PDF</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition-all"
            title="تصدير شيت إكسيل منسق"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>تصدير Excel</span>
          </button>

          {/* Add Warehouse Button */}
          <button
            onClick={() => {
              setEditingWarehouse(null);
              setFormData({ name: '' });
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-900/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مخزن جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي عدد المخازن</div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
              {warehouses.length} مخازن
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي كمية القطع المخزنة</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
              {warehouses.reduce((acc, w) => acc + Number(w.total_pieces || 0), 0)} قطعة
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي تقييم بضاعة المخازن</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {warehouses.reduce((acc, w) => acc + Number(w.total_valuation || 0), 0).toLocaleString()} ج.م
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 mr-2 pointer-events-none" />
        <input 
          type="text"
          placeholder="بحث باسم المخزن، الكود، أمين المخزن، أو الموقع..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </button>
        )}
      </div>

      {/* Main Warehouses Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">كود المخزن</th>
                <th className="p-4">اسم المخزن</th>
                <th className="p-4">أمين المخزن والموقع</th>
                <th className="p-4 text-center">عدد المنتجات به</th>
                <th className="p-4 text-center">عدد القطع الكلية</th>
                <th className="p-4 text-center">القيمة التقديرية</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    جاري تحميل بيانات المخازن من قاعدة البيانات MySQL...
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد مخازن مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        {w.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 text-sm">{w.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{w.type}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{w.keeper_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{w.location}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {w.products_count} صنف
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {w.total_pieces} قطعة
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {Number(w.total_valuation || 0).toLocaleString()} ج.م
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* 1. عرض المنتجات بالداخل */}
                        <button
                          onClick={() => handleOpenProductsModal(w)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 cursor-pointer transition-all"
                          title="عرض المنتجات الموجودة بهذا المخزن"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>

                        {/* 2. تعديل اسم المخزن */}
                        <button
                          onClick={() => openEditModal(w)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer transition-all"
                          title="تعديل بيانات المخزن"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {/* 3. حذف المخزن إن كان فارغاً */}
                        <button
                          onClick={() => handleDeleteWarehouse(w)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            w.products_count > 0 || w.total_pieces > 0
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                          }`}
                          title={w.products_count > 0 ? 'لا يمكن حذف مخزن به بضاعة' : 'حذف المخزن'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Add or Edit Warehouse Popup */}
      {/* ========================================================================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-cyan-500" />
                <span>{editingWarehouse ? 'تعديل بيانات المخزن' : 'إضافة مخزن جديد'}</span>
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المخزن:</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: مخزن الفرع الثاني، مخزن الأجهزة..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Warehouse Products Inspection Popup */}
      {/* ========================================================================= */}
      {selectedWarehouseForProducts && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-fadeIn relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-500" />
                  <span>المنتجات الموجودة في: {selectedWarehouseForProducts.name}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  كود المخزن: {selectedWarehouseForProducts.code} • إجمالي الأصناف: {warehouseProducts.length}
                </span>
              </div>
              <button 
                onClick={() => setSelectedWarehouseForProducts(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 scrollbar-thin">
              {loadingProducts ? (
                <div className="p-8 text-center text-slate-400">جاري تحميل المنتجات...</div>
              ) : warehouseProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد منتجات مسجلة في هذا المخزن حالياً.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">الكود</th>
                      <th className="p-3">اسم المنتج</th>
                      <th className="p-3">التصنيف</th>
                      <th className="p-3 text-center">الرصيد المتاح</th>
                      <th className="p-3 text-center">سعر التكلفة</th>
                      <th className="p-3 text-center">سعر البيع</th>
                      <th className="p-3 text-center">حركة المخزون</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {warehouseProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{p.code}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                        <td className="p-3">{p.category}</td>
                        <td className="p-3 text-center font-bold text-purple-600 dark:text-purple-400">
                          {p.current_stock} {p.unit}
                        </td>
                        <td className="p-3 text-center font-mono">{Number(p.buy_price).toLocaleString()} ج.م</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {Number(p.sell_price).toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenMovementsModal(p)}
                            className="flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-all"
                            title="عرض حركات الوارد والمنصرف لهذا المنتج"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>حركة المخزون</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['الكود', 'اسم المنتج', 'التصنيف', 'الرصيد المتاح', 'الوحدة', 'سعر التكلفة', 'سعر البيع'];
                    const rows = warehouseProducts.map(p => [
                      p.code,
                      p.name,
                      p.category,
                      p.current_stock,
                      p.unit,
                      p.buy_price,
                      p.sell_price
                    ]);
                    exportToExcel(`منتجات_مخزن_${selectedWarehouseForProducts.name}`, headers, rows);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
                  title="تصدير إكسيل"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>تصدير Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = `
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #0891b2; color: #fff;">
                            <th>الكود</th>
                            <th>اسم المنتج</th>
                            <th>التصنيف</th>
                            <th>الرصيد المتاح</th>
                            <th>سعر التكلفة</th>
                            <th>سعر البيع</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${warehouseProducts.map(p => `
                            <tr>
                              <td style="text-align: center;">${p.code}</td>
                              <td><strong>${p.name}</strong></td>
                              <td>${p.category}</td>
                              <td style="text-align: center; font-weight: bold;">${p.current_stock} ${p.unit}</td>
                              <td style="text-align: center;">${Number(p.buy_price).toLocaleString()} ج.م</td>
                              <td style="text-align: center; font-weight: bold;">${Number(p.sell_price).toLocaleString()} ج.م</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    exportToPDF(`تقرير أصناف مخزن - ${selectedWarehouseForProducts.name}`, tableHtml);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer transition-colors"
                  title="تصدير PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>تصدير PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = `
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #0891b2; color: #fff;">
                            <th>الكود</th>
                            <th>اسم المنتج</th>
                            <th>التصنيف</th>
                            <th>الرصيد المتاح</th>
                            <th>سعر التكلفة</th>
                            <th>سعر البيع</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${warehouseProducts.map(p => `
                            <tr>
                              <td style="text-align: center;">${p.code}</td>
                              <td><strong>${p.name}</strong></td>
                              <td>${p.category}</td>
                              <td style="text-align: center; font-weight: bold;">${p.current_stock} ${p.unit}</td>
                              <td style="text-align: center;">${Number(p.buy_price).toLocaleString()} ج.م</td>
                              <td style="text-align: center; font-weight: bold;">${Number(p.sell_price).toLocaleString()} ج.م</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    printTableOrReceipt(`أصناف مخزن: ${selectedWarehouseForProducts.name}`, tableHtml);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="طباعة"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedWarehouseForProducts(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Product Stock Movements Popup */}
      {/* ========================================================================= */}
      {selectedProductForMovements && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-fadeIn relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  <span>حركة المخزون للمنتج: {selectedProductForMovements.name}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  كود: {selectedProductForMovements.code} • الرصيد الحالي: {selectedProductForMovements.current_stock} قطعة
                </span>
              </div>
              <button 
                onClick={() => setSelectedProductForMovements(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Filter Bar for Stock Movements */}
            <div className="my-3 shrink-0">
              <DateFilterBar
                fromDate={movFromDate}
                toDate={movToDate}
                onFromDateChange={(d) => {
                  setMovFromDate(d);
                  fetchMovements(selectedProductForMovements.id, d, movToDate);
                }}
                onToDateChange={(d) => {
                  setMovToDate(d);
                  fetchMovements(selectedProductForMovements.id, movFromDate, d);
                }}
                activeShortcut={movShortcut}
                onShortcutSelect={setMovShortcut}
                onReset={() => fetchMovements(selectedProductForMovements.id, '', '')}
                label="فلترة حركات المخزون:"
              />
            </div>

            <div className="flex-1 overflow-y-auto my-4 scrollbar-thin">
              {loadingMovements ? (
                <div className="p-8 text-center text-slate-400">جاري تحميل سجل الحركات...</div>
              ) : productMovements.length === 0 ? (
                <div className="p-8 text-center text-slate-400">لا توجد حركات مخزنية مسجلة لهذا المنتج بعد.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">رقم الإذن</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-center">سعر الوحدة</th>
                      <th className="p-3">المخزن المعني</th>
                      <th className="p-3 text-center">التاريخ</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {productMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">{m.reference_no}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.movement_type === 'IN' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                            m.movement_type === 'OUT' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' :
                            'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          }`}>
                            {m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">{m.quantity}</td>
                        <td className="p-3 text-center font-mono">{Number(m.unit_price).toLocaleString()} ج.م</td>
                        <td className="p-3 text-[11px]">{m.target_warehouse || m.source_warehouse || 'المخزن الرئيسي'}</td>
                        <td className="p-3 text-center text-[10px] text-slate-500">
                          {new Date(m.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* زر عرض المعاملة */}
                            <button
                              onClick={() => setInspectingMovement(m)}
                              className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/40"
                              title="عرض تفاصيل المعاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {/* زر طباعة المعاملة */}
                            <button
                              onClick={() => handlePrintMovement(m)}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                              title="طباعة إذن المعاملة"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['رقم الإذن', 'نوع الحركة', 'الكمية', 'سعر الوحدة', 'المخزن المعني', 'التاريخ'];
                    const rows = productMovements.map(m => [
                      m.reference_no,
                      m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني',
                      m.quantity,
                      m.unit_price,
                      m.target_warehouse || m.source_warehouse || 'المخزن الرئيسي',
                      new Date(m.created_at).toLocaleDateString('ar-EG')
                    ]);
                    exportToExcel(`حركات_مخزون_${selectedProductForMovements.name}`, headers, rows);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
                  title="تصدير إكسيل"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>تصدير Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = `
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #0891b2; color: #fff;">
                            <th>رقم الإذن</th>
                            <th>نوع الحركة</th>
                            <th>الكمية</th>
                            <th>سعر الوحدة</th>
                            <th>المخزن المعني</th>
                            <th>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productMovements.map(m => `
                            <tr>
                              <td style="text-align: center;">${m.reference_no}</td>
                              <td style="text-align: center;">${m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني'}</td>
                              <td style="text-align: center; font-weight: bold;">${m.quantity}</td>
                              <td style="text-align: center;">${Number(m.unit_price).toLocaleString()} ج.م</td>
                              <td>${m.target_warehouse || m.source_warehouse || 'المخزن الرئيسي'}</td>
                              <td style="text-align: center;">${new Date(m.created_at).toLocaleDateString('ar-EG')}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    exportToPDF(`حركات مخزون للصنف - ${selectedProductForMovements.name}`, tableHtml);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer transition-colors"
                  title="تصدير PDF"
                >
                  <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>تصدير PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = `
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #0891b2; color: #fff;">
                            <th>رقم الإذن</th>
                            <th>نوع الحركة</th>
                            <th>الكمية</th>
                            <th>سعر الوحدة</th>
                            <th>المخزن المعني</th>
                            <th>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productMovements.map(m => `
                            <tr>
                              <td style="text-align: center;">${m.reference_no}</td>
                              <td style="text-align: center;">${m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني'}</td>
                              <td style="text-align: center; font-weight: bold;">${m.quantity}</td>
                              <td style="text-align: center;">${Number(m.unit_price).toLocaleString()} ج.م</td>
                              <td>${m.target_warehouse || m.source_warehouse || 'المخزن الرئيسي'}</td>
                              <td style="text-align: center;">${new Date(m.created_at).toLocaleDateString('ar-EG')}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    `;
                    printTableOrReceipt(`سجل حركات مخزون: ${selectedProductForMovements.name}`, tableHtml);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
                  title="طباعة"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedProductForMovements(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Single Movement Inspector & Receipt */}
      {/* ========================================================================= */}
      {inspectingMovement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>تفاصيل إذن الحركة: {inspectingMovement.reference_no}</span>
              </h3>
              <button onClick={() => setInspectingMovement(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المنتج:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{inspectingMovement.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">نوع الحركة:</span>
                  <span className="font-bold text-cyan-500">{inspectingMovement.movement_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الكمية المسجلة:</span>
                  <span className="font-black text-purple-500">{inspectingMovement.quantity} قطعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">سعر الوحدة:</span>
                  <span className="font-mono">{Number(inspectingMovement.unit_price).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold">
                  <span className="text-slate-500">الإجمالي:</span>
                  <span className="text-emerald-500 font-mono">{Number(inspectingMovement.total_price).toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div><strong>المخزن المصدر:</strong> {inspectingMovement.source_warehouse || '—'}</div>
                <div><strong>المخزن المستهدف:</strong> {inspectingMovement.target_warehouse || '—'}</div>
                <div><strong>المسؤول:</strong> {inspectingMovement.created_by}</div>
                <div><strong>التاريخ:</strong> {new Date(inspectingMovement.created_at).toLocaleString('ar-EG')}</div>
                {inspectingMovement.notes && <div><strong>ملاحظات:</strong> {inspectingMovement.notes}</div>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintMovement(inspectingMovement)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => {
                    const html = `
                      <div style="padding: 10px; font-family: 'Cairo', sans-serif;">
                        <h2 style="color: #0891b2;">إشعار حركة مخزنية ${inspectingMovement.reference_no}</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">رقم الإذن</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.reference_no}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">المنتج</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.product_name}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">نوع الحركة</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.movement_type}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">الكمية</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.quantity}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">سعر الوحدة</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.unit_price} ج.م</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">الإجمالي</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.total_price} ج.م</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">المخزن المصدر</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.source_warehouse || '—'}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">المخزن المستهدف</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.target_warehouse || '—'}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">المسؤول</th><td style="padding:6px;border:1px solid #ccc;">${inspectingMovement.created_by}</td></tr>
                          <tr><th style="padding:6px;border:1px solid #ccc;text-align:right;">التاريخ</th><td style="padding:6px;border:1px solid #ccc;">${new Date(inspectingMovement.created_at).toLocaleString('ar-EG')}</td></tr>
                        </table>
                      </div>
                    `;
                    exportToPDF(`إذن_حركة_${inspectingMovement.reference_no}`, html);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => {
                    const headers = ['رقم الإذن', 'المنتج', 'نوع الحركة', 'الكمية', 'سعر الوحدة', 'الإجمالي', 'المخزن المصدر', 'المخزن المستهدف', 'المسؤول', 'التاريخ'];
                    const rows = [[
                      inspectingMovement.reference_no,
                      inspectingMovement.product_name,
                      inspectingMovement.movement_type,
                      inspectingMovement.quantity,
                      inspectingMovement.unit_price,
                      inspectingMovement.total_price,
                      inspectingMovement.source_warehouse || '—',
                      inspectingMovement.target_warehouse || '—',
                      inspectingMovement.created_by,
                      new Date(inspectingMovement.created_at).toLocaleString('ar-EG')
                    ]];
                    exportToExcel(`إذن_حركة_${inspectingMovement.reference_no}`, headers, rows);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
              <button
                onClick={() => setInspectingMovement(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
