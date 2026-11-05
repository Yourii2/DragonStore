import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Shield, 
  Wifi, 
  Cpu, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Layers, 
  User, 
  Search, 
  Activity,
  Check,
  Trash2,
  X,
  RefreshCw,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { globalErpStore, MaintenanceOrder, CctvProject, NetworkProject, InternetSubscriber } from '../store/erpStore';

export const TechnicalServicesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'cctv' | 'networks' | 'internet'>('maintenance');

  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([...globalErpStore.maintenanceOrders]);
  const [cctvProjects, setCctvProjects] = useState<CctvProject[]>([...globalErpStore.cctvProjects]);
  const [networkProjects, setNetworkProjects] = useState<NetworkProject[]>([...globalErpStore.networkProjects]);
  const [subscribers, setSubscribers] = useState<InternetSubscriber[]>([...globalErpStore.subscribers]);

  const [loading, setLoading] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Modals state
  const [showAddMaintenance, setShowAddMaintenance] = useState<boolean>(false);
  const [showAddCctv, setShowAddCctv] = useState<boolean>(false);
  const [showAddNetwork, setShowAddNetwork] = useState<boolean>(false);
  const [showAddSubscriber, setShowAddSubscriber] = useState<boolean>(false);

  // Maintenance form
  const [mntForm, setMntForm] = useState({
    customer_name: '',
    customer_phone: '',
    device_type: 'لابتوب',
    brand_model: '',
    serial_number: '',
    problem_description: '',
    technician_name: 'م/ مصطفى كمال',
    labor_cost: 300,
    parts_cost: 0,
    paid_amount: 0
  });

  // CCTV form
  const [cctvForm, setCctvForm] = useState({
    project_name: '',
    customer_name: '',
    customer_phone: '',
    location: '',
    cameras_count: 8,
    dvr_type: 'DVR 8-Channel 5MP',
    contract_value: 25000,
    hardware_cost: 15000,
    labor_cost: 3000,
    other_expenses: 1000,
    paid_amount: 10000,
    status: 'PLANNING' as 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED'
  });

  // Network form
  const [netForm, setNetForm] = useState({
    project_name: '',
    customer_name: '',
    location: '',
    scope_description: '',
    contract_value: 30000,
    hardware_cost: 18000,
    labor_cost: 4000,
    other_expenses: 1000,
    paid_amount: 15000,
    status: 'IN_PROGRESS' as 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED'
  });

  // Subscriber form
  const [subForm, setSubForm] = useState({
    subscriber_name: '',
    phone: '',
    ip_address: '192.168.10.',
    mac_address: '',
    package_name: 'باقة سوبر 30 ميجا',
    monthly_fee: 350,
    line_cost: 190,
    due_day_of_month: 1
  });

  // Load all live data from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [resMnt, resCctv, resNet, resSub] = await Promise.allSettled([
        fetch('/api/services/maintenance').then(r => r.json()),
        fetch('/api/services/cctv').then(r => r.json()),
        fetch('/api/services/networks').then(r => r.json()),
        fetch('/api/services/subscribers').then(r => r.json())
      ]);

      if (resMnt.status === 'fulfilled' && resMnt.value?.success && Array.isArray(resMnt.value.data)) {
        setMaintenanceOrders(resMnt.value.data);
        globalErpStore.maintenanceOrders = resMnt.value.data;
      }
      if (resCctv.status === 'fulfilled' && resCctv.value?.success && Array.isArray(resCctv.value.data)) {
        setCctvProjects(resCctv.value.data);
        globalErpStore.cctvProjects = resCctv.value.data;
      }
      if (resNet.status === 'fulfilled' && resNet.value?.success && Array.isArray(resNet.value.data)) {
        setNetworkProjects(resNet.value.data);
        globalErpStore.networkProjects = resNet.value.data;
      }
      if (resSub.status === 'fulfilled' && resSub.value?.success && Array.isArray(resSub.value.data)) {
        setSubscribers(resSub.value.data);
        globalErpStore.subscribers = resSub.value.data;
      }
    } catch (e) {
      console.warn('Using offline store fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statusMapArabic: Record<string, { label: string; color: string }> = {
    RECEIVED: { label: 'مستلم وجديد', color: 'bg-slate-800 text-slate-300' },
    INSPECTION: { label: 'قيد الفحص والتشخيص', color: 'bg-blue-500/20 text-blue-400' },
    WAITING_APPROVAL: { label: 'بانتظار موافقة العميل', color: 'bg-amber-500/20 text-amber-400' },
    IN_REPAIR: { label: 'قيد الصيانة واللحام', color: 'bg-purple-500/20 text-purple-400' },
    WAITING_PARTS: { label: 'بانتظار قطع غيار', color: 'bg-orange-500/20 text-orange-400' },
    READY: { label: 'جاهز للاستلام', color: 'bg-emerald-500/20 text-emerald-400' },
    DELIVERED: { label: 'تم التسليم والتحصيل', color: 'bg-teal-500/20 text-teal-300' },
    CANCELLED: { label: 'ملغي ومسترجع', color: 'bg-rose-500/20 text-rose-400' }
  };

  const advanceOrderStatus = async (orderId: string, nextStatus: MaintenanceOrder['status']) => {
    try {
      const res = await fetch(`/api/services/maintenance/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err) {
      console.warn('Backend update failed, updating memory store:', err);
    }

    const updated = maintenanceOrders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: nextStatus,
          delivery_date: nextStatus === 'DELIVERED' ? new Date().toISOString().slice(0, 10) : ord.delivery_date
        };
      }
      return ord;
    });
    setMaintenanceOrders(updated);
    globalErpStore.maintenanceOrders = updated;
  };

  const deleteMaintenanceOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف أمر الصيانة هذا نهائياً؟')) return;
    try {
      await fetch(`/api/services/maintenance/${orderId}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    const updated = maintenanceOrders.filter(o => o.id !== orderId);
    setMaintenanceOrders(updated);
    globalErpStore.maintenanceOrders = updated;
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const labor = Number(mntForm.labor_cost) || 0;
    const partsCost = Number(mntForm.parts_cost) || 0;
    const totalAmount = labor + partsCost;

    const payload = {
      order_number: `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customer_name: mntForm.customer_name || 'عميل نقدي',
      customer_phone: mntForm.customer_phone,
      device_type: mntForm.device_type,
      brand_model: mntForm.brand_model,
      serial_number: mntForm.serial_number,
      problem_description: mntForm.problem_description,
      status: 'RECEIVED',
      technician_name: mntForm.technician_name,
      parts_used: partsCost > 0 ? [{ product_id: 'part_custom', name: 'قطع غيار مخصصة', quantity: 1, cost: partsCost * 0.8, price: partsCost }] : [],
      labor_cost: labor,
      total_amount: totalAmount,
      paid_amount: Number(mntForm.paid_amount) || 0,
      received_date: new Date().toISOString().slice(0, 10)
    };

    try {
      const res = await fetch('/api/services/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddMaintenance(false);
        setMntForm({
          customer_name: '',
          customer_phone: '',
          device_type: 'لابتوب',
          brand_model: '',
          serial_number: '',
          problem_description: '',
          technician_name: 'م/ مصطفى كمال',
          labor_cost: 300,
          parts_cost: 0,
          paid_amount: 0
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCctv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/services/cctv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cctvForm,
          start_date: new Date().toISOString().slice(0, 10)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCctv(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCctvProject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف مشروع الكاميرات؟')) return;
    try {
      await fetch(`/api/services/cctv/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    const updated = cctvProjects.filter(p => p.id !== id);
    setCctvProjects(updated);
    globalErpStore.cctvProjects = updated;
  };

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/services/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...netForm,
          start_date: new Date().toISOString().slice(0, 10)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddNetwork(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNetworkProject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف مشروع الشبكة؟')) return;
    try {
      await fetch(`/api/services/networks/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    const updated = networkProjects.filter(p => p.id !== id);
    setNetworkProjects(updated);
    globalErpStore.networkProjects = updated;
  };

  const toggleSubscriberPayment = async (subId: string) => {
    try {
      const res = await fetch(`/api/services/subscribers/${subId}/toggle-payment`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        const updated = subscribers.map(s => {
          if (s.id === subId) {
            return {
              ...s,
              status: data.status,
              last_payment_date: data.last_payment_date
            };
          }
          return s;
        });
        setSubscribers(updated);
        globalErpStore.subscribers = updated;
        return;
      }
    } catch (err) {
      console.warn('Subscriber payment toggle fallback:', err);
    }

    const updated = subscribers.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          status: (s.status === 'ACTIVE' ? 'OVERDUE' : 'ACTIVE') as any,
          last_payment_date: s.status !== 'ACTIVE' ? new Date().toISOString().slice(0, 10) : s.last_payment_date
        };
      }
      return s;
    });
    setSubscribers(updated);
    globalErpStore.subscribers = updated;
  };

  const handleCreateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/services/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subForm,
          last_payment_date: new Date().toISOString().slice(0, 10),
          status: 'ACTIVE'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddSubscriber(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف المشترك؟')) return;
    try {
      await fetch(`/api/services/subscribers/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    const updated = subscribers.filter(s => s.id !== id);
    setSubscribers(updated);
    globalErpStore.subscribers = updated;
  };

  // Filtered lists
  const filteredMaintenance = maintenanceOrders.filter(o => 
    !filterSearch || 
    o.customer_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    o.order_number.toLowerCase().includes(filterSearch.toLowerCase()) ||
    o.brand_model.toLowerCase().includes(filterSearch.toLowerCase()) ||
    o.customer_phone.includes(filterSearch)
  );

  const filteredCctv = cctvProjects.filter(p =>
    !filterSearch ||
    p.project_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    p.customer_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const filteredNetworks = networkProjects.filter(p =>
    !filterSearch ||
    p.project_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    p.customer_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter(s =>
    !filterSearch ||
    s.subscriber_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    s.phone.includes(filterSearch) ||
    s.ip_address.includes(filterSearch) ||
    s.package_name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wrench className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100">إدارة الخدمات الفنية والميدانية والإنترنت (Technical Services & ISP)</h2>
              <button 
                onClick={loadData} 
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-all"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">ورشة صيانة الحواسيب، مشاريع كاميرات المراقبة، تمديد الشبكات، ومشتركو شبكة الإنترنت — متصلة مباشرة بقاعدة البيانات</p>
          </div>
        </div>

        {/* Sub-Nav Pills */}
        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1 flex-wrap">
          <button
            onClick={() => { setActiveTab('maintenance'); setFilterSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'maintenance' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>الصيانة ({maintenanceOrders.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('cctv'); setFilterSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cctv' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>كاميرات CCTV ({cctvProjects.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('networks'); setFilterSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'networks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>مشاريع الشبكات ({networkProjects.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('internet'); setFilterSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'internet' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>مشتركو الإنترنت ({subscribers.length})</span>
          </button>
        </div>
      </div>

      {/* Action Strip: Search & Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="بحث بالاسم، الرقم، الموديل، الهاتف..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          {activeTab === 'maintenance' && (
            <button
              onClick={() => setShowAddMaintenance(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أمر صيانة جديد</span>
            </button>
          )}
          {activeTab === 'cctv' && (
            <button
              onClick={() => setShowAddCctv(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشروع كاميرات جديد</span>
            </button>
          )}
          {activeTab === 'networks' && (
            <button
              onClick={() => setShowAddNetwork(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشروع شبكة جديد</span>
            </button>
          )}
          {activeTab === 'internet' && (
            <button
              onClick={() => setShowAddSubscriber(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشترك إنترنت جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">إجمالي طلبات الصيانة</span>
              <span className="text-xl font-bold text-slate-100">{maintenanceOrders.length} أجهزة</span>
              <span className="text-[11px] text-cyan-400 block mt-1">توليد إيرادات صيانة وتصريف قطع غيار</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">إجمالي إيراد ورشة الصيانة</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {maintenanceOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toLocaleString()} ج.م
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">شامل أجور اليد والقطع المركبة</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">صافي ربح الورشة</span>
              <span className="text-xl font-bold text-cyan-300 font-mono">
                {maintenanceOrders.reduce((sum, o) => sum + Number(o.labor_cost || 0) + (o.parts_used || []).reduce((psum, p) => psum + (Number(p.price || 0) - Number(p.cost || 0)), 0), 0).toLocaleString()} ج.م
              </span>
              <span className="text-[11px] text-emerald-400 block mt-1">أجور يد + هامش ربح قطع الغيار</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200">سجل أوامر صيانة الأجهزة ومراحل الإنجاز</h3>
              <span className="text-xs text-slate-400 font-mono">نظام التتبع من 8 حالات متصل بـ MySQL</span>
            </div>

            {filteredMaintenance.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">لا توجد أوامر صيانة مطابقة</div>
            ) : (
              <div className="space-y-3">
                {filteredMaintenance.map(order => {
                  const statusMeta = statusMapArabic[order.status] || { label: order.status, color: 'bg-slate-800 text-slate-300' };

                  return (
                    <div key={order.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/30">
                            {order.order_number}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-100">{order.device_type} - {order.brand_model}</span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              سيريال: {order.serial_number || 'غير محدد'} | استلام: {order.received_date} {order.delivery_date ? `| تسليم: ${order.delivery_date}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                          <button
                            onClick={() => deleteMaintenanceOrder(order.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="حذف أمر الصيانة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">العميل والهاتف:</span>
                          <span className="text-slate-200 font-bold">{order.customer_name} ({order.customer_phone || 'بدون هاتف'})</span>
                          <span className="text-slate-400 block text-[11px] mt-1 font-mono">الفني: {order.technician_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">العطل المشتكى منه:</span>
                          <span className="text-slate-300">{order.problem_description}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>أجر اليد:</span>
                            <span className="text-slate-200">{Number(order.labor_cost || 0).toLocaleString()} ج.م</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>قطع الغيار:</span>
                            <span className="text-slate-200">
                              {(order.parts_used || []).reduce((s, p) => s + Number(p.price || 0), 0).toLocaleString()} ج.م
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-400 font-bold text-xs pt-1 border-t border-slate-800 mt-1">
                            <span>الإجمالي:</span>
                            <span>{Number(order.total_amount || 0).toLocaleString()} ج.م</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick State Machine Transition Actions */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] text-slate-500">تحديث الحالة التشغيلية:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.status === 'RECEIVED' && (
                            <button onClick={() => advanceOrderStatus(order.id, 'INSPECTION')} className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer">
                              بدء الفحص والتشخيص
                            </button>
                          )}
                          {order.status === 'INSPECTION' && (
                            <button onClick={() => advanceOrderStatus(order.id, 'WAITING_APPROVAL')} className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold cursor-pointer">
                              طلب موافقة العميل على التكلفة
                            </button>
                          )}
                          {order.status === 'WAITING_APPROVAL' && (
                            <button onClick={() => advanceOrderStatus(order.id, 'IN_REPAIR')} className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer">
                              وافق العميل - بدء الصيانة واللحام
                            </button>
                          )}
                          {order.status === 'IN_REPAIR' && (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => advanceOrderStatus(order.id, 'WAITING_PARTS')} className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold cursor-pointer">
                                بانتظار وصول قطع غيار
                              </button>
                              <button onClick={() => advanceOrderStatus(order.id, 'READY')} className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer">
                                تم الإصلاح وجاهز للتسليم
                              </button>
                            </div>
                          )}
                          {order.status === 'WAITING_PARTS' && (
                            <button onClick={() => advanceOrderStatus(order.id, 'IN_REPAIR')} className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer">
                              وصلت القطع - استئناف العمل
                            </button>
                          )}
                          {order.status === 'READY' && (
                            <button onClick={() => advanceOrderStatus(order.id, 'DELIVERED')} className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold cursor-pointer">
                              تسليم وتحصيل الحساب
                            </button>
                          )}
                          {order.status === 'DELIVERED' && (
                            <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تم التسليم النهائي والتحصيل
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CCTV Projects Tab */}
      {activeTab === 'cctv' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200">مشاريع توريد وتركيب كاميرات المراقبة (CCTV Projects)</h3>
              <span className="text-xs text-amber-400 font-bold">عقود، معدات، وربحية المشاريع</span>
            </div>

            {filteredCctv.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">لا توجد مشاريع كاميرات مطابقة</div>
            ) : (
              <div className="space-y-3">
                {filteredCctv.map(proj => (
                  <div key={proj.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{proj.project_name}</h4>
                        <span className="text-[11px] text-slate-400">{proj.customer_name} | {proj.location || 'الموقع غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {proj.status === 'IN_PROGRESS' ? 'قيد التنفيذ والتركيب' : proj.status === 'COMPLETED' ? 'مكتمل ومسلم' : 'قيد التخطيط'}
                        </span>
                        <button
                          onClick={() => deleteCctvProject(proj.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">قيمة العقد:</span>
                        <span className="text-slate-100 font-bold">{Number(proj.contract_value || 0).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">تكلفة الكاميرات والمعدات:</span>
                        <span className="text-rose-400">{Number(proj.hardware_cost || 0).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">العمالة والنثريات:</span>
                        <span className="text-amber-400">{(Number(proj.labor_cost || 0) + Number(proj.other_expenses || 0)).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">صافي ربح المشروع:</span>
                        <span className="text-emerald-400 font-black">+{Number(proj.net_profit || 0).toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Network Projects Tab */}
      {activeTab === 'networks' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200">مشاريع تمديد البنية التحتية والشبكات (Network Installations)</h3>
              <span className="text-xs text-indigo-400 font-bold">راوترات، سويتشات، وكبائن راك</span>
            </div>

            {filteredNetworks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">لا توجد مشاريع شبكات مطابقة</div>
            ) : (
              <div className="space-y-3">
                {filteredNetworks.map(proj => (
                  <div key={proj.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{proj.project_name}</h4>
                        <span className="text-[11px] text-slate-400">{proj.customer_name} | {proj.location || 'الموقع غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {proj.status === 'IN_PROGRESS' ? 'قيد التمديد والبرمجة' : proj.status === 'COMPLETED' ? 'مكتمل ومسلم' : 'قيد التخطيط'}
                        </span>
                        <button
                          onClick={() => deleteNetworkProject(proj.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">قيمة العقد:</span>
                        <span className="text-slate-100 font-bold">{Number(proj.contract_value || 0).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">تكلفة السويتشات والكابلات:</span>
                        <span className="text-rose-400">{Number(proj.hardware_cost || 0).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">العمالة:</span>
                        <span className="text-amber-400">{Number(proj.labor_cost || 0).toLocaleString()} ج.م</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">صافي الربح:</span>
                        <span className="text-emerald-400 font-black">+{Number(proj.net_profit || 0).toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Internet Subscribers Tab */}
      {activeTab === 'internet' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-200">إدارة مشتركي شبكة الإنترنت وتتبع الفوترة الشهرية</h3>
                <span className="text-xs text-slate-400">تجديد الاشتراكات، تتبع المتأخرين، ومراقبة الربحية الشهرية</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-lg">
                إجمالي الدخل الشهري المتوقع: {subscribers.reduce((s, sub) => s + Number(sub.monthly_fee || 0), 0).toLocaleString()} ج.م
              </span>
            </div>

            {filteredSubscribers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">لا يوجد مشتركون مطابقون للبحث</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">المشترك</th>
                      <th className="py-2.5 px-3">الهاتف</th>
                      <th className="py-2.5 px-3 font-mono">IP / MAC</th>
                      <th className="py-2.5 px-3">الباقة</th>
                      <th className="py-2.5 px-3 text-center">الاشتراك الشهري</th>
                      <th className="py-2.5 px-3 text-center">يوم الاستحقاق</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                      <th className="py-2.5 px-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{sub.subscriber_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{sub.phone}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                          <div>{sub.ip_address}</div>
                          <div className="text-slate-500">{sub.mac_address}</div>
                        </td>
                        <td className="py-2.5 px-3 text-cyan-400">{sub.package_name}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{Number(sub.monthly_fee || 0).toLocaleString()} ج.م</td>
                        <td className="py-2.5 px-3 text-center text-slate-300">يوم {sub.due_day_of_month}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {sub.status === 'ACTIVE' ? 'نشط ومسدد' : 'متأخر عن السداد'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => toggleSubscriberPayment(sub.id)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                sub.status === 'ACTIVE'
                                  ? 'bg-slate-800 text-slate-300 hover:bg-rose-900/50'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                              }`}
                            >
                              {sub.status === 'ACTIVE' ? 'تعيين كمتأخر' : 'تحصيل وتجديد'}
                            </button>
                            <button
                              onClick={() => deleteSubscriber(sub.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="حذف المشترك"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Maintenance Order */}
      {showAddMaintenance && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                إضافة أمر صيانة جديد
              </h3>
              <button onClick={() => setShowAddMaintenance(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={mntForm.customer_name}
                    onChange={(e) => setMntForm({ ...mntForm, customer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="مثال: أحمد محمود"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={mntForm.customer_phone}
                    onChange={(e) => setMntForm({ ...mntForm, customer_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="010xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">نوع الجهاز</label>
                  <select
                    value={mntForm.device_type}
                    onChange={(e) => setMntForm({ ...mntForm, device_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="لابتوب">لابتوب Laptop</option>
                    <option value="حاسوب مكتبي PC">حاسوب مكتبي PC</option>
                    <option value="شاشة Monitor">شاشة Monitor</option>
                    <option value="طابعة Printer">طابعة Printer</option>
                    <option value="سيرفر Server">سيرفر Server</option>
                    <option value="راوتر Router">راوتر Router</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">الموديل والماركة *</label>
                  <input
                    type="text"
                    required
                    value={mntForm.brand_model}
                    onChange={(e) => setMntForm({ ...mntForm, brand_model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                    placeholder="مثال: HP Victus 15"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">الرقم التسلسلي (سيريال)</label>
                <input
                  type="text"
                  value={mntForm.serial_number}
                  onChange={(e) => setMntForm({ ...mntForm, serial_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="SN-XXXX-XXXX"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">وصف العطل والملاحظات *</label>
                <textarea
                  required
                  rows={2}
                  value={mntForm.problem_description}
                  onChange={(e) => setMntForm({ ...mntForm, problem_description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="مثال: الجهاز يغلق تلقائياً بعد ربع ساعة عمل..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">أجر اليد (المصنعية)</label>
                  <input
                    type="number"
                    value={mntForm.labor_cost}
                    onChange={(e) => setMntForm({ ...mntForm, labor_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">قطع الغيار</label>
                  <input
                    type="number"
                    value={mntForm.parts_cost}
                    onChange={(e) => setMntForm({ ...mntForm, parts_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">المسدد مقدماً</label>
                  <input
                    type="number"
                    value={mntForm.paid_amount}
                    onChange={(e) => setMntForm({ ...mntForm, paid_amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenance(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30"
                >
                  حفظ وطباعة إيصال الاستلام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add CCTV Project */}
      {showAddCctv && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                إضافة مشروع كاميرات مراقبة CCTV
              </h3>
              <button onClick={() => setShowAddCctv(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCctv} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم المشروع *</label>
                <input
                  type="text"
                  required
                  value={cctvForm.project_name}
                  onChange={(e) => setCctvForm({ ...cctvForm, project_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="مثال: منظومة مراقبة مستودع العبور"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={cctvForm.customer_name}
                    onChange={(e) => setCctvForm({ ...cctvForm, customer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={cctvForm.customer_phone}
                    onChange={(e) => setCctvForm({ ...cctvForm, customer_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">الموقع / العنوان</label>
                  <input
                    type="text"
                    value={cctvForm.location}
                    onChange={(e) => setCctvForm({ ...cctvForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">عدد الكاميرات</label>
                  <input
                    type="number"
                    value={cctvForm.cameras_count}
                    onChange={(e) => setCctvForm({ ...cctvForm, cameras_count: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">قيمة العقد الإجمالية</label>
                  <input
                    type="number"
                    value={cctvForm.contract_value}
                    onChange={(e) => setCctvForm({ ...cctvForm, contract_value: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">تكلفة المعدات</label>
                  <input
                    type="number"
                    value={cctvForm.hardware_cost}
                    onChange={(e) => setCctvForm({ ...cctvForm, hardware_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">المصنعية والعمالة</label>
                  <input
                    type="number"
                    value={cctvForm.labor_cost}
                    onChange={(e) => setCctvForm({ ...cctvForm, labor_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCctv(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30"
                >
                  حفظ المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Network Project */}
      {showAddNetwork && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                إضافة مشروع تمديد شبكة
              </h3>
              <button onClick={() => setShowAddNetwork(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNetwork} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">اسم المشروع *</label>
                <input
                  type="text"
                  required
                  value={netForm.project_name}
                  onChange={(e) => setNetForm({ ...netForm, project_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="مثال: تمديد شبكة بيانات لمكتب 16 نقطة"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={netForm.customer_name}
                    onChange={(e) => setNetForm({ ...netForm, customer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">الموقع / المقر</label>
                  <input
                    type="text"
                    value={netForm.location}
                    onChange={(e) => setNetForm({ ...netForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">نطاق العمل والتجهيزات</label>
                <textarea
                  rows={2}
                  value={netForm.scope_description}
                  onChange={(e) => setNetForm({ ...netForm, scope_description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="سويتشات، راك، باكت، نقاط بيانات..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">قيمة العقد</label>
                  <input
                    type="number"
                    value={netForm.contract_value}
                    onChange={(e) => setNetForm({ ...netForm, contract_value: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">تكلفة الأجهزة</label>
                  <input
                    type="number"
                    value={netForm.hardware_cost}
                    onChange={(e) => setNetForm({ ...netForm, hardware_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">العمالة</label>
                  <input
                    type="number"
                    value={netForm.labor_cost}
                    onChange={(e) => setNetForm({ ...netForm, labor_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNetwork(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  حفظ المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Internet Subscriber */}
      {showAddSubscriber && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-400" />
                إضافة مشترك إنترنت جديد
              </h3>
              <button onClick={() => setShowAddSubscriber(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscriber} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم المشترك *</label>
                  <input
                    type="text"
                    required
                    value={subForm.subscriber_name}
                    onChange={(e) => setSubForm({ ...subForm, subscriber_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: م/ محمود السيد"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={subForm.phone}
                    onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="010xxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">عنوان IP</label>
                  <input
                    type="text"
                    value={subForm.ip_address}
                    onChange={(e) => setSubForm({ ...subForm, ip_address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">عنوان MAC</label>
                  <input
                    type="text"
                    value={subForm.mac_address}
                    onChange={(e) => setSubForm({ ...subForm, mac_address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="E4:8D:8C:..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم الباقة</label>
                  <input
                    type="text"
                    value={subForm.package_name}
                    onChange={(e) => setSubForm({ ...subForm, package_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">يوم الاستحقاق الشهري (1 - 31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={subForm.due_day_of_month}
                    onChange={(e) => setSubForm({ ...subForm, due_day_of_month: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">قيمة الاشتراك الشهري</label>
                  <input
                    type="number"
                    value={subForm.monthly_fee}
                    onChange={(e) => setSubForm({ ...subForm, monthly_fee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">تكلفة الخط المباشرة</label>
                  <input
                    type="number"
                    value={subForm.line_cost}
                    onChange={(e) => setSubForm({ ...subForm, line_cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubscriber(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  حفظ المشترك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
