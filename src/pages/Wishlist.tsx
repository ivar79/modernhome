import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Product, Category, Showroom } from "../types";
import ProductCard from "../components/ProductCard";
import { Heart, ArrowLeft, Sofa } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "../hooks/useWishlist";

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        
        const showRes = await fetch("/api/showrooms");
        const showData = await showRes.json();

        if (prodData.success) {
          setProducts(prodData.products);
        }
        if (catData.success) {
          setCategories(catData.categories);
        }
        if (showData.success) {
          setShowrooms(showData.showrooms);
        }
      } catch (err) {
        console.error("Failed to fetch data for wishlist", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24 font-sans selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/10 mb-2">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-900">
            مبلمان مورد علاقه شما
          </h1>
          <p className="text-stone-500 max-w-2xl text-sm md:text-base leading-relaxed">
            محصولاتی که برای بررسی و خرید آینده ذخیره کرده‌اید. برای ثبت سفارش روی محصول کلیک کنید تا با مشاوران ما در ارتباط باشید.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-stone-400 animate-pulse">در حال بازیابی لیست علاقه‌مندی‌ها...</p>
          </div>
        ) : wishlistedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-stone-200/60 shadow-sm"
          >
            <div className="w-24 h-24 bg-stone-100 text-stone-300 rounded-full flex items-center justify-center mb-6">
              <Sofa className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">لیست علاقه‌مندی‌های شما خالی است</h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto mb-8">
              شما هنوز هیچ مبلمانی را به لیست علاقه‌مندی‌های خود اضافه نکرده‌اید. با کلیک روی نماد قلب محصولات، آن‌ها را اینجا ذخیره کنید.
            </p>
            <Link
              to="/products"
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-xl shadow-stone-900/10"
            >
              <span>مشاهده محصولات</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            <AnimatePresence>
              {wishlistedProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const showroom = showrooms.find((s) => s.id === product.showroomId);
                
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={category?.name || "دسته بندی نامشخص"}
                    showroomName={showroom?.name || "نمایشگاه نامشخص"}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
