import React, { useState, useEffect, useRef } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { printTableOrReceipt, exportToPDF, exportToExcel } from '../utils/exportUtils';

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
  items: CartItem[];
  discount: number;
  mode: 'SALE' | 'QUOTATION';
}

export const SalesAndPosView: React.FC = () => {
  // Mode: Sale Invoice or Price Quotation
  const [docMode, setDocMode] = useState<'SALE' | 'QUOTATION'>('SALE');

  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('مخزن المتجر الرئيسي');

  // Cart & Invoice Form state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('WALK_IN');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'BANK' | 'INSTAPAY'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
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

  // Suspended Carts (Hold Invoices)
  const [suspendedCarts, setSuspendedCarts] = useState<SuspendedCart[]>([]);

  // Previous Invoices / Quotations list Modal
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [inspectingDoc, setInspectingDoc] = useState<any | null>(null);

  // Company Settings for Receipt Header/Footer
  const [companyProfile, setCompanyProfile] = useState<any>(null);

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
      const [prodRes, custRes, accRes, whRes, compRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/accounts'),
        fetch('/api/warehouses'),
        fetch('/api/settings/company')
      ]);

      const [pData, cData, aData, wData, compData] = await Promise.all([
        safeJson(prodRes),
        safeJson(custRes),
        safeJson(accRes),
        safeJson(whRes),
        safeJson(compRes)
      ]);

      if (pData.success) setProducts(pData.data || []);
      if (cData.success) setCustomers(cData.data || []);
      if (aData.success) {
        setAccounts(aData.data || []);
        if (aData.data?.length > 0 && !selectedAccountId) {
          setSelectedAccountId(aData.data[0].id);
        }
      }
      if (wData.success && wData.data?.length > 0) {
        setWarehouses(wData.data);
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

  // Filter products by search and category
  const categoriesList = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
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
  const handleConfirmPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingProduct) return;

    if (promptPrice <= 0 && promptType !== 'COST') {
      alert('يرجى إدخال سعر بيع صحيح أكبر من صفر');
      return;
    }

    if (pendingProduct.min_sell_price > 0 && promptPrice < pendingProduct.min_sell_price && promptType !== 'COST') {
      if (!window.confirm(`تنبيه: سعر البيع المدخل (${promptPrice} ج.م) أقل من الحد الأدنى المسموح به للبيع (${pendingProduct.min_sell_price} ج.م). هل أنت متأكد من المتابعة؟`)) {
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

  // Keep paidAmount synced with netTotal for Cash / Bank payments by default
  useEffect(() => {
    if (paymentType === 'CASH' || paymentType === 'BANK' || paymentType === 'INSTAPAY') {
      setPaidAmount(netTotal);
    } else if (paymentType === 'CREDIT') {
      setPaidAmount(0);
    }
  }, [netTotal, paymentType]);

  // Suspend current cart (Hold Invoice)
  const handleSuspendCart = () => {
    if (cart.length === 0) return;
    const cust = customers.find(c => c.id === selectedCustomerId);
    const newHold: SuspendedCart = {
      id: `hold-${Date.now()}`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      customerName: cust ? cust.name : 'عميل نقدي',
      items: cart,
      discount: discountVal,
      mode: docMode
    };
    setSuspendedCarts(prev => [newHold, ...prev]);
    clearCart();
    setFeedback({ type: 'success', text: 'تم تعليق الفاتورة بنجاح ويمكن استرجاعها في أي وقت' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Resume suspended cart
  const handleResumeCart = (hold: SuspendedCart) => {
    if (cart.length > 0) {
      if (!window.confirm('يوجد أصناف في السلة الحالية، هل تريد استبدالها بالفاتورة المعلقة؟')) {
        return;
      }
    }
    setCart(hold.items);
    setDiscountVal(hold.discount);
    setDocMode(hold.mode);
    setSuspendedCarts(prev => prev.filter(h => h.id !== hold.id));
  };

  // Submit Sale Invoice or Quotation
  const handleSubmitInvoice = async () => {
    if (cart.length === 0) {
      alert('السلة فارغة، يرجى إضافة منتجات أولاً');
      return;
    }

    const cust = customers.find(c => c.id === selectedCustomerId);
    const custName = cust ? cust.name : 'عميل نقدي / عام';

    // Credit validation
    if (docMode === 'SALE' && (paymentType === 'CREDIT' || remainingAmount > 0)) {
      if (selectedCustomerId === 'WALK_IN') {
        alert('لا يمكن إجراء بيع آجل أو متبقي على حساب عميل نقدي عام! يرجى اختيار عميل مسجل.');
        return;
      }
      if (cust && cust.credit_limit > 0 && (Number(cust.balance) + remainingAmount) > cust.credit_limit) {
        if (!window.confirm(`تنبيه: مديونية العميل بعد هذه الفاتورة (${Number(cust.balance) + remainingAmount} ج.م) ستتجاوز الحد الائتماني المسموح به (${cust.credit_limit} ج.م). هل تريد المتابعة؟`)) {
          return;
        }
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
      account_id: selectedAccountId,
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

        // Ask for print
        if (window.confirm(`تم حفظ ${isQuo ? 'عرض السعر' : 'فاتورة المبيعات'} برقم (${docRef}) بنجاح!\n\nهل ترغب في طباعة الإيصال الآن؟`)) {
          handlePrintThermalReceipt({
            ...payload,
            invoice_number: docRef,
            created_at: new Date().toISOString()
          });
        }

        clearCart();
        loadMasterData();
      } else {
        alert(data.message || 'فشل حفظ الفاتورة');
      }
    } catch (err: any) {
      alert('خطأ في الاتصال بالخادم: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Print Thermal 80mm Receipt
  const handlePrintThermalReceipt = (inv: any) => {
    const compName = companyProfile?.company_name || 'دراجون للأنظمة والحلول المتكاملة';
    const compPhones = companyProfile?.phones || '01050016289';
    const compAddress = companyProfile?.address || 'القاهرة - المقر الرئيسي';
    const compFooter = companyProfile?.invoice_footer || 'شكراً لتعاملكم معنا';
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
    const compName = companyProfile?.company_name || 'دراجون للأنظمة والحلول المتكاملة';
    const compPhones = companyProfile?.phones || '01050016289';
    const compAddress = companyProfile?.address || 'القاهرة - المقر الرئيسي';
    const compFooter = companyProfile?.invoice_footer || 'يسري هذا العرض لمدة 15 يوماً من تاريخ إصداره.';

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

  return (
    <div className="space-y-4 animate-fadeIn text-slate-800 dark:text-slate-100 pb-12">
      {/* Top Bar: Switch Mode, Warehouse, Suspended Bills, History */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Left: Mode Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setDocMode('SALE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                docMode === 'SALE'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>فاتورة مبيعات وكاشير (POS)</span>
            </button>

            <button
              onClick={() => setDocMode('QUOTATION')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                docMode === 'QUOTATION'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>عرض أسعار رسمي (Quotation)</span>
            </button>
          </div>
        </div>

        {/* Center / Right: Warehouse selector & Suspended / History buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Warehouse */}
          {docMode === 'SALE' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Warehouse className="w-4 h-4 text-cyan-500" />
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Suspended Carts (Hold Invoices) */}
          {suspendedCarts.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <PauseCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>معلق ({suspendedCarts.length}):</span>
              </span>
              <div className="flex gap-1 overflow-x-auto max-w-[200px]">
                {suspendedCarts.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => handleResumeCart(h)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-100 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                    title={`استرجاع فاتورة ${h.customerName} (${h.time})`}
                  >
                    <PlayCircle className="w-3 h-3" />
                    <span>#{i + 1} {h.customerName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Previous Invoices / Quotations History Button */}
          <button
            onClick={handleOpenHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-cyan-500" />
            <span>سجل الفواتير والعروض</span>
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
        {/* COLUMN 1: Products Search & Grid (7 cols) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar & Barcode Scanner Input */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="ابحث باسم المنتج، الكود، أو امسح الباركود مباشرة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredProducts.length === 1) {
                    handleSelectProduct(filteredProducts[0]);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Categories Filter Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-cyan-500 text-white font-black shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                الكل ({products.length})
              </button>
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-cyan-500 text-white font-black shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({products.filter(p => p.category === cat).length})
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto p-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                لا توجد منتجات مطابقة لمعايير البحث
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
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 flex flex-col justify-between transition-all group relative ${
                      isOutOfStock
                        ? 'opacity-50 border-dashed border-slate-300 dark:border-slate-700 cursor-not-allowed'
                        : 'hover:shadow-md hover:border-cyan-500/50 cursor-pointer border-slate-200 dark:border-slate-800 active:scale-98'
                    }`}
                  >
                    {/* Variable Price Badge */}
                    {(hasVarPrice || hasVarCost) && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        {hasVarPrice && hasVarCost ? 'سعر/تكلفة متغيرة' : hasVarPrice ? 'سعر متغير' : 'تكلفة متغيرة'}
                      </span>
                    )}

                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5 group-hover:text-cyan-500 transition-colors">
                        {p.name}
                      </h4>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.category}</div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                          {Number(p.sell_price).toLocaleString()} <span className="text-[10px]">ج.م</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.current_stock <= 0 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {p.current_stock} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
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
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleSuspendCart}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-500/30 hover:bg-amber-100 cursor-pointer transition-colors"
                  title="تعليق الفاتورة الحالية مؤقتاً لخدمة عميل آخر"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>تعليق</span>
                </button>
              )}

              {/* Clear Cart */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
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
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="WALK_IN">عميل نقدي فوري (Walk-in Customer)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} - رصيد: {Number(c.balance).toLocaleString()} ج.م
                </option>
              ))}
            </select>
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
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold p-1"
                  >
                    <option value="AMOUNT">ج.م</option>
                    <option value="PERCENT">%</option>
                  </select>
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
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {/* Payment Method */}
                <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                  {[
                    { id: 'CASH', label: 'كاش / نقدية' },
                    { id: 'BANK', label: 'شبكة / بنك' },
                    { id: 'INSTAPAY', label: 'إنستاباي' },
                    { id: 'CREDIT', label: 'آجل / حساب' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentType(m.id as any)}
                      className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentType === m.id
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Treasury / Account selector (if not purely CREDIT) */}
                {paymentType !== 'CREDIT' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">إيداع النقدية في خزينة / حساب:</label>
                    <select
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (رصيد: {Number(acc.balance).toLocaleString()} ج.م)</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Paid & Remaining */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المدفوع الآن:</label>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={e => setPaidAmount(Number(e.target.value))}
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
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitInvoice}
                disabled={submitting || cart.length === 0}
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
                    ? `إتمام وتحصيل الفاتورة (${netTotal.toLocaleString()} ج.م)` 
                    : `حفظ واستخراج عرض الأسعار (${netTotal.toLocaleString()} ج.م)`}
                </span>
              </button>
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
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isQuo 
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isQuo ? 'عرض أسعار' : 'فاتورة مبيعات'}
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
    </div>
  );
};
