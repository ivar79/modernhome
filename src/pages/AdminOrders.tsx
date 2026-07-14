import { adminFetch } from "../adminFetch";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Order, Showroom, OrderStatus } from "../types";
import { Search, SlidersHorizontal, ArrowDownToLine, Users, Sofa, Calendar, Building, ListFilter, CreditCard, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showroomFilter, setShowroomFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const res = await adminFetch("/api/admin/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }

      const showRes = await adminFetch("/api/showrooms");
      const showData = await showRes.json();
      if (showData.success) {
        setShowrooms(showData.showrooms);
      }
    } catch (err) {
      console.error("Orders fetching error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Soft client side filter
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.order.status === statusFilter;
    const matchesShowroom = showroomFilter === "ALL" || o.order.showroomId === showroomFilter;
    const matchesSearch =
      o.order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesShowroom && matchesSearch;
  });

  // Export CSV Excel formatted UTF-8 report with BOM indicator
  const handleExportCSV = () => {
    // UTF-8 BOM indicator for Excel representation
    const BOM = "\uFEFF";
    let csvContent = "";

    // CSV Headers
    csvContent += "شناسه سفارش,نام مشتری,شماره موبایل,شهر,محصول کاندید,نمایشگاه,قیمت توافقی,نرخ پورسانت,مبلغ پورسانت,وضعیت پرداخت پورسانت,وضعیت سفارش,تاریخ ثبت\n";

    filteredOrders.forEach((o) => {
      const { order, productName, showroomName } = o;
      const row = [
        order.id,
        order.customerName.replace(/,/g, "-"),
        order.customerPhone,
        order.customerCity,
        productName.replace(/,/g, "-"),
        showroomName.replace(/,/g, "-"),
        order.agreedPrice || "ثبت نشده",
        order.commissionRate ? `${order.commissionRate}%` : "پیش‌فرض",
        order.commissionAmount || "۰",
        order.commissionPaid ? "دریافت شده" : "وصول نشده",
        translateStatus(order.status),
        new Date(order.createdAt).toLocaleDateString("fa-IR"),
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `furniture-commission-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const translateStatus = (status: OrderStatus) => {
    switch (status) {
      case "PENDING": return "در انتظار پیگیری";
      case "CONTACTED": return "تماس گرفته شد";
      case "NEGOTIATING": return "در حال مذاکره";
      case "CONFIRMED": return "تایید توافقی سفارش";
      case "DELIVERED": return "تحویل داده شده";
      case "CANCELLED": return "لغو شده";
      default: return status;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">منتظر پیگیری</span>;
      case "CONTACTED":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold">تماس گرفته شده</span>;
      case "NEGOTIATING":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] font-bold">در حال مذاکره</span>;
      case "CONFIRMED":
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-bold">تایید توافق</span>;
      case "DELIVERED":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">تحویل داده شد</span>;
      case "CANCELLED":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold">لغو شده</span>;
    }
  };

  return (
    <div className="space-y-6 text-right pb-10">
      
      {/* Header section with CSV Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200/50 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">مدیریت کل سفارش‌ها و سرنخ‌ها</h1>
          <p className="text-xs text-stone-400 mt-1">تغییر فرآیند وضعیت مبل‌ها، بررسی یادداشت‌های محرمانه و بازمحاسبه کمیسیون</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>خروجی اکسل حسابداری</span>
        </button>
      </div>

      {/* Advanced Filter Widgets Bar */}
      <div className="bg-white border border-stone-200/50 p-5 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        
        {/* Search */}
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label className="text-xs font-bold text-stone-500">جستجوی مشتری یا کالا</label>
          <div className="relative">
            <input
              type="text"
              placeholder="نام خریدار، شماره موبایل، مبل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-3 pr-10 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute top-3.5 right-3" />
          </div>
        </div>

        {/* Status select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-500">منظور از وضعیت</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-800 focus:outline-none"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="PENDING">در انتظار پیگیری</option>
            <option value="CONTACTED">تماس گرفته شده</option>
            <option value="NEGOTIATING">در حال مذاکره</option>
            <option value="CONFIRMED">تایید توافقی سفارش</option>
            <option value="DELIVERED">تحویل شده</option>
            <option value="CANCELLED">لغو شده</option>
          </select>
        </div>

        {/* Showroom filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-500">نمایشگاه مبلمان</label>
          <select
            value={showroomFilter}
            onChange={(e) => setShowroomFilter(e.target.value)}
            className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-800 focus:outline-none"
          >
            <option value="ALL">همه نمایشگاه‌ها</option>
            {showrooms.map((sr) => (
              <option key={sr.id} value={sr.id}>{sr.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main orders table Grid */}
      <div className="bg-white border border-stone-200/50 rounded-3xl p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-stone-500">
              <thead className="text-[10px] sm:text-xs uppercase text-stone-400 bg-stone-50/50 rounded-xl">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">مشتری و شهر</th>
                  <th className="px-4 py-3.5 text-center">شماره تماس</th>
                  <th className="px-4 py-3.5">محصول کاندید شده</th>
                  <th className="px-4 py-3.5">نمایشگاه مبل</th>
                  <th className="px-4 py-3.5">قیمت توافقی</th>
                  <th className="px-4 py-3.5">پورسانت واسطه</th>
                  <th className="px-4 py-3.5">وضعیت پیگیری</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات مالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {filteredOrders.map((o: any) => {
                  const { order, productName, showroomName } = o;
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/50 transition-colors text-xs text-stone-800">
                      
                      <td className="px-4 py-4 space-y-1.5">
                        <p className="font-extrabold text-stone-900">{order.customerName}</p>
                        <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-md">
                          {order.customerCity}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center font-mono select-all" dir="ltr">
                        {order.customerPhone}
                      </td>

                      <td className="px-4 py-4 font-medium">{productName}</td>

                      <td className="px-4 py-4 text-stone-600 space-y-1">
                        <span className="text-xs flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-stone-400" />
                          {showroomName}
                        </span>
                        <p className="text-[10px] text-stone-400">کمیسیون: {order.commissionRate || "۱۰"}٪</p>
                      </td>

                      <td className="px-4 py-4">
                        {order.agreedPrice ? (
                          <span className="font-bold text-stone-950">
                            {new Intl.NumberFormat("fa-IR").format(order.agreedPrice)} تومان
                          </span>
                        ) : (
                          <span className="text-stone-400 italic font-light">تعیین نشده</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {order.commissionAmount ? (
                          <div className="space-y-1">
                            <p className="font-bold text-stone-900">
                              {new Intl.NumberFormat("fa-IR").format(order.commissionAmount)} تومان
                            </p>
                            {order.commissionPaid ? (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">دریافت شد</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-bold">در انتظار دریافت</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">پیش‌فاکتور</span>
                        )}
                      </td>

                      <td className="px-4 py-4">{getStatusBadge(order.status)}</td>

                      <td className="px-4 py-4 text-center">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="bg-stone-900 hover:bg-stone-800 text-stone-50 text-[10px] font-bold px-3 py-2 rounded-xl transition-all"
                        >
                          بررسی و ویرایش فاکتور
                        </Link>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-stone-50 rounded-2xl text-stone-400 text-xs">
            هیچ سفارش یا سرنخی با شرایط داده شده پیدا نشد.
          </div>
        )}
      </div>

    </div>
  );
}
