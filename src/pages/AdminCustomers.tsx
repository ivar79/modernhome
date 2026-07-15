import { adminFetch } from "../adminFetch";
import React, { useState, useEffect } from "react";
import { Users, ShieldCheck, Search, Filter, Percent, Layers, Sparkles, Scale, RefreshCw, Sliders, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomerProfile {
  phone: string;
  name: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  latestOrderDate: string;
  isManualVip: boolean;
  autoEligible: boolean;
  isVip: boolean;
  referralsCount?: number;
  successfulReferrals?: number;
  referralEarning?: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vipThreshold, setVipThreshold] = useState<number>(50000000);
  const [newThreshold, setNewThreshold] = useState<string>("");
  const [updatingThreshold, setUpdatingThreshold] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "VIP" | "REGULAR">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Selected customer's order history modal state
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomersData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setVipThreshold(data.vipThreshold);
        setNewThreshold(String(Math.floor(data.vipThreshold / 1000000))); // in Millions
      } else {
        setError(data.error || "خطا در دریافت اطلاعات مشتریان");
      }
    } catch (err: any) {
      setError(err.message || "خطای غیرمنتظره در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersData();
  }, []);

  const handleToggleVip = async (phone: string, currentIsVip: boolean) => {
    try {
      setActionLoading(phone);
      const res = await adminFetch("/api/admin/customers/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, isVip: !currentIsVip })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically update
        setCustomers(prev => prev.map(c => {
          if (c.phone === phone) {
            const nextManual = !currentIsVip;
            return {
              ...c,
              isManualVip: nextManual,
              isVip: nextManual || c.autoEligible
            };
          }
          return c;
        }));
      } else {
        alert(data.error || "خطا در بروزرسانی وضعیت VIP لغو شد");
      }
    } catch (err: any) {
      alert("خطای ارتباطی در سیستم تغییر وضعیت");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    const thresholdNum = parseFloat(newThreshold) * 1000000; // millions to unit
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      alert("لطفا عدد معتبری وارد کنید.");
      return;
    }

    try {
      setUpdatingThreshold(true);
      const res = await adminFetch("/api/admin/customers/vip-threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: thresholdNum })
      });
      const data = await res.json();
      if (data.success) {
        setVipThreshold(thresholdNum);
        alert("حد نصاب ارتقای خودکار با موفقیت ذخیره شد.");
        fetchCustomersData(); // reload values
      } else {
        alert(data.error || "خطا در بروزرسانی حد نصاب فروشگاه");
      }
    } catch (err: any) {
      alert("خطای ارتباط با سرور");
    } finally {
      setUpdatingThreshold(false);
    }
  };

  const handleViewOrders = async (phone: string) => {
    setSelectedPhone(phone);
    try {
      setLoadingOrders(true);
      setCustomerOrders([]);
      const res = await adminFetch("/api/customer/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filters logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery);
    
    if (selectedFilter === "VIP") {
      return matchesSearch && c.isVip;
    }
    if (selectedFilter === "REGULAR") {
      return matchesSearch && !c.isVip;
    }
    return matchesSearch;
  });

  const activeVipCount = customers.filter(c => c.isVip).length;

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            سیستم مدیریت کلوپ مشتریان و VIP
          </h1>
          <p className="text-xs text-stone-400 font-light">
            لیست خریداران، امتیازات کسب شده دکوراسیون و اعتبارسنجی باشگاه الیت خانه مبل
          </p>
        </div>
        <button
          onClick={fetchCustomersData}
          className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          بروزرسانی لیست
        </button>
      </div>

      {/* VIP Config Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Summary cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm space-y-4">
            <span className="text-[10px] text-stone-400 font-bold block uppercase">کل مشتریان سیستم</span>
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold text-stone-900 font-sans">
                {new Intl.NumberFormat("fa-IR").format(customers.length)}
              </span>
              <span className="text-xs text-stone-400">شماره ثبت شده</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-stone-400 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          <div className="bg-amber-950/5 border border-amber-900/10 p-6 rounded-3xl space-y-4">
            <span className="text-[10px] text-amber-800 font-extrabold block">اعضای باشگاه طلایی VIP</span>
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold text-amber-900 font-sans">
                {new Intl.NumberFormat("fa-IR").format(activeVipCount)}
              </span>
              <span className="text-xs text-amber-700 font-medium">مشتری ویژه</span>
            </div>
            <div className="h-1.5 bg-amber-900/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${customers.length ? (activeVipCount / customers.length) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="bg-emerald-950/5 border border-emerald-900/10 p-6 rounded-3xl space-y-4">
            <span className="text-[10px] text-emerald-800 font-extrabold block">خرید واقعیِ تحویل‌شده</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-extrabold text-emerald-900">
                {new Intl.NumberFormat("fa-IR").format(
                  customers.reduce((sum, c) => sum + c.totalSpent, 0)
                )} <span className="text-[10px] font-sans">تومان</span>
              </span>
            </div>
            <div className="h-1.5 bg-emerald-900/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>
        </div>

        {/* Right: Threshold settings forms */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm space-y-4 text-right">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-extrabold text-stone-900">تنظیمات ارتقای خودکار VIP</h3>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed font-light">
            مشتریانی که مجموع خریدهای تایید شده یا تحویل شده آنها از این مبلغ عبور کند به طور هوشمند عضو کلوپ ویژه (VIP) خواهند شد.
          </p>

          <form onSubmit={handleSaveThreshold} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400">حد نصاب خرید کل (به میلیون تومان)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="مثال: ۵۰"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="flex-1 text-center bg-stone-50 border border-stone-200 rounded-xl py-2 px-3 text-xs text-stone-850 font-bold focus:outline-none focus:border-stone-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={updatingThreshold}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {updatingThreshold ? "ثبت..." : "ذخیره"}
                </button>
              </div>
            </div>
            <div className="text-[9px] text-stone-400 text-left">
              فعلی: <span className="font-bold font-mono text-stone-700">{new Intl.NumberFormat("fa-IR").format(vipThreshold / 1000000)} میلیون تومان</span>
            </div>
          </form>
        </div>

      </div>

      {/* Filter and Search Box */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="جستجوی نام یا تلفن مشتری..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2 pl-4 pr-9 text-xs focus:outline-none focus:border-stone-400 transition-colors"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-auto right-3 top-2.5" />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter("ALL")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedFilter === "ALL" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-700"
            }`}
          >
            همه مشتریان
          </button>
          <button
            onClick={() => setSelectedFilter("VIP")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedFilter === "VIP" ? "bg-amber-500 text-amber-950 shadow-sm" : "text-amber-800/80 hover:text-amber-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            اعضای VIP ({new Intl.NumberFormat("fa-IR").format(activeVipCount)})
          </button>
          <button
            onClick={() => setSelectedFilter("REGULAR")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedFilter === "REGULAR" ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-700"
            }`}
          >
            مشتریان عادی
          </button>
        </div>

      </div>

      {/* Main Customers Table */}
      <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-16 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-stone-400">در حال دریافت و هماهنگ‌سازی مشتریان...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-500 text-xs">
            {error}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-stone-400 text-xs">
            مشتری منطبق با معیارهای جستجو یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 text-stone-450 font-bold">
                  <th className="p-4 pr-6">مشتری</th>
                  <th className="p-4">شماره همراه خریدار</th>
                  <th className="p-4">شهر مراجعه</th>
                  <th className="p-4 text-center">تعداد کل درخواست‌ها</th>
                  <th className="p-4 text-left">مجموع خرید واقعی (تومان)</th>
                  <th className="p-4 text-center border-x border-stone-100 bg-stone-50/50">آمار معرفی و تخفیف ارجاعی</th>
                  <th className="p-4 text-center">وضعیت باشگاه VIP</th>
                  <th className="p-4 pl-6 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.phone} className="hover:bg-stone-50/50 transition-colors">
                    
                    {/* Customer Info */}
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          cust.isVip 
                            ? "bg-amber-100 text-amber-950 border border-amber-200" 
                            : "bg-stone-100 text-stone-700"
                        }`}>
                          {cust.name[0] || "م"}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-stone-900 block">{cust.name}</span>
                          <span className="text-[10px] text-stone-400 font-light font-mono">ثبت اول: {new Date(cust.latestOrderDate).toLocaleDateString("fa-IR")}</span>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-4 font-mono select-all text-stone-850 font-semibold">{cust.phone}</td>

                    {/* City */}
                    <td className="p-4">{cust.city}</td>

                    {/* Total orders */}
                    <td className="p-4 text-center font-mono font-bold text-stone-900">{cust.totalOrders}</td>

                    {/* Total spent */}
                    <td className="p-4 text-left font-mono font-bold">
                      {cust.totalSpent > 0 ? (
                        <span className="text-emerald-600">
                          {new Intl.NumberFormat("fa-IR").format(cust.totalSpent)}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    {/* Referrals Stats */}
                    <td className="p-4 text-center border-x border-stone-100 bg-stone-50/20">
                      <div className="space-y-1">
                        <span className="font-extrabold text-stone-900 block font-mono">
                          {cust.referralsCount ? `${new Intl.NumberFormat("fa-IR").format(cust.referralsCount)} نفر` : "۰ نفر"}
                        </span>
                        {cust.successfulReferrals && cust.successfulReferrals > 0 ? (
                          <div className="flex flex-col gap-0.5 items-center justify-center">
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg font-bold">
                              {new Intl.NumberFormat("fa-IR").format(cust.successfulReferrals)} خرید موفق
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono font-semibold">
                              ({new Intl.NumberFormat("fa-IR").format(cust.referralEarning || 0)} تومان اعتبار)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-light">فاقد خرید ارجاعی</span>
                        )}
                      </div>
                    </td>

                    {/* VIP status Badge */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        {cust.isVip ? (
                          <div className="bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>عضو VIP باشگاه</span>
                          </div>
                        ) : (
                          <span className="text-[10px] bg-stone-100 text-stone-400 px-3 py-1 rounded-full font-bold">رسمی عادی</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pl-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* View orders */}
                        <button
                          onClick={() => handleViewOrders(cust.phone)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-850 px-3 py-1.5 rounded-xl font-bold transition-all text-[10px]"
                        >
                          مشاهده فاکتورها
                        </button>

                        {/* Toggle VIP */}
                        <button
                          onClick={() => handleToggleVip(cust.phone, cust.isManualVip)}
                          disabled={actionLoading === cust.phone}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
                            cust.isManualVip
                              ? "bg-stone-900 hover:bg-stone-850 text-amber-400 border-stone-800"
                              : "bg-amber-500 hover:bg-amber-650 text-stone-950 border-amber-400"
                          }`}
                        >
                          {actionLoading === cust.phone 
                            ? "بروزرسانی..." 
                            : cust.isManualVip 
                              ? "لغو VIP دستی" 
                              : "ارتقا به VIP"
                          }
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

      {/* Orders detail Modal for customer */}
      <AnimatePresence>
        {selectedPhone && (
          <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-stone-200/50 flex flex-col"
            >
              <div className="p-6 bg-stone-900 text-stone-100 border-b border-stone-800 flex justify-between items-center text-right">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-100">کارنامه و تاریخچه فاکتورهای خریدار</h3>
                  <span className="text-[10px] text-stone-400 font-mono">تلفن: {selectedPhone}</span>
                </div>
                <button
                  onClick={() => setSelectedPhone(null)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-400 px-3 py-1.5 rounded-xl font-bold"
                >
                  بستن پنجره
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {loadingOrders ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                    <p className="text-[11px] text-stone-400 mt-2">در حال بارگزاری سوابق مبل...</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    داده‌ای یافت نشد.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order: any, idx) => (
                      <div key={order.id} className="p-4 bg-stone-50 border border-stone-250/50 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-1.5 text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-stone-200 text-stone-800 px-2 py-0.5 rounded-md font-mono">فاکتور شماره {idx + 1}</span>
                            <span className="text-xs font-bold text-stone-900">{order.product?.name || "مبل سفارشی ثبت شده"}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-light text-stone-450">
                            <div>آدرس تحویل: <span className="font-semibold text-stone-700">{order.customerCity}</span></div>
                            <div>تاریخ ثبت: <span className="font-semibold text-stone-700 font-mono">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</span></div>
                            {order.agreedPrice && (
                              <div className="col-span-2 text-emerald-600 font-semibold font-mono">قیمت نهایی فاکتور: {new Intl.NumberFormat("fa-IR").format(order.agreedPrice)} تومان</div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center items-end shrink-0 gap-1.5">
                          {/* Order status Badge */}
                          <div className="text-xs">
                            {order.status === "DELIVERED" && <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg font-bold">تحویل داده شد</span>}
                            {order.status === "CONFIRMED" && <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded-lg font-bold">تایید شده کارگاه</span>}
                            {order.status === "PENDING" && <span className="text-amber-700 bg-amber-500/10 px-2 py-1 rounded-lg font-bold">منتظر تماس</span>}
                            {order.status === "CANCELLED" && <span className="text-red-700 bg-red-100 px-2 py-1 rounded-lg font-bold font-light">انصراف داده شده</span>}
                            {!["DELIVERED", "CONFIRMED", "PENDING", "CANCELLED"].includes(order.status) && (
                              <span className="text-stone-700 bg-stone-100 px-2 py-1 rounded-lg font-bold">{order.status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
