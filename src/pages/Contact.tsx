import { Phone, Mail, MapPin, Instagram, HelpCircle, Calendar, MessageSquare, Send, MessageCircle, ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function Contact() {
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

  const address = settings?.contact_address || "تهران، بازار مبل یافت‌آباد غربی، بلوار معلم، ساختمان دیزاین فضا، پلاک ۱۸۰، طبقه ۳";
  const phone = settings?.contact_phone || "۰۲۱-۶۶۵۴۳۲۱۰  /  ۰۹۱۲۳۴۵۶۷۸۹";
  const email = settings?.contact_email || "management@modern-home.ir";
  
  const instagram = settings?.instagram || "modern_home_gallery";
  const telegram = settings?.telegram || "modern_home_admin";
  const bale = settings?.bale || "@modern_home";

  // Helper to construct URLs
  const getInstagramUrl = () => {
    if (!instagram) return "#";
    return instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`;
  };

  const getTelegramUrl = () => {
    if (!telegram) return "#";
    return telegram.startsWith("http") ? telegram : `https://t.me/${telegram}`;
  };

  const getBaleUrl = () => {
    if (!bale) return "#";
    const baleHandle = bale.replace("@", "").trim();
    return bale.startsWith("http") ? bale : `https://ble.ir/${baleHandle}`;
  };

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
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-stone-900">ارتباط با آژانس واسطه‌گری مبلمان</h1>
          <p className="text-stone-400 text-xs sm:text-sm font-light">در هر ساعت شبانه‌روز آماده‌ی پاسخگویی و راهنمایی خرید مبلمان لوکس شما هستیم.</p>
        </div>

        {/* Detailed Contact Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">دفتر مرکزی هماهنگی</h3>
            
            <div className="space-y-4">
              
              <div className="flex gap-3 items-start text-xs">
                <MapPin className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-stone-400 block">نشانی فیزیکی مدیریت</span>
                  <span className="text-stone-700">{address}</span>
                </div>
              </div>

              <div className="flex gap-3 items-center text-xs">
                <Phone className="w-5 h-5 text-stone-500 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-stone-400 block">تلفن‌های تماس مستقیم</span>
                  <span className="text-stone-700" dir="ltr">{phone}</span>
                </div>
              </div>

              <div className="flex gap-3 items-center text-xs">
                <Mail className="w-5 h-5 text-stone-500 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-stone-400 block">پست الکترونیکی رسمی</span>
                  <span className="text-stone-700 font-sans">{email}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">ساعات پشتیبانی و بازرسی</h3>
            
            <div className="space-y-4 text-xs">
              
              <div className="flex gap-3 items-start">
                <Calendar className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-stone-400 block">روزهای کاری تیم ناظر</span>
                  <span className="text-stone-700">شنبه الی پنجشنبه / ساعات اداری از ۹:۰۰ صبح الی ۱۸:۰۰ عصر</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <MessageSquare className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-stone-400 block">پاسخگویی آنلاین تلگرام و واتساپ</span>
                  <span className="text-stone-700">کلاینت‌ها می‌توانند شبانه‌روز تصویر مبل مورد نظر را جهت کارشناسی و استعلام قیمت به خطوط ما در پیامرسان‌ها ارسال نمایند.</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Dynamic Social Networks Links Section */}
        <div className="bg-stone-900 text-stone-100 p-8 sm:p-10 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="space-y-2 text-center sm:text-right">
            <h3 className="text-lg font-bold">پیوستن به شبکه‌های اجتماعی خانه مبل</h3>
            <p className="text-stone-400 text-xs font-light">جدیدترین نمونه کارها، مبلمان‌های حراجی و آفی‌های دوره‌ای نمایشگاه‌ها را در کانال‌های زیر دنبال کنید.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            
            {/* Instagram Card */}
            <a
              href={getInstagramUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-800 hover:bg-stone-750 border border-stone-700/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 group transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Instagram className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm block">اینستاگرام خانه مبل</span>
                <span className="text-[10px] text-stone-400 font-mono block">@{instagram}</span>
              </div>
              <span className="text-[10px] text-pink-400 flex items-center gap-1 mt-1 font-semibold group-hover:underline">
                مشاهده صفحه <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            {/* Telegram Card */}
            <a
              href={getTelegramUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-800 hover:bg-stone-750 border border-stone-700/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 group transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 rotate-[-30deg]" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm block">کانال تلگرام ما</span>
                <span className="text-[10px] text-stone-400 font-mono block">@{telegram}</span>
              </div>
              <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-1 font-semibold group-hover:underline">
                عضویت در کانال <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            {/* Bale Card */}
            <a
              href={getBaleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-800 hover:bg-stone-750 border border-stone-700/60 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 group transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm block">پیام‌رسان بله (ایرانی)</span>
                <span className="text-[10px] text-stone-400 font-mono block">{bale}</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold group-hover:underline">
                ارتباط در بله <ExternalLink className="w-3 h-3" />
              </span>
            </a>

          </div>
        </div>

      </div>
    </div>
  );
}
