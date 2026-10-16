import React, { useState, useEffect, useMemo } from 'react';
import { systemAuthStore, hasPermission, getUserWarehouse } from '../store/systemAuthStore';
import {
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Printer,
  FileSpreadsheet,
  FileDown,
  Warehouse,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Package,
  X,
  Eye
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { DateFilterBar, DateShortcut } from './DateFilterBar';
import { SearchableSelect } from './SearchableSelect';

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

interface TransferItem {
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

export const StockTransferView: React.FC = () => {
  const currentUser = systemAuthStore.currentUser;
  const userWarehouse = getUserWarehouse(currentUser);
  const isRestrictedWarehouse = currentUser?.role !== 'SUPER_ADMIN' && Boolean(userWarehouse) && userWarehouse !== 'ALL';

  const canAdd = hasPermission(currentUser, 'stock_transfer', 'add');
  const canPrint = hasPermission(currentUser, 'stock_transfer', 'print');
  const canExport = hasPermission(currentUser, 'stock_transfer', 'export');

  // Master data
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // History & loading
  const [history, setHistory] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Transfer voucher modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [sourceWarehouse, setSourceWarehouse] = useState<string>(isRestrictedWarehouse ? userWarehouse : '');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [transferRefNo, setTransferRefNo] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Items to transfer
  const [items, setItems] = useState<TransferItem[]>([]);

  // History filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>(isRestrictedWarehouse ? userWarehouse : 'ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateShortcut, setDateShortcut] = useState<DateShortcut>('ALL');

  // Detail inspection modal
  const [selectedBatchRef, setSelectedBatchRef] = useState<string | null>(null);

  // Load master data
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [wareRes, prodRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/products')
      ]);

      const [wareData, prodData] = await Promise.all([
        wareRes.json(),
        prodRes.json()
      ]);

      if (wareData.success) {
        const whs: WarehouseRecord[] = wareData.data || [];
        setWarehouses(whs);
        if (isRestrictedWarehouse) {
          setSourceWarehouse(userWarehouse);
          const other = whs.find(w => w.name !== userWarehouse);
          if (other) setTargetWarehouse(other.name);
        } else {
          if (whs.length >= 2) {
            if (!sourceWarehouse) setSourceWarehouse(whs[0].name);
            if (!targetWarehouse) setTargetWarehouse(whs[1].name);
          } else if (whs.length === 1) {
            if (!sourceWarehouse) setSourceWarehouse(whs[0].name);
          }
        }
      }
      if (prodData.success) setProducts(prodData.data || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load transfer movements
  const loadHistory = async () => {
    try {
      let url = '/api/stock-movements?movementType=TRANSFER';
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
  const openNewTransferModal = () => {
    if (!canAdd) {
      alert('ليس لديك صلاحية إنشاء إذن نقل وتحويل مخزني جديد');
      return;
    }
    if (warehouses.length < 2) {
      alert('يجب أن يتوفر على الأقل مخزنان في النظام لإتمام عملية النقل والتحويل بين المخازن');
    }
    const src = isRestrictedWarehouse ? userWarehouse : (warehouses.length > 0 ? warehouses[0].name : '');
    const otherWh = warehouses.find(w => w.name !== src);
    const tgt = otherWh ? otherWh.name : '';
    setSourceWarehouse(src);
    setTargetWarehouse(tgt);
    setTransferRefNo(`TRF-${Date.now().toString().slice(-6)}`);
    setGeneralNotes('');
    setItems([
      {
        id: `trf-item-${Date.now()}-1`,
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

  // Add row
  const addNewItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: `trf-item-${Date.now()}-${prev.length + 1}`,
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

  // Update item
  const updateItem = (id: string, field: keyof TransferItem, value: any) => {
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
      alert('يجب أن يحتوي إذن التحويل على صنف واحد على الأقل');
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);

  // Submit transfer
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceWarehouse || !targetWarehouse) {
      alert('يرجى تحديد كل من المخزن المصدر والمخزن المستهدف');
      return;
    }

    if (sourceWarehouse === targetWarehouse) {
      alert('لا يمكن أن يكون المخزن المصدر هو نفسه المخزن المستهدف! يرجى اختيار مخزنين مختلفين');
      return;
    }

    if (items.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل للنقل');
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
        alert(`الكمية المراد نقلها في السطر رقم (${i + 1}) تتجاوز الرصيد الحالي المتاح (${it.currentStock}) للمنتج: ${it.name}`);
        return;
      }
    }

    const payload = {
      movement_type: 'TRANSFER',
      reference_no: transferRefNo || `TRF-${Date.now().toString().slice(-6)}`,
      source_warehouse: sourceWarehouse,
      target_warehouse: targetWarehouse,
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
        alert(`تم تنفيذ إذن نقل البضائع بنجاح برقم: ${data.reference_no}`);
        setShowOrderModal(false);
        await Promise.all([loadMasterData(), loadHistory()]);
      } else {
        alert(data.message || 'حدث خطأ أثناء نقل البضائع');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال بالخادم: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Grouped history
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
        target_warehouse: first.target_warehouse,
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
          <h2 className="text-xl font-black flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
            <RefreshCw className="w-6 h-6" />
            <span>نقل بضائع من مخزن إلى آخر</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إجراء المناقلات والتحويلات المخزنية بين المستودعات والفروع (إمكانية نقل أصناف متعددة بكميات مختلفة في نفس الإذن)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canAdd && (
            <button
              onClick={openNewTransferModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إذن نقل وتحويل مخزني جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الإذن، اسم المنتج، أو الملاحظات..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Warehouse className="w-4 h-4 text-slate-400" />
            <SearchableSelect
              value={filterWarehouse}
              onChange={e => setFilterWarehouse(e.target.value)}
              disabled={isRestrictedWarehouse}
              className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 ${
                isRestrictedWarehouse ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
              }`}
              searchPlaceholder="ابحث عن مخزن..."
              minWidth="min-w-[180px]"
            >
              {!isRestrictedWarehouse && <option value="ALL">جميع المخازن (المصدر أو المستهدف)</option>}
              {warehouses.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </SearchableSelect>
            {isRestrictedWarehouse && (
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg font-bold shrink-0">
                مخزنك المحدد
              </span>
            )}
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

      {/* Main Table: Batches Transferred */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 font-black text-xs text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>سجل أذونات النقل والتحويل المخزني ({filteredBatches.length} إذن)</span>
          </div>

          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={() => {
                  const headers = ['رقم الإذن', 'التاريخ', 'من مخزن', 'إلى مخزن', 'عدد الأصناف', 'إجمالي القطع', 'القيمة التقديرية', 'البيان'];
                  const rows = filteredBatches.map(b => [
                    b.ref,
                    new Date(b.date).toLocaleDateString('ar-EG'),
                    b.source_warehouse || '—',
                    b.target_warehouse || '—',
                    b.itemsCount,
                    b.totalQty,
                    b.totalVal,
                    b.notes || ''
                  ]);
                  exportToExcel('سجل_مناقلات_المخازن', headers, rows);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
            )}
            {canPrint && (
              <button
                onClick={() => {
                  const tableHtml = `
                    <table style="width: 100%; border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #2563eb; color: #fff;">
                          <th>رقم الإذن</th>
                          <th>التاريخ</th>
                          <th>من مخزن</th>
                          <th>إلى مخزن</th>
                          <th>عدد الأصناف</th>
                          <th>إجمالي القطع</th>
                          <th>القيمة</th>
                          <th>البيان</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${filteredBatches.map(b => `
                          <tr>
                            <td style="text-align: center; font-weight: bold;">${b.ref}</td>
                            <td style="text-align: center;">${new Date(b.date).toLocaleDateString('ar-EG')}</td>
                            <td>${b.source_warehouse || '—'}</td>
                            <td>${b.target_warehouse || '—'}</td>
                            <td style="text-align: center;">${b.itemsCount} صنف</td>
                            <td style="text-align: center; font-weight: bold;">${b.totalQty}</td>
                            <td style="text-align: center; color: #2563eb; font-weight: bold;">${Number(b.totalVal).toLocaleString()} ج.م</td>
                            <td>${b.notes || ''}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  `;
                  printTableOrReceipt('تقرير أذونات النقل والتحويل بين المخازن', tableHtml);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السجل</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">رقم الإذن</th>
                <th className="p-4">تاريخ التحويل</th>
                <th className="p-4">من مخزن (المصدر)</th>
                <th className="p-4">إلى مخزن (المستهدف)</th>
                <th className="p-4 text-center">عدد الأصناف</th>
                <th className="p-4 text-center">إجمالي الكميات</th>
                <th className="p-4 text-center">القيمة التقديرية</th>
                <th className="p-4">الملاحظات</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لا توجد أذونات تحويل مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredBatches.map(b => (
                  <tr key={b.ref} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-black text-blue-600 dark:text-blue-400">
                      {b.ref}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(b.date).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {b.source_warehouse || '—'}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {b.target_warehouse || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {b.itemsCount} صنف
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-purple-600 dark:text-purple-400">
                      {b.totalQty} قطعة
                    </td>
                    <td className="p-4 text-center font-mono font-black text-blue-600 dark:text-blue-400">
                      {Number(b.totalVal).toLocaleString()} ج.م
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-500" title={b.notes || ''}>
                      {b.notes || '—'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedBatchRef(b.ref)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        title="عرض تفاصيل الأصناف المنقولة"
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
      {/* MODAL 1: Create New Stock Transfer Voucher (Multiple Products) */}
      {/* ========================================================================= */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl animate-fadeIn relative my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  <span>إذن نقل بضائع بين المخازن (متعدد الأصناف)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدد المخزن المصدر والمخزن المستهدف وقائمة الأصناف والكميات المراد نقلها
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
            <form onSubmit={handleSubmitTransfer} className="flex flex-col flex-1 overflow-hidden mt-4">
              {/* General Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shrink-0 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    من مخزن (المصدر): *
                  </label>
                  <SearchableSelect
                    required
                    value={sourceWarehouse}
                    onChange={e => setSourceWarehouse(e.target.value)}
                    disabled={isRestrictedWarehouse}
                    className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 ${
                      isRestrictedWarehouse ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
                    }`}
                    searchPlaceholder="ابحث عن مخزن المصدر..."
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </SearchableSelect>
                  {isRestrictedWarehouse && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 block">
                      تم القفل على مخزنك المحدد
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    إلى مخزن (المستهدف): *
                  </label>
                  <SearchableSelect
                    required
                    value={targetWarehouse}
                    onChange={e => setTargetWarehouse(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    searchPlaceholder="ابحث عن مخزن الوجهة..."
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.name} disabled={w.name === sourceWarehouse}>
                        {w.name} {w.name === sourceWarehouse ? '(المخزن المصدر)' : ''}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    رقم إذن النقل:
                  </label>
                  <input
                    type="text"
                    required
                    value={transferRefNo}
                    onChange={e => setTransferRefNo(e.target.value)}
                    placeholder="TRF-XXXXX"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    ملاحظات التحويل:
                  </label>
                  <input
                    type="text"
                    value={generalNotes}
                    onChange={e => setGeneralNotes(e.target.value)}
                    placeholder="سائق النقل، سبب التحويل..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Items Table Area */}
              <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">اسم المنتج المراد تحويله</th>
                      <th className="p-3 w-28 text-center">الرصيد المتاح</th>
                      <th className="p-3 w-28 text-center">الكمية المنقولة</th>
                      <th className="p-3 w-28 text-center">سعر الوحدة</th>
                      <th className="p-3 w-28 text-center">القيمة التقديرية</th>
                      <th className="p-3">ملاحظات الصنف</th>
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
                            <SearchableSelect
                              required
                              value={it.productId}
                              onChange={e => updateItem(it.id, 'productId', e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                              searchPlaceholder="ابحث باسم المنتج أو الكود..."
                            >
                              <option value="">-- اختر المنتج من الكتالوج --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (الكود: {p.code} - الرصيد: {p.current_stock} {p.unit})
                                </option>
                              ))}
                            </SearchableSelect>
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

                          {/* Transfer Quantity */}
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
                                  : 'border-slate-200 dark:border-slate-700 text-blue-600 focus:border-blue-500'
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
                          <td className="p-3 text-center font-mono font-black text-blue-600 dark:text-blue-400">
                            {(Number(it.quantity || 0) * Number(it.unitPrice || 0)).toLocaleString()} ج.م
                          </td>

                          {/* Item Note */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={it.notes}
                              onChange={e => updateItem(it.id, 'notes', e.target.value)}
                              placeholder="ملاحظات الصنف..."
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صنف آخر للنقل</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 ml-1">إجمالي القطع المنقولة:</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">{totalQuantity}</span>
                  </div>
                  <div className="border-r border-slate-300 dark:border-slate-700 pr-4">
                    <span className="text-slate-500 ml-1">القيمة التقديرية:</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400">{totalAmount.toLocaleString()} ج.م</span>
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
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ تنفيذ التحويل...' : 'تأكيد وحفظ إذن التحويل'}</span>
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
                  <Package className="w-5 h-5 text-blue-500" />
                  <span>تفاصيل إذن نقل بضائع: {activeBatch.ref}</span>
                </h3>
                <span className="text-xs text-slate-500 mt-0.5">
                  من: {activeBatch.source_warehouse} ← إلى: {activeBatch.target_warehouse} • التاريخ: {new Date(activeBatch.date).toLocaleString('ar-EG')}
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
                    <th className="p-3 text-center">الكمية المنقولة</th>
                    <th className="p-3 text-center">سعر الوحدة</th>
                    <th className="p-3 text-center">القيمة التقديرية</th>
                    <th className="p-3">ملاحظات الصنف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeBatch.items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{it.product_name}</td>
                      <td className="p-3 text-center font-black text-purple-600 dark:text-purple-400">{it.quantity}</td>
                      <td className="p-3 text-center font-mono">{Number(it.unit_price).toLocaleString()} ج.م</td>
                      <td className="p-3 text-center font-mono font-black text-blue-600 dark:text-blue-400">
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
                {canPrint && (
                  <button
                    type="button"
                    onClick={() => {
                      const tableHtml = `
                        <div style="font-family: 'Cairo', sans-serif; padding: 15px;">
                          <h2 style="color: #2563eb; margin-bottom: 5px;">إذن نقل وتحويل بضائع بين المخازن</h2>
                          <p>رقم الإذن: <strong>${activeBatch.ref}</strong></p>
                          <p>من مخزن: <strong>${activeBatch.source_warehouse}</strong> إلى مخزن: <strong>${activeBatch.target_warehouse}</strong></p>
                          <p>التاريخ: ${new Date(activeBatch.date).toLocaleString('ar-EG')}</p>
                          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                              <tr style="background-color: #2563eb; color: #fff;">
                                <th style="padding: 6px; border: 1px solid #ccc;">#</th>
                                <th style="padding: 6px; border: 1px solid #ccc;">اسم الصنف</th>
                                <th style="padding: 6px; border: 1px solid #ccc;">الكمية المنقولة</th>
                                <th style="padding: 6px; border: 1px solid #ccc;">سعر الوحدة</th>
                                <th style="padding: 6px; border: 1px solid #ccc;">القيمة التقديرية</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${activeBatch.items.map((it, idx) => `
                                <tr>
                                  <td style="text-align: center; padding: 6px; border: 1px solid #ccc;">${idx + 1}</td>
                                  <td style="padding: 6px; border: 1px solid #ccc;">${it.product_name}</td>
                                  <td style="text-align: center; padding: 6px; border: 1px solid #ccc; font-weight: bold;">${it.quantity}</td>
                                  <td style="text-align: center; padding: 6px; border: 1px solid #ccc;">${it.unit_price} ج.م</td>
                                  <td style="text-align: center; padding: 6px; border: 1px solid #ccc; font-weight: bold; color: #2563eb;">${it.total_price} ج.م</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div style="margin-top: 15px; font-weight: bold; text-align: left;">
                            إجمالي قيمة المناقلة: ${Number(activeBatch.totalVal).toLocaleString()} ج.م
                          </div>
                        </div>
                      `;
                      printTableOrReceipt(`إذن_تحويل_${activeBatch.ref}`, tableHtml);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة إذن التحويل</span>
                  </button>
                )}
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
