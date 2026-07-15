import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Product, Showroom, Category } from "../types";
import { ArrowRight, CheckCircle2, Store, Calendar, HelpCircle, PhoneCall, Heart, Star, Sparkles, MapPin, ShieldAlert, BadgeInfo, ShieldCheck, Scale, Percent, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "../hooks/useWishlist";
import { Helmet } from "react-helmet-async";

function WishlistToggle({ productId }: { productId: string }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);

  return (
    <button
      onClick={() => toggleWishlist(productId)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
        isWishlisted 
          ? "bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100" 
          : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-900"
      }`}
    >
      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
      <span>{isWishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}</span>
    </button>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [data, setData] = useState<{ product: Product; showroom: Showroom; category: Category } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  
  // Lead Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("تهران");
  const [customerMessage, setCustomerMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Capture referral code if present in url query
    const searchParams = new URLSearchParams(window.location.search);
    const refParam = searchParams.get("ref");
    if (refParam) {
      localStorage.setItem("m_referrer", refParam.trim());
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const parsed = await res.json();
        if (parsed.success) {
          setData(parsed.data);
          if (parsed.data.product.images?.length > 0) {
            setActiveImage(parsed.data.product.images[0]);
          }
        }
      } catch (err) {
        console.error("Detail fetching error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]);

  // Iranian cities
  const iranianCities = [
    "تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "کرج", "قم", "رشت", "اهواز", "کرمان", "یزد", "همدان", "ساری", "کرمانشاه"
  ];

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    if (!customerName || !customerPhone || !customerCity) {
      setErrorMessage("لطفاً تمام کادرهای ستاره‌دار را پر کنید.");
      setIsSubmitting(false);
      return;
    }

    const iranPhoneRegex = /^(\+98|0098|98|0)?9[0-9]{9}$/;
    if (!iranPhoneRegex.test(customerPhone)) {
      setErrorMessage("شماره موبایل اشتباه است. مثال مناسب: 09121234567");
      setIsSubmitting(false);
      return;
    }

    // Append optional referral code if present in localStorage
    let finalMessage = customerMessage;
    const storedReferrer = localStorage.getItem("m_referrer");
    if (storedReferrer) {
      finalMessage = `${customerMessage ? customerMessage + "\n" : ""}[کد معرف: ${storedReferrer}]`;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerCity,
          customerMessage: finalMessage,
          productId: data?.product.id,
        })
      });

      const resJson = await res.json();
      if (resJson.success) {
        setFormSuccess(true);
        // Reset states
        setCustomerName("");
        setCustomerPhone("");
        setCustomerMessage("");
      } else {
        setErrorMessage(resJson.error || "مشکلی در ذخیره اطلاعات به وجود آمد.");
      }
    } catch (err: any) {
      setErrorMessage("خطا در ارتباط با سرور. دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-stone-50 min-h-screen pt-36 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-stone-50 min-h-screen pt-36 pb-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-800">کالای انتخابی شما پیدا نشد!</h2>
        <Link to="/products" className="inline-block bg-stone-900 text-stone-50 px-5 py-2 rounded-xl text-xs">
          برگشت به گالری مبل‌ها
        </Link>
      </div>
    );
  }

  const { product, showroom, category } = data;
  const isImagePlaceholder = !product.images || product.images.length === 0;
  const currentImage = activeImage || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="bg-stone-50 min-h-screen text-stone-900 pt-28 pb-20 leading-relaxed">
      <Helmet>
        <title>{product.name} | گالری مبلمان خانه مبل</title>
        <meta name="description" content={product.description || `خرید ${product.name} از نمایشگاه ${showroom.name} با بهترین کیفیت.`} />
        <meta property="og:title" content={`${product.name} | گالری مبلمان خانه مبل`} />
        <meta property="og:description" content={product.description || `خرید ${product.name} از نمایشگاه ${showroom.name} با بهترین کیفیت.`} />
        {product.images && product.images.length > 0 && <meta property="og:image" content={product.images[0]} />}
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Bar: Back Link & Wishlist */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/products" className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowRight className="w-4 h-4" />
            <span>برگشت به گالری و کاتالوگ</span>
          </Link>
          
          <WishlistToggle productId={product.id} />
        </div>

        {/* Double Column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Column 1: Images Stage & Technical details */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Image display stage */}
            <div className="bg-white border border-stone-200/50 p-4 rounded-3xl space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 group">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Thumbs Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border-2 transition-all ${
                        activeImage === imgUrl ? "border-stone-900" : "border-transparent opacity-70"
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Technical Parameters Table */}
            <div className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-lg font-extrabold text-stone-900">مشخصات فنی و متریال ساخت</h3>
                <p className="text-xs text-stone-400 mt-1">کلیه پارامترهای زیر در هنگام سفارش قابل شخصی‌سازی هستند.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                  <span className="text-stone-400 font-bold">جنس کلاف کل بدنه</span>
                  <span className="text-stone-800 font-extrabold">{product.material || "چوب درخت روس چنار خشک"}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                  <span className="text-stone-400 font-bold">پایه و متریال روکار</span>
                  <span className="text-stone-800 font-extrabold">{product.baseMaterial || "راش طبیعی گرجستان"}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                  <span className="text-stone-400 font-bold">فوم و اسفنج نشیمن</span>
                  <span className="text-stone-800 font-extrabold">{product.seatSponge || "اسفنج ۳۵ کیلویی ویژه"}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                  <span className="text-stone-400 font-bold">نوع و متریال پارچه</span>
                  <span className="text-stone-800 font-extrabold">{product.fabricType || "پارچه خارجی نانو مسکو"}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                  <span className="text-stone-400 font-bold">ابعاد و ساختار فیزیکی</span>
                  <span className="text-stone-800 font-extrabold">{product.dimensions || "اندازه استاندارد ژورنالی"}</span>
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                  <span className="text-stone-400 font-bold">کلاف تقویتی داخل کار</span>
                  <span className="text-stone-800 font-extrabold">{product.innerFrame || "چوب راش و اتصالات فلزی"}</span>
                </div>

              </div>

              {/* Interactive Colors/Fabric Selector */}
              {((product.colorVariants && product.colorVariants.length > 0) || (product.colors && product.colors.length > 0)) && (
                <div className="pt-4 border-t border-stone-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="text-sm font-extrabold text-stone-900 mb-1">کالیته پارچه و چرم</h4>
                      <p className="text-xs text-stone-500 font-light">رنگ مورد نظر خود را برای مشاهده انتخاب کنید</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {/* Render color variants if they exist, else fallback to simple string colors */}
                    {(product.colorVariants && product.colorVariants.length > 0 
                      ? product.colorVariants 
                      : (product.colors || []).map(c => ({ name: c }))
                    ).map((variant: any, idx) => {
                      const c = variant.name;
                      
                      // Generate a pseudo-color based on string for preview purposes
                      const pseudoColors: Record<string, string> = {
                        "سفید": "bg-stone-100 border-stone-200",
                        "کرم": "bg-[#F5F5DC] border-[#E8E8C8]",
                        "طوسی": "bg-stone-400 border-stone-500",
                        "زغالی": "bg-stone-700 border-stone-800",
                        "سبز": "bg-[#4A5D23] border-[#3A4D13]",
                        "آبی": "bg-[#2C3E50] border-[#1C2E40]",
                        "مشکی": "bg-stone-900 border-black",
                        "نسکافه ای": "bg-[#D4B895] border-[#C4A885]",
                        "قهوه ای": "bg-[#5C4033] border-[#4C3023]",
                        "زرشکی": "bg-[#800000] border-[#700000]",
                      };
                      
                      // Find best match or default to a neutral
                      const matchedKey = Object.keys(pseudoColors).find(key => c.includes(key));
                      const colorClass = matchedKey ? pseudoColors[matchedKey] : "bg-stone-300 border-stone-400";
                      
                      return (
                        <button 
                          key={idx} 
                          onClick={() => {
                             // Just a small interaction to show it's clickable
                             const el = document.getElementById(`fabric-preview-${idx}`);
                             if (el) {
                               el.classList.add("scale-95");
                               setTimeout(() => el.classList.remove("scale-95"), 150);
                             }
                             
                             // Update main image if variant has one
                             if (variant.productImage) {
                               setActiveImage(variant.productImage);
                             }
                          }}
                          className="group flex flex-col items-center gap-2 cursor-pointer"
                        >
                          {variant.image ? (
                            <img 
                              id={`fabric-preview-${idx}`}
                              src={variant.image}
                              alt={c}
                              className="w-10 h-10 rounded-full border-2 border-stone-200 object-cover transition-all duration-200 shadow-sm group-hover:shadow-md group-hover:scale-105 group-hover:border-stone-900"
                            />
                          ) : (
                            <div 
                              id={`fabric-preview-${idx}`}
                              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 shadow-sm ${colorClass} group-hover:shadow-md group-hover:scale-105 group-hover:border-stone-900`}
                              title={c}
                            />
                          )}
                          <span className="text-[10px] text-stone-600 font-medium">{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 flex gap-2 items-start">
                    <BadgeInfo className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-stone-500 leading-relaxed text-right">
                      رنگ‌های نمایش داده شده صرفاً جهت تقریب ذهنی است. برای مشاهده دقیق بافت و رنگ در نور طبیعی، از گزینه <strong>«درخواست ارسال کالیته پارچه»</strong> استفاده کنید.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Order Lead Form & Showroom Details */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Header Product Details */}
            <div className="bg-white border border-stone-200/50 p-6 sm:p-8 rounded-3xl space-y-4">
              <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-xs font-bold w-fit">
                {category.name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight">
                {product.name}
              </h1>

              <p className="text-stone-500 text-xs sm:text-sm font-light leading-relaxed">
                {product.description || "هیچ توضیحی برای این محصول لوکس توسط نمایشگاه مبل نوشته نشده است. مبلی بر اساس الگوهای نوین دکوراسیون و راحتی بی عیب و نقص."}
              </p>

              <div className="h-px bg-stone-100" />

              {/* Price Row / Dynamic Anti-Bypass Comparison */}
              <div className="space-y-3.5 pt-2">
                <div className="flex justify-between items-center text-xs text-stone-400 font-semibold line-through">
                  <span>خرید آزاد و مستقیم از فیزیک نمایشگاه:</span>
                  <span>
                    {new Intl.NumberFormat("fa-IR").format(Math.round(product.basePrice * 1.05 / 50000) * 50000)} <span className="text-[10px]">تومان</span>
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-stone-50 border border-stone-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] bg-amber-100 text-stone-900 border border-amber-200 px-2 py-0.5 rounded-lg font-extrabold inline-block leading-none mb-1">
                      ۵٪ تخفیف نقدی پلتفرم
                    </span>
                    <span className="text-xs font-extrabold text-stone-900 block">قیمت نهایی با ثبت از طریق سایت:</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-stone-900">
                    {new Intl.NumberFormat("fa-IR").format(product.basePrice)} <span className="text-xs font-sans">تومان</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Showroom metadata card */}
            <div className="bg-white border border-stone-200/50 p-5 rounded-3xl flex items-start gap-4">
              <div className="w-12 h-12 bg-stone-100/50 rounded-2xl flex items-center justify-center shrink-0 text-stone-800">
                <Store className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1 text-right">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">نمایشگاه عرضه‌کننده</h4>
                <p className="text-sm font-bold text-stone-900">{showroom.name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-stone-500 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-100">
                  <MapPin className="w-3.5 h-3.5" />
                  {showroom.city}
                </span>
              </div>
            </div>

            {/* Order Form (Lead Generation) */}
            <div className="bg-stone-900 text-stone-50 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-l from-amber-400 via-stone-500 to-stone-400" />
              
              <div className="space-y-1.5 text-right">
                <h3 className="text-lg font-extrabold text-stone-50">رزرو وقت بازدید و مشاوره اختصاصی</h3>
                <p className="text-stone-400 text-xs font-light">مبلمان واسطه‌گری ما را با بهترین شرایط قیمتی کاندید کنید. کارشناسان ما جهت هماهنگی با شما تماس خواهند گرفت.</p>
              </div>

              {!formSuccess ? (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 block text-right">
                      نام و نام خانوادگی <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: علی محمدی"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-right bg-stone-800/80 border border-stone-700/80 rounded-xl py-2.5 px-4 text-xs text-stone-50 placeholder-stone-500 focus:outline-none focus:border-stone-400 transition-colors"
                    />
                  </div>

                  {/* Phone field with Iranian Validation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 block text-right">
                      شماره موبایل <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 09123456789"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-left bg-stone-800/80 border border-stone-700/80 rounded-xl py-2.5 px-4 text-xs text-stone-50 placeholder-stone-500 focus:outline-none focus:border-stone-400 transition-colors"
                      dir="ltr"
                    />
                  </div>

                  {/* City Select */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300 block text-right">
                        شهر محل سکونت <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full text-right bg-stone-800/80 border border-stone-700/80 rounded-xl py-2.5 px-3 text-xs text-stone-100 focus:outline-none focus:border-stone-400 transition-colors"
                      >
                        {iranianCities.map((c) => (
                          <option key={c} value={c} className="bg-stone-900 text-stone-100 text-right">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-300 block text-right">توضیحات اختیاری (پارچه، کلاف، ابعاد خاص)</label>
                    <textarea
                      rows={3}
                      placeholder="رنگ پارچه دلخواه را اینجا یادداشت کنید..."
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      className="w-full text-right bg-stone-800/80 border border-stone-700/80 rounded-xl py-2.5 px-4 text-xs text-stone-50 placeholder-stone-500 focus:outline-none focus:border-stone-400 transition-colors resize-none"
                    />
                  </div>

                  {/* Errors display */}
                  {errorMessage && (
                    <div className="flex gap-2 items-start bg-red-950/50 border border-red-900/60 p-3 rounded-xl text-red-300 text-xs">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit button */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-stone-50 hover:bg-stone-200 text-stone-900 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">در حال پردازش...</span>
                      ) : (
                        <>
                          <PhoneCall className="w-4 h-4" />
                          <span>رزرو وقت بازدید و مشاوره اختصاصی</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => alert("درخواست شما برای ارسال کالیته ثبت شد. همکاران ما برای هماهنگی آدرس با شما تماس می‌گیرند.")}
                      className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 hover:text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      <span>درخواست ارسال کالیته پارچه (VIP)</span>
                    </button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-stone-800/40 border border-stone-700 p-6 rounded-2xl text-center space-y-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-extrabold text-stone-50">بسته طلایی و تخفیف ۵٪ شما رزرو شد!</h4>
                  <p className="text-stone-300 text-xs font-light leading-relaxed">
                    با تشکر از ثبت هوشمندانه درخواست در پلتفرم واسطه‌گری <span className="font-semibold text-stone-50">خانه مبل</span>.<br />
                    تخفیف انحصاری ۵٪، بن مشاوره دکوراسیون و گارانتی کاربری مهندسی متریال مبل برای شماره‌ی <span className="font-bold underline text-stone-100">{customerPhone}</span> قفل شد. کارشناسان ما ظرف ۲۴ ساعت آینده با شما تماس خواهند گرفت.
                  </p>
                  <button
                    onClick={() => setFormSuccess(false)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-50 text-[10px] px-4 py-2 rounded-lg font-bold"
                  >
                    ثبت مجدد درخواستِ مشاوره
                  </button>
                </motion.div>
              )}
            </div>

            {/* Platform notice badge */}
            <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-3xl flex gap-2.5 items-start">
              <BadgeInfo className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-stone-500 leading-relaxed text-right">
                <strong>توجه مالی:</strong> پرداخت شما مستقیماً در وجه نمایشگاه مبلمان به قیمت مصوب تولیدی، در فاکتور رسمی نمایشگاه تسویه می‌شود. هیچ مبلغی تحت عنوان بیعانه از طرف این پلتفرم از کلاینت‌ها اخذ نخواهد شد.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
