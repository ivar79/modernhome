import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sofa, KeyRound, Menu, X, ArrowLeft, ArrowRight, Crown, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "../hooks/useWishlist";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");
  const isHome = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [settings, setSettings] = useState<any>({});
  
  const { wishlist } = useWishlist();
  const [wishlistCount, setWishlistCount] = useState(wishlist.length);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.settings);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setWishlistCount(wishlist.length);
  }, [wishlist.length]);

  useEffect(() => {
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "صفحه اصلی", path: "/" },
    { label: "گالری محصولات", path: "/products" },
    { label: "باشگاه مشتریان و VIP", path: "/customer-club" },
    { label: "درباره ما", path: "/about" },
    { label: "ارتباط با ما", path: "/contact" },
  ];

  const isDarkBg = isHome && !isScrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-stone-50/90 backdrop-blur-xl border-b border-stone-200/50 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          
          {/* Desktop Right (Logo & Nav) */}
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              {settings.site_logo ? (
                <>
                  <img 
                    src={settings.site_logo} 
                    alt="Khane Mobl Logo" 
                    className="h-8 object-contain" 
                    referrerPolicy="no-referrer"
                  />
                  <span className={`font-bold text-xl transition-colors ${isDarkBg ? 'text-white' : 'text-stone-900'}`}>Khane Mobl</span>
                </>
              ) : (
                <span className={`font-bold text-2xl transition-colors ${isDarkBg ? 'text-white' : 'text-stone-900'}`}>
                  Khane Mobl
                </span>
              )}
            </Link>

            {!isAdmin && (
              <div className="hidden lg:flex items-center gap-8" dir="rtl">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative text-sm font-medium transition-colors py-1 ${
                        isActive
                          ? (isDarkBg ? "text-white font-semibold" : "text-stone-900 font-semibold")
                          : (isDarkBg ? "text-stone-300 hover:text-white" : "text-stone-500 hover:text-stone-900")
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavTab"
                          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${isDarkBg ? 'bg-white' : 'bg-stone-900'}`}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Left (Auth/Admin Actions) */}
          <div className="hidden lg:flex items-center gap-4">
            {!isAdmin ? (
              <>
                {!isHome && (
                  <Link
                    to="/"
                    className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3.5 py-2.5 rounded-xl transition-all"
                  >
                    <span>صفحه اصلی</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                )}
                
                <Link
                  to="/wishlist"
                  className="relative flex items-center justify-center p-2.5 rounded-xl text-stone-600 hover:bg-stone-100 hover:text-rose-500 transition-colors"
                  title="علاقه‌مندی‌ها"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white border border-white" />
                  )}
                </Link>

                <Link
                  to="/customer-club"
                  className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/[0.08]"
                >
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>باشگاه مشتریان و VIP</span>
                </Link>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 text-xs font-medium border px-4 py-2.5 rounded-lg transition-colors ${
                    isDarkBg 
                      ? "text-stone-300 border-stone-500/50 hover:text-white hover:bg-stone-800/50 hover:border-stone-400" 
                      : "text-stone-500 hover:text-stone-900 border-stone-200/80 hover:bg-stone-50"
                  }`}
                  title="پنل مدیریت واسطه‌گری"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>ورود به پنل مدیریت</span>
                </Link>
              </>
            ) : (
              <Link
                to="/"
                className="flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 border border-stone-200 bg-stone-50 px-4 py-2.5 rounded-lg transition-colors"
              >
                <span>صفحه اصلی</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 -mr-2 transition-colors ${isDarkBg ? 'text-white' : 'text-stone-900'}`}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-7 h-7" strokeWidth={1.5} /> : <Menu className="w-7 h-7" strokeWidth={1.5} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-stone-50 border-b border-stone-200 shadow-2xl absolute top-full left-0 right-0 z-50 rounded-b-3xl max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="px-6 py-8 space-y-8 flex flex-col">
              {!isAdmin ? (
                <>
                  <div className="flex flex-col gap-5 w-full text-right" dir="rtl">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`block text-lg transition-colors ${
                          location.pathname === link.path
                            ? "text-stone-900 font-medium"
                            : "text-stone-500 hover:text-stone-900 font-light"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="w-full pt-8 border-t border-stone-200 flex flex-col gap-3">
                    <Link
                      to="/wishlist"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-bold text-rose-800 border border-rose-100 bg-rose-50 px-4 py-3.5 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span>محصولات مورد علاقه ({wishlistCount})</span>
                    </Link>

                    <Link
                      to="/customer-club"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-extrabold text-amber-900 bg-amber-100/80 hover:bg-amber-100 border border-amber-200/50 px-4 py-3.5 rounded-xl transition-all shadow-sm"
                    >
                      <Crown className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>باشگاه مشتریان و VIP</span>
                    </Link>
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full text-sm font-medium text-stone-600 border border-stone-200 bg-white px-4 py-3.5 rounded-xl hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>ورود به پنل مدیریت</span>
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-center bg-stone-900 text-white px-4 py-4 rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                >
                  <span>صفحه اصلی</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
