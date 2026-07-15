import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import { AnimatePresence } from "motion/react";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CustomerClub from "./pages/CustomerClub";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminProducts from "./pages/AdminProducts";
import AdminShowrooms from "./pages/AdminShowrooms";
import AdminCommissions from "./pages/AdminCommissions";
import AdminSettings from "./pages/AdminSettings";
import AdminCustomers from "./pages/AdminCustomers";
import Wishlist from "./pages/Wishlist";

// Icons for Admin Sidebar
import { LayoutDashboard, ShoppingCart, Sofa, Store, Receipt, LogOut, ChevronLeft, Menu, Settings, Users } from "lucide-react";

export default function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

function MainLayout() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/admin/login";

  // If it's the admin site and NOT the login page, render the special admin workspace
  if (isAdminPath && !isLoginPage) {
    return (
      <AdminRequiredGuard>
        <AdminWorkspaceLayout />
      </AdminRequiredGuard>
    );
  }

  // Otherwise, render the gorgeous client-facing public website
  return (
    <div className="bg-stone-50 min-h-screen text-stone-900 font-sans selection:bg-stone-900 selection:text-stone-50 flex flex-col justify-between">
      {!isLoginPage && <Navbar />}
      <main className="flex-grow pb-20 lg:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/customer-club" element={<CustomerClub />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <BottomNav />}
    </div>
  );
}

// 1. Admin Auth Security Guards
function AdminRequiredGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

// 2. Beautiful Administrative Dashboard Workspace Layout
function AdminWorkspaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("adminUser");
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        setAdminUser({ name: "مدیر ارشد" });
      }
    } else {
      setAdminUser({ name: "مدیر ارشد" });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const menuItems = [
    { path: "/admin", name: "پیشخوان تحلیلی", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/admin/orders", name: "سفارش‌ها و سرنخ‌ها", icon: <ShoppingCart className="w-4 h-4" /> },
    { path: "/admin/products", name: "مدیریت گالری مبل‌ها", icon: <Sofa className="w-4 h-4" /> },
    { path: "/admin/showrooms", name: "مدیریت نمایشگاه‌ها", icon: <Store className="w-4 h-4" /> },
    { path: "/admin/commissions", name: "گزارشات پورسانت", icon: <Receipt className="w-4 h-4" /> },
    { path: "/admin/customers", name: "باشگاه مشتریان و VIP", icon: <Users className="w-4 h-4" /> },
    { path: "/admin/settings", name: "تنظیمات اصلی سایت", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-stone-100 min-h-screen text-stone-900 flex flex-col md:flex-row font-sans" dir="rtl">
      
      {/* Sidebar - Desktop Layout */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-100 shrink-0 border-l border-stone-800 flex flex-col justify-between p-6 md:fixed md:top-0 md:bottom-0 md:right-0">
        <div className="space-y-8">
          
          {/* Logo badge */}
          <div className="flex items-center gap-3 border-b border-stone-800 pb-5">
            <div className="w-9 h-9 bg-amber-500 text-stone-950 rounded-xl flex items-center justify-center font-bold font-sans">
              MH
            </div>
            <div className="text-right leading-none space-y-1">
              <h2 className="text-xs font-extrabold text-stone-50">پنل خانه مبل (MH)</h2>
              <span className="text-[10px] text-stone-400 font-light block">سیستم واسطه‌گری دکور</span>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="bg-stone-800/40 border border-stone-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-700 text-stone-200 flex items-center justify-center font-extrabold text-xs">
              {adminUser?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="text-right leading-none">
              <span className="text-[10px] text-stone-400 block pb-1">خوش‌آمدید</span>
              <p className="text-xs font-bold text-stone-200">{adminUser?.name || "مدیر ارشد"}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 pt-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white text-stone-950"
                      : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  <ChevronLeft className={`w-3.5 h-3.5 transform transition-transform ${isActive ? "opacity-100" : "opacity-0"}`} />
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Footer Sidebar buttons */}
        <div className="space-y-3 pt-6 border-t border-stone-800 mt-6 sm:mt-0">
          <Link
            to="/"
            className="w-full text-right text-[10px] text-stone-500 hover:text-stone-300 block font-light"
          >
            صفحه اصلی سایت عمومی
          </Link>
          <button
            onClick={handleLogout}
            className="w-full bg-stone-850 hover:bg-stone-800 text-rose-450 border border-stone-800 hover:border-red-950/25 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="text-stone-300">خروج از سیستم</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 md:mr-64 flex flex-col min-h-screen">
        
        {/* Mobile top-bar navigation */}
        <header className="md:hidden bg-stone-900 text-stone-100 p-4 flex justify-between items-center z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-stone-300 hover:text-stone-150"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-xs font-bold">پنل مدیریت خانه مبل</span>
          <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-[10px] font-sans">
            ADM
          </div>
        </header>

        {/* Mobile menu sheet drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-30 flex">
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Drawer Sheet */}
              <div className="relative flex flex-col w-64 max-w-xs bg-stone-900 text-stone-100 p-6 z-40 text-right justify-between h-full">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                    <span className="text-xs font-bold text-stone-100">ناوبری پنل ادمین</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-stone-500 font-bold">بستن</button>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {menuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${
                          location.pathname === item.path ? "bg-white text-stone-950" : "text-stone-400"
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full bg-stone-800 text-red-400 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج</span>
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Real Content Body Frame */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 pt-8 sm:pt-10 overflow-y-auto">
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/showrooms" element={<AdminShowrooms />} />
            <Route path="/admin/commissions" element={<AdminCommissions />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
        </main>

      </div>

    </div>
  );
}
