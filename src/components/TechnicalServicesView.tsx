import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { globalErpStore, MaintenanceOrder, CctvProject, NetworkProject, InternetSubscriber } from '../store/erpStore';

export const TechnicalServicesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'cctv' | 'networks' | 'internet'>('maintenance');

  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([...globalErpStore.maintenanceOrders]);
  const [cctvProjects, setCctvProjects] = useState<CctvProject[]>([...globalErpStore.cctvProjects]);
  const [networkProjects, setNetworkProjects] = useState<NetworkProject[]>([...globalErpStore.networkProjects]);
  const [subscribers, setSubscribers] = useState<InternetSubscriber[]>([...globalErpStore.subscribers]);

  const [filterSearch, setFilterSearch] = useState<string>('');

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

  const advanceOrderStatus = (orderId: string, nextStatus: MaintenanceOrder['status']) => {
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

  const toggleSubscriberPayment = (subId: string) => {
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

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wrench className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-100">إدارة الخدمات الفنية والميدانية والإنترنت (Technical Services & ISP)</h2>
            <p className="text-xs text-slate-400 mt-0.5">ورشة صيانة الحواسيب، مشاريع كاميرات المراقبة، تمديد الشبكات، ومشتركو شبكة الإنترنت</p>
          </div>
        </div>

        {/* Sub-Nav Pills */}
        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'maintenance' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>الصيانة ({maintenanceOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cctv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cctv' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>كاميرات CCTV ({cctvProjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('networks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'networks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>مشاريع الشبكات ({networkProjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('internet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'internet' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>مشتركو الإنترنت ({subscribers.length})</span>
          </button>
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
              <span className="text-xl font-bold text-emerald-400">
                {maintenanceOrders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString()} ج.م
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">شامل أجور اليد والقطع المركبة</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">صافي ربح الورشة</span>
              <span className="text-xl font-bold text-cyan-300">
                {maintenanceOrders.reduce((sum, o) => sum + o.labor_cost + o.parts_used.reduce((psum, p) => psum + (p.price - p.cost), 0), 0).toLocaleString()} ج.م
              </span>
              <span className="text-[11px] text-emerald-400 block mt-1">أجور يد + هامش ربح قطع الغيار</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200">سجل أوامر صيانة الأجهزة ومراحل الإنجاز</h3>
              <span className="text-xs text-slate-400 font-mono">نظام التتبع من 8 حالات</span>
            </div>

            <div className="space-y-3">
              {maintenanceOrders.map(order => {
                const statusMeta = statusMapArabic[order.status] || { label: order.status, color: 'bg-slate-800 text-slate-300' };

                return (
                  <div key={order.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/30">
                          {order.order_number}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-100">{order.device_type} - {order.brand_model}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">سيريال: {order.serial_number} | استلام: {order.received_date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">العميل والهاتف:</span>
                        <span className="text-slate-200 font-bold">{order.customer_name} ({order.customer_phone})</span>
                        <span className="text-slate-400 block text-[11px] mt-1 font-mono">الفني: {order.technician_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">العطل المشتكى منه:</span>
                        <span className="text-slate-300">{order.problem_description}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>أجر اليد:</span>
                          <span className="text-slate-200">{order.labor_cost.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>قطع الغيار:</span>
                          <span className="text-slate-200">{order.parts_used.reduce((s, p) => s + p.price, 0).toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold text-xs pt-1 border-t border-slate-800 mt-1">
                          <span>الإجمالي:</span>
                          <span>{order.total_amount.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick State Machine Transition Actions */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-slate-500">تحديث الحالة التشغيلية:</span>
                      <div className="flex items-center gap-1.5">
                        {order.status === 'RECEIVED' && (
                          <button onClick={() => advanceOrderStatus(order.id, 'INSPECTION')} className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold">
                            بدء الفحص
                          </button>
                        )}
                        {order.status === 'INSPECTION' && (
                          <button onClick={() => advanceOrderStatus(order.id, 'WAITING_APPROVAL')} className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold">
                            طلب موافقة العميل
                          </button>
                        )}
                        {order.status === 'WAITING_APPROVAL' && (
                          <button onClick={() => advanceOrderStatus(order.id, 'IN_REPAIR')} className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold">
                            وافق العميل - بدء الصيانة
                          </button>
                        )}
                        {order.status === 'IN_REPAIR' && (
                          <button onClick={() => advanceOrderStatus(order.id, 'READY')} className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold">
                            تم الإصلاح وجاهز
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button onClick={() => advanceOrderStatus(order.id, 'DELIVERED')} className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold">
                            تسليم وتحصيل الحساب
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

            <div className="space-y-3">
              {cctvProjects.map(proj => (
                <div key={proj.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{proj.project_name}</h4>
                      <span className="text-[11px] text-slate-400">{proj.customer_name} | {proj.location}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {proj.status === 'IN_PROGRESS' ? 'قيد التنفيذ والتركيب' : 'مكتمل ومسلم'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">قيمة العقد:</span>
                      <span className="text-slate-100 font-bold">{proj.contract_value.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">تكلفة الكاميرات والمعدات:</span>
                      <span className="text-rose-400">{proj.hardware_cost.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">العمالة والنثريات:</span>
                      <span className="text-amber-400">{(proj.labor_cost + proj.other_expenses).toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">صافي ربح المشروع:</span>
                      <span className="text-emerald-400 font-black">+{proj.net_profit.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

            <div className="space-y-3">
              {networkProjects.map(proj => (
                <div key={proj.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{proj.project_name}</h4>
                      <span className="text-[11px] text-slate-400">{proj.customer_name} | {proj.location}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {proj.status === 'IN_PROGRESS' ? 'قيد التمديد والبرمجة' : 'مكتمل'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">قيمة العقد:</span>
                      <span className="text-slate-100 font-bold">{proj.contract_value.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">تكلفة السويتشات والكابلات:</span>
                      <span className="text-rose-400">{proj.hardware_cost.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">العمالة:</span>
                      <span className="text-amber-400">{proj.labor_cost.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">صافي الربح:</span>
                      <span className="text-emerald-400 font-black">+{proj.net_profit.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Internet Subscribers Tab */}
      {activeTab === 'internet' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200">إدارة مشتركي شبكة الإنترنت وتتبع الفوترة الشهرية</h3>
                <span className="text-xs text-slate-400">تجديد الاشتراكات، تتبع المتأخرين، ومراقبة الربحية الشهرية</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                إجمالي الدخل الشهري المتوقع: {subscribers.reduce((s, sub) => s + sub.monthly_fee, 0).toLocaleString()} ج.م
              </span>
            </div>

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
                  {subscribers.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{sub.subscriber_name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{sub.phone}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                        <div>{sub.ip_address}</div>
                        <div className="text-slate-500">{sub.mac_address}</div>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400">{sub.package_name}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{sub.monthly_fee} ج.م</td>
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
                        <button
                          onClick={() => toggleSubscriberPayment(sub.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            sub.status === 'ACTIVE'
                              ? 'bg-slate-800 text-slate-300 hover:bg-rose-900/50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                        >
                          {sub.status === 'ACTIVE' ? 'تعيين كمتأخر' : 'تحصيل وتجديد'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
