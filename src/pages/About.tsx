import { Sofa, ShieldCheck, HeartHandshake, Compass, Gem } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function About() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const title = settings?.about_title || "درباره گالری مبلمان Modern Home";
  const desc = settings?.about_desc || "ما محصول عینی نمی‌فروشیم — ما حلقه ارتباطی امن و وکیل شما با نمایشگا‌ه‌های ممتاز مبلمان کشور هستیم.";
  const content = settings?.about_content || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900" />
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen text-stone-900 pt-28 pb-20 leading-relaxed">
      <div className="max-w-4xl mx-auto px-4 text-right space-y-12">
        
        {/* About Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-stone-900 text-stone-100 flex items-center justify-center rounded-2xl mx-auto mb-2 shadow-md">
            <Sofa className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900">{title}</h1>
          <p className="text-stone-400 text-xs sm:text-sm font-light">{desc}</p>
        </div>

        {/* Big Banner */}
        <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200">
          <img
            src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&auto=format&fit=crop&q=80"
            alt="Showroom Design"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Business Model Explanation */}
        <div className="bg-white border border-stone-200/50 p-6 sm:p-10 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-stone-900">فرآیند فعالیت و سهم واسطه‌گری ما</h2>
          <div className="space-y-4">
            {content.split("\n").map((paragraph: string, idx: number) => {
              if (!paragraph.trim()) return null;
              return (
                <p key={idx} className="text-stone-600 text-xs sm:text-sm font-light leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            
            <div className="border border-stone-100 bg-stone-50 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <HeartHandshake className="w-5 h-5" />
                <span>حذف بروکراسی سوداگرانه</span>
              </div>
              <p className="text-xs text-stone-400">قیمت دریافتی مشتری منطبق با نرخ کف بازار تولیدی است. ما پورسانت را از نمایشگاه کسر می‌طلبیم نه کلاینت.</p>
            </div>

            <div className="border border-stone-100 bg-stone-50 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>کارشناسی تضمینی به نفع شما</span>
              </div>
              <p className="text-xs text-stone-400">تایپ فوم نشیمن سفارشی (فوم سرد ویژه یا اسفنج ۳۵ کیلویی ساخت ممیز) قبل از ارسال کارگاه تائید فیزیکی می‌شود.</p>
            </div>

          </div>
        </div>

        {/* Values blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <div className="bg-white border border-stone-200/50 p-6 rounded-3xl text-right space-y-3">
            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-800">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">کجاها فعال هستیم؟</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              تیم اداری و بازرسی دکوراسیون ما به طور متمرکز در بازارهای مبل یافت‌آباد تهران، جاده ابعلی و کارخانجات مبل‌سازی مرتضی‌گرد و ماهدشت فعال هستند.
            </p>
          </div>

          <div className="bg-white border border-stone-200/50 p-6 rounded-3xl text-right space-y-3">
            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-800">
              <Gem className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">تعرفه پورسانت نمایشگاه کجاست؟</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              پورسانت واسطه‌گری ما متأثر از قیمت توافقی، بین ۵٪ الی ۱۵٪ است که مستقیما با کارفرما یا مدیر برند نمایشگاه مبل فاکتور و تصفیه مالی می‌شود.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
