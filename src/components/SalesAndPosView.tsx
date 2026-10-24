import React, { useState, useEffect, useRef, useMemo } from 'react';
import { systemAuthStore, hasPermission } from '../store/systemAuthStore';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Search, 
  RotateCcw, 
  DollarSign, 
  CreditCard, 
  Receipt,
  Package,
  Layers,
  AlertCircle,
  FileText,
  Printer,
  FileDown,
  PauseCircle,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Warehouse,
  Coins,
  ChevronDown,
  Percent,
  X,
  Eye,
  CheckCheck,
  LayoutGrid,
  PackageSearch,
  Smartphone,
  Laptop,
  Tv,
  Wifi,
  Tag
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';
import { SearchableSelect } from './SearchableSelect';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/swal';

interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  buy_price: number;
  sell_price: number;
  min_sell_price: number;
  is_variable_price: number;
  is_variable_cost: number;
  current_stock: number;
  warehouse: string;
  image_data?: string | null;
  product_type?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  products_count?: number;
}

interface CartItem {
  product_id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  total_cost: number;
  warehouse: string;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  credit_limit: number;
}

interface Account {
  id: string;
  name: string;
  account_code: string;
  balance: number;
}

interface SuspendedCart {
  id: string;
  time: string;
  customerName: string;
  customerId?: string;
  items: CartItem[];
  discount: number;
  discountType?: 'AMOUNT' | 'PERCENT';
  mode: 'SALE' | 'QUOTATION';
  total?: number;
}

interface SalesAndPosViewProps {
  initialMode?: 'SALE' | 'QUOTATION';
}

