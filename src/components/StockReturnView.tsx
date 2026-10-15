import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  Trash2,
  Search,
  Printer,
  FileSpreadsheet,
  FileDown,
  Warehouse,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  X,
  Eye
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';

interface Supplier {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  balance?: number;
}

interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  buy_price: number;
  sell_price: number;
  current_stock: number;
  warehouse: string;
}

interface ReturnItem {
  id: string; // temporary line id
  productId: string;
  code: string;
  name: string;
  currentStock: number;
  unit: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface MovementRecord {
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

export const StockReturnView: React.FC = () => {
  // Master data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // History & loading
  const [history, setHistory] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Return voucher modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [returnRefNo, setReturnRefNo] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Items to return
  const [items, setItems] = useState<ReturnItem[]>([]);

  // History filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateShortcut, setDateShortcut] = useState<DateShortcut>('ALL');

  // Detail inspection modal
  const [selectedBatchRef, setSelectedBatchRef] = useState<string | null>(null);

  // Load master data
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [suppRes, wareRes, prodRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/warehouses'),
        fetch('/api/products')
      ]);

      const [suppData, wareData, prodData] = await Promise.all([
        suppRes.json(),
        wareRes.json(),
        prodRes.json()
      ]);

      if (suppData.success) setSuppliers(suppData.data || []);
      if (wareData.success) {
        setWarehouses(wareData.data || []);
        if (wareData.data?.length > 0 && !sourceWarehouse) {
          setSourceWarehouse(wareData.data[0].name);
        }
      }
      if (prodData.success) setProducts(prodData.data || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load return movements
  const loadHistory = async () => {
    try {
      let url = '/api/stock-movements?movementType=RETURN';
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      if (filterWarehouse !== 'ALL') url += `&warehouse=${encodeURIComponent(filterWarehouse)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [fromDate, toDate, filterWarehouse]);

  // Open modal
  const openNewReturnModal = () => {
    const defaultWh = warehouses.length > 0 ? warehouses[0].name : 'مخزن المتجر الرئيسي';
    setSourceWarehouse(defaultWh);
    setSelectedSupplierId('');
    setReturnRefNo(`RET-${Date.now().toString().slice(-6)}`);
    setGeneralNotes('');
    setItems([
      {
        id: `ret-item-${Date.now()}-1`,
        productId: '',
        code: '',
        name: '',
        currentStock: 0,
        unit: 'قطعة',
        quantity: 1,
        unitPrice: 0,
        notes: ''
      }
    ]);
    setShowOrderModal(true);
  };

  // Add line
  const addNewItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: `ret-item-${Date.now()}-${prev.length + 1}`,
        productId: '',
        code: '',
        name: '',
        currentStock: 0,
        unit: 'قطعة',
        quantity: 1,
        unitPrice: 0,
        notes: ''
      }
    ]);
  };

  // Update item field
  const updateItem = (id: string, field: keyof ReturnItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated.productId = prod.id;
          updated.code = prod.code;
          updated.name = prod.name;
          updated.currentStock = Number(prod.current_stock || 0);
          updated.unit = prod.unit;
          updated.unitPrice = Number(prod.buy_price || 0);
          updated.quantity = 1;
        }
      }

      return updated;
    }));
  };

  // Remove line
  const removeItemRow = (id: string) => {
    if (items.length <= 1) {
      alert('يجب أن يحتوي إذن الارتجاع على صنف واحد على الأقل');
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);

  // Submit batch return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceWarehouse) {
      alert('يرجى اختيار مخزن خروج المرتجع');
      return;
    }

    if (items.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل');
      return;
    }

    // Validation
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        alert(`يرجى تحديد المنتج في السطر رقم (${i + 1})`);
        return;
      }
      const qty = Number(it.quantity) || 0;
      if (qty <= 0) {
        alert(`يرجى إدخال كمية صحيحة في السطر رقم (${i + 1})`);
        return;
      }
      if (qty > it.currentStock) {
        alert(`الكمية المطلوبة للارتجاع في السطر رقم (${i + 1}) تتجاوز الرصيد الحالي المتاح (${it.currentStock}) للمنتج: ${it.name}`);
        return;
      }
    }

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

    const payload = {
      movement_type: 'RETURN',
      reference_no: returnRefNo || `RET-${Date.now().toString().slice(-6)}`,
      supplier_id: selectedSupplierId || null,
      supplier_name: selectedSupplier ? (selectedSupplier.company ? `${selectedSupplier.name} (${selectedSupplier.company})` : selectedSupplier.name) : null,
      source_warehouse: sourceWarehouse,
      notes: generalNotes,
      created_by: 'المدير العام',
      items: items.map(it => ({
        product_id: it.productId,
        product_name: it.name,
        code: it.code,
        quantity: Number(it.quantity),
        unit_price: Number(it.unitPrice),
        total_price: Number(it.quantity) * Number(it.unitPrice),
        notes: it.notes
      }))
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/stock-movements/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(`تم تسجيل إذن ارتجاع البضاعة بنجاح برقم إذن: ${data.reference_no}`);
        setShowOrderModal(false);
        await Promise.all([loadMasterData(), loadHistory()]);
      } else {
        alert(data.message || 'حدث خطأ أثناء حفظ حركة الارتجاع');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال بالخادم: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Grouped history by reference_no
  const groupedBatches = useMemo(() => {
    const groups: { [ref: string]: MovementRecord[] } = {};
    history.forEach(m => {
      if (!groups[m.reference_no]) groups[m.reference_no] = [];
      groups[m.reference_no].push(m);
    });
    return Object.entries(groups).map(([ref, items]) => {
      const first = items[0];
      const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
      const totalVal = items.reduce((s, it) => s + Number(it.total_price || 0), 0);
      return {
        ref,
        date: first.created_at,
        source_warehouse: first.source_warehouse,
        notes: first.notes,
        created_by: first.created_by,
        itemsCount: items.length,
        totalQty,
        totalVal,
        items
      };
    });
  }, [history]);

  // Filtered grouped batches
  const filteredBatches = groupedBatches.filter(b => {
    const matchSearch =
      b.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.items.some(it => it.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  const activeBatch = groupedBatches.find(b => b.ref === selectedBatchRef);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <ArrowUpRight className="w-6 h-6" />
            <span>ارتجاع بضائع إلى مورد</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إخراج وتسليم مرتجعات البضائع للموردين وتخفيض أرصدتها من المخازن المختارة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openNewReturnModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إذن ارتجاع بضاعة جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الإذن، اسم المنتج، المورد، أو الملاحظات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Warehouse className="w-4 h-4 text-slate-400" />
            <select
              value={filterWarehouse}
              onChange={e => setFilterWarehouse(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">جميع المخازن المصدر</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DateFilterBar
          activeShortcut={dateShortcut}
          fromDate={fromDate}
          toDate={toDate}
          onShortcutSelect={setDateShortcut}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
        />
      </div>

      {/* Main Table: Batches Returned */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 font-black text-xs text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>سجل أذونات ارتجاع البضائع للموردين ({filteredBatches.length} إذن)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const headers = ['رقم الإذن', 'التاريخ', 'المخزن المصدر', 'عدد الأصناف', 'إجمالي القطع', 'القيمة الإجمالية', 'الملاحظات'];
                const rows = filteredBatches.map(b => [
                  b.ref,
                  new Date(b.date).toLocaleDateString('ar-EG'),
                  b.source_warehouse || '—',
                  b.itemsCount,
                  b.totalQty,
                  b.totalVal,
                  b.notes || ''
                ]);
                exportToExcel('سجل_ارتجاع_بضائع_موردين', headers, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={() => {
                const tableHtml = `
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #d97706; color: #fff;">
                        <th>رقم الإذن</th>
                        <th>التاريخ</th>
                        <th>المخزن المصدر</th>
                        <th>عدد الأصناف</th>
                        <th>إجمالي القطع</th>
                        <th>القيمة الإجمالية</th>
                        <th>البيان</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredBatches.map(b => `
                        <tr>
                          <td style="text-align: center; font-weight: bold;">${b.ref}</td>
                          <td style="text-align: center;">${new Date(b.date).toLocaleDateString('ar-EG')}</td>
                          <td>${b.source_warehouse || '—'}</td>
                          <td style="text-align: center;">${b.itemsCount} صنف</td>
                          <td style="text-align: center; font-weight: bold;">${b.totalQty}</td>
                          <td style="text-align: center; color: #d97706; font-weight: bold;">${Number(b.totalVal).toLocaleString()} ج.م</td>
                          <td>${b.notes || ''}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `;
                printTableOrReceipt('تقرير أذونات ارتجاع البضائع للموردين', tableHtml);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السجل</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">رقم الإذن</th>
                <th className="p-4">تاريخ الارتجاع</th>
                <th className="p-4">المخزن المصدر</th>
                <th className="p-4 text-center">عدد الأصناف</th>
                <th className="p-4 text-center">إجمالي الكميات</th>
                <th className="p-4 text-center">إجمالي القيمة</th>
                <th className="p-4">البيان / المورد</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد أذونات ارتجاع مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredBatches.map(b => (
                  <tr key={b.ref} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-black text-amber-600 dark:text-amber-400">
                      {b.ref}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(b.date).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {b.source_warehouse || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {b.itemsCount} صنف
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-purple-600 dark:text-purple-400">
                      {b.totalQty} قطعة
                    </td>
                    <td className="p-4 text-center font-mono font-black text-rose-600 dark:text-rose-400">
                      {Number(b.totalVal).toLocaleString()} ج.م
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-500" title={b.notes || ''}>
                      {b.notes || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedBatchRef(b.ref)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                        title="عرض تفاصيل الأصناف المرتجعة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض الأصناف</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Create New Stock Return Voucher (Multiple Products) */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl animate-fadeIn relative my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-amber-500" />
                  <span>إذن ارتجاع بضاعة إلى مورد (متعدد الأصناف)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدد المورد والمخزن المصدر والأصناف والكميات المراد ارتجاعها (مع التحقق الفوري من توفر الرصيد)
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReturn} className="flex flex-col flex-1 overflow-hidden mt-4">
              {/* General Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shrink-0 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    المورد المرتجع إليه: *
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- اختر المورد --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.company ? `(${s.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    مخزن خروج المرتجع: *
                  </label>
                  <select
                    required
                    value={sourceWarehouse}
                    onChange={e => setSourceWarehouse(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    رقم إذن الارتجاع:
                  </label>
                  <input
                    type="text"
                    required
                    value={returnRefNo}
                    onChange={e => setReturnRefNo(e.target.value)}
                    placeholder="RET-XXXXX"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    سبب الارتجاع / ملاحظات:
                  </label>
                  <input
                    type="text"
                    value={generalNotes}
                    onChange={e => setGeneralNotes(e.target.value)}
                    placeholder="تالف، غير مطابق للمواصفات، فائض..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Items Table Area */}
              <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">اسم المنتج المراد إرجاعه</th>
                      <th className="p-3 w-28 text-center">الرصيد المتاح</th>
                      <th className="p-3 w-28 text-center">الكمية المرتجعة</th>
                      <th className="p-3 w-28 text-center">سعر الوحدة</th>
                      <th className="p-3 w-28 text-center">الإجمالي</th>
                      <th className="p-3">سبب ارتجاع الصنف</th>
                      <th className="p-3 w-12 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it, idx) => {
                      const isOverStock = it.productId && it.quantity > it.currentStock;

                      return (
                        <tr key={it.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isOverStock ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                          <td className="p-3 text-center text-slate-400 font-bold">
                            {idx + 1}
                          </td>

                          {/* Product Select */}
                          <td className="p-3">
                            <select
                              required
                              value={it.productId}
                              onChange={e => updateItem(it.id, 'productId', e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- اختر المنتج من الكتالوج --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (الكود: {p.code} - الرصيد: {p.current_stock} {p.unit})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Available Current Stock */}
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              it.currentStock <= 0 
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {it.currentStock} {it.unit}
                            </span>
                          </td>

                          {/* Return Quantity */}
                          <td className="p-3">
                            <input
                              type="number"
                              min="1"
                              max={it.currentStock || undefined}
                              step="1"
                              required
                              value={it.quantity}
                              onChange={e => updateItem(it.id, 'quantity', Number(e.target.value))}
                              className={`w-full bg-white dark:bg-slate-900 border rounded-lg p-1.5 text-center font-black text-xs focus:outline-none ${
                                isOverStock
                                  ? 'border-rose-500 text-rose-600 bg-rose-50'
                                  : 'border-slate-200 dark:border-slate-700 text-amber-600 focus:border-amber-500'
                              }`}
                            />
                            {isOverStock && (
                              <span className="text-[10px] text-rose-500 font-bold block text-center mt-0.5">
                                يتجاوز المتاح!
                              </span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.unitPrice}
                              onChange={e => updateItem(it.id, 'unitPrice', Number(e.target.value))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center font-mono font-bold text-xs focus:outline-none"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="p-3 text-center font-mono font-black text-rose-600 dark:text-rose-400">
                            {(Number(it.quantity || 0) * Number(it.unitPrice || 0)).toLocaleString()} ج.م
                          </td>

                          {/* Item Note */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={it.notes}
                              onChange={e => updateItem(it.id, 'notes', e.target.value)}
                              placeholder="سبب الارتجاع..."
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
                            />
                          </td>

                          {/* Remove */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(it.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="حذف هذا السطر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons to Add Rows */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addNewItemRow}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صنف آخر للإرجاع</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 ml-1">إجمالي القطع المرتجعة:</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">{totalQuantity}</span>
                  </div>
                  <div className="border-r border-slate-300 dark:border-slate-700 pr-4">
                    <span className="text-slate-500 ml-1">إجمالي قيمة المرتجع:</span>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400">{totalAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Footer Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 cursor-pointer transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ تسجيل الارتجاع...' : 'تأكيد وحفظ إذن الارتجاع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: View Batch Items Details */}
      {/* ========================================================================= */}
      {activeBatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-fadeIn relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span>تفاصيل إذن ارتجاع بضاعة: {activeBatch.ref}</span>
                </h3>
                <span className="text-xs text-slate-500 mt-0.5">
                  المخزن المصدر: {activeBatch.source_warehouse} • التاريخ: {new Date(activeBatch.date).toLocaleString('ar-EG')}
                </span>
              </div>
              <button onClick={() => setSelectedBatchRef(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم المنتج</th>
                    <th className="p-3 text-center">الكمية المرتجعة</th>
                    <th className="p-3 text-center">سعر الوحدة</th>
                    <th className="p-3 text-center">الإجمالي</th>
                    <th className="p-3">ملاحظات وسبب الارتجاع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeBatch.items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{it.product_name}</td>
                      <td className="p-3 text-center font-black text-purple-600 dark:text-purple-400">{it.quantity}</td>
                      <td className="p-3 text-center font-mono">{Number(it.unit_price).toLocaleString()} ج.م</td>
                      <td className="p-3 text-center font-mono font-black text-rose-600 dark:text-rose-400">
                        {Number(it.total_price).toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-slate-500">{it.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tableHtml = `
                      <div style="font-family: 'Cairo', sans-serif; padding: 15px;">
                        <h2 style="color: #d97706; margin-bottom: 5px;">إذن ارتجاع بضاعة إلى مورد</h2>
                        <p>رقم الإذن: <strong>${activeBatch.ref}</strong> | المخزن المصدر: <strong>${activeBatch.source_warehouse}</strong></p>
                        <p>التاريخ: ${new Date(activeBatch.date).toLocaleString('ar-EG')}</p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                          <thead>
                            <tr style="background-color: #d97706; color: #fff;">
                              <th style="padding: 6px; border: 1px solid #ccc;">#</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">اسم الصنف</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">الكمية المرتجعة</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">سعر الوحدة</th>
                              <th style="padding: 6px; border: 1px solid #ccc;">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${activeBatch.items.map((it, idx) => `
                              <tr>
                                <td style="text-align: center; padding: 6px; border: 1px solid #ccc;">${idx + 1}</td>
                                <td style="padding: 6px; border: 1px solid #ccc;">${it.product_name}</td>
                                <td style="text-align: center; padding: 6px; border: 1px solid #ccc; font-weight: bold;">${it.quantity}</td>
                                <td style="text-align: center; padding: 6px; border: 1px solid #ccc;">${it.unit_price} ج.م</td>
                                <td style="text-align: center; padding: 6px; border: 1px solid #ccc; font-weight: bold; color: #dc2626;">${it.total_price} ج.م</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                        <div style="margin-top: 15px; font-weight: bold; text-align: left;">
                          إجمالي قيمة المرتجع: ${Number(activeBatch.totalVal).toLocaleString()} ج.م
                        </div>
                      </div>
                    `;
                    printTableOrReceipt(`إذن_ارتجاع_${activeBatch.ref}`, tableHtml);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة إذن الارتجاع</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedBatchRef(null)}
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
