import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Barcode, 
  Tag, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Eye, 
  Hash,
  Boxes,
  QrCode,
  Upload,
  Printer,
  FileDown,
  FileSpreadsheet,
  X,
  RefreshCw,
  FolderPlus,
  Sparkles,
  DollarSign,
  Warehouse as WarehouseIcon,
  Cpu,
  Wrench,
  ShoppingBag,
  History
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { compressImageFile } from '../utils/imageCompressor';
import { DateFilterBar, DateShortcut } from './DateFilterBar';
import SearchableSelect from './SearchableSelect';
import { showToast, showConfirm, showError, showWarning, showSuccess } from '../utils/swal';

export type ProductType = 'PHYSICAL' | 'SERVICE' | 'DIGITAL';

export interface ProductItem {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  buy_price: number;
  sell_price: number;
  min_sell_price: number;
  is_variable_price: boolean;
  is_variable_cost: boolean;
  product_type: ProductType;
  image_data?: string | null;
  current_stock: number;
  min_stock: number;
  warehouse: string;
  has_serial: boolean;
  business_unit: 'SHOP' | 'SERVICES' | 'BOTH';
}

interface CategoryOption {
  id: string;
  name: string;
  image_url?: string;
}

interface WarehouseOption {
  id: string;
  name: string;
}