export const SalesAndPosView: React.FC<SalesAndPosViewProps> = ({ initialMode = 'SALE' }) => {
  // Mode: Sale Invoice or Price Quotation
  const [docMode, setDocMode] = useState<'SALE' | 'QUOTATION'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setDocMode(initialMode);
    }
  }, [initialMode]);

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  
  const currentUser = systemAuthStore.currentUser;
  const userAssignedWarehouse = currentUser?.assignedWarehouse;
  const isRestrictedWarehouse = currentUser?.role !== 'SUPER_ADMIN' && Boolean(userAssignedWarehouse) && userAssignedWarehouse !== 'ALL';
  const userAssignedTreasury = currentUser?.assignedTreasury;
  const isRestrictedTreasury = currentUser?.role !== 'SUPER_ADMIN' && Boolean(userAssignedTreasury) && userAssignedTreasury !== 'ALL';

  // Permission checks for Sales POS
  const canSale = hasPermission(currentUser, 'sales_pos', 'sale');
  const canReturn = hasPermission(currentUser, 'sales_pos', 'return');
  const canCredit = hasPermission(currentUser, 'sales_pos', 'credit');

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(() => {
    return isRestrictedWarehouse && userAssignedWarehouse ? userAssignedWarehouse : 'مخزن المتجر الرئيسي';
  });

  // Cart & Invoice Form state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('WALK_IN');
  // Payment & Treasury state
  // Types: 'CASH' (خزينة نقدية), 'INSTAPAY' (حساب بنكي), 'WALLET' (محفظة إلكترونية), 'SPLIT' (تقسيم الدفع), 'CREDIT' (آجل / على الحساب)
  const [paymentType, setPaymentType] = useState<'CASH' | 'INSTAPAY' | 'WALLET' | 'SPLIT' | 'CREDIT'>('CASH');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  
  // Split payment state: Cash part vs Electronic/Bank part
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitCashAccountId, setSplitCashAccountId] = useState<string>('');
  const [splitDigitalAmount, setSplitDigitalAmount] = useState<number>(0);
  const [splitDigitalAccountId, setSplitDigitalAccountId] = useState<string>('');
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Variable Price & Cost Modal state
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [promptPrice, setPromptPrice] = useState<number>(0);
  const [promptCost, setPromptCost] = useState<number>(0);
  const [promptType, setPromptType] = useState<'PRICE' | 'COST' | 'BOTH' | null>(null);

  // Suspended Carts (Hold Invoices) with localStorage persistence
  const [suspendedCarts, setSuspendedCarts] = useState<SuspendedCart[]>(() => {
    try {
      const saved = localStorage.getItem('dragon_pos_suspended_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dragon_pos_suspended_carts', JSON.stringify(suspendedCarts));
    } catch (e) {
      console.error(e);
    }
  }, [suspendedCarts]);

  // Previous Invoices / Quotations list Modal
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [inspectingDoc, setInspectingDoc] = useState<any | null>(null);

  // Dedicated Modals for Top Bar: Return, Reprint, Suspended Queue
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showReprintModal, setShowReprintModal] = useState<boolean>(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState<boolean>(false);

  // Search & Selection state inside Modals
  const [returnSearch, setReturnSearch] = useState<string>('');
  const [reprintSearch, setReprintSearch] = useState<string>('');
  const [selectedDocForReturn, setSelectedDocForReturn] = useState<any | null>(null);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('dragon_pos_last_invoice');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (lastCompletedInvoice) {
      try {
        localStorage.setItem('dragon_pos_last_invoice', JSON.stringify(lastCompletedInvoice));
      } catch (e) {
        console.error(e);
      }
    }
  }, [lastCompletedInvoice]);

  // Company Settings for Receipt Header/Footer
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Categories from DB
  const [dbCategories, setDbCategories] = useState<CategoryOption[]>([]);

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Barcode input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  const safeJson = async (res: Response) => {
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return { success: false, data: null };
    }
  };

  // Fetch Master Data
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [prodRes, custRes, accRes, whRes, compRes, catRes, salesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/accounts'),
        fetch('/api/warehouses'),
        fetch('/api/settings/company'),
        fetch('/api/categories'),
        fetch('/api/sales')
      ]);

      const [pData, cData, aData, wData, compData, catData, sData] = await Promise.all([
        safeJson(prodRes),
        safeJson(custRes),
        safeJson(accRes),
        safeJson(whRes),
        safeJson(compRes),
        safeJson(catRes),
        safeJson(salesRes)
      ]);

      if (pData.success) setProducts(pData.data || []);
      if (cData.success) setCustomers(cData.data || []);
      if (catData.success) setDbCategories(catData.data || []);
      if (sData.success) {
        const list = sData.data || [];
        setHistoryList(list);
        const last = list.find((d: any) => d.status === 'COMPLETED');
        if (last) setLastCompletedInvoice(last);
      }
      if (aData.success) {
        let accList = aData.data || [];
        if (isRestrictedTreasury && userAssignedTreasury) {
          accList = accList.filter((a: any) => a.id === userAssignedTreasury || a.name === userAssignedTreasury);
        }
        setAccounts(accList);
        if (accList.length > 0 && (!selectedAccountId || isRestrictedTreasury)) {
          setSelectedAccountId(accList[0].id);
        }
      }
      if (wData.success && wData.data?.length > 0) {
        let whList = wData.data;
        if (isRestrictedWarehouse && userAssignedWarehouse) {
          whList = whList.filter((w: any) => w.name === userAssignedWarehouse || w.id === userAssignedWarehouse);
          setSelectedWarehouse(userAssignedWarehouse);
        }
        setWarehouses(whList);
      }
      if (compData.success && compData.data) {
        setCompanyProfile(compData.data);
      }
    } catch (err) {
      console.error('Failed to load master data in SalesAndPosView:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Helper for category icon
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('شبك') || n.includes('راوتر') || n.includes('net') || n.includes('wifi') || n.includes('isp')) return Wifi;
    if (n.includes('كامير') || n.includes('dvr') || n.includes('nvr') || n.includes('مراقبة')) return Eye;
    if (n.includes('شاش') || n.includes('كمبيوتر') || n.includes('pc') || n.includes('شاشة')) return Tv;
    if (n.includes('لابتوب') || n.includes('محمول') || n.includes('laptop')) return Laptop;
    if (n.includes('هاتف') || n.includes('موبايل') || n.includes('phone')) return Smartphone;
    if (n.includes('برمج') || n.includes('سوفت') || n.includes('كود') || n.includes('app')) return Sparkles;
    return Tag;
  };

  // Combine DB categories with any categories existing only on products
  const categoryCards = useMemo(() => {
    const list: Array<{ id: string; name: string; image_url?: string; count: number }> = [];
    const seen = new Set<string>();

    dbCategories.forEach(c => {
      seen.add(c.name);
      const count = products.filter(p => p.category === c.name).length;
      list.push({
        id: c.id,
        name: c.name,
        image_url: c.image_url || undefined,
        count
      });
    });

    products.forEach(p => {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category);
        const count = products.filter(prod => prod.category === p.category).length;
        list.push({
          id: `cat-${p.category}`,
          name: p.category,
          image_url: undefined,
          count
        });
      }
    });

    return list;
  }, [dbCategories, products]);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Handle adding product to cart with Variable Price / Cost popup check
  const handleSelectProduct = (product: Product) => {
    // If out of stock and in Sale mode, alert
    if (docMode === 'SALE' && Number(product.current_stock || 0) <= 0) {
      alert(`المنتج (${product.name}) غير متوفر حالياً في المخزن (الرصيد: 0)`);
      return;
    }

    const hasVarPrice = Boolean(Number(product.is_variable_price));
    const hasVarCost = Boolean(Number(product.is_variable_cost));

    if (hasVarPrice && hasVarCost) {
      setPendingProduct(product);
      setPromptPrice(Number(product.sell_price || 0));
      setPromptCost(Number(product.buy_price || 0));
      setPromptType('BOTH');
      return;
    } else if (hasVarPrice) {
      setPendingProduct(product);
      setPromptPrice(Number(product.sell_price || 0));
      setPromptCost(Number(product.buy_price || 0));
      setPromptType('PRICE');
      return;
    } else if (hasVarCost) {
      setPendingProduct(product);
      setPromptPrice(Number(product.sell_price || 0));
      setPromptCost(Number(product.buy_price || 0));
      setPromptType('COST');
      return;
    }

    // Normal product with fixed prices
    addProductDirectlyToCart(product, Number(product.sell_price || 0), Number(product.buy_price || 0));
  };

  // Add to cart directly
  const addProductDirectlyToCart = (product: Product, sellPrice: number, buyPrice: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product_id === product.id);
      if (idx > -1) {
        const item = prev[idx];
        const nextQty = item.quantity + 1;
        if (docMode === 'SALE' && nextQty > product.current_stock) {
          alert(`لا يمكن إضافة كمية أكبر من الرصيد المتوفر بالمخزن (${product.current_stock})`);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...item,
          quantity: nextQty,
          unit_price: sellPrice,
          unit_cost: buyPrice,
          total_price: nextQty * sellPrice,
          total_cost: nextQty * buyPrice
        };
        return updated;
      } else {
        const newItem: CartItem = {
          product_id: product.id,
          code: product.code,
          name: product.name,
          unit: product.unit || 'قطعة',
          quantity: 1,
          unit_price: sellPrice,
          unit_cost: buyPrice,
          total_price: sellPrice,
          total_cost: buyPrice,
          warehouse: selectedWarehouse
        };
        return [newItem, ...prev];
      }
    });

    setSearchTerm('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Confirm Variable Price / Cost Modal
  const handleConfirmPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingProduct) return;

    if (promptPrice <= 0 && promptType !== 'COST') {
      showWarning('سعر غير صحيح', 'يرجى إدخال سعر بيع صحيح أكبر من صفر');
      return;
    }

    if (pendingProduct.min_sell_price > 0 && promptPrice < pendingProduct.min_sell_price && promptType !== 'COST') {
      const confirmed = await showConfirm(
        'تنبيه الحد الأدنى لسعر البيع',
        `تنبيه: سعر البيع المدخل (${promptPrice} ج.م) أقل من الحد الأدنى المسموح به للبيع (${pendingProduct.min_sell_price} ج.م). هل أنت متأكد من المتابعة؟`,
        { isDanger: true, confirmText: 'نعم، متابعة', cancelText: 'إلغاء' }
      );
      if (!confirmed) {
        return;
      }
    }

    addProductDirectlyToCart(pendingProduct, promptPrice, promptCost);
    setPendingProduct(null);
    setPromptType(null);
  };

  // Update item quantity
  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (docMode === 'SALE' && prod && newQty > prod.current_stock) {
      alert(`الكمية المطلوبة تتجاوز الرصيد المتوفر (${prod.current_stock})`);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.product_id !== productId) return item;
      return {
        ...item,
        quantity: newQty,
        total_price: newQty * item.unit_price,
        total_cost: newQty * item.unit_cost
      };
    }));
  };

  // Update item unit price directly in cart
  const updateCartUnitPrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id !== productId) return item;
      return {
        ...item,
        unit_price: newPrice,
        total_price: item.quantity * newPrice
      };
    }));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setDiscountVal(0);
    setPaidAmount(0);
    setInvoiceNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.total_cost, 0);
  const calculatedDiscount = discountType === 'PERCENT' ? (subtotal * (discountVal / 100)) : discountVal;
  const netTotal = Math.max(0, subtotal - calculatedDiscount);
  const grossProfit = Math.max(0, netTotal - totalCost);
  const remainingAmount = Math.max(0, netTotal - paidAmount);
  // Categorize accounts by code or name
  // 1. الخزائن النقدية (الكاش): كود 111 أو اسم يحتوي على خزينة / نقدية / كاش
  const cashAccounts = accounts.filter(a => a.account_code?.startsWith('111') || a.name?.includes('خزينة') || a.name?.includes('كاش'));
  // 2. الحسابات البنكية (إنستاباي / بنك): كود 112 أو اسم يحتوي على بنك / CIB / بنكي
  const bankAccounts = accounts.filter(a => a.account_code?.startsWith('112') || a.name?.includes('بنك') || a.name?.includes('حساب'));
  // 3. المحافظ الإلكترونية: كود 113 أو اسم يحتوي على محفظة / فودافون / كاش / إلكتروني
  const walletAccounts = accounts.filter(a => a.account_code?.startsWith('113') || a.name?.includes('محفظة') || a.name?.includes('فودافون'));
  // 4. الحسابات البنكية والمحافظ معاً لخيار التقسيم أو الدفع الرقمي
  const digitalAccounts = accounts.filter(a => !a.account_code?.startsWith('111') || a.name?.includes('بنك') || a.name?.includes('محفظة'));

  // Keep accounts selected on payment type switch
  useEffect(() => {
    if (paymentType === 'CASH') {
      if (cashAccounts.length > 0 && (!selectedAccountId || !cashAccounts.some(a => a.id === selectedAccountId))) {
        setSelectedAccountId(cashAccounts[0].id);
      }
      setPaidAmount(netTotal);
    } else if (paymentType === 'INSTAPAY') {
      if (bankAccounts.length > 0 && (!selectedAccountId || !bankAccounts.some(a => a.id === selectedAccountId))) {
        setSelectedAccountId(bankAccounts[0].id);
      }
      setPaidAmount(netTotal);
    } else if (paymentType === 'WALLET') {
      if (walletAccounts.length > 0 && (!selectedAccountId || !walletAccounts.some(a => a.id === selectedAccountId))) {
        setSelectedAccountId(walletAccounts[0].id);
      }
      setPaidAmount(netTotal);
    } else if (paymentType === 'SPLIT') {
      if (cashAccounts.length > 0 && !splitCashAccountId) {
        setSplitCashAccountId(cashAccounts[0].id);
      }
      if (digitalAccounts.length > 0 && !splitDigitalAccountId) {
        setSplitDigitalAccountId(digitalAccounts[0].id);
      }
      // Initialize half or remaining
      const half = Math.round(netTotal / 2);
      setSplitCashAmount(half);
      setSplitDigitalAmount(Math.max(0, netTotal - half));
      setPaidAmount(netTotal);
    } else if (paymentType === 'CREDIT') {
      setPaidAmount(0);
    }
  }, [paymentType, netTotal, accounts]);

  // When split amounts change, update total paid
  const handleSplitCashChange = (val: number) => {
    setSplitCashAmount(val);
    const rest = Math.max(0, netTotal - val);
    setSplitDigitalAmount(rest);
    setPaidAmount(val + rest);
  };

  const handleSplitDigitalChange = (val: number) => {
    setSplitDigitalAmount(val);
    setPaidAmount(splitCashAmount + val);
  };

  // Suspend current cart (Hold Invoice)
  const handleSuspendCart = () => {
    if (cart.length === 0) {
      setFeedback({ type: 'error', text: 'السلة فارغة! يرجى إضافة أصناف إلى سلة المبيعات أولاً قبل تعليقها.' });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    const newHold: SuspendedCart = {
      id: `hold-${Date.now()}`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      customerName: cust ? cust.name : 'عميل نقدي فوري',
      customerId: selectedCustomerId,
      items: [...cart],
      discount: discountVal,
      discountType: discountType,
      mode: docMode,
      total: netTotal
    };
    setSuspendedCarts(prev => [newHold, ...prev]);
    clearCart();
    setFeedback({ type: 'success', text: `تم تعليق الفاتورة بنجاح (${newHold.items.length} أصناف). يمكنك استرجاعها في أي وقت من زر "الفواتير المعلقة"` });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Resume suspended cart
  const handleResumeCart = async (hold: SuspendedCart) => {
    if (cart.length > 0) {
      const confirmed = await showConfirm(
        'استبدال السلة الحالية',
        'يوجد أصناف في السلة الحالية، هل تريد استبدالها بالفاتورة المعلقة؟',
        { confirmText: 'نعم، استبدال السلة', cancelText: 'إلغاء' }
      );
      if (!confirmed) {
        return;
      }
    }
    setCart(hold.items);
    setDiscountVal(hold.discount);
    if (hold.discountType) setDiscountType(hold.discountType);
    if (hold.customerId) setSelectedCustomerId(hold.customerId);
    setDocMode(hold.mode);
    setSuspendedCarts(prev => prev.filter(h => h.id !== hold.id));
    setShowSuspendedModal(false);
    showToast(`تم استرجاع فاتورة (${hold.customerName}) بنجاح إلى شاشة الكاشير`);
    setFeedback({ type: 'success', text: `تم استرجاع فاتورة (${hold.customerName}) بنجاح إلى شاشة الكاشير` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Open Return Modal
  const handleOpenReturnModal = async () => {
    setSelectedDocForReturn(null);
    setReturnSearch('');
    try {
      const res = await fetch('/api/sales');
      const data = await safeJson(res);
      if (data.success) {
        setHistoryList(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setShowReturnModal(true);
  };

  // Open Reprint Modal
  const handleOpenReprintModal = async () => {
    setReprintSearch('');
    try {
      const res = await fetch('/api/sales');
      const data = await safeJson(res);
      if (data.success) {
        setHistoryList(data.data || []);
        const latest = (data.data || []).find((d: any) => d.status === 'COMPLETED');
        if (latest) setLastCompletedInvoice(latest);
      }
    } catch (e) {
      console.error(e);
    }
    setShowReprintModal(true);
  };

  // Global Keyboard Shortcuts for POS Cashier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (isInput) return;

      if (e.key === 'F2') {
        e.preventDefault();
        handleSuspendCart();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleOpenReprintModal();
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (canReturn) {
          handleOpenReturnModal();
        } else {
          alert('ليس لديك صلاحية عمل مرتجع مبيعات');
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowSuspendedModal(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleOpenHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, canReturn, selectedCustomerId, discountVal, discountType, docMode, netTotal]);

  // Submit Sale Invoice or Quotation
  const handleSubmitInvoice = async () => {
    if (cart.length === 0) {
      alert('السلة فارغة، يرجى إضافة منتجات أولاً');
      return;
    }

    if (docMode === 'SALE' && !canSale) {
      alert('ليس لديك صلاحية بيع أو إصدار فواتير مبيعات');
      return;
    }

    const cust = customers.find(c => c.id === selectedCustomerId);
    const custName = cust ? cust.name : 'عميل نقدي / عام';

    // Credit validation - strict check
    if (docMode === 'SALE' && (paymentType === 'CREDIT' || remainingAmount > 0)) {
      if (!canCredit) {
        showWarning('غير مصرح', 'ليس لديك صلاحية البيع بالآجل أو تسجيل متبقي على الحساب!');
        return;
      }
      if (!selectedCustomerId || selectedCustomerId === 'WALK_IN') {
        showWarning('عميل غير محدد', 'ممنوع البيع الآجل أو تسجيل متبقي على الحساب بدون اختيار عميل مسجل من القائمة!');
        return;
      }
      if (cust && cust.credit_limit > 0 && (Number(cust.balance) + remainingAmount) > cust.credit_limit) {
        const confirmed = await showConfirm(
          'تجاوز الحد الائتماني',
          `تنبيه: مديونية العميل بعد هذه الفاتورة (${(Number(cust.balance) + remainingAmount).toLocaleString()} ج.م) ستتجاوز الحد الائتماني المسموح به (${cust.credit_limit.toLocaleString()} ج.م). هل تريد المتابعة؟`,
          { isDanger: true, confirmText: 'نعم، متابعة البيع', cancelText: 'إلغاء' }
        );
        if (!confirmed) {
          return;
        }
      }
    }

    // Split payments payload preparation
    let splitList: Array<{ account_id: string; amount: number; method: string }> | undefined = undefined;
    if (docMode === 'SALE' && paymentType === 'SPLIT') {
      splitList = [];
      if (splitCashAmount > 0 && splitCashAccountId) {
        splitList.push({ account_id: splitCashAccountId, amount: splitCashAmount, method: 'نقدية / كاش' });
      }
      if (splitDigitalAmount > 0 && splitDigitalAccountId) {
        splitList.push({ account_id: splitDigitalAccountId, amount: splitDigitalAmount, method: 'بنك / محفظة' });
      }
    }

    const payload = {
      customer_id: selectedCustomerId,
      customer_name: custName,
      date: new Date().toISOString().slice(0, 10),
      items: cart,
      subtotal,
      discount: calculatedDiscount,
      net_total: netTotal,
      cogs_total: totalCost,
      gross_profit: grossProfit,
      payment_type: paymentType,
      account_id: paymentType === 'SPLIT' ? splitCashAccountId : selectedAccountId,
      split_payments: splitList,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      status: docMode === 'QUOTATION' ? 'QUOTATION' : 'COMPLETED',
      warehouse: selectedWarehouse,
      notes: invoiceNotes
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        const isQuo = docMode === 'QUOTATION';
        const docRef = data.invoice_number;

        const savedInvoiceObj = {
          ...payload,
          id: data.id || data.invoice_id || docRef,
          invoice_number: docRef,
          created_at: new Date().toISOString()
        };
        setLastCompletedInvoice(savedInvoiceObj);
        try {
          localStorage.setItem('dragon_pos_last_invoice', JSON.stringify(savedInvoiceObj));
        } catch (e) {
          console.error(e);
        }

        clearCart();
        loadMasterData();

        // Ask for print with SweetAlert2
        const wantPrint = await showConfirm(
          'تم الحفظ بنجاح',
          `تم حفظ ${isQuo ? 'عرض السعر' : 'فاتورة المبيعات'} برقم (${docRef}) بنجاح!\nهل ترغب في طباعة الإيصال الآن؟`,
          { confirmText: 'طباعة الإيصال', cancelText: 'لاحقاً', icon: 'success' }
        );
        if (wantPrint) {
          handlePrintThermalReceipt(savedInvoiceObj);
        }
      } else {
        showError('فشل الحفظ', data.message || 'فشل حفظ الفاتورة');
      }
    } catch (err: any) {
      showError('خطأ في الاتصال بالخادم', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Print Thermal 80mm Receipt
  const handlePrintThermalReceipt = (inv: any) => {
    const compName = companyProfile?.company_name || '';
    const compPhones = companyProfile?.phones || '';
    const compAddress = companyProfile?.address || '';
    const compFooter = companyProfile?.invoice_footer || '';
    const isQuo = inv.status === 'QUOTATION';

    const html = `
      <div style="font-family: 'Courier New', monospace, 'Cairo', sans-serif; width: 80mm; margin: auto; padding: 10px; font-size: 12px; color: #000; direction: rtl;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          ${companyProfile?.logo ? `<img src="${companyProfile.logo}" style="max-height: 45px; margin-bottom: 5px;" /><br/>` : ''}
          <strong style="font-size: 15px;">${compName}</strong><br/>
          <span>${compAddress}</span><br/>
          <span>هاتف: ${compPhones}</span><br/>
          ${companyProfile?.tax_number ? `<span>الرقم الضريبي: ${companyProfile.tax_number}</span><br/>` : ''}
          <div style="font-weight: bold; margin-top: 5px; font-size: 14px; border: 1px solid #000; padding: 2px 5px; display: inline-block;">
            ${isQuo ? 'عرض أسعار رسمي' : 'فاتورة مبيعات نقدية'}
          </div>
        </div>

        <div style="margin-bottom: 8px; font-size: 11px;">
          <div><strong>رقم الإذن:</strong> ${inv.invoice_number}</div>
          <div><strong>التاريخ:</strong> ${new Date(inv.created_at || Date.now()).toLocaleString('ar-EG')}</div>
          <div><strong>العميل:</strong> ${inv.customer_name}</div>
          ${!isQuo ? `<div><strong>طريقة السداد:</strong> ${inv.payment_type}</div>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px dashed #000; border-top: 1px dashed #000;">
              <th style="text-align: right; padding: 4px 0;">الصنف</th>
              <th style="text-align: center; padding: 4px 0;">الكمية</th>
              <th style="text-align: center; padding: 4px 0;">السعر</th>
              <th style="text-align: left; padding: 4px 0;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${(inv.items || []).map((it: any) => `
              <tr>
                <td style="padding: 3px 0;">${it.name || it.product_name}</td>
                <td style="text-align: center; padding: 3px 0;">${it.quantity}</td>
                <td style="text-align: center; padding: 3px 0;">${it.unit_price}</td>
                <td style="text-align: left; padding: 3px 0;">${Number(it.total_price || (it.quantity * it.unit_price)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000; padding-top: 6px; font-size: 12px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between;">
            <span>المجموع:</span>
            <span>${Number(inv.subtotal).toLocaleString()} ج.م</span>
          </div>
          ${Number(inv.discount) > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>الخصم:</span>
              <span>-${Number(inv.discount).toLocaleString()} ج.م</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
            <span>الصافي:</span>
            <span>${Number(inv.net_total).toLocaleString()} ج.م</span>
          </div>
          ${!isQuo ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>المدفوع:</span>
              <span>${Number(inv.paid_amount).toLocaleString()} ج.م</span>
            </div>
            ${Number(inv.remaining_amount) > 0 ? `
              <div style="display: flex; justify-content: space-between; font-weight: bold; color: red;">
                <span>المتبقي:</span>
                <span>${Number(inv.remaining_amount).toLocaleString()} ج.م</span>
              </div>
            ` : ''}
          ` : ''}
        </div>

        <div style="text-align: center; margin-top: 12px; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px;">
          ${compFooter}<br/>
          <strong>DragonStore ERP</strong>
        </div>
      </div>
    `;

    printTableOrReceipt(inv.invoice_number, html);
  };

  // Export Quotation to A4 PDF
  const handleExportQuotationA4PDF = (inv: any) => {
    const compName = companyProfile?.company_name || '';
    const compPhones = companyProfile?.phones || '';
    const compAddress = companyProfile?.address || '';
    const compFooter = companyProfile?.invoice_footer || '';

    const tableHtml = `
      <div style="font-family: 'Cairo', sans-serif; padding: 20px; direction: rtl; color: #1e293b;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0891b2; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="color: #0891b2; margin: 0; font-size: 22px;">${compName}</h1>
            <p style="margin: 3px 0; font-size: 12px; color: #64748b;">${compAddress} | هاتف: ${compPhones}</p>
            ${companyProfile?.tax_number ? `<p style="margin: 2px 0; font-size: 12px; color: #64748b;">الرقم الضريبي: ${companyProfile.tax_number} | السجل: ${companyProfile.commercial_record || '—'}</p>` : ''}
          </div>
          <div style="text-align: left;">
            <div style="background-color: #0891b2; color: #fff; padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 14px;">
              عرض أسعار رسمي
            </div>
            <p style="margin: 4px 0; font-size: 12px; font-family: monospace;">رقم العرض: <strong>${inv.invoice_number}</strong></p>
            <p style="margin: 2px 0; font-size: 11px; color: #64748b;">التاريخ: ${new Date(inv.date || Date.now()).toLocaleDateString('ar-EG')}</p>
          </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 20px; font-size: 12px;">
          <strong>موجه إلى السيد / الشركة:</strong> ${inv.customer_name}<br/>
          <span style="color: #64748b;">بناءً على طلبكم، يسرنا تقديم عرض الأسعار التالي للأصناف والخدمات المطلوبة:</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #0891b2; color: #ffffff;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 40px; text-align: center;">#</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">الصنف / البيان</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 70px; text-align: center;">الكمية</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 100px; text-align: center;">سعر الوحدة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; width: 120px; text-align: center;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${(inv.items || []).map((it: any, idx: number) => `
              <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; color: #94a3b8;">${idx + 1}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${it.name || it.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${it.quantity} ${it.unit || ''}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${Number(it.unit_price).toLocaleString()} ج.م</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: bold; color: #0891b2;">${Number(it.total_price || (it.quantity * it.unit_price)).toLocaleString()} ج.م</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <table style="width: 280px; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; text-align: right; color: #64748b;">إجمالي الأصناف:</td>
              <td style="padding: 5px; text-align: left; font-family: monospace;">${Number(inv.subtotal).toLocaleString()} ج.م</td>
            </tr>
            ${Number(inv.discount) > 0 ? `
              <tr>
                <td style="padding: 5px; text-align: right; color: #64748b;">خصم خاص:</td>
                <td style="padding: 5px; text-align: left; font-family: monospace; color: #e11d48;">-${Number(inv.discount).toLocaleString()} ج.م</td>
              </tr>
            ` : ''}
            <tr style="border-top: 2px solid #0891b2; font-weight: bold; font-size: 15px;">
              <td style="padding: 8px 5px; text-align: right; color: #0891b2;">الإجمالي الصافي:</td>
              <td style="padding: 8px 5px; text-align: left; font-family: monospace; color: #0891b2;">${Number(inv.net_total).toLocaleString()} ج.م</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b;">
          <strong>ملاحظات وشروط العرض:</strong><br/>
          ${compFooter}<br/>
          ${inv.notes ? `• ${inv.notes}<br/>` : ''}
        </div>
      </div>
    `;

    exportToPDF(`عرض_أسعار_${inv.invoice_number}`, tableHtml);
  };

  // Convert Quotation to Active Invoice
  const handleConvertQuotationToSale = (quotation: any) => {
    if (!canSale) {
      alert('ليس لديك صلاحية بيع أو إصدار فواتير مبيعات لتحويل عرض السعر إليها');
      return;
    }
    setDocMode('SALE');
    setSelectedCustomerId(quotation.customer_id || 'WALK_IN');
    setCart(quotation.items || []);
    setDiscountVal(Number(quotation.discount || 0));
    setShowHistoryModal(false);
    setFeedback({
      type: 'success',
      text: `تم تحميل عرض الأسعار (${quotation.invoice_number}) بنجاح إلى شاشة الكاشير للتحصيل الفوري!`
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Open Previous Documents history
  const handleOpenHistory = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.data || []);
        setShowHistoryModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Process Return of a Sales Invoice
  const handleReturnInvoice = async (doc: any) => {
    if (!canReturn) {
      showWarning('غير مصرح', 'ليس لديك صلاحية عمل مرتجع مبيعات!');
      return;
    }
    const confirmed = await showConfirm(
      'تأكيد مرتجع المبيعات',
      `هل أنت متأكد من عمل مرتجع كامل لفاتورة المبيعات رقم (${doc.invoice_number}) بقيمة (${Number(doc.net_total).toLocaleString()} ج.م) وإعادة الأصناف إلى المخزن؟`,
      { isDanger: true, confirmText: 'نعم، تأكيد المرتجع', cancelText: 'إلغاء' }
    );
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/sales/${doc.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('تم إتمام المرتجع', data.message || 'تم عمل مرتجع الفاتورة وتحديث المخزن بنجاح');
        handleOpenHistory();
        loadMasterData();
      } else {
        showError('فشل المرتجع', data.message || 'فشل إتمام المرتجع');
      }
    } catch (err: any) {
      showError('خطأ في الاتصال بالخادم', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn text-slate-800 dark:text-slate-100 pb-12">
      {/* Top Bar: Switch Mode, Warehouse, Suspended Bills, History */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Left: Mode Title Badge */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {docMode === 'SALE' ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">إدارة المبيعات ونقاط البيع (POS)</h3>
                  <span className="text-[10px] text-slate-400 font-bold">إصدار وتحصيل فواتير المبيعات الفورية والآجلة</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">إدارة عروض الأسعار الرسمية (Quotations)</h3>
                  <span className="text-[10px] text-slate-400 font-bold">إنشاء عروض أسعار للعملاء مع إمكانية التحويل المباشر لفواتير مبيعات</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center / Right: Warehouse selector & Action buttons (Return, Suspended, Reprint, History) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Warehouse Selector */}
          {docMode === 'SALE' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Warehouse className="w-4 h-4 text-cyan-500" />
              <SearchableSelect
                value={selectedWarehouse}
                disabled={isRestrictedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className={`bg-transparent border-none p-0 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer ${
                  isRestrictedWarehouse ? 'opacity-80 cursor-not-allowed' : ''
                }`}
                searchPlaceholder="ابحث عن مخزن..."
                minWidth="min-w-[130px]"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </SearchableSelect>
              {isRestrictedWarehouse && (
                <span className="text-[10px] text-cyan-500 font-black px-1.5 py-0.5 bg-cyan-500/10 rounded-md">
                  مخزنك المحدد
                </span>
              )}
            </div>
          )}

          {/* 1. BUTTON: Sales Return (مرتجع مبيعات) */}
          <button
            type="button"
            onClick={() => {
              if (!canReturn) {
                alert('ليس لديك صلاحية عمل مرتجع مبيعات!');
                return;
              }
              handleOpenReturnModal();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-sm active:scale-95 ${
              canReturn
                ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:from-amber-500/25 hover:to-orange-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
            }`}
            title={canReturn ? 'إرجاع فاتورة مبيعات واسترداد الأصناف للمخزن (F7)' : 'غير مصرح بمرتجع المبيعات'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>مرتجع مبيعات</span>
            <span className="text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-amber-500/20">F7</span>
          </button>

          {/* 2. BUTTON: Hold/Suspend Bill (تعليق الفاتورة الحالية) */}
          <button
            type="button"
            onClick={handleSuspendCart}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 dark:text-indigo-300 hover:from-indigo-500/25 hover:to-purple-500/25 cursor-pointer transition-all shadow-sm active:scale-95"
            title="تعليق الفاتورة الحالية مؤقتاً لخدمة عميل آخر (F2)"
          >
            <PauseCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>تعليق الفاتورة</span>
            <span className="text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-indigo-500/20">F2</span>
          </button>

          {/* 3. BUTTON: Suspended Invoices Queue (الفواتير المعلقة) */}
          <button
            type="button"
            onClick={() => setShowSuspendedModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-sm active:scale-95 ${
              suspendedCarts.length > 0
                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30 animate-pulse'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
            title="عرض واسترجاع الفواتير المعلقة مؤقتاً (F8)"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>الفواتير المعلقة</span>
            {suspendedCarts.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-amber-700">
                {suspendedCarts.length}
              </span>
            ) : (
              <span className="text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800">F8</span>
            )}
          </button>

          {/* 4. BUTTON: Reprint Invoice (إعادة طباعة فاتورة) */}
          <button
            type="button"
            onClick={handleOpenReprintModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-700 dark:text-cyan-300 hover:from-cyan-500/25 hover:to-blue-500/25 cursor-pointer transition-all shadow-sm active:scale-95"
            title="إعادة طباعة أي فاتورة سابقة أو طباعة آخر فاتورة تم بيعها (F4)"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>إعادة طباعة فاتورة</span>
            <span className="text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-cyan-500/20">F4</span>
          </button>

          {/* 5. BUTTON: Invoices & Quotations History (سجل الفواتير) */}
          <button
            type="button"
            onClick={handleOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-xs"
            title="عرض سجل جميع الفواتير وعروض الأسعار (F9)"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>سجل الفواتير</span>
            <span className="text-[9px] font-mono opacity-60 px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800">F9</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Dual Grid: Products Catalog (Left/Right depending on RTL) & Invoice Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================== */}
        {/* COLUMN 1: Products Search & Visual POS Catalog (7 cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Top Search & Barcode Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ابحث باسم المنتج، الكود، أو امسح الباركود..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredProducts.length === 1) {
                    handleSelectProduct(filteredProducts[0]);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-9 py-2.5 text-xs font-bold focus:outline-none focus:border-cyan-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Visual POS Layout: Categories Column on the Right & Products Grid on the Left */}
          <div className="flex flex-col md:flex-row gap-3 items-start">
            {/* ------------------------------------------------------------- */}
            {/* RIGHT (in RTL): Category Cards Sidebar */}
            {/* ------------------------------------------------------------- */}
            <div className="w-full md:w-48 xl:w-52 shrink-0 bg-white dark:bg-slate-900 p-2.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-500" />
                  <span>أقسام المتجر</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {categoryCards.length}
                </span>
              </div>

              {/* Scrollable Categories List */}
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[640px] p-0.5 custom-scrollbar">
                {/* "ALL" Categories Card */}
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className={`w-full text-right p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 group relative shrink-0 ${
                    categoryFilter === 'ALL'
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm ring-2 ring-cyan-500/20'
                      : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                    categoryFilter === 'ALL'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-xs truncate">جميع الأصناف</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {products.length} منتج
                    </div>
                  </div>
                  {categoryFilter === 'ALL' && (
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  )}
                </button>

                {/* Specific Category Cards with Image/Icon */}
                {categoryCards.map(cat => {
                  const isSelected = categoryFilter === cat.name;
                  const IconComp = getCategoryIcon(cat.name);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.name)}
                      className={`w-full text-right p-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 group relative shrink-0 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-sm ring-2 ring-cyan-500/20'
                          : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e: any) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isSelected ? 'bg-cyan-500/20 text-cyan-600' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                          }`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-black text-xs truncate" title={cat.name}>
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cat.count} منتج
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* LEFT (in RTL): Products Grid of Selected Category */}
            {/* ------------------------------------------------------------- */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Category Breadcrumb & Active Info */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {categoryFilter === 'ALL' ? 'جميع المنتجات' : `قسم: ${categoryFilter}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mr-2">
                      ({filteredProducts.length} صنف متاح)
                    </span>
                  </div>
                </div>

                {categoryFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className="text-[11px] font-bold text-cyan-600 hover:text-cyan-500 cursor-pointer flex items-center gap-1"
                  >
                    <span>عرض الكل</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Products Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto p-0.5 custom-scrollbar">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                      <PackageSearch className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                      {searchTerm ? 'لا توجد منتجات مطابقة لكلمة البحث' : `لا توجد منتجات في قسم "${categoryFilter}"`}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {searchTerm ? 'جرب البحث بكلمة أخرى أو كود مختلف' : 'اختر تصنيفاً آخر أو اضغط على جميع الأصناف لعرض المنتجات'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('ALL');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-sm transition-all"
                    >
                      إعادة ضبط وعرض كل المنتجات
                    </button>
                  </div>
                ) : (
                  filteredProducts.map(p => {
                    const isOutOfStock = docMode === 'SALE' && p.current_stock <= 0;
                    const hasVarPrice = Boolean(Number(p.is_variable_price));
                    const hasVarCost = Boolean(Number(p.is_variable_cost));

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && handleSelectProduct(p)}
                        className={`bg-white dark:bg-slate-900 border rounded-2xl p-3 flex flex-col justify-between transition-all group relative ${
                          isOutOfStock
                            ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-700 cursor-not-allowed'
                            : 'hover:shadow-lg hover:border-cyan-500/60 hover:-translate-y-0.5 cursor-pointer border-slate-200 dark:border-slate-800 active:scale-98'
                        }`}
                      >
                        {/* Variable Price Badge */}
                        {(hasVarPrice || hasVarCost) && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 z-10">
                            {hasVarPrice && hasVarCost ? 'سعر/تكلفة متغيرة' : hasVarPrice ? 'سعر متغير' : 'تكلفة متغيرة'}
                          </span>
                        )}

                        {/* Top: Product Image / Thumbnail */}
                        <div className="w-full h-24 mb-2.5 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative border border-slate-100 dark:border-slate-800/80">
                          {p.image_data ? (
                            <img
                              src={p.image_data}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 transition-colors">
                              <Package className="w-8 h-8 opacity-60" />
                            </div>
                          )}

                          {/* Quick Add Overlay Icon */}
                          {!isOutOfStock && (
                            <div className="absolute inset-0 bg-cyan-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-black text-[10px] shadow-sm flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                <span>إضافة للسلة</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 font-mono">
                              <span>{p.code}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 truncate max-w-[80px]">
                                {p.category}
                              </span>
                            </div>
                            <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 line-clamp-2 mt-1 group-hover:text-cyan-500 transition-colors">
                              {p.name}
                            </h4>
                          </div>

                          {/* Price & Stock */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                            <div className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                              {Number(p.sell_price).toLocaleString()} <span className="text-[10px]">ج.م</span>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.current_stock <= 0 
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {p.current_stock <= 0 ? 'نفد' : `${p.current_stock} ${p.unit}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 2: Cart / Invoice Panel (5 cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden sticky top-20">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${docMode === 'SALE' ? 'bg-cyan-500 animate-pulse' : 'bg-purple-500'}`} />
              <h3 className="font-black text-xs text-slate-900 dark:text-slate-100">
                {docMode === 'SALE' ? 'سلة المبيعات الحالية' : 'مسودة عرض الأسعار'}
              </h3>
              <span className="text-[11px] text-slate-400">({cart.length} أصناف)</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Suspend Bill (Hold) Button */}
              <button
                type="button"
                onClick={handleSuspendCart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer shadow-xs active:scale-95 transition-all"
                title="تعليق الفاتورة الحالية مؤقتاً لخدمة عميل آخر (F2)"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>تعليق</span>
              </button>

              {/* Suspended Carts Queue Quick Trigger */}
              {suspendedCarts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSuspendedModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-xs transition-all animate-pulse"
                  title="فتح قائمة الفواتير المعلقة (F8)"
                >
                  <span>المعلقة</span>
                  <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] flex items-center justify-center font-bold">
                    {suspendedCarts.length}
                  </span>
                </button>
              )}

              {/* Clear Cart */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                  title="تفريغ السلة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Selection Row */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">العميل المستفيد: *</label>
            <SearchableSelect
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
              searchPlaceholder="ابحث باسم العميل أو رقم الهاتف..."
            >
              <option value="WALK_IN">عميل نقدي فوري (Walk-in Customer)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} - رصيد: {Number(c.balance).toLocaleString()} ج.م
                </option>
              ))}
            </SearchableSelect>
          </div>

          {/* Cart Items List */}
          <div className="max-h-[290px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="text-xs font-bold">السلة فارغة</div>
                <div className="text-[11px]">اختر منتجات من الكتالوج أو امسح الباركود لبدء الفاتورة</div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>الكود: {item.code}</span>
                      <span>•</span>
                      <span>سعر الوحدة: {item.unit_price.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateCartQty(item.product_id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateCartQty(item.product_id, Number(e.target.value))}
                      className="w-10 text-center font-black text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 focus:outline-none"
                    />
                    <button
                      onClick={() => updateCartQty(item.product_id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-left shrink-0 min-w-[70px]">
                    <div className="font-mono font-black text-xs text-cyan-600 dark:text-cyan-400">
                      {item.total_price.toLocaleString()} ج.م
                    </div>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-rose-400 hover:text-rose-600 p-1 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Financial Calculation & Checkout Area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            {/* Subtotal & Discount Row */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{subtotal.toLocaleString()} ج.م</span>
              </div>

              {/* Discount control */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">الخصم:</span>
                <div className="flex items-center gap-1.5">
                  <SearchableSelect
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold p-1 min-w-[70px]"
                  >
                    <option value="AMOUNT">ج.م</option>
                    <option value="PERCENT">%</option>
                  </SearchableSelect>
                  <input
                    type="number"
                    min="0"
                    value={discountVal}
                    onChange={e => setDiscountVal(Number(e.target.value))}
                    placeholder="0"
                    className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 text-center font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Net Total Highlight */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-black">
                <span className="text-slate-800 dark:text-slate-100 text-sm">الإجمالي الصافي:</span>
                <span className="text-base font-mono text-cyan-600 dark:text-cyan-400">
                  {netTotal.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Payment Details (Only for Sale Mode) */}
            {docMode === 'SALE' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">طريقة الدفع والتحصيل:</label>
                  <div className={`grid ${canCredit ? 'grid-cols-5' : 'grid-cols-4'} gap-1 text-[10px] font-bold`}>
                    {[
                      { id: 'CASH', label: 'كاش' },
                      { id: 'INSTAPAY', label: 'إنستاباي' },
                      { id: 'WALLET', label: 'محفظة' },
                      { id: 'SPLIT', label: 'تقسيم' },
                      ...(canCredit ? [{ id: 'CREDIT', label: 'آجل' }] : [])
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentType(m.id as any)}
                        className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentType === m.id
                            ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. كاش: قائمة بالخزائن النقدية */}
                {paymentType === 'CASH' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الخزينة النقدية المستلمة:</label>
                    <SearchableSelect
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                      searchPlaceholder="ابحث عن خزينة نقدية..."
                    >
                      {cashAccounts.length > 0 ? (
                        cashAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (رصيد: {Number(acc.balance).toLocaleString()} ج.م)</option>
                        ))
                      ) : (
                        <option value="">لا توجد خزائن نقدية متاحة</option>
                      )}
                    </SearchableSelect>
                  </div>
                )}

                {/* 2. إنستاباي: قائمة بالحسابات البنكية */}
                {paymentType === 'INSTAPAY' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الحساب البنكي (إنستاباي / تحويل):</label>
                    <SearchableSelect
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                      searchPlaceholder="ابحث عن حساب بنكي..."
                    >
                      {bankAccounts.length > 0 ? (
                        bankAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (رصيد: {Number(acc.balance).toLocaleString()} ج.م)</option>
                        ))
                      ) : (
                        <option value="">لا توجد حسابات بنكية مسجلة</option>
                      )}
                    </SearchableSelect>
                  </div>
                )}

                {/* 3. محفظة إلكترونية: قائمة بالمحافظ الإلكترونية */}
                {paymentType === 'WALLET' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">المحفظة الإلكترونية المستلمة (فودافون كاش / وغيرها):</label>
                    <SearchableSelect
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                      searchPlaceholder="ابحث عن محفظة إلكترونية..."
                    >
                      {walletAccounts.length > 0 ? (
                        walletAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (رصيد: {Number(acc.balance).toLocaleString()} ج.م)</option>
                        ))
                      ) : (
                        <option value="">لا توجد محافظ إلكترونية مسجلة</option>
                      )}
                    </SearchableSelect>
                  </div>
                )}

                {/* 4. خيار تقسيم الدفع (كاش + إنستاباي / محفظة) */}
                {paymentType === 'SPLIT' && (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-cyan-500/30 space-y-2">
                    <div className="text-[10px] font-black text-cyan-600 dark:text-cyan-400">
                      ⚖️ تقسيم المبلغ بين نقدية (كاش) وإلكتروني (بنك / محفظة):
                    </div>

                    {/* الجزء النقدي */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">مبلغ الكاش (ج.م):</label>
                        <input
                          type="number"
                          min="0"
                          max={netTotal}
                          value={splitCashAmount}
                          onChange={e => handleSplitCashChange(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-center font-mono font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">إيداع كاش في الخزينة:</label>
                        <SearchableSelect
                          value={splitCashAccountId}
                          onChange={e => setSplitCashAccountId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-[11px] font-bold focus:outline-none"
                          searchPlaceholder="ابحث عن خزينة..."
                        >
                          {cashAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </SearchableSelect>
                      </div>
                    </div>

                    {/* الجزء الإلكتروني (حساب بنكي أو محفظة) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">المتبقي إلكتروني (ج.م):</label>
                        <input
                          type="number"
                          min="0"
                          value={splitDigitalAmount}
                          onChange={e => handleSplitDigitalChange(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-center font-mono font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">إيداع في بنك / محفظة:</label>
                        <SearchableSelect
                          value={splitDigitalAccountId}
                          onChange={e => setSplitDigitalAccountId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-1 text-[11px] font-bold focus:outline-none"
                          searchPlaceholder="ابحث عن بنك أو محفظة..."
                        >
                          {digitalAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </SearchableSelect>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. آجل: تنبيه باختيار العميل */}
                {paymentType === 'CREDIT' && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                    ⚠️ بيع آجل بالكامل: سيتم ترحيل كامل الفاتورة ({netTotal.toLocaleString()} ج.م) كمديونية على حساب العميل المختار.
                  </div>
                )}

                {/* Paid & Remaining display */}
                {paymentType !== 'SPLIT' && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المدفوع الآن:</label>
                      <input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={e => {
                          const val = Number(e.target.value);
                          if (!canCredit && val < netTotal) {
                            alert('ليس لديك صلاحية البيع بالآجل أو تسجيل متبقي. يجب تحصيل كامل المبلغ.');
                            return;
                          }
                          setPaidAmount(val);
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 text-center font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المتبقي على الحساب:</label>
                      <input
                        type="text"
                        readOnly
                        value={`${remainingAmount.toLocaleString()} ج.م`}
                        className={`w-full border rounded-xl p-1.5 text-center font-mono font-bold ${
                          remainingAmount > 0 
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/40 text-rose-500' 
                            : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick POS Cashier Operations Strip (Hold, Return, Reprint) */}
            <div className="pt-2 grid grid-cols-3 gap-2">
              {/* 1. Hold Bill */}
              <button
                type="button"
                onClick={handleSuspendCart}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black border border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer shadow-xs active:scale-95"
                title="تعليق الفاتورة الحالية مؤقتاً لخدمة عميل آخر (F2)"
              >
                <PauseCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>تعليق الفاتورة</span>
              </button>

              {/* 2. Sales Return */}
              <button
                type="button"
                onClick={() => {
                  if (!canReturn) {
                    alert('ليس لديك صلاحية عمل مرتجع مبيعات!');
                    return;
                  }
                  handleOpenReturnModal();
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  canReturn
                    ? 'border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
                title={canReturn ? 'إرجاع فاتورة مبيعات واسترداد الأصناف للمخزن (F7)' : 'غير مصرح بمرتجع المبيعات'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>مرتجع مبيعات</span>
              </button>

              {/* 3. Reprint */}
              <button
                type="button"
                onClick={handleOpenReprintModal}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black border border-cyan-500/30 bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-all cursor-pointer shadow-xs active:scale-95"
                title="إعادة طباعة آخر فاتورة أو أي إيصال سابق (F4)"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>إعادة طباعة</span>
              </button>
            </div>

            {/* Submit Action Button */}
            <div className="pt-1 space-y-2">
              {docMode === 'SALE' && !canSale && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>حسابك يملك صلاحية عرض الصفحة فقط. تم تعطيل إصدار فواتير البيع.</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleSubmitInvoice}
                disabled={submitting || cart.length === 0 || (docMode === 'SALE' && !canSale)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black text-white shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                  docMode === 'SALE' 
                    ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/30' 
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                }`}
              >
                {docMode === 'SALE' ? <CheckCircle2 className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                <span>
                  {submitting 
                    ? 'جارٍ الحفظ...' 
                    : docMode === 'SALE' 
                    ? (canSale ? `إتمام وتحصيل الفاتورة (${netTotal.toLocaleString()} ج.م)` : 'غير مصرح بإصدار فواتير بيع') 
                    : `حفظ واستخراج عرض الأسعار (${netTotal.toLocaleString()} ج.م)`}
                </span>
              </button>

              {/* POS Keyboard Shortcuts Legend */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800/80">
                <span>⚡ اختصارات:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">F2 تعليق</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">F4 إعادة طباعة</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">F7 مرتجع</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">F8 المعلقة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Variable Price / Cost Popup Prompt */}
      {/* ========================================================================= */}
      {promptType && pendingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fadeIn relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>
                  {promptType === 'BOTH' ? 'تحديد سعر الشراء وسعر البيع' : promptType === 'PRICE' ? 'تحديد سعر البيع' : 'تحديد سعر التكلفة'}
                </span>
              </h3>
              <button 
                onClick={() => { setPromptType(null); setPendingProduct(null); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 mb-4 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">{pendingProduct.name}</div>
              <div className="text-slate-400">الكود: {pendingProduct.code} • التصنيف: {pendingProduct.category}</div>
            </div>

            <form onSubmit={handleConfirmPrompt} className="space-y-4 text-xs">
              {/* Cost input if BOTH or COST */}
              {(promptType === 'BOTH' || promptType === 'COST') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر الشراء / التكلفة (ج.م): *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={promptCost}
                    onChange={e => setPromptCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-600 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">التكلفة المسجلة بالكتالوج: {pendingProduct.buy_price} ج.م</span>
                </div>
              )}

              {/* Price input if BOTH or PRICE */}
              {(promptType === 'BOTH' || promptType === 'PRICE') && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر البيع لهذه الفاتورة (ج.م): *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={promptPrice}
                    onChange={e => setPromptPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-black text-emerald-600 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>السعر الافتراضي: {pendingProduct.sell_price} ج.م</span>
                    {pendingProduct.min_sell_price > 0 && <span>الحد الأدنى: {pendingProduct.min_sell_price} ج.م</span>}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setPromptType(null); setPendingProduct(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30 cursor-pointer"
                >
                  تأكيد وإضافة للسلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: History of Sales & Quotations */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-fadeIn relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-cyan-500" />
                  <span>سجل فواتير المبيعات وعروض الأسعار</span>
                </h3>
                <span className="text-xs text-slate-500">
                  عرض وطباعة الفواتير السابقة أو تحويل عروض الأسعار إلى فواتير مبيعات
                </span>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-y-auto my-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">النوع</th>
                    <th className="p-3">رقم الإذن</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3 text-center">الصافي</th>
                    <th className="p-3 text-center">طريقة السداد</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyList.map(doc => {
                    const isQuo = doc.status === 'QUOTATION';
                    const isReturned = doc.status === 'RETURNED';
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReturned
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : isQuo 
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isReturned ? 'مرتجع مبيعات' : isQuo ? 'عرض أسعار' : 'فاتورة مبيعات'}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {doc.invoice_number}
                        </td>
                        <td className="p-3 text-slate-500">
                          {doc.date}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {doc.customer_name}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600">
                          {Number(doc.net_total).toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center text-slate-500 font-bold">
                          {isQuo ? '—' : doc.payment_type}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Print Receipt */}
                            <button
                              onClick={() => handlePrintThermalReceipt(doc)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 cursor-pointer"
                              title="طباعة إيصال كاشير"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Export A4 PDF */}
                            <button
                              onClick={() => handleExportQuotationA4PDF(doc)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="تصدير A4 PDF رسمي"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Return Button */}
                            {!isQuo && !isReturned && (
                              <button
                                onClick={() => handleReturnInvoice(doc)}
                                disabled={!canReturn}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  canReturn
                                    ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                                }`}
                                title={canReturn ? 'عمل مرتجع كامل لهذه الفاتورة' : 'ليس لديك صلاحية عمل مرتجع مبيعات'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Convert Quotation to Sale Button */}
                            {isQuo && (
                              <button
                                onClick={() => handleConvertQuotationToSale(doc)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors shadow-xs"
                                title="تحويل عرض الأسعار هذا إلى فاتورة مبيعات فعلية"
                              >
                                تحويل لفاتورة
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Dedicated Sales Return Modal (مرتجع مبيعات) */}
      {/* ========================================================================= */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-fadeIn relative my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-500" />
                  <span>إرجاع فاتورة مبيعات (مرتجع مبيعات)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدد الفاتورة المراد عمل مرتجع لها لإعادة المنتجات للمخزن ورد المبلغ للخزينة أو تخفيض حساب العميل
                </p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-4 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الفاتورة (مثال: INV-...) أو اسم العميل..."
                  value={returnSearch}
                  onChange={e => setReturnSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Invoices List / Selected Detail */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              {selectedDocForReturn ? (
                /* Detail of selected invoice to return */
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-400">الفاتورة المحددة للإرجاع:</span>
                      <h4 className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                        {selectedDocForReturn.invoice_number} • العميل: {selectedDocForReturn.customer_name}
                      </h4>
                      <span className="text-[11px] text-slate-500">التاريخ: {selectedDocForReturn.date} | المخزن: {selectedDocForReturn.warehouse || 'الرئيسي'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDocForReturn(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      ← العودة لقائمة الفواتير
                    </button>
                  </div>

                  {/* Items in Invoice */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">الأصناف التي سيتم إرجاعها للمخزن:</h5>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">اسم الصنف</th>
                            <th className="p-2.5 text-center">الكمية</th>
                            <th className="p-2.5 text-center">السعر</th>
                            <th className="p-2.5 text-center">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(selectedDocForReturn.items || []).map((it: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-2.5 text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{it.name || it.product_name}</td>
                              <td className="p-2.5 text-center font-black text-purple-600">{it.quantity}</td>
                              <td className="p-2.5 text-center font-mono">{Number(it.unit_price).toLocaleString()} ج.م</td>
                              <td className="p-2.5 text-center font-mono font-bold text-rose-600">{Number(it.total_price || (it.quantity * it.unit_price)).toLocaleString()} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Refund summary alert */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block">إجمالي قيمة المرتجع المستردة:</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                        {Number(selectedDocForReturn.net_total).toLocaleString()} ج.م
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        await handleReturnInvoice(selectedDocForReturn);
                        setSelectedDocForReturn(null);
                        setShowReturnModal(false);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{loading ? 'جارٍ تنفيذ المرتجع...' : 'تأكيد إرجاع الفاتورة بالكامل'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* List of eligible completed invoices */
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3 text-center">الصافي</th>
                      <th className="p-3 text-center">طريقة الدفع</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyList
                      .filter(d => 
                        d.status === 'COMPLETED' &&
                        (!returnSearch || 
                          d.invoice_number?.toLowerCase().includes(returnSearch.toLowerCase()) || 
                          d.customer_name?.toLowerCase().includes(returnSearch.toLowerCase()) ||
                          d.date?.includes(returnSearch))
                      )
                      .map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            {doc.invoice_number}
                          </td>
                          <td className="p-3 text-slate-500">{doc.date}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{doc.customer_name}</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600">
                            {Number(doc.net_total).toLocaleString()} ج.م
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500">{doc.payment_type}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedDocForReturn(doc)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-100 cursor-pointer transition-colors"
                            >
                              معاينة وإرجاع
                            </button>
                          </td>
                        </tr>
                      ))}
                    {historyList.filter(d => d.status === 'COMPLETED').length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          لا توجد فواتير مبيعات مكتملة صالحة للمرتجع حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Dedicated Invoice Reprint Modal (إعادة طباعة فاتورة) */}
      {/* ========================================================================= */}
      {showReprintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-fadeIn relative my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-cyan-500" />
                  <span>إعادة طباعة الفواتير والإيصالات</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  إعادة طباعة إيصالات الكاشير الفورية (80mm) أو استخراج نسخة A4 PDF لأي فاتورة سابقة
                </p>
              </div>
              <button onClick={() => setShowReprintModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Reprint Last Completed Sale */}
            {lastCompletedInvoice && (
              <div className="my-3 p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">
                    ⚡ طباعة سريعة لآخر فاتورة مسجلة:
                  </span>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-0.5">
                    رقم الفاتورة: <strong className="font-mono text-cyan-600">{lastCompletedInvoice.invoice_number}</strong> • العميل: {lastCompletedInvoice.customer_name} • الصافي: {Number(lastCompletedInvoice.net_total).toLocaleString()} ج.م
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePrintThermalReceipt(lastCompletedInvoice)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة كاشير (80mm)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportQuotationA4PDF(lastCompletedInvoice)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-500" />
                    <span>A4 PDF</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="mb-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الفاتورة، اسم العميل، أو التاريخ..."
                  value={reprintSearch}
                  onChange={e => setReprintSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Invoices List Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">النوع</th>
                    <th className="p-3">رقم الإذن</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3 text-center">الصافي</th>
                    <th className="p-3 text-center">إعادة الطباعة والتصدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyList
                    .filter(doc =>
                      !reprintSearch ||
                      doc.invoice_number?.toLowerCase().includes(reprintSearch.toLowerCase()) ||
                      doc.customer_name?.toLowerCase().includes(reprintSearch.toLowerCase()) ||
                      doc.date?.includes(reprintSearch)
                    )
                    .map(doc => {
                      const isQuo = doc.status === 'QUOTATION';
                      const isReturned = doc.status === 'RETURNED';

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isReturned
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                                : isQuo
                                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                            }`}>
                              {isReturned ? 'مرتجع' : isQuo ? 'عرض أسعار' : 'فاتورة مبيعات'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            {doc.invoice_number}
                          </td>
                          <td className="p-3 text-slate-500">{doc.date}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{doc.customer_name}</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600">
                            {Number(doc.net_total).toLocaleString()} ج.م
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePrintThermalReceipt(doc)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 border border-cyan-500/30 hover:bg-cyan-100 cursor-pointer"
                                title="طباعة إيصال كاشير (80mm)"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>إيصال 80mm</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExportQuotationA4PDF(doc)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-500/30 hover:bg-rose-100 cursor-pointer"
                                title="تصدير A4 PDF"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                <span>A4 PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowReprintModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Dedicated Suspended Bills Queue Modal (الفواتير المعلقة) */}
      {/* ========================================================================= */}
      {showSuspendedModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-fadeIn relative my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <PauseCircle className="w-5 h-5 text-amber-500" />
                  <span>الفواتير المعلقة مؤقتاً ({suspendedCarts.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  قائمة الفواتير التي تم تعليقها لحساب عملاء آخرين، يمكنك استرجاع أي فاتورة بضغطة زر واحدة
                </p>
              </div>
              <button onClick={() => setShowSuspendedModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Suspended Carts */}
            <div className="flex-1 overflow-y-auto my-4 space-y-3">
              {suspendedCarts.length === 0 ? (
                <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <PauseCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                  <div className="text-xs font-bold">لا توجد فواتير معلقة حالياً</div>
                  <div className="text-[11px] max-w-xs text-slate-400">
                    لتعليق فاتورة، أضف أصنافاً إلى سلة المبيعات ثم اضغط على زر <strong>"تعليق الفاتورة"</strong> في رأس السلة.
                  </div>
                </div>
              ) : (
                suspendedCarts.map((hold, idx) => (
                  <div
                    key={hold.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">
                          {hold.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {hold.time}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 mr-8">
                        {hold.items.length} أصناف • القيمة التقديرية: <strong className="text-amber-600 font-mono">{Number(hold.total || hold.items.reduce((s, it) => s + it.total_price, 0)).toLocaleString()} ج.م</strong>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5 mr-8">
                        {hold.items.slice(0, 4).map((it, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                            {it.name} ({it.quantity})
                          </span>
                        ))}
                        {hold.items.length > 4 && (
                          <span className="text-[9px] text-slate-400">+{hold.items.length - 4} أخرى</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => handleResumeCart(hold)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-sm cursor-pointer active:scale-95 transition-all"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>استرجاع للسلة</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            'حذف الفاتورة المعلقة',
                            `هل أنت متأكد من حذف الفاتورة المعلقة رقم #${idx + 1}؟`,
                            { isDanger: true, confirmText: 'نعم، حذف', cancelText: 'إلغاء' }
                          );
                          if (confirmed) {
                            setSuspendedCarts(prev => prev.filter(h => h.id !== hold.id));
                            showToast('تم حذف الفاتورة المعلقة');
                          }
                        }}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="حذف هذه الفاتورة المعلقة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowSuspendedModal(false)}
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
