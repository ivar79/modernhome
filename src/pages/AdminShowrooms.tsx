import { adminFetch } from "../adminFetch";
import React, { useEffect, useState } from "react";
import { Showroom } from "../types";
import { Plus, Edit2, Check, X, Store, Phone, Percent, MapPin, Save, ShieldAlert, CircleDot } from "lucide-react";
import { motion } from "motion/react";

export default function AdminShowrooms() {
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Form togglers
  const [showForm, setShowForm] = useState(false);
  const [editShowroom, setEditShowroom] = useState<Showroom | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("تهران");
  const [contactPhone, setContactPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    try {
      const res = await adminFetch("/api/showrooms");
      const parsed = await res.json();
      if (parsed.success) {
        setShowrooms(parsed.showrooms);
      }
    } catch (err) {
      console.error("Showrooms API loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditShowroom(null);
    setName("");
    setCity("تهران");
    setContactPhone("");
    setContactName("");
    setCommissionRate("10");
    setAddress("");
    setNotes("");
    setIsActive(true);
    setErrorMsg("");
  };

  const handleEditClick = (sr: Showroom) => {
    setEditShowroom(sr);
    setName(sr.name);
    setCity(sr.city);
    setContactPhone(sr.contactPhone);
    setContactName(sr.contactName || "");
    setCommissionRate(String(parseFloat(sr.commissionRate)));
    setAddress(sr.address || "");
    setNotes(sr.notes || "");
    setIsActive(sr.isActive);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteToggle = async (id: string) => {
    try {
      const res = await adminFetch(`/api/showrooms/${id}`, { method: "DELETE" });
      const parsed = await res.json();
      if (parsed.success) {
        await fetchData();
      }
    } catch (err) {
      console.error("Delete showroom toggle request failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    if (!name || !city || !contactPhone || commissionRate === "") {
      setErrorMsg("لطفاً تمام کادرهای الزامی علامت‌دار را تکمیل بفرمایید.");
      setSaving(false);
      return;
    }

    const payload = {
      name,
      city,
      contactPhone,
      contactName,
      commissionRate: Number(commissionRate),
      address,
      notes,
      isActive,
    };

    try {
      const url = editShowroom ? `/api/showrooms/${editShowroom.id}` : "/api/showrooms";
      const method = editShowroom ? "PUT" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await res.json();
      if (parsed.success) {
        setShowForm(false);
        resetForm();
        await fetchData();
      } else {
        setErrorMsg(parsed.error || "ذخیره‌سازی اطلاعات با خطا روبه‌رو شد.");
      }
    } catch (err) {
      setErrorMsg("عدم ارتباط با دیتابیس.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right pb-10">
      
      {/* Header section with Plus toggle */}
      <div className="flex justify-between items-center border-b border-stone-200/50 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">مدیریت نمایشگاه‌های همکار</h1>
          <p className="text-xs text-stone-400 mt-1">تعریف درصد کمیسیون پیش‌فرض، آدرس اداری و ناظران بارگیری یافت‌آباد و حومه</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs px-4 py-2.5 rounded-xl font-bold transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? "بستن فرم نمایشگاه" : "ثبت نمایشگاه جدید"}</span>
        </button>
      </div>

      {/* Slide form panel */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl text-right shadow-sm"
        >
          <div className="border-b border-stone-100 pb-4 mb-6">
            <h3 className="text-base font-extrabold text-stone-900">
              {editShowroom ? "ویرایش اطلاعات برند همکار" : "افزودن و پیوند نمایشگاه مبل جدید به سیستم"}
            </h3>
            <p className="text-[10px] text-stone-400">اطلاعات فاکتور، پورسانت و کارفرما را با دقت ثبت کنید تا محاسبات پورسانت خودکار مبل‌ها برقرار باشد.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              
              {/* Showroom Name */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-stone-600">نام نمایشگاه مبل <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مبل چسترفیلد ممیز"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              {/* City */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-stone-600">شهر نمایشگاه <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تهران، تبریز، کرج..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-stone-600">تلفن تماس مستقیم <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 09123456789"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-left bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-950 focus:outline-none font-sans"
                  dir="ltr"
                />
              </div>

              {/* Default Commission Rate */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-stone-600">نرخ پورسانت پیش‌فرض (درصد) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="مثال: 10"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full text-left bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-950 focus:outline-none"
                  dir="ltr"
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-stone-600">نام کارفرما / رابط نمایشگاه</label>
                <input
                  type="text"
                  placeholder="مثال: مهندس ممیزی"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5 col-span-3">
                <label className="text-xs font-bold text-stone-600">نشانی دقیق فیزیکی نمایشگاه</label>
                <input
                  type="text"
                  placeholder="مثال: تهران، بازار مبل یافت‌آباد، خیابان شقایق، پلاک ۴۰"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-xs text-stone-900 focus:outline-none"
                />
              </div>

            </div>

            {/* Private notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600">یادداشت‌های محرمانه ادمین دکوراسیون</label>
              <textarea
                rows={2}
                placeholder="یادداشتی درباره نحوه بارگیری، تسویه‌های بانکی و خوش‌قولی تحویل کارگاه..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-xs text-stone-900 focus:outline-none resize-none"
              />
            </div>

            {/* Checkbox settings */}
            <div className="flex gap-4 items-center">
              <input
                type="checkbox"
                id="isActiveSr"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-stone-950 border-stone-300 rounded focus:ring-stone-950 accent-stone-950"
              />
              <label htmlFor="isActiveSr" className="text-xs font-bold text-stone-700 cursor-pointer select-none">
                همکاری فعال سیستم (درج و همگامی در مبل‌های کاتالوگ)
              </label>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-800 p-3.5 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Form actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-stone-900 hover:bg-stone-850 text-stone-50 text-xs px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "در حال به‌روزرسانی سیستم..." : editShowroom ? "اصلاح اطلاعات برند" : "ثبت شراکت نمایشگاهی"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs px-6 py-3 rounded-xl font-bold transition-all"
              >
                انصراف
              </button>
            </div>

          </form>
        </motion.div>
      )}

      {/* Showrooms directory lists */}
      <div className="bg-white border border-stone-200/50 rounded-3xl p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
          </div>
        ) : showrooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right text-stone-500">
              <thead className="text-xs uppercase text-stone-400 bg-stone-50/50 rounded-xl">
                <tr>
                  <th className="px-4 py-3.5 rounded-r-xl">برند نمایشگاه</th>
                  <th className="px-4 py-3.5">شهرستان</th>
                  <th className="px-4 py-3.5">پورسانت پیش‌فرض وکیل</th>
                  <th className="px-4 py-3.5 text-center">ناظر / کلاینت رابط</th>
                  <th className="px-4 py-3.5 text-center">ارتباط مستقیم</th>
                  <th className="px-4 py-3.5 text-center">کتابچه یادداشت</th>
                  <th className="px-4 py-3.5 text-center rounded-l-xl">عملیات مالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {showrooms.map((sr) => (
                  <tr key={sr.id} className={`hover:bg-stone-50/50 transition-colors text-xs text-stone-800 ${!sr.isActive ? "opacity-60 bg-stone-50/10" : ""}`}>
                    
                    <td className="px-4 py-4 font-extrabold text-stone-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-stone-50 text-stone-700 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <span>{sr.name}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="bg-stone-100 text-stone-650 px-2 py-0.5 rounded-md font-bold">
                        {sr.city}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-extrabold text-stone-950 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-stone-400" />
                      <span>{parseFloat(sr.commissionRate)}٪</span>
                    </td>

                    <td className="px-4 py-4 text-center text-stone-600">
                      {sr.contactName || <span className="text-stone-300">مجهول</span>}
                    </td>

                    <td className="px-4 py-4 text-center font-mono select-all" dir="ltr">
                      {sr.contactPhone}
                    </td>

                    <td className="px-4 py-4 text-stone-400 text-xs text-right max-w-xs truncate">
                      {sr.notes || <span className="italic font-light">هیچ یادداشتی موجود نیست.</span>}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-2 justify-center items-center">
                        <button
                          onClick={() => handleEditClick(sr)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 p-2 rounded-lg transition-colors"
                          title="ویرایش شراکت مالی"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteToggle(sr.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            sr.isActive ? "bg-rose-50 hover:bg-rose-100 text-rose-750" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-750"
                          }`}
                          title={sr.isActive ? "تعلیق همکاری" : "شراکت فعال"}
                        >
                          <CircleDot className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-stone-50 rounded-2xl text-stone-400 text-xs">
            هیچ برند نمایشگاهی در پلتفرم ثبت نشده است. ساخت اولین همکاری را آغاز کنید!
          </div>
        )}
      </div>

    </div>
  );
}