export const ProductsManagementView: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSoftware, setShowSoftware] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Add / Edit Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [productForm, setProductForm] = useState<{
    id?: string;
    code: string;
    barcode: string;
    name: string;
    category: string;
    product_type: ProductType;
    image_data: string;
    // Physical / Service / Digital fields
    buy_price: number;
    sell_price: number;
    min_sell_price: number;
    is_variable_price: boolean;
    is_variable_cost: boolean;
    current_stock: number;
    min_stock: number;
    warehouse: string;
    unit: string;
  }>({
    code: '',
    barcode: '',
    name: '',
    category: '',
    product_type: 'PHYSICAL',
    image_data: '',
    buy_price: 0,
    sell_price: 0,
    min_sell_price: 0,
    is_variable_price: false,
    is_variable_cost: false,
    current_stock: 0,
    min_stock: 3,
    warehouse: '',
    unit: 'قطعة'
  });

  // Inline "Add Category" Modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // View Details Modal
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(null);

  // Stock Movements Modal for Product
  const [selectedProductForMovements, setSelectedProductForMovements] = useState<ProductItem | null>(null);
  const [productMovements, setProductMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movFromDate, setMovFromDate] = useState('');
  const [movToDate, setMovToDate] = useState('');
  const [movShortcut, setMovShortcut] = useState<DateShortcut>('ALL');

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

  const handleOpenMovements = async (p: ProductItem) => {
    setSelectedProductForMovements(p);
    setMovFromDate('');
    setMovToDate('');
    setMovShortcut('ALL');
    await fetchMovements(p.id, '', '');
  };

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Generate random 13-digit EAN-13 compatible barcode
  const generateBarcode = () => {
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    // Compute EAN checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(random12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const barcode = `${random12}${checkDigit}`;
    setProductForm(prev => ({ ...prev, barcode }));
  };

  // Fetch Products, Categories, and Warehouses
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, whRes, compRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/warehouses'),
        fetch('/api/settings/company')
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.data)) {
          setProducts(prodData.data.map((p: any) => ({
            id: p.id,
            code: p.code || '',
            barcode: p.barcode || '',
            name: p.name || '',
            category: p.category || '',
            unit: p.unit || 'قطعة',
            buy_price: Number(p.buy_price ?? 0),
            sell_price: Number(p.sell_price ?? 0),
            min_sell_price: Number(p.min_sell_price ?? 0),
            is_variable_price: Boolean(p.is_variable_price),
            is_variable_cost: Boolean(p.is_variable_cost),
            product_type: (p.product_type as ProductType) || 'PHYSICAL',
            image_data: p.image_data || null,
            current_stock: Number(p.current_stock ?? 0),
            min_stock: Number(p.min_stock ?? 3),
            warehouse: p.warehouse || '',
            has_serial: Boolean(p.has_serial),
            business_unit: p.business_unit || 'SHOP'
          })));
        }
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.data)) {
          setCategories(catData.data);
        }
      }

      if (whRes.ok) {
        const whData = await whRes.json();
        if (whData.success && Array.isArray(whData.data)) {
          setWarehouses(whData.data);
        }
      }

      if (compRes && compRes.ok) {
        const compData = await compRes.json();
        if (compData.success && compData.data) {
          setShowSoftware(compData.data.show_software_features !== undefined ? Boolean(compData.data.show_software_features) : true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleSettingsUpdated = (e: any) => {
      if (e?.detail && typeof e.detail.show_software_features === 'boolean') {
        setShowSoftware(e.detail.show_software_features);
      }
    };
    window.addEventListener('company-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('company-settings-updated', handleSettingsUpdated);
  }, []);

  // Open modal for new product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const defaultCat = categories.length > 0 ? categories[0].name : 'أجهزة ولابتوبات';
    const defaultWh = warehouses.length > 0 ? warehouses[0].name : 'مخزن المتجر الرئيسي';
    
    // Auto-generate barcode & code
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(random12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const barcode = `${random12}${checkDigit}`;

    setProductForm({
      code: `PRD-${Date.now().toString().slice(-4)}`,
      barcode,
      name: '',
      category: defaultCat,
      product_type: 'PHYSICAL',
      image_data: '',
      buy_price: 0,
      sell_price: 0,
      min_sell_price: 0,
      is_variable_price: false,
      is_variable_cost: false,
      current_stock: 0,
      min_stock: 3,
      warehouse: defaultWh,
      unit: 'قطعة'
    });
    setShowProductModal(true);
  };

  // Open modal for editing product
  const handleOpenEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setProductForm({
      id: p.id,
      code: p.code,
      barcode: p.barcode,
      name: p.name,
      category: p.category,
      product_type: p.product_type || 'PHYSICAL',
      image_data: p.image_data || '',
      buy_price: p.buy_price,
      sell_price: p.sell_price,
      min_sell_price: p.min_sell_price,
      is_variable_price: p.is_variable_price,
      is_variable_cost: p.is_variable_cost,
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      warehouse: p.warehouse,
      unit: p.unit || 'قطعة'
    });
    setShowProductModal(true);
  };

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('يرجى إدخال اسم المنتج');
      return;
    }

    try {
      const payload: any = {
        id: editingProduct?.id || productForm.id,
        code: productForm.code || `PRD-${Date.now().toString().slice(-4)}`,
        barcode: productForm.barcode,
        name: productForm.name.trim(),
        category: productForm.category,
        product_type: productForm.product_type,
        image_data: productForm.image_data || null,
        unit: productForm.unit || 'قطعة',
        sell_price: Number(productForm.sell_price) || 0,
        is_variable_price: productForm.is_variable_price ? 1 : 0
      };

      if (productForm.product_type === 'PHYSICAL') {
        payload.buy_price = Number(productForm.buy_price) || 0;
        payload.min_sell_price = Number(productForm.min_sell_price) || 0;
        payload.current_stock = Number(productForm.current_stock) || 0;
        payload.min_stock = Number(productForm.min_stock) || 3;
        payload.warehouse = productForm.warehouse;
        payload.is_variable_cost = 0;
      } else if (productForm.product_type === 'SERVICE') {
        payload.buy_price = Number(productForm.buy_price) || 0;
        payload.is_variable_cost = productForm.is_variable_cost ? 1 : 0;
        payload.min_sell_price = 0;
        payload.current_stock = 0;
        payload.min_stock = 0;
        payload.warehouse = '';
      } else if (productForm.product_type === 'DIGITAL') {
        payload.buy_price = Number(productForm.buy_price) || 0;
        payload.is_variable_cost = 0;
        payload.min_sell_price = 0;
        payload.current_stock = 0;
        payload.min_stock = 0;
        payload.warehouse = '';
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (resData.success) {
        setShowProductModal(false);
        showToast(editingProduct ? 'تم تحديث بيانات المنتج بنجاح' : 'تمت إضافة المنتج الجديد بنجاح');
        fetchData();
      } else {
        showError('خطأ أثناء الحفظ', resData.message || 'فشل حفظ بيانات المنتج');
      }
    } catch (err: any) {
      console.error(err);
      showError('فشل الاتصال بالخادم', err.message);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    const confirmed = await showConfirm(
      'تأكيد حذف المنتج',
      `هل أنت متأكد من رغبتك في حذف المنتج: "${name}" نهائياً من النظام؟`,
      { isDanger: true, confirmText: 'نعم، حذف المنتج', cancelText: 'إلغاء' }
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم حذف المنتج بنجاح');
        fetchData();
      } else {
        showError('فشل الحذف', data.message || 'فشل حذف المنتج');
      }
    } catch (err: any) {
      console.error(err);
      showError('خطأ في الاتصال', 'فشل حذف المنتج: ' + err.message);
    }
  };

  // Handle Quick Add Category from within Product Modal
  const handleSaveCategoryQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showWarning('بيانات غير مكتملة', 'يرجى إدخال اسم التصنيف');
      return;
    }

    setSavingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          image_url: newCatImage || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        const createdCat: CategoryOption = {
          id: data.id || `cat-${Date.now()}`,
          name: newCatName.trim(),
          image_url: newCatImage || ''
        };
        // Instantly update categories in SPA state & auto-select it for current product!
        setCategories(prev => {
          const exists = prev.some(c => c.name.toLowerCase() === createdCat.name.toLowerCase());
          return exists ? prev : [createdCat, ...prev];
        });
        setProductForm(prev => ({ ...prev, category: createdCat.name }));
        setShowAddCategoryModal(false);
        setNewCatName('');
        setNewCatImage('');
        showToast(`تمت إضافة تصنيف "${createdCat.name}" واختياره للمنتج الحالي فوراً!`);
      } else {
        showError('فشل حفظ التصنيف', data.message || 'تعذر حفظ التصنيف');
      }
    } catch (err: any) {
      console.error(err);
      showError('فشل الاتصال بالخادم', 'فشل حفظ التصنيف: ' + err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    const matchesType = selectedTypeFilter === 'ALL' || p.product_type === selectedTypeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Export & Print Handlers
  const handlePrint = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: right;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الباركود</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">اسم المنتج</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">نوع المنتج</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">التصنيف</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">سعر التكلفة</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">سعر البيع</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">الرصيد بالمخزن</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">المخزن</th>
          </tr>
        </thead>
        <tbody>
          ${filteredProducts.map(p => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${p.barcode || '—'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${p.name}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.product_type === 'PHYSICAL' ? 'سلعة مادية' : p.product_type === 'SERVICE' ? 'خدمة / عمل' : 'رقمي / برمجية'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.category || 'عام'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.buy_price.toLocaleString()} ج.م ${p.is_variable_cost ? '(متغير)' : ''}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; color: #0891b2; font-weight: bold;">${p.sell_price.toLocaleString()} ج.م ${p.is_variable_price ? '(متغير)' : ''}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.product_type === 'PHYSICAL' ? `${p.current_stock} ${p.unit}` : '—'}</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.product_type === 'PHYSICAL' ? (p.warehouse || '—') : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printTableOrReceipt('تقرير إدارة وقائمة المنتجات والأصناف', tableHtml);
  };

  const handleExportPDF = () => {
    handlePrint();
  };

  const handleExportExcel = () => {
    const headers = [
      'كود الصنف',
      'الباركود',
      'اسم المنتج',
      'نوع المنتج',
      'التصنيف',
      'سعر التكلفة',
      'سعر البيع',
      'أقل سعر بيع',
      'سعر البيع متغير',
      'تكلفة الخدمة متغيرة',
      'الكمية الحالية',
      'الوحدة',
      'المخزن'
    ];

    const rows = filteredProducts.map(p => [
      p.code,
      p.barcode,
      p.name,
      p.product_type === 'PHYSICAL' ? 'سلعة مادية' : p.product_type === 'SERVICE' ? 'خدمة / عمل' : 'رقمي / برمجية',
      p.category,
      p.buy_price,
      p.sell_price,
      p.min_sell_price,
      p.is_variable_price ? 'نعم' : 'لا',
      p.is_variable_cost ? 'نعم' : 'لا',
      p.product_type === 'PHYSICAL' ? p.current_stock : 0,
      p.unit,
      p.product_type === 'PHYSICAL' ? p.warehouse : ''
    ]);

    exportToExcel('قائمة_المنتجات_متجر_دراجون', headers, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>إدارة المنتجات والأصناف</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  {products.length} صنف مسجل
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                سجل متكامل للمنتجات المادية، الخدمات البرمجية، والأعمال الحرة مع توليد الباركود وضغط الصور
              </p>
            </div>
          </div>
        </div>

        {/* Buttons: Add Product + Export / Print */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title="طباعة الجدول"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title="تصدير كملف PDF"
          >
            <FileDown className="w-4 h-4 text-rose-500" />
            <span>تصدير PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title="تصدير إلى إكسيل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>تصدير إكسيل</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم المنتج، الباركود، الكود، أو التصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 backdrop-blur-xl"
          />
        </div>

        <div className="md:col-span-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <SearchableSelect
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">جميع التصنيفات والأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </SearchableSelect>
        </div>

        <div className="md:col-span-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <SearchableSelect
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">جميع أنواع المنتجات</option>
            <option value="PHYSICAL">منتج مادي / سلعة</option>
            <option value="SERVICE">خدمة / عمل حر</option>
            {showSoftware && <option value="DIGITAL">منتج رقمي / برمجية</option>}
          </SearchableSelect>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black">
                <th className="p-4">الصورة</th>
                <th className="p-4">الباركود والكود</th>
                <th className="p-4">اسم المنتج</th>
                <th className="p-4">القسم / التصنيف</th>
                <th className="p-4">النوع</th>
                <th className="p-4">سعر التكلفة</th>
                <th className="p-4">سعر البيع</th>
                <th className="p-4 text-center">المخزن والرصيد</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    <span>جارٍ تحميل بيانات المنتجات من الخادم...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-bold">لا توجد منتجات تطابق البحث الحالي</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.product_type === 'PHYSICAL' && p.current_stock <= p.min_stock;
                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product Image */}
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.image_data ? (
                            <img src={p.image_data} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Barcode & Code */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-cyan-500" />
                          <span>{p.barcode || '—'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {p.code}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 dark:text-slate-100 text-sm max-w-xs">
                          {p.name}
                        </div>
                        {p.min_sell_price > 0 && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            أقل سعر مسموح: {p.min_sell_price.toLocaleString()} ج.م
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {p.category || 'عام'}
                        </span>
                      </td>

                      {/* Product Type */}
                      <td className="p-4">
                        {p.product_type === 'PHYSICAL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <ShoppingBag className="w-3 h-3" />
                            <span>سلعة مادية</span>
                          </span>
                        )}
                        {p.product_type === 'SERVICE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Wrench className="w-3 h-3" />
                            <span>خدمة / عمل</span>
                          </span>
                        )}
                        {p.product_type === 'DIGITAL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Cpu className="w-3 h-3" />
                            <span>رقمي / برمجية</span>
                          </span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="p-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {p.buy_price.toLocaleString()} ج.م
                        </div>
                        {p.is_variable_cost && (
                          <span className="text-[10px] text-amber-500 font-bold">متغيرة بالفاتورة</span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="p-4">
                        <div className="font-black text-cyan-600 dark:text-cyan-400">
                          {p.sell_price.toLocaleString()} ج.م
                        </div>
                        {p.is_variable_price && (
                          <span className="text-[10px] text-indigo-500 font-bold">متغير بالفاتورة</span>
                        )}
                      </td>

                      {/* Stock / Warehouse */}
                      <td className="p-4 text-center">
                        {p.product_type === 'PHYSICAL' ? (
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                              isLowStock 
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isLowStock && <AlertTriangle className="w-3 h-3" />}
                              <span>{p.current_stock} {p.unit}</span>
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                              <WarehouseIcon className="w-3 h-3" />
                              <span>{p.warehouse || 'المخزن الرئيسي'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold text-[11px]">
                            {p.product_type === 'SERVICE' ? 'خدمة فورية' : 'تسليم رقمي'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Movements (for physical products) */}
                          {p.product_type === 'PHYSICAL' && (
                            <button
                              onClick={() => handleOpenMovements(p)}
                              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-500/20 transition-all cursor-pointer"
                              title="عرض حركات المخزون لهذا المنتج"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}

                          {/* View */}
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-cyan-500/20 transition-all cursor-pointer"
                            title="معاينة تفاصيل المنتج"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-500/20 transition-all cursor-pointer"
                            title="تعديل المنتج"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-500/20 transition-all cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                */}
      {/* ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-fadeIn relative my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-500 rounded-2xl text-white">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمنظومة'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    أدخل بيانات المنتج بدقة، مع إمكانية توليد باركود تلقائي واختيار التصنيف
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="space-y-5">
              
              {/* Row 1: Barcode with Generator */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  1. باركود المنتج (Barcode):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="امسح الباركود بجهاز القارئ أو اضغط توليد..."
                      value={productForm.barcode}
                      onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 cursor-pointer transition-all flex-shrink-0"
                    title="توليد باركود عشوائي فريد"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد باركود عشوائي</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Product Name */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  2. اسم المنتج (Product Name): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لابتوب Dell Precision 5520 أو تصميم موقع إلكتروني..."
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              {/* Row 3: Category with inline "Add New Category" button */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  3. القسم / التصنيف (Category):
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <SearchableSelect
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </SearchableSelect>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-all flex-shrink-0"
                    title="إضافة تصنيف جديد فوراً دون مغادرة الصفحة"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>إضافة تصنيف جديد</span>
                  </button>
                </div>
              </div>

              {/* Row 4: Product Image (File Upload from Device + Auto Compress) */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
                  4. صورة المنتج (رفع من الجهاز وضغط تلقائي برمجياً):
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-cyan-500" />
                    <span>اختيار صورة من جهازك...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file, 400, 400, 0.72);
                            setProductForm({ ...productForm, image_data: compressed });
                          } catch (err: any) {
                            alert(err.message || 'فشل ضغط الصورة');
                          }
                        }
                      }}
                    />
                  </label>

                  {productForm.image_data ? (
                    <div className="relative group w-16 h-16 rounded-2xl border-2 border-cyan-500/40 overflow-hidden shadow-sm flex-shrink-0">
                      <img src={productForm.image_data} alt="معاينة" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, image_data: '' })}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold"
                        title="إزالة الصورة"
                      >
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">لم يتم اختيار صورة (اختياري)</span>
                  )}
                </div>
              </div>

              {/* Row 5: Product Type Selection */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  5. نوع المنتج (Product Type):
                </label>
                <div className={`grid ${showSoftware ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, product_type: 'PHYSICAL' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      productForm.product_type === 'PHYSICAL'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>منتج مادي / سلعة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, product_type: 'SERVICE' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      productForm.product_type === 'SERVICE'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>خدمة / عمل</span>
                  </button>

                  {showSoftware && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, product_type: 'DIGITAL' })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                        productForm.product_type === 'DIGITAL'
                          ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Cpu className="w-4 h-4" />
                      <span>منتج رقمي / برمجية</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* DYNAMIC FIELDS BASED ON PRODUCT TYPE                     */}
              {/* ======================================================== */}

              {/* CASE 1: PHYSICAL PRODUCT */}
              {productForm.product_type === 'PHYSICAL' && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-4 animate-fadeIn">
                  <div className="text-xs font-black text-blue-700 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span>بيانات السلعة المادية والتخزين:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Cost Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سعر التكلفة (شراء):</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.buy_price}
                        onChange={(e) => setProductForm({ ...productForm, buy_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Selling Price + Variable option */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سعر البيع الافتراضي:</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.sell_price}
                        onChange={(e) => setProductForm({ ...productForm, sell_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_variable_price}
                          onChange={(e) => setProductForm({ ...productForm, is_variable_price: e.target.checked })}
                          className="rounded text-cyan-600 focus:ring-0"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">سعر البيع متغير حسب الفاتورة</span>
                      </label>
                    </div>

                    {/* Min Selling Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">أقل سعر بيع مسموح به (الحد الأدنى):</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.min_sell_price}
                        onChange={(e) => setProductForm({ ...productForm, min_sell_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Current Stock */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الكمية الحالية في المخزن:</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.current_stock}
                        onChange={(e) => setProductForm({ ...productForm, current_stock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Warehouse Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المخزن الموجود فيه:</label>
                      <SearchableSelect
                        value={productForm.warehouse}
                        onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        {warehouses.length > 0 ? (
                          warehouses.map((w) => (
                            <option key={w.id} value={w.name}>{w.name}</option>
                          ))
                        ) : (
                          <option value="مخزن المتجر الرئيسي">مخزن المتجر الرئيسي</option>
                        )}
                      </SearchableSelect>
                    </div>

                    {/* Min Alert Stock */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">أقل كمية للتنبيه (نواقص):</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.min_stock}
                        onChange={(e) => setProductForm({ ...productForm, min_stock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 2: SERVICE / WORK */}
              {productForm.product_type === 'SERVICE' && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-4 animate-fadeIn">
                  <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Wrench className="w-4 h-4" />
                    <span>بيانات الخدمة / العمل الحر (حقول المخزون والكميات مخفية تماماً):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Service Cost */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تكلفة الخدمة (إن وجدت):</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.buy_price}
                        onChange={(e) => setProductForm({ ...productForm, buy_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_variable_cost}
                          onChange={(e) => setProductForm({ ...productForm, is_variable_cost: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-0"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">تكلفة الخدمة متغيرة حسب الفاتورة</span>
                      </label>
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سعر بيع / أتعاب الخدمة:</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.sell_price}
                        onChange={(e) => setProductForm({ ...productForm, sell_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_variable_price}
                          onChange={(e) => setProductForm({ ...productForm, is_variable_price: e.target.checked })}
                          className="rounded text-cyan-600 focus:ring-0"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">سعر البيع متغير حسب الفاتورة</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 3: DIGITAL PRODUCT / SOFTWARE */}
              {productForm.product_type === 'DIGITAL' && (
                <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 space-y-4 animate-fadeIn">
                  <div className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                    <Cpu className="w-4 h-4" />
                    <span>بيانات المنتج الرقمي / البرمجية (حقول المخزون والكميات مخفية تماماً):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Cost Price (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سعر التكلفة (ترخيص / خوادم - إن وجد):</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.buy_price}
                        onChange={(e) => setProductForm({ ...productForm, buy_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سعر البيع / الترخيص:</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.sell_price}
                        onChange={(e) => setProductForm({ ...productForm, sell_price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
                      />
                      <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_variable_price}
                          onChange={(e) => setProductForm({ ...productForm, is_variable_price: e.target.checked })}
                          className="rounded text-cyan-600 focus:ring-0"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">سعر البيع متغير حسب الفاتورة</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 cursor-pointer transition-all"
                >
                  {editingProduct ? 'تحديث المنتج' : 'حفظ المنتج في المنظومة'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CATEGORY POPUP (INLINE)                       */}
      {/* ======================================================== */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-500" />
                <span>إضافة تصنيف جديد</span>
              </h4>
              <button 
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryQuick} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم التصنيف: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: هواتف ذكية، صيانة شبكات، استضافة سحابية..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  صورة التصنيف (رفع من الجهاز وضغط تلقائي):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    <span>رفع صورة...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImageFile(file, 250, 250, 0.7);
                            setNewCatImage(compressed);
                          } catch (err: any) {
                            alert(err.message || 'فشل ضغط الصورة');
                          }
                        }
                      }}
                    />
                  </label>

                  {newCatImage && (
                    <div className="relative group w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-shrink-0">
                      <img src={newCatImage} alt="معاينة" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewCatImage('')}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                        title="حذف الصورة"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {savingCategory && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ واختيار</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW PRODUCT DETAILS                              */}
      {/* ======================================================== */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-500" />
                <span>بطاقة تفاصيل المنتج</span>
              </h3>
              <button onClick={() => setViewingProduct(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {viewingProduct.image_data ? (
                    <img src={viewingProduct.image_data} alt={viewingProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">{viewingProduct.name}</h4>
                  <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{viewingProduct.barcode || '—'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">كود الصنف: {viewingProduct.code}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-0.5">التصنيف:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingProduct.category || 'عام'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">النوع:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingProduct.product_type === 'PHYSICAL' ? 'سلعة مادية' : viewingProduct.product_type === 'SERVICE' ? 'خدمة / عمل' : 'رقمي / برمجية'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">سعر التكلفة:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingProduct.buy_price.toLocaleString()} ج.م
                    {viewingProduct.is_variable_cost && ' (متغير بالفاتورة)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">سعر البيع:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {viewingProduct.sell_price.toLocaleString()} ج.م
                    {viewingProduct.is_variable_price && ' (متغير بالفاتورة)'}
                  </span>
                </div>

                {viewingProduct.product_type === 'PHYSICAL' && (
                  <>
                    <div>
                      <span className="text-slate-400 block mb-0.5">أقل سعر بيع مسموح:</span>
                      <span className="font-bold text-amber-600">{viewingProduct.min_sell_price.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">المخزن الحالي:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{viewingProduct.warehouse || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الكمية الحالية:</span>
                      <span className="font-black text-slate-900 dark:text-slate-100">{viewingProduct.current_stock} {viewingProduct.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">حد التنبيه الأدنى:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{viewingProduct.min_stock} {viewingProduct.unit}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRODUCT STOCK MOVEMENTS WITH DATE FILTERS         */}
      {/* ======================================================== */}
      {selectedProductForMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  <span>حركة المخزون للصنف: {selectedProductForMovements.name}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  كود: {selectedProductForMovements.code} • الباركود: {selectedProductForMovements.barcode} • الرصيد الحالي: {selectedProductForMovements.current_stock} {selectedProductForMovements.unit}
                </span>
              </div>
              <button 
                onClick={() => setSelectedProductForMovements(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Filter Bar */}
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

            <div className="flex-1 overflow-y-auto my-3 scrollbar-thin">
              {loadingMovements ? (
                <div className="p-8 text-center text-slate-400">جاري تحميل سجل حركات المخزون...</div>
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
                      <th className="p-3">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {productMovements.map((m: any) => (
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
                        <td className="p-3">{m.source_warehouse || m.target_warehouse || '—'}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{m.notes || '—'}</td>
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
                    const headers = ['رقم الإذن', 'نوع الحركة', 'الكمية', 'سعر الوحدة', 'المخزن المعني', 'التاريخ', 'ملاحظات'];
                    const rows = productMovements.map((m: any) => [
                      m.reference_no,
                      m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني',
                      m.quantity,
                      m.unit_price,
                      m.source_warehouse || m.target_warehouse || 'المخزن الرئيسي',
                      m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG') : '—',
                      m.notes || ''
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
                            <th>ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productMovements.map((m: any) => `
                            <tr>
                              <td style="text-align: center;">${m.reference_no}</td>
                              <td style="text-align: center;">${m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني'}</td>
                              <td style="text-align: center; font-weight: bold;">${m.quantity}</td>
                              <td style="text-align: center;">${Number(m.unit_price).toLocaleString()} ج.م</td>
                              <td>${m.source_warehouse || m.target_warehouse || '—'}</td>
                              <td style="text-align: center;">${m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                              <td>${m.notes || '—'}</td>
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
                            <th>ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productMovements.map((m: any) => `
                            <tr>
                              <td style="text-align: center;">${m.reference_no}</td>
                              <td style="text-align: center;">${m.movement_type === 'IN' ? 'وارد استلام' : m.movement_type === 'OUT' ? 'صرف مبيعات' : 'تحويل مخزني'}</td>
                              <td style="text-align: center; font-weight: bold;">${m.quantity}</td>
                              <td style="text-align: center;">${Number(m.unit_price).toLocaleString()} ج.م</td>
                              <td>${m.source_warehouse || m.target_warehouse || '—'}</td>
                              <td style="text-align: center;">${m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                              <td>${m.notes || '—'}</td>
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
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
