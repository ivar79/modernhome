import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Flame, Sofa, Store, Percent, Layers, Sparkles, Scale, RefreshCw, Trophy, Crown, ArrowLeft, BarChart2, CheckCircle2, AlertTriangle, LogOut, Copy, Check, Share2, Users, Github, KeyRound, Mail, UserCheck, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomerPortalData {
  phone: string;
  name: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  isVip: boolean;
  rewardPoints: number;
  vipThreshold: number;
  nextRankRemaining: number;
  totalReferrals?: number;
  successfulReferrals?: number;
  referralEarning?: number;
}

export default function CustomerClub() {
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerPortalData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "PERKS" | "SAVINGS">("TIMELINE");
  const [copied, setCopied] = useState(false);

  // OTP standard login variables
  const [otpSent, setOtpSent] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // VIP Password login mode
  const [isVipLoginMode, setIsVipLoginMode] = useState(false);
  const [vipPasswordInput, setVipPasswordInput] = useState("");

  // Social linking OTP variables
  const [socialOtpSent, setSocialOtpSent] = useState(false);
  const [socialOtpInput, setSocialOtpInput] = useState("");
  const [socialOtpTimer, setSocialOtpTimer] = useState(0);

  // Simulated SMS Toast Notification for easy live preview testing
  const [notification, setNotification] = useState<{ title: string; message: string; code?: string } | null>(null);

  // Social Login & Association variables
  const [simulatedProvider, setSimulatedProvider] = useState<"google" | "apple" | "github" | null>(null);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState("");
  const [simulatedName, setSimulatedName] = useState("");
  const [pendingConnection, setPendingConnection] = useState<any>(null);
  const [linkPhoneInput, setLinkPhoneInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [activeSocialProvider, setActiveSocialProvider] = useState<string | null>(null);

  // OTP Countdown Timers
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  useEffect(() => {
    if (socialOtpTimer > 0) {
      const interval = setInterval(() => {
        setSocialOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [socialOtpTimer]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem("customerClubPhone");
    const savedProvider = localStorage.getItem("customerSocialProvider");
    if (savedPhone) {
      fetchCustomerPortal(savedPhone);
    }
    if (savedProvider) {
      setActiveSocialProvider(savedProvider);
    }
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/customer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(120);
        setNotification({
          title: "💬 پیامک رمز یکبار مصرف (الیت مبل)",
          message: `کد تایید ورود شما به باشگاه مشتریان: ${data.otpCode} است.`,
          code: data.otpCode
        });
        setOtpCodeInput("");
      } else {
        setError(data.error || "خطا در ارسال پیامک تایید");
      }
    } catch (err) {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim(), code: otpCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerData(data.customer);
        setOrders(data.orders || []);
        localStorage.setItem("customerClubPhone", phoneInput.trim());
        localStorage.setItem("customerToken", data.token);
        setNotification(null);
        setOtpSent(false);
        setOtpCodeInput("");
      } else {
        setError(data.error || "کد تایید وارد شده نادرست است");
      }
    } catch (err) {
      setError("خطا در تایید کد پیامکی");
    } finally {
      setLoading(false);
    }
  };

  const handleVipLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipPasswordInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/customer/vip-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: vipPasswordInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerData({
          ...data.customer,
          stats: data.stats
        });
        setOrders([]);
        localStorage.setItem("customerClubPhone", "VIP-ACCESS");
        setNotification(null);
        setIsVipLoginMode(false);
        setVipPasswordInput("");
      } else {
        setError(data.error || "کلمه عبور VIP نادرست است");
      }
    } catch (err) {
      setError("خطا در تایید کلمه عبور VIP");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerPortal = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("customerToken");
      const res = await fetch("/api/customer/portal", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerData(data.customer);
        setOrders(data.orders || []);
        localStorage.setItem("customerClubPhone", phone);
      } else {
        setError(data.error || "خطا در بارگذاری اطلاعات باشگاه");
      }
    } catch (err: any) {
      setError("خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customerClubPhone");
    localStorage.removeItem("customerSocialProvider");
    setCustomerData(null);
    setOrders([]);
    setPhoneInput("");
    setOtpSent(false);
    setOtpCodeInput("");
    setSocialOtpSent(false);
    setSocialOtpInput("");
    setLinkPhoneInput("");
    setActiveSocialProvider(null);
    setNotification(null);
  };

  const openSocialSimulator = (provider: "google" | "apple" | "github") => {
    setSimulatedProvider(provider);
    setSocialModalOpen(true);
    setLinkError(null);
    setPendingConnection(null);
    setLinkPhoneInput("");
    setSocialOtpSent(false);
    setSocialOtpInput("");
    
    if (provider === "google") {
      setSimulatedEmail("ska.reza1398@gmail.com");
      setSimulatedName("رضا حسینی");
    } else if (provider === "apple") {
      setSimulatedEmail("m.kazemi.elite@icloud.com");
      setSimulatedName("مریم کاظمی");
    } else if (provider === "github") {
      setSimulatedEmail("arash.developer88@github.com");
      setSimulatedName("مهندس آرش راد");
    }
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedEmail || !simulatedName) return;

    try {
      setSocialLoading(true);
      setLinkError(null);

      const res = await fetch("/api/customer/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: simulatedProvider,
          providerId: `id_${simulatedProvider}_${simulatedEmail.split("@")[0]}`,
          email: simulatedEmail.trim(),
          name: simulatedName.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.needsPhone) {
          setPendingConnection(data.connection);
        } else {
          setCustomerData(data.customer);
          setOrders(data.orders || []);
          localStorage.setItem("customerClubPhone", data.customer.phone);
          localStorage.setItem("customerSocialProvider", simulatedProvider || "");
          setActiveSocialProvider(simulatedProvider);
          setSocialModalOpen(false);
        }
      } else {
        setLinkError(data.error || "خطا در ورود یکپارچه");
      }
    } catch (err) {
      setLinkError("خطا در برقراری ارتباط با پلتفرم");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSocialRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPhoneInput.trim()) return;

    try {
      setSocialLoading(true);
      setLinkError(null);
      const res = await fetch("/api/customer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: linkPhoneInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSocialOtpSent(true);
        setSocialOtpTimer(120);
        setNotification({
          title: "💬 پیامک اتصال هویت (الیت مبل)",
          message: `کد تایید اتصال حساب کاربری: ${data.otpCode} است.`,
          code: data.otpCode
        });
      } else {
        setLinkError(data.error || "شناسه شماره همراه در سیستم فاکتورها یافت نشد.");
      }
    } catch (err) {
      setLinkError("خطا در برقراری ارتباط با سامانه پیامکی");
    } finally {
      setSocialLoading(false);
    }
  };

  const handleLinkPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPhoneInput.trim() || !socialOtpInput.trim() || !pendingConnection) return;

    try {
      setSocialLoading(true);
      setLinkError(null);

      const res = await fetch("/api/customer/link-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: pendingConnection.id,
          phone: linkPhoneInput.trim(),
          code: socialOtpInput.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchCustomerPortal(linkPhoneInput.trim());
        localStorage.setItem("customerSocialProvider", simulatedProvider || "");
        setActiveSocialProvider(simulatedProvider);
        setSocialModalOpen(false);
        setSocialOtpSent(false);
        setSocialOtpInput("");
        setNotification(null);
      } else {
        setLinkError(data.error || "کد تأیید نادرست یا منقضی شده است");
      }
    } catch (err) {
      setLinkError("خطا در برقراری ارتباط با پلتفرم");
    } finally {
      setSocialLoading(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case "PENDING": return 0;
      case "CONTACTED": return 1;
      case "NEGOTIATING": return 2;
      case "CONFIRMED": return 3;
      case "DELIVERED": return 4;
      default: return 0;
    }
  };

  const steps = [
    { label: "ثبت درخواست سایت", desc: "بسته تخفیف ۵٪ رزرو کدهای کارگاهی" },
    { label: "تماس کارشناسی", desc: "هماهنگی ابعاد و رنگ کالیته مبل" },
    { label: "مذاکره نهایی", desc: "توافقات ارسال، پارچه و چیدمان کلاف" },
    { label: "تایید ساخت و بازرسی QC", desc: "بررسی فیزیکی کیفیت اسفنج ۳۵ و الوار روس" },
    { label: "تحویل مبل و گارانتی", desc: "ارسال اختصاصی با گارانتی سلامت فیزیکی" }
  ];

  return (
    <div className={`min-h-screen pt-28 pb-12 transition-all text-right ${customerData?.isVip ? "bg-stone-950 text-stone-100" : "bg-stone-50 text-stone-900"}`} dir="rtl">
      {/* iOS/Android style Simulated Push Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.9 }}
            className="fixed top-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-stone-900 border border-amber-500/30 text-stone-100 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 shadow-amber-500/5 text-right font-sans"
            dir="rtl"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-extrabold text-amber-500 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {notification.title}
              </span>
              <button
                onClick={() => setNotification(null)}
                className="text-stone-400 hover:text-stone-200 text-[10px] font-light cursor-pointer"
              >
                بستن
              </button>
            </div>
            <p className="text-xs text-stone-300 font-light leading-relaxed">
              {notification.message}
            </p>
            {notification.code && (
              <button
                type="button"
                onClick={() => {
                  if (socialModalOpen) {
                    setSocialOtpInput(notification.code || "");
                  } else if (otpSent) {
                    setOtpCodeInput(notification.code || "");
                  }
                  setNotification(null);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 py-1.5 px-3 rounded-xl text-[10px] font-extrabold transition-all text-center self-start cursor-pointer mt-1"
              >
                کپی و جایگذاری خودکار رمز تایید
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Not Logged In View */}
        <AnimatePresence mode="wait">
          {!customerData ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto bg-white dark:bg-stone-900/65 p-6 sm:p-8 border border-stone-200 dark:border-stone-800 rounded-3xl space-y-6 shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-400/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
                <Crown />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-50">باشگاه و پیگیری سفارشات ویژه خانه مبل</h2>
                <p className="text-xs text-stone-400 dark:text-stone-400 font-light leading-relaxed">
                  سریع‌ترین سیستم رهگیری فرآیند ساخت مبل در کارگاه، مشاهده امتیازات دکوراسیون و دسترسی به باشگاه تخفیف انحصاری ۵٪
                </p>
              </div>

              {isVipLoginMode ? (
                <form onSubmit={handleVipLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300">رمز عبور ویژه یکپارچه (VIP)</label>
                    <input
                      type="password"
                      placeholder="کلمه عبور خود را وارد کنید"
                      value={vipPasswordInput}
                      onChange={(e) => setVipPasswordInput(e.target.value)}
                      className="w-full text-center bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-bold font-mono"
                      required
                      dir="ltr"
                    />
                  </div>

                  {error && (
                    <div className="flex gap-2 items-start text-xs bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-right">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تایید رمز و ورود به پنل ویژه</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVipLoginMode(false);
                      setError(null);
                    }}
                    className="w-full text-[10px] text-stone-500 hover:text-stone-800 font-bold hover:underline"
                  >
                    بازگشت به ورود با شماره همراه
                  </button>
                </form>
              ) : !otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-stone-600 dark:text-stone-300">شماره همراهِ ثبت فاکتور</label>
                    <input
                      type="tel"
                      placeholder="مثال: 09123456789"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full text-center bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-bold font-mono"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex gap-2 items-start text-xs bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-right">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 py-3 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>دریافت کد تایید پیامکی</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-stone-600 dark:text-stone-300">کد تایید پیامک‌شده</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setError(null);
                        }}
                        className="text-[10px] text-amber-600 font-bold hover:underline"
                      >
                        ویرایش شماره
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="۴ رقم کد تأیید"
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      className="w-full text-center bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-bold font-mono tracking-widest"
                      required
                    />
                    <p className="text-[10px] text-stone-400 font-light leading-normal text-center">
                      کد تأیید به شماره <strong className="font-mono text-stone-600 dark:text-stone-300">{phoneInput}</strong> پیامک شد.
                    </p>
                  </div>

                  {error && (
                    <div className="flex gap-2 items-start text-xs bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-right">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <span className="text-[10px] text-stone-400 font-light">
                        ارسال مجدد پیامک در {otpTimer} ثانیه دیگر
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-[10px] text-amber-500 hover:text-amber-600 font-bold hover:underline"
                      >
                        درخواست مجدد رمز تایید پیامکی
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 py-3 rounded-xl text-xs font-extrabold transition-all duration-300 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تایید نهایی و ورود به باشگاه</span>
                      </>
                    )}
                  </button>
                </form>
              )}
              
              <div className="pt-4 border-t border-stone-100 dark:border-stone-850 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsVipLoginMode(true)}
                  className="flex items-center justify-center gap-2 text-[11px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 py-2.5 rounded-xl transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>ورود با کلمه عبور ویژه (VIP)</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-light">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>دسترسی موقت بدون نیاز به کلمه عبور پیچیده</span>
                </div>
              </div>

              {/* Secure Unified Login Option */}
              <div className="relative pt-4 border-t border-stone-100 dark:border-stone-850">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-150 dark:border-stone-850"></div>
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white dark:bg-stone-900 px-3 text-stone-400 dark:text-stone-450 font-bold">ورود یکپارچه بدون کلمه عبور</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openSocialSimulator("google")}
                  type="button"
                  className="flex flex-col items-center justify-center py-3 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl transition-all hover:bg-stone-50 dark:hover:bg-stone-950 text-stone-700 dark:text-stone-300 pointer-events-auto cursor-pointer focus:ring-1 focus:ring-amber-500/30 gap-1.5"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[10px] font-bold">حساب گوگل</span>
                </button>
                <button
                  onClick={() => openSocialSimulator("apple")}
                  type="button"
                  className="flex flex-col items-center justify-center py-3 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl transition-all hover:bg-stone-50 dark:hover:bg-stone-950 text-stone-700 dark:text-stone-300 pointer-events-auto cursor-pointer focus:ring-1 focus:ring-amber-500/30 gap-1.5"
                >
                  <svg className="w-5 h-5 fill-current text-stone-900 dark:text-stone-100 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                  </svg>
                  <span className="text-[10px] font-bold">حساب اپل</span>
                </button>
                <button
                  onClick={() => openSocialSimulator("github")}
                  type="button"
                  className="flex flex-col items-center justify-center py-3 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl transition-all hover:bg-stone-50 dark:hover:bg-stone-950 text-stone-700 dark:text-stone-300 pointer-events-auto cursor-pointer focus:ring-1 focus:ring-amber-500/30 gap-1.5"
                >
                  <svg className="w-5 h-5 fill-current text-stone-900 dark:text-stone-100 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.4772 2 2 6.4772 2 12C2 16.4179 4.8654 20.1661 8.8398 21.4883C9.34 21.5807 9.5225 21.2721 9.5225 21.0069C9.5225 20.7718 9.5139 19.9986 9.5093 19.1689C6.7275 19.7725 6.1404 18.063 5.92 17.44C5.7958 17.1246 5.2575 16.1451 4.78 15.8784C4.39 15.6684 3.83 15.1584 4.77 15.1484C5.65 15.1384 6.28 15.9584 6.49 16.2984C7.49 17.9784 9.09 17.5084 9.73 17.2184C9.83 16.4984 10.12 16.0184 10.44 15.7384C7.97 15.4584 5.38 14.5084 5.38 10.2584C5.38 9.0484 5.81 8.0484 6.52 7.2684C6.41 6.9884 6.03 5.8584 6.63 4.3184C6.63 4.3184 7.56 4.0284 9.68 5.4684C10.57 5.2184 11.51 5.0984 12.45 5.0984C13.39 5.0984 14.33 5.2184 15.22 5.4684C17.34 4.0184 18.27 4.3184 18.27 4.3184C18.87 5.8584 18.49 6.9884 18.38 7.2684C19.09 8.0484 19.52 9.0384 19.52 10.2584C19.52 14.5184 16.92 15.4584 14.44 15.7384C14.84 16.0784 15.19 16.7384 15.19 17.7584C15.19 19.2184 15.18 20.3984 15.18 20.7584C15.18 21.0284 15.36 21.3484 15.87 21.2484C19.8354 19.919 22.7 16.1754 22.7 12C22.7 6.4772 18.2228 2 12 2Z" />
                  </svg>
                  <span className="text-[10px] font-bold">گیت‌هاب</span>
                </button>
              </div>
            </motion.div>
          ) : (
            
            /* Logged In View */
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              
              {/* Profile Bar */}
              <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                customerData.isVip 
                  ? "bg-[#16120c] border-amber-900/40 text-stone-100 shadow-xl shadow-amber-500/[0.03]" 
                  : "bg-white border-stone-200 text-stone-900 shadow-sm"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    customerData.isVip 
                      ? "bg-amber-500/10 border border-amber-400/35 text-amber-400" 
                      : "bg-stone-100 text-stone-900"
                  }`}>
                    {customerData.isVip ? <Crown className="w-7 h-7" /> : <Trophy className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold">{customerData.name}</h2>
                      {customerData.isVip && (
                        <span className="text-[9px] bg-amber-400 text-stone-950 font-extrabold px-2 py-0.5 rounded-md uppercase">
                          VIP الیت خانه مبل
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 font-light">
                      محل دریافت کالا: <span className="font-semibold">{customerData.city}</span> | همراه: {customerData.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between border-t border-stone-850 pt-4 md:border-0 md:pt-0">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold block leading-none">امتیاز وفاداری وفور کلاف</span>
                    <span className="text-xl font-extrabold font-sans text-amber-500">
                      {new Intl.NumberFormat("fa-IR").format(customerData.rewardPoints)} <span className="text-xs">امتیاز کش‌بک</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-rose-400 border border-stone-800 transition-colors"
                    title="خروج از پنل"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VIP Progress gauge – show only if not VIP yet */}
              {!customerData.isVip && (
                <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-900">پیشرفت برای پیوستن به باشگاه الیت VIP</span>
                    <span className="text-stone-400 font-light">
                      حد نصاب خرید: <span className="font-semibold text-stone-900">{new Intl.NumberFormat("fa-IR").format(customerData.vipThreshold)} تومان</span>
                    </span>
                  </div>

                  <div className="relative h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (customerData.totalSpent / customerData.vipThreshold) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-stone-400">
                    <span>ثبت خرید تایید شده شما: <span className="font-bold text-emerald-600 font-mono">{new Intl.NumberFormat("fa-IR").format(customerData.totalSpent)} تومان</span></span>
                    <span className="font-light">
                      فقط <span className="font-bold text-stone-900 underline font-mono">{new Intl.NumberFormat("fa-IR").format(customerData.nextRankRemaining)} تومان</span> خرید مانده تا ارتقای مادام‌العمر VIP
                    </span>
                  </div>
                </div>
              )}

              {/* Tab selector */}
              <div className={`p-1 rounded-2xl flex flex-col sm:flex-row gap-1 border ${
                customerData.isVip 
                  ? "bg-stone-900/40 border-stone-800" 
                  : "bg-stone-100 border-stone-200"
              }`}>
                <button
                  onClick={() => setActiveTab("TIMELINE")}
                  className={`flex-1 shrink-0 px-4 py-3 text-xs font-extrabold rounded-xl transition-all ${
                    activeTab === "TIMELINE"
                      ? customerData.isVip ? "bg-amber-500 text-stone-950 shadow-md" : "bg-stone-900 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  }`}
                >
                  رهگیری زنده و مراحل ساخت ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("PERKS")}
                  className={`flex-1 shrink-0 px-4 py-3 text-xs font-extrabold rounded-xl transition-all ${
                    activeTab === "PERKS"
                      ? customerData.isVip ? "bg-amber-500 text-stone-950 shadow-md" : "bg-stone-900 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  }`}
                >
                  مزایای عضویت و نقشه مهندسی مبل
                </button>
                <button
                  onClick={() => setActiveTab("SAVINGS")}
                  className={`flex-1 shrink-0 px-4 py-3 text-xs font-extrabold rounded-xl transition-all ${
                    activeTab === "SAVINGS"
                      ? customerData.isVip ? "bg-amber-500 text-stone-950 shadow-md" : "bg-stone-900 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  }`}
                >
                  تخفیف ارجاعی و معرفی دوستان
                </button>
              </div>

              {/* Tab Contents */}
              <div className="min-h-80">
                {activeTab === "TIMELINE" && (
                  <div className="space-y-6">
                    {orders.map((order, oIdx) => (
                      <div 
                        key={order.id} 
                        className={`p-6 sm:p-8 rounded-3xl border text-right space-y-6 ${
                          customerData.isVip 
                            ? "bg-stone-900/35 border-stone-800" 
                            : "bg-white border-stone-200/85 shadow-sm"
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100 dark:border-stone-850">
                          <div>
                            <span className="text-[10px] bg-stone-250 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-md font-mono">درخواست شماره {oIdx + 1}</span>
                            <h3 className="text-sm font-extrabold mt-1 text-stone-900 dark:text-stone-100">{order.product?.name || "مبل سفارشی ثبت شده"}</h3>
                          </div>
                          
                          <div className="text-left font-mono">
                            <span className="text-[10px] text-stone-400 block font-sans">قیمت تایید شده پلتفرم</span>
                            <span className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                              {order.agreedPrice 
                                ? `${new Intl.NumberFormat("fa-IR").format(order.agreedPrice)} تومان` 
                                : "در حال تایید نهایی..."}
                            </span>
                          </div>
                        </div>

                        {/* Timeline graphic steps */}
                        {order.status === "CANCELLED" ? (
                          <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-2xl text-xs font-light">
                            این درخواست دکوراسیون لغو شده یا با عدم موفقیت مذاکرات نمایشگاه مواجه شده است. در صورت تمایل سفارش مشاوره جدید ثبت کنید.
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="relative pr-6 border-r border-stone-200 dark:border-stone-800 space-y-8 py-2">
                              {steps.map((st, sIdx) => {
                                const orderStepIdx = getStatusStepIndex(order.status);
                                const isCompleted = sIdx < orderStepIdx;
                                const isActive = sIdx === orderStepIdx;
                                
                                return (
                                  <div key={sIdx} className="relative transition-all">
                                    {/* Circle node indicator */}
                                    <div className={`absolute right-[-31px] top-1 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                                      isCompleted 
                                        ? "bg-emerald-500 border-emerald-500" 
                                        : isActive 
                                          ? "bg-amber-500 border-amber-500 animate-pulse" 
                                          : "bg-stone-200 dark:bg-stone-900 border-stone-300 dark:border-stone-800"
                                    }`}>
                                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>

                                    <div className="space-y-1">
                                      <h4 className={`text-xs font-extrabold ${
                                        isCompleted ? "text-emerald-500" : isActive ? "text-amber-500 font-extrabold" : "text-stone-400 dark:text-stone-500"
                                      }`}>
                                        {st.label}
                                      </h4>
                                      <p className="text-[10px] text-stone-400 font-light">{st.desc}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "PERKS" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Perk 1 */}
                    <div className={`p-6 rounded-3xl border space-y-3 ${
                      customerData.isVip 
                        ? "bg-stone-900/30 border-stone-800" 
                        : "bg-white border-stone-200 shadow-sm"
                    }`}>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Percent className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-extrabold">تخفیف انحصاری ۵٪ دکور</h4>
                      <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                        عضویت شما در کلوپ خانه مبل به صورت مادام‌العمر باعث محاسبه ۵٪ ارزان‌تر فاکتور روی هر نوع مبلمانی از فیزیک تمام گالری‌ها می‌شود.
                      </p>
                    </div>

                    {/* Perk 2 */}
                    <div className={`p-6 rounded-3xl border space-y-3 ${
                      customerData.isVip 
                        ? "bg-stone-900/30 border-stone-800" 
                        : "bg-white border-stone-200 shadow-sm"
                    }`}>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-extrabold">گزارش بازرسی مهندسی کلاف مبل</h4>
                      <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                        پرک ویژه جایگزینی گارانتی: ناظر فنی دکوراسیون پیش از ارسال فاکتور، عکس، فیلم و سرتیفیکیت استحکام شاسی ساختاری را به عنوان شناسنامه مبل تایید می‌کند.
                      </p>
                    </div>

                    {/* Perk 3 */}
                    <div className={`p-6 rounded-3xl border space-y-3 ${
                      customerData.isVip 
                        ? "bg-stone-900/30 border-stone-800" 
                        : "bg-white border-stone-200 shadow-sm"
                    }`}>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-extrabold">مشاوره دکوراسیون ۳بعدی رایگان</h4>
                      <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                        دیزاینرهای الیت خانه مبل چیدمان شما را با کالیته کاندید شده به صورت رندرهای دیجیتالی منطبق با ابعاد منزل شما بازطراحی می‌کنند.
                      </p>
                    </div>

                    {/* Perk 4 */}
                    <div className={`p-6 rounded-3xl border space-y-3 ${
                      customerData.isVip 
                        ? "bg-stone-900/30 border-stone-800" 
                        : "bg-white border-stone-200 shadow-sm"
                    }`}>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Flame className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-extrabold">بالاترین اولویت نوبت کارگاهی</h4>
                      <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                        انتقال سریع‌تر موعد تحویل و الویت تولید کارگاهی VIP به صورت کتبی به منظور جلوگیری از لنگ ماندن اسباب‌کشی‌های خریدار.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "SAVINGS" && (
                  <div className="space-y-6">
                    {/* Share & Code Box */}
                    <div className={`p-6 sm:p-8 rounded-3xl border text-right space-y-6 ${
                      customerData.isVip 
                        ? "bg-stone-900/40 border-stone-800" 
                        : "bg-white border-stone-200/85 shadow-sm"
                    }`}>
                      <div className="space-y-2">
                        <span className="text-[10px] bg-amber-400 text-stone-950 font-extrabold px-2.5 py-1 rounded-md inline-block uppercase tracking-wider">
                          ارتباط ارگانیک و تخفیف ارجاعی
                        </span>
                        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <Share2 className="w-5 h-5 text-amber-500 shrink-0" />
                          لینک اختصاصی به اشتراک‌گذاری و معرفی کلوپ الیت مبل
                        </h3>
                        <p className="text-xs text-stone-400 font-light leading-relaxed">
                          دوستان و همکاران خود را به خانه مبل معرفی کنید. هم دوست معرفی شده شما از <strong className="text-emerald-500">تخفیف نقدی ارجاعی دکوراسیون</strong> بهره‌مند می‌شود و هم به پاس اعتماد شما، <strong className="text-emerald-500">مبلغ ۲۵۰,۰۰۰ تومان اعتبار کسر از فاکتور</strong> برای خریدهای بعدی یا تسویه‌های دکور به حساب شما واریز خواهد شد!
                        </p>
                      </div>

                      {/* Referral Link Stage */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <div className="flex-1 bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3 text-xs flex items-center justify-between font-mono select-all">
                          <span className="text-stone-400 dark:text-stone-500 truncate ml-4">
                            {`${window.location.origin}/products?ref=${customerData.phone}`}
                          </span>
                          <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md font-sans font-bold shrink-0">کد: {customerData.phone}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/products?ref=${customerData.phone}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-stone-950" />
                              <span>لینک کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-stone-950" />
                              <span>کپی لینک اختصاصی شما</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* Stat 1: Total clicks/referred leads */}
                      <div className={`p-6 rounded-3xl border space-y-4 text-right ${
                        customerData.isVip ? "bg-stone-900/30 border-stone-800" : "bg-white border-stone-200 shadow-sm"
                      }`}>
                        <span className="text-[10px] text-stone-400 font-bold block uppercase">افراد معرفی‌شده با کد شما</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 font-sans">
                            {new Intl.NumberFormat("fa-IR").format(customerData.totalReferrals || 0)}
                          </span>
                          <span className="text-xs text-stone-400">تقاضای مشاوره</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-light">مجموع درخواست همکاران یا آشنایان ثبت شده</p>
                      </div>

                      {/* Stat 2: Successful conversions */}
                      <div className={`p-6 rounded-3xl border space-y-4 text-right ${
                        customerData.isVip ? "bg-stone-900/30 border-stone-800" : "bg-white border-stone-200 shadow-sm"
                      }`}>
                        <span className="text-[10px] text-stone-400 font-bold block uppercase">خرید موفق و تایید کارگاهی</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-3xl font-extrabold text-emerald-600 font-sans">
                            {new Intl.NumberFormat("fa-IR").format(customerData.successfulReferrals || 0)}
                          </span>
                          <span className="text-xs text-emerald-500 font-bold">فاکتور شده</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-light">معرفی‌هایی که به مرحله ساخت کلاف رسیده‌اند</p>
                      </div>

                      {/* Stat 3: Accumulated reward discount */}
                      <div className={`p-6 rounded-3xl border space-y-4 text-right ${
                        customerData.isVip ? "bg-amber-950/5 border-amber-900/10 text-stone-100" : "bg-emerald-50 border-emerald-100 text-stone-950"
                      }`}>
                        <span className="text-[10px] text-stone-400 font-bold block uppercase">اعتبار دکوراسیون جمع‌شده</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-extrabold text-emerald-600 font-sans">
                            {new Intl.NumberFormat("fa-IR").format(customerData.referralEarning || 0)} <span className="text-[11px] font-sans">تومان</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-light">قابل کسر مستقیم روی پیش‌فاکتور سفارش بعدی شما</p>
                      </div>

                    </div>

                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Authentication Simulator Modal */}
        <AnimatePresence>
          {socialModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md"
              dir="rtl"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden relative text-right"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSocialModalOpen(false)}
                  className="absolute left-4 top-4 w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-500 dark:text-stone-300 flex items-center justify-center transition-colors text-xs font-bold"
                >
                  ✕
                </button>

                {!pendingConnection ? (
                  /* STEP 1: Verify Social Profile */
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-amber-400 text-stone-950 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                          تایید هویت امن
                        </span>
                        <span className="text-[10px] bg-stone-100 dark:bg-stone-850 text-stone-500 dark:text-stone-400 px-2 py-1 rounded-md font-bold uppercase font-mono">
                          OAuth {simulatedProvider}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-500 shrink-0" />
                        ورود امن و بدون نیاز به رمز با حساب {simulatedProvider === "google" ? "گوگل" : simulatedProvider === "apple" ? "اپل" : "گیت‌هاب"}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-light leading-relaxed">
                        جهت تکمیل فرآیند ورود یکپارچه بدون نیاز به گذرواژه، اطلاعات حساب کاربری خود را تایید نموده تا فرآیند پیوند امن با حساب باشگاه شما آغاز شود.
                      </p>
                    </div>

                    {/* Custom Form fields */}
                    <form onSubmit={handleSocialSubmit} className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-850">
                      <div className="space-y-3">
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] font-bold text-stone-500">نام و نام خانوادگی:</label>
                          <input
                            type="text"
                            placeholder="مثال: رضا عباسی"
                            value={simulatedName}
                            onChange={(e) => setSimulatedName(e.target.value)}
                            className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-950 dark:text-stone-100 font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] font-bold text-stone-500 font-mono">آدرس ایمیل اجتماعی (Email):</label>
                          <input
                            type="email"
                            placeholder="user@example.com"
                            value={simulatedEmail}
                            onChange={(e) => setSimulatedEmail(e.target.value)}
                            className="w-full text-left font-mono bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-950 dark:text-stone-100"
                            required
                          />
                        </div>
                      </div>

                      {linkError && (
                        <div className="flex gap-2 items-start text-xs bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-right animate-pulse">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{linkError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={socialLoading}
                        className="w-full bg-stone-950 hover:bg-stone-850 text-amber-500 py-3 rounded-xl text-xs font-extrabold transition-all duration-350 shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-stone-800"
                      >
                        {socialLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            <span>تایید و ورود امن به کلوپ</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* STEP 2: Bind social account to order phone */
                  <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-1 rounded-md font-extrabold uppercase flex items-center gap-1">
                          ✓ حساب اجتماعی تایید شد
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                        اتصال نهایی حساب به باشگاه الیت مبل
                      </h3>
                      <p className="text-xs text-stone-400 font-light leading-relaxed">
                        حساب کاربری <strong className="text-stone-850 dark:text-stone-200">{simulatedName} ({simulatedEmail})</strong> با موفقیت متصل شد. حال جهت هماهنگی ساخت مبل، امتیازات دکوراسیون و VIP، شماره همراه ثبتی فاکتور خود را از طریق تایید پیامکی پیوند دهید:
                      </p>
                    </div>

                    <div className="p-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-2xl text-right text-xs text-stone-500 dark:text-stone-400 space-y-1">
                      <div className="font-extrabold text-stone-800 dark:text-stone-200">مزایای همگام‌سازی مبالغ:</div>
                      <ul className="list-disc mr-4 space-y-0.5 text-[11px] text-stone-400 font-light">
                        <li>مشاهده وضعیت زنده کلاف، اسفنج ۳۵ و QC فیزیکی مبل</li>
                        <li>فعال‌سازی سیستم معرفی دوستان با ۲۵۰ هزار تومان اعتبار نقدی</li>
                        <li>امکان ورود سریع و انحصاری بدون نیاز به رمزهای تایید مکرر در آینده</li>
                      </ul>
                    </div>

                    {!socialOtpSent ? (
                      <form onSubmit={handleSocialRequestOtp} className="space-y-4">
                        <div className="space-y-1.5 text-right">
                          <label className="text-xs font-bold text-stone-600 dark:text-stone-300">شماره همراهِ ثبت فاکتور</label>
                          <input
                            type="tel"
                            placeholder="مثال: 09123456789"
                            value={linkPhoneInput}
                            onChange={(e) => setLinkPhoneInput(e.target.value)}
                            className="w-full text-center bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-bold font-mono"
                            required
                          />
                          <span className="text-[10px] text-amber-600 dark:text-amber-450 font-light block mt-1 leading-normal">
                            نکته مهم: برای شبیه‌سازی معتبر، حتماً شماره همراهی را وارد کنید که سفارش فعال در کارگاه مبل دارد تا سوابق متصل شود.
                          </span>
                        </div>

                        {linkError && (
                          <div className="flex gap-2 items-start text-xs bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-right font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{linkError}</span>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setPendingConnection(null)}
                            className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-stone-200 dark:border-stone-700"
                          >
                            تغییر حساب اجتماعی
                          </button>
                          <button
                            type="submit"
                            disabled={socialLoading}
                            className="flex-[2] bg-amber-500 hover:bg-amber-600 text-stone-950 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                          >
                            {socialLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Search className="w-4 h-4" />
                                <span>ارسال کد تایید پیامکی</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleLinkPhoneSubmit} className="space-y-4">
                        <div className="space-y-2 text-right">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-stone-600 dark:text-stone-300">ککد تایید پیامک‌شده به کلوپ</label>
                            <button
                              type="button"
                              onClick={() => {
                                setSocialOtpSent(false);
                                setLinkError(null);
                              }}
                              className="text-[10px] text-amber-600 font-bold hover:underline"
                            >
                              ویرایش شماره همراه
                            </button>
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="کد تأیید ۴ رقمی"
                            value={socialOtpInput}
                            onChange={(e) => setSocialOtpInput(e.target.value)}
                            className="w-full text-center bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-bold font-mono tracking-widest"
                            required
                          />
                          <p className="text-[10px] text-stone-400 font-light leading-normal text-center">
                            کد تأیید پیامک‌شده به شماره <strong className="font-mono text-stone-700 dark:text-stone-300">{linkPhoneInput}</strong> را وارد کنید.
                          </p>
                        </div>

                        {linkError && (
                          <div className="flex gap-2 items-start text-xs bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 p-3 rounded-xl text-right font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{linkError}</span>
                          </div>
                        )}

                        <div className="text-center text-[10px] text-stone-400 font-light">
                          {socialOtpTimer > 0 ? (
                            <span>امکان ارسال مجدد پیامک در {socialOtpTimer} ثانیه</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSocialRequestOtp}
                              className="text-amber-500 hover:text-amber-600 font-bold hover:underline"
                            >
                              درخواست مجدد رمز تایید پیامکی
                            </button>
                          )}
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSocialOtpSent(false);
                              setPendingConnection(null);
                            }}
                            className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 py-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-stone-200 dark:border-stone-700"
                          >
                            لغو اتصال
                          </button>
                          <button
                            type="submit"
                            disabled={socialLoading}
                            className="flex-[2] bg-amber-500 hover:bg-amber-600 text-stone-950 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                          >
                            {socialLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>تایید و اتصال نهایی باشگاه</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
