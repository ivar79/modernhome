import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Product, Category } from "../types";
import ProductCard from "../components/ProductCard";
import { ArrowLeft, Sparkles, Sofa, Shield, Compass, BadgeCheck, PhoneCall, ChevronLeft, Percent, Scale, Layers, ShieldCheck, Headset, WalletCards } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        const prodRes = await fetch("/api/products?showcaseOnly=true");
        const prodData = await prodRes.json();
        if (prodData.success) {
          setFeaturedProducts(prodData.products.slice(0, 3));
        }

        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.categories);
        }

        const setRes = await fetch("/api/settings");
        const setData = await setRes.json();
        if (setData.success) {
          setSettings(setData.settings);
        }
      } catch (err) {
        console.error("Home loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Parse hero images
  const heroImages = settings.hero_images 
    ? settings.hero_images.split(',').map((img: string) => img.trim()).filter(Boolean) 
    : ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80"];

  useEffect(() => {
    if (heroImages.length > 1) {
      const interval = setInterval(() => {
        setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length]);

  return (
    <div 
      className="bg-stone-50 min-h-screen text-stone-900 pb-20 bg-cover bg-fixed bg-center"
      style={settings.site_background ? { backgroundImage: `url(${settings.site_background})` } : {}}
    >
      
      {/* 1. Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0 z-0">
          {heroImages.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              alt="Luxury Sofa"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === heroImageIndex ? "opacity-60" : "opacity-0"
              }`}
              referrerPolicy="no-referrer"
            />
          ))}
          <div className="absolute inset-0 bg-stone-950/40 sm:bg-gradient-to-t sm:from-stone-950/80 sm:via-stone-950/30 sm:to-stone-950/10" />
        </div>

        <div 
          className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 select-none transition-opacity duration-1000"
          style={{ 
            opacity: heroImageIndex === 0 ? 1 : 0,
            pointerEvents: heroImageIndex === 0 ? "auto" : "none"
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-1.5 self-center mx-auto bg-stone-100/10 text-stone-300 border border-stone-100/20 px-4 py-1.5 rounded-full w-fit text-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>پلتفرم تخصصی مقایسه و مشاوره مبلمان لوکس</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-stone-50 leading-[1.4] sm:leading-[1.25] px-4"
          >
            مبلمان لوکس؛ خرید مطمئن، با شرایط اقساطی
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-stone-100 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-[1.8] sm:leading-[1.9] px-6 sm:px-0"
          >
            ما در انتخاب بهترین مبلمان همراه شما هستیم. مشاوره‌ی تخصصی، مقایسه‌ی برندهای معتبر و تضمین بهترین شرایط قیمتی برای خلق خانه‌ای رویایی.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-4 w-full px-6 sm:px-0"
          >
            <Link
              to="/products"
              className="w-full sm:w-auto bg-stone-50 hover:bg-stone-200 text-stone-950 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>مشاهده گالری مبل‌ها</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto bg-stone-900/40 hover:bg-stone-900/60 border border-stone-800 text-stone-100 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <span>درخواست مشاوره رایگان</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Platform Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 text-right">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          
          <div className="flex flex-col gap-4 p-8 bg-white border border-stone-200/50 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-stone-100 text-stone-900 flex items-center justify-center shrink-0 rounded-2xl mx-auto md:mx-0">
              <Headset className="w-6 h-6 text-stone-700" />
            </div>
            <div className="space-y-2 text-center md:text-right">
              <h3 className="text-lg font-bold text-stone-900">مشاوره تخصصی</h3>
              <p className="text-sm text-stone-500 leading-relaxed font-normal">راهنمایی دقیق برای انتخاب سبک، رنگ و متریال متناسب با دکوراسیون منزل شما توسط کارشناسان معماری داخلی.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-8 bg-white border border-stone-200/50 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-stone-100 text-stone-900 flex items-center justify-center shrink-0 rounded-2xl mx-auto md:mx-0">
              <Scale className="w-6 h-6 text-stone-700" />
            </div>
            <div className="space-y-2 text-center md:text-right">
              <h3 className="text-lg font-bold text-stone-900">مقایسه شفاف</h3>
              <p className="text-sm text-stone-500 leading-relaxed font-normal">بررسی و مقایسه بی‌طرفانه کیفیت و قیمت محصولات برترین برندها و نمایشگاه در کنار هم برای خریدی آگاهانه.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-8 bg-white border border-stone-200/50 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-stone-100 text-stone-900 flex items-center justify-center shrink-0 rounded-2xl mx-auto md:mx-0">
              <WalletCards className="w-6 h-6 text-stone-700" />
            </div>
            <div className="space-y-2 text-center md:text-right">
              <h3 className="text-lg font-bold text-stone-900">شرایط اقساطی</h3>
              <p className="text-sm text-stone-500 leading-relaxed font-normal">امکان خرید مبلمان لوکس و با کیفیت بالا از طریق پرداخت‌های منعطف و شرایط اقساطی.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 sm:mt-28">
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-2 text-right">
            <div className="flex items-center gap-1.5 justify-start text-stone-400 text-xs font-bold uppercase">
              <Sofa className="w-4 h-4 text-stone-400" />
              <span>مبلمان برگزیده هفته</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">طرح‌های شاخص نمایشگاه</h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 border-b border-stone-900/0 hover:border-stone-900 pb-0.5 transition-all"
          >
            <span>همه مدل‌ها</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white border border-stone-200 rounded-2xl h-[420px]" />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((p) => (
              <div key={p.product.id} className="w-full">
              <ProductCard
                product={p.product}
                showroomName={p.showroomName}
                categoryName={p.categoryName}
              />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-stone-200/50 rounded-2xl">
            <p className="text-stone-400">هیچ محصولی به عنوان محصول ویژه ثبت نشده است.</p>
          </div>
        )}
      </section>

      {/* 4. Category Exploration Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-stone-900 rounded-3xl overflow-hidden p-8 sm:p-12 text-stone-50 flex flex-col md:flex-row items-center justify-between gap-10 relative">
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80"
              alt="Background sofa text"
              className="w-full h-full object-cover scale-110"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10 space-y-4 max-w-lg text-right">
            <span className="text-xs font-bold text-stone-300 uppercase flex items-center gap-1.5 justify-start">
              <BadgeCheck className="w-4 h-4 text-amber-400" />
              تضمین کیفیت و اصالت
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-50">خرید مبل بی‌دردسر و ایمن</h3>
            <p className="text-xs sm:text-sm text-stone-300 font-normal leading-[1.8] sm:leading-[1.9]">
              دیگر نگران بدعهدی نمایشگاه‌ها یا گران‌فروشی مبل در یافت‌آباد نباشید. کلیه فرآیندهای مالی، برآورد قیمت نهایی و بررسی‌های فنی به عنوان وکیل قانونی و راهنمای خرید شما انجام می‌شود.
            </p>
          </div>

          <div className="relative z-10 shrink-0 w-full md:w-auto">
            <Link
              to="/products"
              className="block text-center w-full md:w-auto bg-stone-50 hover:bg-stone-200 text-stone-900 px-8 py-3.5 rounded-2xl text-sm font-semibold transition-colors"
            >
              مشاوره خرید کالا
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
