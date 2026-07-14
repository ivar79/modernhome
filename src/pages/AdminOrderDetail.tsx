import { adminFetch } from "../adminFetch";
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Order, Product, Showroom, OrderStatus } from "../types";
import { ArrowRight, CheckCircle2, ShieldAlert, Save, Calendar, User, Phone, MapPin, Store, MessageSquare, Briefcase, DollarSign, Gem, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ order: Order; product: Product; showroom: Showroom } | null>(null);
  const [commissionDetail, setCommissionDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [adminNotes, setAdminNotes] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [commissionPaid, setCommissionPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("کارت‌به‌کارت");
  const [commissionNotes, setCommissionNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOrderDetail = async () => {
    try {
      const res = await adminFetch(`/api/admin/orders/${id}`);
      const parsed = await res.json();
      if (parsed.success) {
        setData(parsed.data);
        setCommissionDetail(parsed.commission);

        // Prepopulate states
        const { order } = parsed.data;
        setStatus(order.status);
        setAdminNotes(order.adminNotes || "");
        setStatusNote(order.statusNote || "");
        setAgreedPrice(order.agreedPrice !== null ? String(order.agreedPrice) : "");
        setCommissionPaid(order.commissionPaid);
        
        if (parsed.commission) {
          setPaymentMethod(parsed.commission.paymentMethod || "کارت‌به‌کارت");
          setCommissionNotes(parsed.commission.notes || "");
        }
      }
    } catch (err) {
      console.error("Order detail load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // Live dynamic calculation on client side to show in UI
  const parsedAgreedPrice = Number(agreedPrice) || 0;
  const currentRate = data?.order.commissionRate ? Number(data.order.commissionRate) : 0;
  const liveCommissionAmount = Math.round((parsedAgreedPrice * currentRate) / 100);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg("");

    try {
      const res = await adminFetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes,
          statusNote,
          agreedPrice: agreedPrice !== "" ? Number(agreedPrice) : null,
          commissionPaid,
          paymentMethod,
          commissionNotes,
        }),
      });

      const parsed = await res.json();
      if (parsed.success) {
        setSaveSuccess(true);
        // Refresh values
        await fetchOrderDetail();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg(parsed.error || "خطایی در سابمیت اطلاعات رخ داد.");
      }
    } catch (err) {
      setErrorMsg("سرور در دسترس نیست.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-20 space-y-4">
        <p className="text-stone-400">سفارش مورد نظر پیدا نشد.</p>
        <Link to="/admin/orders" className="bg-stone-900 text-stone-50 text-xs px-4 py-2 rounded-xl">
          برگشت به لیست سفارش‌ها
        </Link>
      </div>
    );
  }

  const { order, product, showroom } = data;

  return (
    <div className="space-y-6 text-right pb-14">
      {/* Back link */}
      <div>
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors">
          <ArrowRight className="w-4 h-4" />
          <span>برگشت به مدیریت سفارشات</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Client Metadata & Product card summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Buyer Profile Info */}
          <div className="bg-white border border-stone-200/50 p-6 rounded-3xl space-y-5">
            <h3 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-3">سرنخ خریدار مبلمان</h3>
            
            <div className="space-y-4 text-xs">
              
              <div className="flex gap-2.5 items-center">
                <div className="w-8 h-8 rounded-lg bg-stone-50 text-stone-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-stone-400 font-bold block">نام خریدار کالا</p>
                  <span className="text-stone-900 font-extrabold">{order.customerName}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <div className="w-8 h-8 rounded-lg bg-stone-50 text-stone-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-stone-400 font-bold block">شماره موبایل ارتباطی</p>
                  <span className="text-stone-900 font-mono select-all font-bold" dir="ltr">{order.customerPhone}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <div className="w-8 h-8 rounded-lg bg-stone-50 text-stone-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-stone-400 font-bold block">استان / شهر سکونت</p>
                  <span className="text-stone-900 font-extrabold">{order.customerCity}</span>
                </div>
              </div>

              {order.customerMessage && (
                <div className="flex gap-2.5 items-start bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                  <MessageSquare className="w-4 h-4 text-stone-450 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-400 font-bold">پیغام بومی مشتری</p>
                    <span className="text-stone-700 italic font-light">{order.customerMessage}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 flex justify-between text-[10px] text-stone-400">
                <span>مکانیزم ثبت: کلاینت سایت</span>
                <span>{new Date(order.createdAt).toLocaleDateString("fa-IR")}</span>
              </div>

            </div>
          </div>

          {/* Product metadata summary */}
          <div className="bg-white border border-stone-200/50 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-3">محصول و نمایشگاه مربوطه</h3>
            
            <div className="flex gap-3.5 items-center">
              <div className="w-16 h-12 rounded-lg bg-stone-50 overflow-hidden shrink-0 border border-stone-100">
                <img
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 text-right">
                <h4 className="text-xs font-bold text-stone-900">{product.name}</h4>
                <p className="text-[10px] text-stone-400">قیمت ابزار پایه: {new Intl.NumberFormat("fa-IR").format(product.basePrice)} تومان</p>
              </div>
            </div>

            <div className="h-px bg-stone-100" />

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>نمایشگاه طرف حساب:</span>
                <span className="font-bold text-stone-850 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-stone-400" />
                  {showroom.name}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>درصد کمیسیون توافقی:</span>
                <span className="font-bold text-stone-850">{order.commissionRate || showroom.commissionRate}٪</span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 2: Big Action Commission updates Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleUpdateOrder} className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-6 text-right shadow-sm">
            
            <div className="border-b border-stone-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-stone-950">بررسی، تایید قیمت و تسویه کمیسیون</h3>
                <p className="text-[10px] text-stone-400 mt-1">تغییر فرآیندهای مالی واسطه‌گری مابین مشتری و کارخانه‌دار</p>
              </div>
              <span className="text-[10px] text-stone-400 select-all font-mono bg-stone-100 px-2 py-1 rounded-md">ID: {order.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Status Selector */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-extrabold text-stone-600 block">وضعیت فعلی پیگیری کالا</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none"
                >
                  <option value="PENDING">در انتظار بررسی / تماس اولیه</option>
                  <option value="CONTACTED">تماس حاصل گردید (توضیحات هماهنگی)</option>
                  <option value="NEGOTIATING">در حال مذاکره تکی قیمت نهایی</option>
                  <option value="CONFIRMED">تایید قطعی خرید مبل (قیمت توافق شد)</option>
                  <option value="DELIVERED">کالا به خانه کلاینت تحویل شد</option>
                  <option value="CANCELLED">کنسل شد / عدم تطابق شرایط</option>
                </select>
              </div>

              {/* Status Note explanation */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-extrabold text-stone-600 block">یادداشت توضیح تغییر وضعیت</label>
                <input
                  type="text"
                  placeholder="مثال: مبل چستر با کالیته پارچه سفید پچ شد."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              {/* Agreed final price */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-extrabold text-stone-600 block">قیمت نهایی فاکتور توافقی (تومان)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="مثال: 58000000"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    className="w-full text-left bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-3 pr-4 text-xs text-stone-900 focus:outline-none"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-stone-400">قیمت پایه مبنا: {new Intl.NumberFormat("fa-IR").format(product.basePrice)} تومان است.</p>
              </div>

              {/* Live calculated commission preview */}
              <div className="bg-stone-900 p-5 rounded-2xl flex flex-col justify-center text-stone-50 col-span-1 border border-stone-800">
                <span className="text-[10px] text-stone-400 block mb-1">مبلغ کمیسیون شما (محاسبه خودکار)</span>
                <span className="text-base sm:text-xl font-extrabold text-amber-400 leading-none tracking-tight">
                  {formatTomanPrice(liveCommissionAmount)}
                </span>
                <span className="text-[9px] text-stone-500 block mt-2 font-light">مبنای محاسبه: {currentRate}٪ پورسانت ثبتی نمایشگاه</span>
              </div>

            </div>

            {/* Separator block */}
            <div className="h-px bg-stone-100" />

            {/* Commission Payment details toggle */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="commissionPaid"
                  checked={commissionPaid}
                  onChange={(e) => setCommissionPaid(e.target.checked)}
                  className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-950 accent-stone-950"
                />
                <label htmlFor="commissionPaid" className="text-xs font-bold text-stone-800 cursor-pointer select-none">
                  پورسانت دریافت شد و کل فاکتور تسویه شد
                </label>
              </div>

              {commissionPaid && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-200/60"
                >
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-stone-600">روش دریافت کمیسیون</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full text-right bg-white border border-stone-200 rounded-lg py-2 px-2 text-xs text-stone-800 focus:outline-none"
                    >
                      <option value="کارت‌به‌کارت">کارت‌به‌کارت بانکی شتاب</option>
                      <option value="نقد">نقد به صندوق</option>
                      <option value="چک">چک صیادی مدت دار</option>
                      <option value="پایانه">صفحه تراکنش پوز نمایشگاه</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-stone-600">یادداشت حسابداری پورسانت</label>
                    <input
                      type="text"
                      placeholder="سری تراکنش، شماره چک یا ارجاع..."
                      value={commissionNotes}
                      onChange={(e) => setCommissionNotes(e.target.value)}
                      className="w-full text-right bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-800 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Admin private notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-stone-600 block">یادداشت خصوصی ادمین (مخفی از خریدار کالا)</label>
              <textarea
                rows={3}
                placeholder="این متن به هیچ وجه در فرانت‌کلاینت عمومی چاپ نخواهد شد و فقط شامل یادداشت‌های پیگیری کاری ادمین است..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-xs text-stone-900 focus:outline-none resize-none"
              />
            </div>

            {/* Success Alert */}
            {saveSuccess && (
              <div className="flex gap-2 items-center bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>کل تغییرات فوانین فاکتورسازی و پرداخت با موفقیت ثبت و بازمحاسبه شد.</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex gap-2 items-center bg-red-50 border border-red-200 p-3.5 rounded-xl text-red-800 text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-stone-900 hover:bg-stone-850 text-stone-50 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "در حال به‌روزرسانی سیستم..." : "ثبت و اصلاح نهایی فاکتور"}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}

function formatTomanPrice(amount: number) {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}
