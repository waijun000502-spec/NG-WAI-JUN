import React, { useState, useEffect } from "react";
import {
  Shield,
  Heart,
  GraduationCap,
  PiggyBank,
  Star,
  CheckCircle,
  ArrowRight,
  Home,
  FileText,
  CheckCircle2,
  Instagram,
  Facebook,
} from "lucide-react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import { handleFirestoreError, OperationType } from "./lib/error";
import { auth } from "./lib/firebase";
import { motion } from "motion/react";

// Custom TikTok Icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.68a6.34 6.34 0 006.27 6.36 6.33 6.33 0 006.33-6.33V11a8.05 8.05 0 005.15 1.86v-3.38a4.84 4.84 0 01-3.16-2.79z" />
  </svg>
);

export default function Landing() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    occupation: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({ photoSize: 160, photoY: 50 });
  const [sessionId] = useState(
    () => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  );

  // Track user session duration
  useEffect(() => {
    const startTime = Date.now();

    const logSessionDuration = () => {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (durationSeconds > 0) {
        setDoc(doc(db, "sessions", sessionId), {
          durationSeconds,
          leftAt: serverTimestamp(),
        }).catch(() => {});
      }
    };

    const interval = setInterval(() => {
      logSessionDuration();
    }, 5000); // Update every 5 seconds to provide accurate tracking

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logSessionDuration();
      }
    };

    const handleBeforeUnload = () => {
      logSessionDuration();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      logSessionDuration();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAdmin(!!user && user.email === "waijun000502@gmail.com");
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "landing"));
        if (snap.exists() && snap.data().photoSize) {
          setSettings(snap.data() as any);
        }
      } catch (e) {
        // Ignore read errors
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    if (isAdmin) {
      try {
        await setDoc(doc(db, "settings", "landing"), {
          ...newSettings,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Failed to save settings", e);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const enquiryId = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, "enquiries", enquiryId), {
        name: formData.name,
        age: String(formData.age),
        occupation: formData.occupation,
        whatsapp: formData.whatsapp,
        sessionId: sessionId,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setFormData({ name: "", age: "", occupation: "", whatsapp: "" });
    } catch (error) {
      setErrorMsg("提交失败，请稍后再试。");
      handleFirestoreError(error, OperationType.CREATE, "enquiries", auth);
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document
      .getElementById("enquiry-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative bg-slate-50 font-sans flex flex-col text-slate-800">
      {/* Navbar */}
      <header className="relative z-20 px-6 md:px-12 py-5 flex justify-between items-center bg-white/90 backdrop-blur-md sticky top-0 shadow-sm border-b border-indigo-50">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <h1 className="text-xl font-extrabold text-blue-900 tracking-wide uppercase">
              Life Planning
            </h1>
            <p className="text-[10px] text-blue-600 uppercase tracking-widest font-bold">
              Malaysia Licensed Agent
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm font-bold text-slate-600">
          <button
            onClick={scrollToForm}
            className="hidden md:block cursor-pointer hover:text-blue-600 transition"
          >
            快速预约
          </button>
          <a
            href="/admin"
            className="text-slate-400 hover:text-blue-600 text-xs transition-colors"
          >
            登录后台
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        {/* --- HERO SECTION --- */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900 border-b-8 border-blue-600">
          {/* Grand Hero Image Background */}
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-blue-950/70 mix-blend-multiply z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Grand Protection"
              className="w-full h-full object-cover scale-105 animate-[slow-zoom_20s_ease-in-out_infinite_alternate]"
            />
          </div>

          <div className="px-6 md:px-12 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20 w-full max-w-7xl mx-auto">
            <div className="lg:col-span-7 space-y-8 relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                  {/* Profile Image Wrapper */}
                  <div className="relative group perspective-1000">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-amber-300 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 animate-pulse-slow"></div>
                    <div className="absolute inset-0 bg-white rounded-full scale-105 shadow-xl"></div>
                    <img
                      src="/IMG0001.jpeg"
                      alt="Agent Profile"
                      style={{
                        width: `${settings.photoSize}px`,
                        height: `${settings.photoSize}px`,
                        objectPosition: `center ${settings.photoY}%`,
                      }}
                      className="relative rounded-full object-cover shadow-inner flex-shrink-0 mx-auto md:mx-0 bg-slate-200 transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute -bottom-3 -right-3 bg-white p-2 rounded-full shadow-lg border border-slate-100 hidden md:block">
                      <Shield className="w-6 h-6 text-blue-600 drop-shadow" />
                    </div>
                  </div>

                  <div className="pt-4">
                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold mb-6 backdrop-blur-sm mx-auto md:mx-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                      Ms. Teapy
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white shadow-sm drop-shadow-xl">
                      为您与家人
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-gradient-x">
                        提供最坚实的保障
                      </span>
                    </h2>
                    <p className="mt-8 text-xl text-slate-200 max-w-xl leading-relaxed font-medium drop-shadow-md border-l-4 border-amber-400 pl-4 bg-slate-900/30 backdrop-blur-sm py-2 rounded-r-lg">
                      提供专业且个性化的保障方案，全面涵盖收入替代、房屋寿险、教育基金以及无忧退休规划。
                    </p>

                    {/* Social Links inside Hero */}
                    <div className="flex items-center justify-center md:justify-start gap-5 mt-10">
                      <a
                        href="https://www.instagram.com/teapy8441?igsh=MTZuZnFkNjN2enBoYQ%3D%3D&utm_source=qr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-gradient-to-tr hover:from-pink-500 hover:to-orange-400 hover:scale-110 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all duration-300 text-white border border-white/20 group"
                      >
                        <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </a>
                      <a
                        href="https://www.facebook.com/share/187mtWbHfd/?mibextid=wwXIfr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-blue-600 hover:scale-110 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all duration-300 text-white border border-white/20 group"
                      >
                        <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </a>
                      <a
                        href="https://www.tiktok.com/@teapyteapy?_r=1&_t=ZS-95r3clwpSEB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-slate-800 hover:scale-110 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 text-white border border-white/20 group"
                      >
                        <TikTokIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Form in Hero Section for high conversion */}
            <div
              className="lg:col-span-5 flex justify-center w-full relative"
              id="enquiry-form"
            >
              <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-[3rem]"></div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-md border border-white/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
                <h3 className="text-2xl font-extrabold text-blue-950 mb-2">
                  获取免费咨询
                </h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">
                  填妥信息，我们将尽快与您联系，了解您的需求并量身定制方案。
                </p>

                {success ? (
                  <div className="bg-emerald-50 text-emerald-800 p-8 rounded-2xl text-center border border-emerald-100">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                    <h4 className="text-2xl font-bold mb-2">预约成功</h4>
                    <p className="text-sm mt-2 text-emerald-700">
                      感谢您的信任。规划师将在 24 小时内通过 WhatsApp 与您联系。
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-sm hover:bg-emerald-700 transition"
                    >
                      重新填写
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                        {errorMsg}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        您的姓名
                      </label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="陈某某 / Mr. Tan"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          年龄
                        </label>
                        <input
                          required
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          placeholder="e.g. 30"
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          目前职业
                        </label>
                        <input
                          required
                          type="text"
                          name="occupation"
                          value={formData.occupation}
                          onChange={handleChange}
                          placeholder="例如: 经理"
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        WhatsApp 号码
                      </label>
                      <input
                        required
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="+60 12-345 6789"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <button
                      disabled={loading}
                      type="submit"
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 group mt-2"
                    >
                      {loading ? "提交中..." : "免费获取专属方案"}
                      {!loading && (
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      )}
                    </button>
                  </form>
                )}
                <p className="text-[10px] text-center text-slate-400 mt-6 font-medium">
                  *您的个人资料受马来西亚 PDPA 法令严格保护，绝不外泄。
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- CORE SERVICES GRID --- */}
        <section className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-blue-950 tracking-tight mb-6">
              打造全方位的财务护城河
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              依据您人生不同阶段的需求，提供最合适的金融与保障产品组合。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: Heart,
                label: "收入保障 / 收入替代",
                color: "text-rose-500",
                bg: "bg-rose-50",
                img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
              },
              {
                icon: Home,
                label: "房屋寿险 / MLTA",
                color: "text-indigo-500",
                bg: "bg-indigo-50",
                img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
              },
              {
                icon: GraduationCap,
                label: "教育基金规划",
                color: "text-blue-500",
                bg: "bg-blue-50",
                img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
              },
              {
                icon: PiggyBank,
                label: "无忧退休储蓄",
                color: "text-teal-500",
                bg: "bg-teal-50",
                img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
              },
            ].map((Service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 text-center hover:shadow-xl transition-all duration-300 group cursor-default overflow-hidden flex flex-col"
              >
                <div className="h-40 w-full overflow-hidden relative shrink-0">
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10"></div>
                  <img
                    src={Service.img}
                    alt={Service.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col items-center justify-center">
                  <div
                    className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${Service.bg} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Service.icon className={`w-7 h-7 ${Service.color}`} />
                  </div>
                  <div className="font-extrabold text-blue-950 text-sm md:text-base">
                    {Service.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- WHY CHOOSE ME SECTION --- */}
        <section className="py-24 relative bg-blue-900 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-950"></div>
            {/* Abstract pattern to replace dark image */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-16 px-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                为什么要选择我？
              </h2>
              <p className="text-lg text-blue-200 font-medium">
                买保险不仅是买一份保单，更是买一辈子的承诺与安心服务。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <motion.div
                whileHover={{ y: -8 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-10 rounded-3xl hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-blue-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  1对1量身定制方案
                </h3>
                <p className="text-blue-100/80 leading-relaxed text-sm md:text-base font-medium">
                  拒绝流水线推销。我将深入了解您的家庭结构、财务状况与未来目标，为您梳理出最合适、无多余负担的专属保障蓝图。
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -8 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-10 rounded-3xl hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-cyan-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  全程高效理赔协助
                </h3>
                <p className="text-blue-100/80 leading-relaxed text-sm md:text-base font-medium">
                  在您最需要的时候绝不缺席。从准备文件到跟进进度，我将为您处理繁杂的理赔手续，确保资金尽早到账。
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -8 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-10 rounded-3xl hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-7 h-7 text-indigo-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  免费现有保单检查
                </h3>
                <p className="text-blue-100/80 leading-relaxed text-sm md:text-base font-medium">
                  不清楚自己买了什么？我能免费帮您梳理旧有保单，排除重复购买，找出保障缺口，让每一分钱都花在刀刃上。
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- TESTIMONIALS --- */}
        <section className="py-24 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-blue-950 mb-6">
                真实客户评价
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                感谢客户们的信任与支持，让我能成为你们家庭的守护者。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  name: "黄先生",
                  role: "工程师",
                  text: "“规划师非常专业，没有硬性推销，而是仔细评估了我的收入情况后，推荐了最符合我预算的收入替代方案，非常实在。”",
                },
                {
                  name: "林女士",
                  role: "企业家",
                  text: "“对于生意人来说，现金流和保障同等重要。她的MLTA方案讲得很清楚，让我的房贷和债务都没有了后顾之忧。”",
                },
                {
                  name: "李太太",
                  role: "全职妈妈",
                  text: "“不仅为小孩规划了教育基金，还顺便帮我们免费整合了之前乱买的医药卡。有她在真的很安心，回复信息也很快。”",
                },
                {
                  name: "张老板",
                  role: "餐饮业者",
                  text: "“前阵子我不幸入院，她第一时间就协助我处理理赔，整个过程我完全不用烦恼，真的证明了找对代理人的重要性！”",
                },
                {
                  name: "苏小姐",
                  role: "会计师",
                  text: "“思路极其清晰，她制作的保障图表让我一目了然。不再像以前买保单那样糊里糊涂了，完全值得信赖。”",
                },
                {
                  name: "陈先生",
                  role: "IT主管",
                  text: "“本来只是随便问问，但她的专业度和耐心深深打动了我。从不给我压迫感，而是用数据说话，强推！”",
                },
              ].map((testi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                >
                  <div className="flex text-amber-400 mb-6 gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="italic text-slate-700 text-base leading-relaxed mb-8 h-24 overflow-hidden font-medium">
                    {testi.text}
                  </p>
                  <div className="font-extrabold text-blue-950 border-t border-slate-200 pt-6">
                    — {testi.name},{" "}
                    <span className="font-medium text-slate-500 text-sm">
                      {testi.role}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-500 py-12 text-center border-t border-slate-200">
        <div className="text-sm space-y-4 font-medium">
          <p>
            © {new Date().getFullYear()} Life Planning. 独立保险与财务规划咨询.
          </p>
          <div className="flex justify-center gap-6 text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">
              隐私政策
            </span>
            <span>|</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">
              服务条规
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
