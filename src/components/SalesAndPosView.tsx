import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { globalErpStore, Product, SaleItem } from '../store/erpStore';

export const SalesAndPosView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'INSTAPAY'>('CASH');
  const [discount, setDiscount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers')
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        if (pData.success && Array.isArray(pData.data)) {
          const prods: Product[] = pData.data.map((p: any) => ({
            id: p.id,
            sku: p.code,
            barcode: p.barcode || '',
            name_ar: p.name,
            category: p.category,
            brand: 'أصلي',
            unit: p.unit || 'قطعة',
            purchase_price: Number(p.buy_price || 0),
            sale_price: Number(p.sell_price || 0),
            min_sale_price: Number(p.sell_price || 0) * 0.9,
            average_cost_price: Number(p.buy_price || 0),
            quantity: Number(p.current_stock || 0),
            min_stock_alert: Number(p.min_stock || 3),
            warehouse_id: 'wh1',
            serial_numbers: Array.isArray(p.serial_numbers) ? p.serial_numbers : (p.serial_numbers ? JSON.parse(p.serial_numbers) : []),
            is_active: true
          }));
          setProducts(prods);
        }
      }

      if (custRes.ok) {
        const cData = await custRes.json();
        if (cData.success && Array.isArray(cData.data)) {
          setCustomers(cData.data);
          if (cData.data.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(cData.data[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;

    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < product.quantity) {
        updated[existingIndex].quantity += 1;
        updated[existingIndex].total_price = updated[existingIndex].quantity * updated[existingIndex].unit_price;
        updated[existingIndex].total_cost = updated[existingIndex].quantity * updated[existingIndex].unit_cost;
        setCart(updated);
      }
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name_ar,
        quantity: 1,
        unit_price: product.sale_price,
        unit_cost: product.average_cost_price,
        total_price: product.sale_price,
        total_cost: product.average_cost_price,
        serial_number: product.serial_numbers && product.serial_numbers.length > 0 ? product.serial_numbers[0] : undefined
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQty > product.quantity) return;

    setCart(cart.map(item => {
      if (item.product_id === productId) {
        return {
          ...item,
          quantity: newQty,
          total_price: newQty * item.unit_price,
          total_cost: newQty * item.unit_cost
        };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const totalCogs = cart.reduce((sum, item) => sum + item.total_cost, 0);
  const netTotal = Math.max(0, subtotal - discount);
  const grossProfit = netTotal - totalCogs;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const customer = customers.find(c => c.id === selectedCustomerId) || { id: 'cust-general', name: 'عميل نقدي عام' };
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const paidAmount = paymentType === 'CREDIT' ? 0 : netTotal;
    const remainingAmount = paymentType === 'CREDIT' ? netTotal : 0;

    const invoicePayload = {
      invoice_number: invoiceNumber,
      date: new Date().toISOString().slice(0, 10),
      customer_id: customer.id,
      customer_name: customer.name,
      business_unit_id: 1,
      items: [...cart],
      subtotal,
      discount,
      net_total: netTotal,
      cogs_total: totalCogs,
      gross_profit: grossProfit,
      payment_type: paymentType,
      paid_amount: paidAmount,
      remaining_amount: remainingAmount
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });
      if (res.ok) {
        await loadData();
        setCart([]);
        setDiscount(0);
        setSuccessMessage(`تم حفظ الفاتورة رقم ${invoiceNumber} في قاعدة بيانات MySQL بنجاح، وخصم المخزون وترحيل القيد المحاسبي المزدوج!`);
        setTimeout(() => setSuccessMessage(null), 6000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShoppingCart className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-100">نقطة البيع وإدارة فواتير المبيعات (POS & Sales)</h2>
            <p className="text-xs text-slate-400 mt-0.5">إصدار فواتير نقدية وآجلة، خصم المخزون بالسيريال، وحساب تكلفة COGS والأرباح الفورية</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            متجر الحواسيب والشبكات (BU 1)
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* POS Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Products Catalog) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الباركود، أو SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const inCart = cart.find(c => c.product_id === product.id);
              const availableQty = product.quantity;

              return (
                <div 
                  key={product.id}
                  className={`bg-slate-950/80 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                    availableQty <= 0 
                      ? 'border-rose-900/30 opacity-60' 
                      : 'border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{product.sku}</span>
                      <span className={`font-bold ${availableQty <= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        المتوفر: {availableQty} {product.unit}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{product.name_ar}</h4>
                    <span className="text-[10px] text-slate-500 block mt-1">{product.category} - {product.brand}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-cyan-400 font-mono">
                        {product.sale_price.toLocaleString()} ج.م
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        التكلفة: {product.average_cost_price.toLocaleString()} ج.م
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={availableQty <= 0}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{inCart ? `(${inCart.quantity}) إضافة` : 'إضافة'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (Cart & Checkout) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">سلة المبيعات والفاتورة الحالية</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">({cart.length} أصناف)</span>
            </div>

            {/* Customer Select */}
            <div className="mt-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-400">العميل المستفيد:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.current_balance > 0 ? `(مديونية سابقة: ${c.current_balance.toLocaleString()} ج.م)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  السلة فارغة. اختر منتجات من القائمة لإضافتها للفاتورة.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.unit_price.toLocaleString()} ج.م × {item.quantity} = {item.total_price.toLocaleString()} ج.م
                        <span className="text-emerald-500 mr-2">| ربح: {(item.total_price - item.total_cost).toLocaleString()} ج.م</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-200 px-1">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 text-rose-400 hover:text-rose-300 mr-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('CASH')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentType === 'CASH' 
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                نقدي (خزينة)
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('INSTAPAY')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentType === 'INSTAPAY' 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                إنستاباي / بنك
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('CREDIT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  paymentType === 'CREDIT' 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                بيع آجل (ذمم)
              </button>
            </div>

            {/* Summary Lines */}
            <div className="space-y-1.5 text-xs text-slate-400 pt-1 font-mono">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="text-slate-200">{subtotal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center">
                <span>الخصم الممنوح:</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-left text-xs text-rose-400 font-mono"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>تكلفة البضاعة المباعة (COGS):</span>
                <span>{totalCogs.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 font-bold">
                <span>مجمل الربح المحقق:</span>
                <span>+{grossProfit.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-100 border-t border-slate-800 pt-2">
                <span>الصافي المطلوب:</span>
                <span className="text-cyan-400">{netTotal.toLocaleString()} ج.م</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
            >
              إصدار الفاتورة وترحيل القيد المحاسبي
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
