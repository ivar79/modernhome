import { adminFetch } from "../adminFetch";
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowRight, Sofa, Loader2 } from "lucide-react";
import { motion } from "motion/react";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("لطفا نام کاربری و رمز عبور را وارد کنید.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify({
          id: data.admin?.id || 1,
          name: data.admin?.name || "مدیر ارشد",
          username: data.admin?.username || "admin",
          role: "admin"
        }));
        window.dispatchEvent(new Event("storage"));
        navigate("/admin");
      } else {
        setError(data.error || "نام کاربری یا رمز عبور اشتباه است.");
      }
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-100 min-h-screen text-stone-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white border border-stone-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6 mx-4"
      >
        <div className="flex justify-between items-start mb-2">
          <Link to="/" className="text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 p-2 rounded-xl border border-stone-100 transition-colors flex items-center gap-1.5 text-[10px] font-bold">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>بازگشت به سایت</span>
          </Link>
        </div>
        
        <div className="text-center space-y-2 mt-2">
          <div className="w-12 h-12 bg-stone-900 text-stone-50 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Sofa className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-stone-950 font-sans tracking-tight">
            ورود به مدیریت خانه مبل
          </h1>
          <p className="text-xs text-stone-400 font-light select-none">
            لطفا نام کاربری و رمز عبور خود را وارد کنید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 flex flex-col items-center">
          <div className="w-full">
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="username">نام کاربری</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 text-left" 
              dir="ltr"
              placeholder="admin"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="password">رمز عبور</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 text-left" 
              dir="ltr"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-stone-50 bg-stone-900 hover:bg-stone-800 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ورود"}
          </button>
        </form>

        {error && (
          <div className="flex gap-2 items-start bg-red-50 border border-red-200 p-3 rounded-xl text-red-700 text-xs text-right mt-4">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
