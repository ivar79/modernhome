import { adminFetch } from "../adminFetch";
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { DollarSign, Wallet, ShieldCheck, Landmark, Sofa, Receipt, CreditCard, Layers } from "lucide-react";

export default function AdminCommissions() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommissions = async () => {
    try {
      const res = await adminFetch("/api/admin/commissions-report");
      const parsed = await res.json();
      if (parsed.success) {
        setReport(parsed);
      }
    } catch (err) {
      console.error("Commissions calculations request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const formatToman = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
      </div>
    );
  }

  const summary = report?.summary || {
    totalSalesVolume: 0,
    totalCommExpected: 0,
    totalCommPaid: 0,
    totalCommUnpaid: 0,
  };

  const showroomPerformance = report?.showroomPerformance || [];
  const transactions = report?.transactions || [];

  // Polished stone theme palette for charts cell representation
  const colors = ["#292524", "#44403c", "#57534e", "#78716c", "#a8a29e", "#d6d3d1"];

  return (
    <div className="space-y-8 text-right pb-10 leading-relaxed">
      
      {/* Page Header */}
      <div className="border-b border-stone-200/50 pb-5">
        <h1 className="text-2xl font-extrabold text-stone-900">گزارشات بیلان مالی و کمیسیون واسطه‌گری</h1>
        <p className="text-xs text-stone-400 mt-1">تراز مالی دریافت‌های پورسانت تولیدی مبل، حجم کل معاملاتی و سود واریزی</p>
      </div>

      {/* Grid Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total transactional volume */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 block pb-1">مجموع فاکتورهای واسطه‌گری</span>
            <span className="text-lg font-extrabold text-stone-900">{formatToman(summary.totalSalesVolume)}</span>
            <span className="text-[10px] text-stone-450 block font-light">مجموع وجوه توافق‌ شده مبل‌ها</span>
          </div>
          <div className="w-11 h-11 bg-stone-50 text-stone-850 rounded-xl flex items-center justify-center shrink-0 border border-stone-100">
            <Layers className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Expected Commission total */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 block pb-1">کل پورسانت مصوب فاکتورها</span>
            <span className="text-lg font-extrabold text-stone-900">{formatToman(summary.totalCommExpected)}</span>
            <span className="text-[10px] text-stone-450 block font-light">مبنای میانگین کمیسیون ثبت‌شده</span>
          </div>
          <div className="w-11 h-11 bg-stone-50 text-stone-850 rounded-xl flex items-center justify-center shrink-0 border border-stone-100">
            <Receipt className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Received Commission */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 block pb-1">کل پورسانت وصول شده</span>
            <span className="text-lg font-extrabold text-emerald-850">{formatToman(summary.totalCommPaid)}</span>
            <span className="text-[10px] text-emerald-600 block bg-emerald-50 w-fit px-1.5 rounded-md font-bold">تسویه شده با کارفرما</span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Outstanding commissions */}
        <div className="bg-white border border-stone-200/50 p-6 rounded-3xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 block pb-1">باقی‌مانده معوقه (در انتظار)</span>
            <span className="text-lg font-extrabold text-rose-800">{formatToman(summary.totalCommUnpaid)}</span>
            <span className="text-[10px] text-stone-450 block font-light">طلب آژانس در جریان وصول</span>
          </div>
          <div className="w-11 h-11 bg-rose-50/50 text-rose-700 rounded-xl flex items-center justify-center shrink-0 border border-rose-100/60">
            <Wallet className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Recharts Showroom comparison Bar chart */}
      <div className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-stone-900">سهم درآمدزایی به تفکیک کل نمایشگاه‌ها</h3>
          <p className="text-[10px] text-stone-400">تایپ تجمیعی سود وصول‌شده و در جریان وصول مربوط به هر برند همکار (تومان)</p>
        </div>

        <div className="h-80 w-full pt-4">
          {showroomPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={showroomPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="showroomName" stroke="#78716c" fontSize={11} fontFamily="sans-serif" tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} fontFamily="sans-serif" tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${new Intl.NumberFormat("fa-IR").format(value)} تومان`, "سهم درآمد"]}
                  contentStyle={{ backgroundColor: "#1c1917", borderRadius: "16px", color: "#fafaf9", border: "none", fontSize: "11px", direction: "rtl", textAlign: "right" }}
                />
                <Bar dataKey="commissionSum" radius={[8, 8, 0, 0]}>
                  {showroomPerformance.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-xs text-stone-400 italic font-light">اطلاعاتی جهت ترسیم چارت سهم سود مبل‌سازان موجود نیست.</div>
          )}
        </div>
      </div>

      {/* Ledger Table: Transactions list of commissions payments */}
      <div className="bg-white border border-stone-200/50 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-stone-900">بیلان واریزی و تاریخ‌نگار دریافت‌های پورسانت</h3>
          <p className="text-[10px] text-stone-400">فهرست ریز تراکنش‌ها و متدهای دریافتی بابت صورت‌حساب‌های تایید شده نهایی</p>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-stone-500">
              <thead className="text-xs uppercase text-stone-400 bg-stone-50/50 rounded-xl">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">مشتری</th>
                  <th className="px-4 py-3.5">مبل کاندید</th>
                  <th className="px-4 py-3.5">نمایشگاه سازنده</th>
                  <th className="px-4 py-3.5">مبلغ کل قرارداد</th>
                  <th className="px-4 py-3.5">پورسانت واریزی</th>
                  <th className="px-4 py-3.5 text-center">روش تصفیه</th>
                  <th className="px-4 py-3.5 text-center">یادداشت بانکی</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">تاریخ وصول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-stone-50/40 transition-colors text-xs text-stone-800">
                    
                    <td className="px-4 py-4 font-bold">{t.customerName}</td>
                    
                    <td className="px-4 py-4">{t.productName}</td>

                    <td className="px-4 py-4 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <Sofa className="w-3.5 h-3.5 text-stone-400" />
                        {t.showroomName}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-stone-600">
                      {new Intl.NumberFormat("fa-IR").format(t.agreedPrice)} تومان
                    </td>

                    <td className="px-4 py-4 font-extrabold text-emerald-800">
                      {new Intl.NumberFormat("fa-IR").format(t.amount)} تومان
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] text-stone-600 bg-stone-100 px-2 py-1 rounded-md border border-stone-200/50">
                        <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                        {t.paymentMethod || "فیش بانکی"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center text-stone-500 italic font-light max-w-xs truncate">
                      {t.notes || <span className="text-stone-300">-</span>}
                    </td>

                    <td className="px-4 py-4 text-center text-stone-400">
                      {new Date(t.paidAt).toLocaleDateString("fa-IR")}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-stone-50 rounded-2xl text-stone-400 text-xs">
            تاکنون هیچ وصول پورسانتی در سیستم فاکتورسازی واسطه‌گری تسویه قطعی نشده است.
          </div>
        )}
      </div>

    </div>
  );
}
