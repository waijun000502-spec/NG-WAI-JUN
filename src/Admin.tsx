import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db, auth, signInWithGoogle, logout } from "./lib/firebase";
import { handleFirestoreError, OperationType } from "./lib/error";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";
import {
  Trash2,
  MessageCircle,
  LogIn,
  LogOut,
  ArrowLeft,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Enquiry {
  id: string;
  name: string;
  age: string;
  occupation: string;
  whatsapp: string;
  sessionId?: string;
  createdAt: any;
}

export default function Admin() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sessionStats, setSessionStats] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState({ count: 0, avgString: "0s" });
  const [sessionMap, setSessionMap] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState({ photoSize: 160, photoY: 50 });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "settings", "landing"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().photoSize) {
        setSettings(docSnap.data() as any);
      }
    });
    return () => unsub();
  }, [user]);

  const updateSettings = async (updates: any) => {
    const nextSettings = { ...settings, ...updates };
    setSettings(nextSettings);
    if (user?.email === "waijun000502@gmail.com") {
      try {
        await setDoc(doc(db, "settings", "landing"), nextSettings, {
          merge: true,
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setEnquiries([]);
      return;
    }

    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Enquiry[] = [];
        snapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() } as Enquiry);
        });
        setEnquiries(data);
        setErrorMsg(null);
      },
      (error) => {
        console.error(error);
        setErrorMsg(error.message);
        try {
          handleFirestoreError(error, OperationType.GET, "enquiries", auth);
        } catch (err) {
          // We catch it so React doesn't crash to a blank screen
        }
      },
    );

    const sessionQ = query(
      collection(db, "sessions"),
      orderBy("leftAt", "desc"),
    );
    const unsubSessions = onSnapshot(sessionQ, (snapshot) => {
      let totalTime = 0;
      let count = 0;
      let statsByDay: Record<string, any> = {};
      let sMap: Record<string, any> = {};

      const formatDuration = (seconds: number) => {
        if (seconds >= 60) {
          return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
        }
        return `${Math.floor(seconds)}s`;
      };

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        sMap[docSnap.id] = d;
        if (d.durationSeconds) {
          totalTime += d.durationSeconds;
          count++;
        }
        if (d.leftAt) {
          const date = d.leftAt.toDate();
          const dateStr = format(date, "yyyy-MM-dd");
          const hour = date.getHours();

          if (!statsByDay[dateStr]) {
            statsByDay[dateStr] = {
              dateStr,
              morning: 0,
              afternoon: 0,
              evening: 0,
              total: 0,
              totalSeconds: 0,
            };
          }
          statsByDay[dateStr].total += 1;

          if (d.durationSeconds) {
            statsByDay[dateStr].totalSeconds += d.durationSeconds;
          }

          if (hour >= 5 && hour < 12) {
            statsByDay[dateStr].morning += 1;
          } else if (hour >= 12 && hour < 18) {
            statsByDay[dateStr].afternoon += 1;
          } else {
            statsByDay[dateStr].evening += 1;
          }
        }
      });
      const avg = count > 0 ? totalTime / count : 0;

      let avgString = formatDuration(avg);
      setSessionData({ count, avgString });

      const statsArr = Object.values(statsByDay)
        .map((stat) => ({
          ...stat,
          avgDailyString:
            stat.total > 0
              ? formatDuration(stat.totalSeconds / stat.total)
              : "0s",
        }))
        .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

      setSessionStats(statsArr);
      setSessionMap(sMap);
    });

    return () => {
      unsubscribe();
      unsubSessions();
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      try {
        await deleteDoc(doc(db, "enquiries", id));
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.DELETE,
          `enquiries/${id}`,
          auth,
        );
        alert("Failed to delete. You might not have permission.");
      }
    }
  };

  const getWhatsAppLink = (number: string) => {
    // Strip everything except numbers
    let cleaned = number.replace(/\D/g, "");
    // Assume Malaysian numbers. If it starts with 0, replace with 60
    if (cleaned.startsWith("0")) {
      cleaned = "6" + cleaned;
    } else if (!cleaned.startsWith("60")) {
      // Just a fallback in case they entered without country code or starting with 1
      cleaned = "60" + cleaned;
    }
    return `https://wa.me/${cleaned}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            代理商后台登录
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            请使用您的授权 Google 账号登录以查看客户咨询。
          </p>
          <div className="bg-blue-50 text-blue-700 text-xs p-4 rounded-lg mb-6 text-left border border-blue-100">
            <strong>⚠️ 重要提示：</strong> 如果登录窗口没有弹出或显示被关闭：
            <br />
            请点击右上方（或下方菜单）的{" "}
            <strong>"在新标签页中打开 / Open in New Tab"</strong>{" "}
            按钮，然后再尝试登录。
          </div>
          {errorMsg && (
            <p className="text-red-500 mb-4 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-100">
              {errorMsg}
            </p>
          )}
          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (e: any) {
                if (e.code === "auth/popup-closed-by-user") {
                  setErrorMsg(
                    "登录窗口被关闭或被浏览器拦截。请务必 点击右上角「在新标签页中打开」 后重试！",
                  );
                } else {
                  setErrorMsg(e.message || "登录失败");
                }
              }
            }}
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition"
          >
            <LogIn className="w-5 h-5" />
            <span>使用 Google 登录</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center space-x-2 mt-6 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回网站首页</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-slate-800">Lead Dashboard</h1>
          <Link
            to="/"
            className="hidden md:flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回访客页面</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex md:hidden items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-bold"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>返回</span>
          </Link>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-800">
              {user.email}
            </div>
            {user.email !== "waijun000502@gmail.com" && (
              <div className="text-[10px] text-red-500 font-bold">
                Unauthorized Email
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Top Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">
                Total Visitors (Sessions)
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {sessionData.count}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">
                Average Time on Site
              </p>
              <h3 className="text-3xl font-bold text-slate-800">
                {sessionData.avgString}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <Star className="w-5 h-5 text-amber-500" /> 前台访客头像设置
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                  照片大小 (Size):{" "}
                  <span className="text-blue-600">{settings.photoSize}px</span>
                </label>
                <input
                  type="range"
                  min="80"
                  max="300"
                  value={settings.photoSize}
                  onChange={(e) =>
                    updateSettings({ photoSize: Number(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                  上边距比例 (Offset):{" "}
                  <span className="text-blue-600">{settings.photoY}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.photoY}
                  onChange={(e) =>
                    updateSettings({ photoY: Number(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Analytics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">
              按日期的访客点击率与逗留记录
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">日期 (Date)</th>
                  <th className="px-6 py-3 font-medium">总访客 (Total)</th>
                  <th className="px-6 py-3 font-medium text-emerald-600">
                    早晨段 (Morning 5a-12p)
                  </th>
                  <th className="px-6 py-3 font-medium text-amber-600">
                    下午段 (Afternoon 12p-6p)
                  </th>
                  <th className="px-6 py-3 font-medium text-indigo-600">
                    晚上段 (Evening 6p-5a)
                  </th>
                  <th className="px-6 py-3 font-medium text-right">
                    平均时常 (Avg Time)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessionStats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No session data available.
                    </td>
                  </tr>
                ) : (
                  sessionStats.map((stat) => (
                    <tr key={stat.dateStr} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-bold text-slate-700">
                        {stat.dateStr}
                      </td>
                      <td className="px-6 py-3">{stat.total}</td>
                      <td className="px-6 py-3 text-emerald-700 font-medium">
                        {stat.morning}
                      </td>
                      <td className="px-6 py-3 text-amber-700 font-medium">
                        {stat.afternoon}
                      </td>
                      <td className="px-6 py-3 text-indigo-700 font-medium">
                        {stat.evening}
                      </td>
                      <td className="px-6 py-3 text-right text-slate-700 font-medium">
                        {stat.avgDailyString}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">
              最新收到的客户咨询表格 (Leads)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Customer Details</th>
                  <th className="px-6 py-4 font-medium">Profile</th>
                  <th className="px-6 py-4 font-medium">WhatsApp</th>
                  <th className="px-6 py-4 font-medium">
                    Date Received / Time on Site
                  </th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {errorMsg ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-red-500 font-medium"
                    >
                      Failed to load enquiries: {errorMsg}
                    </td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No enquiries received yet.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enq) => {
                    let sessionInfo = "N/A";
                    if (enq.sessionId && sessionMap[enq.sessionId]) {
                      const d = sessionMap[enq.sessionId];
                      if (d.durationSeconds) {
                        const m = Math.floor(d.durationSeconds / 60);
                        const s = Math.floor(d.durationSeconds % 60);
                        sessionInfo = m > 0 ? `${m}m ${s}s` : `${s}s`;
                      }
                    }
                    return (
                      <tr
                        key={enq.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{enq.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-slate-900">{enq.occupation}</p>
                            <p className="text-slate-500">
                              {enq.age} years old
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={getWhatsAppLink(enq.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-100"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-medium">{enq.whatsapp}</span>
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <div>
                            {enq.createdAt?.toDate
                              ? format(
                                  enq.createdAt.toDate(),
                                  "MMM d, yyyy HH:mm",
                                )
                              : "Just now"}
                          </div>
                          {sessionInfo !== "N/A" && (
                            <div className="mt-1 text-xs text-blue-600 font-medium">
                              Time on site: {sessionInfo}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(enq.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
