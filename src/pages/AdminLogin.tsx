import { adminFetch } from "../adminFetch";
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowRight, Sofa } from "lucide-react";
import { motion } from "motion/react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
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
        setError(data.error || "خطا در ورود با گوگل");
      }
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    handleGoogleSuccess({ credential: "demo-google-token" });
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
            ورود به مدیریت Modern Home
          </h1>
          <p className="text-xs text-stone-400 font-light select-none">
            ورود امن از طریق حساب گوگل
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center">
          {clientId ? (
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("خطا در ورود با گوگل")}
              />
            </GoogleOAuthProvider>
          ) : (
            <button
              type="button"
              onClick={handleMockGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-stone-200 rounded-xl shadow-sm text-sm font-bold text-stone-700 bg-white hover:bg-stone-50 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              ورود با گوگل (تست سریع محیطی)
            </button>
          )}
        </div>

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
