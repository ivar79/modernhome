import { Link } from "react-router-dom";
import { Product } from "../types";
import { ArrowLeft, Sparkles, Store, Heart, Scale } from "lucide-react";
import { motion } from "motion/react";
import { useWishlist } from "../hooks/useWishlist";

interface ProductCardProps {
  key?: string | number;
  product: Product;
  showroomName: string;
  categoryName: string;
  onCompareToggle?: (product: any) => void;
  isCompared?: boolean;
}

export default function ProductCard({ product, showroomName, categoryName, onCompareToggle, isCompared }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  // Safe helper to format prices beautifully to Iranian Tomans
  const formatToman = (amount: number) => {
    return new Intl.NumberFormat("fa-IR", {
      style: "decimal",
      useGrouping: true,
    }).format(amount) + " تومان";
  };

  const mainImage = product.images?.[0] || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`group flex flex-col bg-white border ${isCompared ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-stone-200/60 hover:shadow-lg'} rounded-3xl overflow-hidden transition-all duration-300 transform`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={mainImage}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80";
          }}
        />
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted
              ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/20 scale-110"
              : "bg-stone-900/40 text-white hover:bg-stone-900/60 hover:scale-110"
          }`}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Compare Toggle Button */}
        {onCompareToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCompareToggle(product);
            }}
            className={`absolute top-14 left-4 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
              isCompared
                ? "bg-amber-500/90 text-white shadow-lg shadow-amber-500/20 scale-110"
                : "bg-stone-900/40 text-white hover:bg-stone-900/60 hover:scale-110"
            }`}
            title="افزودن به مقایسه"
          >
            <Scale className={`w-4 h-4 ${isCompared ? "text-white" : ""}`} />
          </button>
        )}

        {product.isFeatured && (
          <div className="absolute top-4 right-4 bg-stone-900/90 backdrop-blur-sm text-stone-50 text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>سفارشی / ویژه</span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-stone-50/90 backdrop-blur-sm text-stone-900 border border-stone-200 text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1">
          <Store className="w-3.5 h-3.5 text-stone-500" />
          <span>{showroomName}</span>
        </div>
      </div>

      {/* Details Box */}
      <div className="flex flex-col flex-1 p-6 space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
            {categoryName}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1 leading-tight">
            {product.name}
          </h3>
        </div>

        {/* Technical spec chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {product.material && (
            <span className="bg-stone-50 text-stone-600 border border-stone-100 px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
              {product.material.split(" و ")[0]}
            </span>
          )}
          {product.fabricType && (
            <span className="bg-stone-50 text-stone-600 border border-stone-100 px-2 py-0.5 rounded-md text-[10px] sm:text-xs">
              {product.fabricType}
            </span>
          )}
        </div>

        {/* Separator */}
        <div className="h-px bg-stone-100 w-full" />

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-stone-400">قیمت پایه نمایشگاه</span>
            <span className="text-sm font-extrabold text-stone-900">
              {formatToman(product.basePrice)}
            </span>
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-2xl text-xs font-semibold gap-1.5 transition-all"
          >
            <span className="hidden sm:inline">مشاوره و هماهنگی</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
