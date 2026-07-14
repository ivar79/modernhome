import { adminFetch } from "../adminFetch";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, ShoppingBag, Wallet, AlertCircle, Clock, CheckCircle, ArrowLeft, ArrowUpRight, Sofa, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await adminFetch("/api/admin/dashboard");
      const parsed = await res.json();
      if (parsed.success) {
        setData(parsed);
      }
    } catch (err) {
      console.error("Dashboard calculation load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Safe helper to format prices beautifully to Iranian Tomans
  const formatToman = (amount: number) => {
    return new Intl.NumberFormat("fa-IR", {
      style: "decimal",
      useGrouping: true,
    }).format(amount) + " تومان";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">منتظر پیگیری</span>;
      case "CONTACTED":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold">تماس گرفته شده</span>;
      case "NEGOTIATING":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-bold">در حال مذاکره</span>;
      case "CONFIRMED":
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-bold">تایید قطعی سفارش</span>;
      case "DELIVERED":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">تحویل داده شده</span>;
      case "CANCELLED":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold">لغو شده</span>;
      default:
        return <span className="bg-stone-50 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-full text-[10px] font-bold">نامشخص</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalOrdersCount: 0,
    todayOrdersCount: 0,
    pendingCount: 0,
    totalCommissionMonth: 0,
    earnedCommissionPaid: 0,
    earnedCommissionUnpaid: 0,
  };

  const chartData = data?.chartData || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-8 text-right pb-10">
      
      {/* 1. Statistics Cards Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Today orders */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-400 block line-clamp-1">سفارش‌های امروز</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">{stats.todayOrdersCount}</span>
            <span className="text-[10px] text-stone-400 block">سفارش ثبت شده ظرف ۲۴ ساعت</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Pending Leads */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-block text-stone-400">نیاز به پیگیری فوری</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">{stats.pendingCount}</span>
            <span className="text-[10px] text-stone-400 block">سفارش‌های با وضعیت در انتظار</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Commission Month */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-400 block">هدف پورسانت ماه جاری</span>
            <span className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              {formatToman(stats.totalCommissionMonth)}
            </span>
            <span className="text-[10px] text-stone-400 block">سهم مصوب کل سفارش‌های ماه</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Unpaid commissions */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-400 block">طلب وصول نشده (معوقه)</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-700 tracking-tight">
              {formatToman(stats.earnedCommissionUnpaid)}
            </span>
            <span className="text-[10px] text-stone-400 block">پورسانت‌های تایید شده دریافت نشده</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2. Analytical Chart Stage */}
      <div className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-stone-900">نمودار حجم فروش مبلمان واسطه‌گری</h3>
            <p className="text-[10px] text-stone-400">تعداد درخواست‌های مشاوره کلاینت‌ها طی ۳۰ روز گذشته</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c1917" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1c1917" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="date" stroke="#a8a29e" fontSize={10} fontFamily="sans-serif" tickLine={false} />
              <YAxis stroke="#a8a29e" fontSize={10} fontFamily="sans-serif" tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1c1917", borderRadius: "16px", color: "#fafaf9", border: "none", fontSize: "11px", direction: "rtl", textAlign: "right" }}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Area type="monotone" dataKey="value" stroke="#292524" name="درخواست‌ها" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Recent Orders Grid / Table */}
      <div className="bg-white border border-stone-200/50 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">آخرین درخواست‌های ثبت‌شده</h3>
            <p className="text-[10px] text-stone-400">پیگیری آخرین مبل‌های لوکس کاندید شده توسط خریداران محترم</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-stone-600 hover:text-stone-900 border border-stone-200/80 px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            مدیریت تمام سفارش‌ها
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-stone-500">
              <thead className="text-xs uppercase text-stone-400 bg-stone-50/50 rounded-xl">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">مشتری</th>
                  <th className="px-4 py-3.5">دستگاه تماس</th>
                  <th className="px-4 py-3.5">محصول کاندید</th>
                  <th className="px-4 py-3.5">نمایشگاه مبلمان</th>
                  <th className="px-4 py-3.5">وضعیت پیگیری</th>
                  <th className="px-4 py-3.5">تاریخ ثبت</th>
                  <th className="px-4 py-3.5 rounded-l-xl text-center">عملیات ادمین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-stone-50/40 transition-colors text-xs text-stone-800">
                    <td className="px-4 py-4 font-bold">{o.customerName}</td>
                    <td className="px-4 py-4 font-mono select-all" dir="ltr">{o.customerPhone}</td>
                    <td className="px-4 py-4">{o.productName}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1">
                        <Sofa className="w-3.5 h-3.5 text-stone-400" />
                        {o.showroomName}
                      </span>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-4 text-stone-400">
                      {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="text-[10px] font-bold text-stone-50 bg-stone-900 hover:bg-stone-800 px-3.5 py-1.5 rounded-xl transition-all"
                      >
                        بررسی جزئیات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-stone-50 rounded-2xl text-stone-400 text-xs">
            هیچ درخواست مشاوره‌ای ثبت نشده است.
          </div>
        )}
      </div>

    </div>
  );
}
