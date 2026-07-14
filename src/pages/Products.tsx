import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Product, Category } from "../types";
import ProductCard from "../components/ProductCard";
import { Search, SlidersHorizontal, Archive, Sofa, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Compare Feature States
  const [compareList, setCompareList] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const isCompareModalOpen = searchParams.get("compare") === "true";
  const scrollRef = useRef<HTMLDivElement>(null);

  const setCompareModalOpen = (isOpen: boolean) => {
    setSearchParams(prev => {
      if (isOpen) {
        prev.set("compare", "true");
      } else {
        prev.delete("compare");
      }
      return prev;
    });
  };

  const toggleCompare = (item: any) => {
    setCompareList(prev => {
      if (prev.some(p => p.product.id === item.product.id)) {
        return prev.filter(p => p.product.id !== item.product.id);
      }
      if (prev.length < 3) {
        return [...prev, item];
      }
      return prev; // max 3
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        if (prodData.success) {
          setProducts(prodData.products);
        }

        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error("Products loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products locally for instantaneous UI performance
  const filteredProducts = products.filter((item) => {
    const product = item.product;
    const matchesCategory = selectedCategory === "ALL" || product.categoryId === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.material && product.material.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch && product.isActive;
  });

  return (
    <div className="bg-stone-50 min-h-screen text-stone-900 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-right space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
            کالکشن مبلمان لوکس و ژورنالی
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm font-light max-w-2xl leading-relaxed">
            محصول نهایی را در ابعاد، کلاف، پارچه و اسفنج دلخواه سفارشی‌سازی کنید. هر محصول تحت وکیل واسطه‌گری ما در معتبرترین نمایشگاه‌ها با ضمانت فیزیکی قابل هماهنگی است.
          </p>
        </div>

        {/* Search & Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Search Box */}
            <div className="bg-white border border-stone-200/60 p-5 rounded-3xl space-y-3">
              <label className="text-xs font-bold text-stone-800 block text-right">جستجوی مبل</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: چستر، استیل، مدرن..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-right bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-3 pr-10 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400"
                />
                <Search className="w-4 h-4 text-stone-400 absolute top-3 right-3" />
              </div>
            </div>

            {/* Category selection */}
            <div className="bg-white border border-stone-200/60 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                <h3 className="text-xs font-bold text-stone-800">دسته‌بندی‌ها</h3>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs font-medium transition-all flex justify-between items-center ${
                    selectedCategory === "ALL"
                      ? "bg-stone-900 text-stone-50"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span>همه کالاها</span>
                  <Archive className="w-3.5 h-3.5" />
                </button>

                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-medium transition-all flex justify-between items-center ${
                      selectedCategory === c.id
                        ? "bg-stone-900 text-stone-50"
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <span>{c.name}</span>
                    <ChevronIndicator />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Products Grid Stage */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-white border border-stone-200 rounded-3xl h-[400px]" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((item) => {
                    const isCompared = compareList.some(p => p.product.id === item.product.id);
                    return (
                      <ProductCard
                        key={item.product.id}
                        product={item.product}
                        showroomName={item.showroomName}
                        categoryName={item.categoryName}
                        onCompareToggle={() => toggleCompare(item)}
                        isCompared={isCompared}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-24 bg-white border border-stone-200/50 rounded-3xl space-y-4">
                <Sofa className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">هیچ مبلی یافت نشد!</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                  احتمالاً فیلترهای جستجوی شما بسیار سخت‌گیرانه هستند. فیلترها را ریست کنید یا کلمه‌ی دیگری بنویسید.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSearchQuery("");
                  }}
                  className="bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs px-5 py-2.5 rounded-xl font-semibold transition-all"
                >
                  دیدن تمام مبل‌ها
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
      
      {/* Sticky Compare Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 z-40 px-4 pointer-events-none"
          >
            <div className="max-w-2xl mx-auto bg-stone-900 text-stone-50 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto border border-stone-800">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 space-x-reverse">
                    {compareList.map((c, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-900 overflow-hidden bg-stone-800 shrink-0">
                        <img src={c.product.images?.[0]} alt={c.product.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {compareList.length < 3 && (
                      <div className="w-10 h-10 rounded-full border-2 border-stone-800 border-dashed flex items-center justify-center text-stone-500 bg-stone-900 shrink-0">
                        +
                      </div>
                    )}
                  </div>
                  <div className="text-right pr-2">
                    <p className="text-sm font-bold">{compareList.length} مبل انتخاب شده</p>
                    <p className="text-xs text-stone-400 hidden sm:block">حداکثر ۳ مورد برای مقایسه</p>
                  </div>
                </div>
                
                {/* On mobile, show cancel button here */}
                <button
                  onClick={() => setCompareList([])}
                  className="sm:hidden text-stone-400 hover:text-stone-300 text-xs px-2"
                >
                  انصراف
                </button>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setCompareList([])}
                  className="hidden sm:block text-stone-400 hover:text-stone-300 text-xs px-2"
                >
                  انصراف
                </button>
                <button
                  onClick={() => setCompareModalOpen(true)}
                  disabled={compareList.length < 2}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    compareList.length >= 2
                      ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
                      : "bg-stone-800 text-stone-500 cursor-not-allowed"
                  }`}
                >
                  مقایسه محصولات
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-stone-100 bg-stone-50/50">
                <div>
                  <h2 className="text-xl font-black text-stone-900">مقایسه تخصصی مبلمان</h2>
                  <p className="text-xs text-stone-500 mt-1">تفاوت‌ها را با دقت بررسی کنید</p>
                </div>
                <button
                  onClick={() => setCompareModalOpen(false)}
                  className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <div ref={scrollRef} className="flex md:grid gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']" style={{ gridTemplateColumns: `repeat(${compareList.length}, minmax(0, 1fr))` }}>
                  {compareList.map((item, idx) => (
                    <div key={idx} className="flex flex-col space-y-6 min-w-[260px] md:min-w-0 snap-start h-full">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/50">
                        <img src={item.product.images?.[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-600">{item.categoryName}</p>
                        <h3 className="text-lg font-black text-stone-900">{item.product.name}</h3>
                        <p className="text-sm font-bold text-stone-600 border-b border-stone-100 pb-4">
                          {new Intl.NumberFormat("fa-IR").format(item.product.basePrice)} تومان
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <p className="text-[10px] text-stone-400 mb-1 uppercase tracking-wider font-bold">متریال و کلاف</p>
                          <p className="text-sm text-stone-800 font-medium bg-stone-50 p-3 rounded-xl border border-stone-100">
                            {item.product.material || "نامشخص"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-stone-400 mb-1 uppercase tracking-wider font-bold">نوع پارچه</p>
                          <p className="text-sm text-stone-800 font-medium bg-stone-50 p-3 rounded-xl border border-stone-100">
                            {item.product.fabricType || "نامشخص"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-stone-400 mb-1 uppercase tracking-wider font-bold">محل بازدید فیزیکی</p>
                          <p className="text-sm text-stone-800 font-medium bg-stone-50 p-3 rounded-xl border border-stone-100">
                            {item.showroomName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="w-full inline-flex justify-center items-center bg-stone-900 text-white text-xs font-bold py-3 px-4 rounded-xl hover:bg-stone-800 transition-colors"
                        >
                          خرید و هماهنگی بازدید
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mobile Scroll Controls */}
              <div className="md:hidden flex items-center justify-between px-6 pb-6 border-t border-stone-100 pt-4 bg-stone-50/50">
                <button 
                  onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                  className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <p className="text-xs font-medium text-stone-500">مشاهده محصولات بعدی</p>
                <button 
                  onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                  className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronIndicator() {
  return (
    <svg className="w-3 h-3 text-current transform rotate-180 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
