import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, Crown } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';

export default function BottomNav() {
  const location = useLocation();
  const { wishlist } = useWishlist();
  const [wishlistCount, setWishlistCount] = React.useState(wishlist.length);
  
  React.useEffect(() => {
    const handleWishlistUpdate = () => {
      const saved = localStorage.getItem("mh_wishlist");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setWishlistCount(parsed.length);
        } catch (e) {}
      }
    };
    window.addEventListener("wishlist_updated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlist_updated", handleWishlistUpdate);
  }, []);

  const navItems = [
    { path: '/', label: 'خانه', icon: <Home className="w-6 h-6" /> },
    { path: '/products', label: 'محصولات', icon: <Compass className="w-6 h-6" /> },
    { 
      path: '/wishlist', 
      label: 'علاقه‌مندی', 
      icon: (
        <div className="relative">
          <Heart className="w-6 h-6" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border border-white">
              {wishlistCount}
            </span>
          )}
        </div>
      )
    },
    { path: '/customer-club', label: 'کلاب VIP', icon: <Crown className="w-6 h-6" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-200 pb-safe pt-2 px-6 flex justify-between items-center z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${
              isActive ? 'text-amber-600 font-bold' : 'text-stone-400 hover:text-stone-900 font-medium'
            }`}
          >
            {React.cloneElement(item.icon, {
              className: `w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'text-amber-600 fill-amber-600/20' : ''}`
            })}
            <span className="text-[10px] sm:text-xs mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
