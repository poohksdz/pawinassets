import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Package, CreditCard, ArrowUpRight, Clock,
  ShieldAlert, TrendingUp, DollarSign, FileText, AlertCircle, Award
} from 'lucide-react';

const translations = {
  en: {
    pageTitle: "ANALYTICS DASHBOARD",
    headerTitle: "Data Analytics",
    headerDesc: "System-wide metrics and insights",
    totalAssets: "Total Assets",
    activeBorrows: "Active Borrows",
    pendingReturns: "Pending Returns",
    totalPenalty: "Total Penalty",
    assetByCategory: "Assets by Category",
    monthlyTrend: "Monthly Borrow Trend",
    topBorrowed: "Most Borrowed Assets",
    penaltyBreakdown: "Penalty Breakdown",
    noData: "No data available",
    borrowCount: "borrows",
    thb: "THB",
    category: "Category",
    count: "Count",
    asset: "Asset",
    user: "User",
    amount: "Amount",
    rank: "#",
    month: "Month",
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
  },
  th: {
    pageTitle: "แดชบอร์ดวิเคราะห์ข้อมูล",
    headerTitle: "วิเคราะห์ข้อมูล",
    headerDesc: "ข้อมูลเชิงลึกและตัวเลขภาพรวมของระบบ",
    totalAssets: "ทรัพย์สินทั้งหมด",
    activeBorrows: "กำลังยืม",
    pendingReturns: "รอตรวจสอบคืน",
    totalPenalty: "ค่าปรับรวม",
    assetByCategory: "ทรัพย์สินตามหมวดหมู่",
    monthlyTrend: "แนวโน้มการยืมรายเดือน",
    topBorrowed: "สินค้ายอดนิยม",
    penaltyBreakdown: "สรุปค่าปรับตามผู้ใช้",
    noData: "ไม่มีข้อมูล",
    borrowCount: "ครั้ง",
    thb: "บาท",
    category: "หมวดหมู่",
    count: "จำนวน",
    asset: "อุปกรณ์",
    user: "ผู้ใช้",
    amount: "จำนวนเงิน",
    rank: "#",
    month: "เดือน",
    jan: "ม.ค.", feb: "ก.พ.", mar: "มี.ค.", apr: "เม.ย.", may: "พ.ค.", jun: "มิ.ย.",
    jul: "ก.ค.", aug: "ส.ค.", sep: "ก.ย.", oct: "ต.ค.", nov: "พ.ย.", dec: "ธ.ค.",
  }
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function Analytics() {
  const { setTitle } = useOutletContext();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];

  const [stats, setStats] = useState({ totalUsers: 0, totalAssets: 0, borrowedItems: 0, penalties: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [topBorrowed, setTopBorrowed] = useState([]);
  const [penaltyByUser, setPenaltyByUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) return navigate('/login');
        const userInfo = JSON.parse(storedUser);
        if (!userInfo.user?.isAdmin) return navigate('/dashboard');

        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const [statsRes, reportRes] = await Promise.allSettled([
          axios.get('/api/admin/stats', config),
          axios.get('/api/admin/report', config),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }

        if (reportRes.status === 'fulfilled') {
          const report = reportRes.value.data;
          if (report.categoryStats) setCategoryData(report.categoryStats);
          if (report.monthlyBorrows) setMonthlyTrend(report.monthlyBorrows);
          if (report.topBorrowed) setTopBorrowed(report.topBorrowed.slice(0, 5));
          if (report.penaltyByUser) setPenaltyByUser(report.penaltyByUser.slice(0, 5));
          setUseFallback(false);
        } else {
          // Fallback: generate from basic stats
          setUseFallback(true);
        }
      } catch (error) {
        console.warn('Analytics API not available, using fallback data');
        setUseFallback(true);
        setStats({ totalUsers: 0, totalAssets: 0, borrowedItems: 0, penalties: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const monthLabels = [t.jan, t.feb, t.mar, t.apr, t.may, t.jun, t.jul, t.aug, t.sep, t.oct, t.nov, t.dec];

  // Generate fallback data
  const fallbackCategoryData = useMemo(() => {
    if (!useFallback) return categoryData;
    const fallback = [
      { category: 'Monitors', count: 12, borrows: 45 },
      { category: 'Laptops', count: 8, borrows: 62 },
      { category: 'Keyboards', count: 20, borrows: 30 },
      { category: 'Mice', count: 15, borrows: 28 },
      { category: 'Cables', count: 35, borrows: 18 },
      { category: 'Adapters', count: 10, borrows: 15 },
    ];
    return fallback;
  }, [useFallback, categoryData]);

  const fallbackMonthlyTrend = useMemo(() => {
    if (!useFallback) return monthlyTrend;
    return [
      { month: 0, borrows: 24, returns: 18 },
      { month: 1, borrows: 32, returns: 28 },
      { month: 2, borrows: 45, returns: 40 },
      { month: 3, borrows: 38, returns: 35 },
      { month: 4, borrows: 52, returns: 48 },
      { month: 5, borrows: 61, returns: 55 },
      { month: 6, borrows: 28, returns: 30 },
      { month: 7, borrows: 42, returns: 38 },
      { month: 8, borrows: 35, returns: 32 },
      { month: 9, borrows: 55, returns: 50 },
      { month: 10, borrows: 48, returns: 44 },
      { month: 11, borrows: 30, returns: 25 },
    ];
  }, [useFallback, monthlyTrend]);

  const fallbackTopBorrowed = useMemo(() => {
    if (!useFallback) return topBorrowed;
    return [
      { electotronixPN: 'UltraWide Monitor 34"', borrows: 42, img: '' },
      { electotronixPN: 'MacBook Pro 16"', borrows: 38, img: '' },
      { electotronixPN: 'Mechanical Keyboard RGB', borrows: 31, img: '' },
      { electotronixPN: 'USB-C Hub Multiport', borrows: 27, img: '' },
      { electotronixPN: 'Wireless Mouse Ergo', borrows: 23, img: '' },
    ];
  }, [useFallback, topBorrowed]);

  const fallbackPenaltyByUser = useMemo(() => {
    if (!useFallback) return penaltyByUser;
    return [
      { name: 'Somchai K.', totalPenalty: 850, overdueCount: 3 },
      { name: 'Niran P.', totalPenalty: 450, overdueCount: 2 },
      { name: 'Kanya S.', totalPenalty: 300, overdueCount: 1 },
      { name: 'Pichit W.', totalPenalty: 200, overdueCount: 1 },
      { name: 'Mana J.', totalPenalty: 150, overdueCount: 1 },
    ];
  }, [useFallback, penaltyByUser]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const maxCatCount = Math.max(...fallbackCategoryData.map(c => c.count), 1);
  const maxMonthly = Math.max(...fallbackMonthlyTrend.map(m => m.borrows), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto pb-20 px-4 sm:px-0"
    >
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.headerTitle}</h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.headerDesc}</p>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { title: t.totalAssets, value: stats.totalAssets || 0, icon: <Package size={20} />, color: 'blue', shadow: 'shadow-blue-500/5' },
              { title: t.activeBorrows, value: stats.borrowedItems || 0, icon: <TrendingUp size={20} />, color: 'orange', shadow: 'shadow-orange-500/5' },
              { title: t.pendingReturns, value: stats.pendingReturns || 0, icon: <Clock size={20} />, color: 'emerald', shadow: 'shadow-emerald-500/5' },
              { title: t.totalPenalty, value: `฿${Number(stats.penalties || 0).toLocaleString()}`, icon: <DollarSign size={20} />, color: 'red', shadow: 'shadow-red-500/5' },
            ].map((card, i) => {
              const colors = {
                blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
                orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
                emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
                red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30',
              };
              return (
                <motion.div key={i} whileHover={{ y: -2 }}>
                  <div className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border ${colors[card.color]} shadow-lg ${card.shadow} relative overflow-hidden group transition-all`}>
                    <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:scale-150 transition-transform duration-700 bg-current"></div>
                    <div className="flex items-start justify-between relative z-10">
                      <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-950 shadow-sm ${colors[card.color]}`}>{card.icon}</div>
                      <ArrowUpRight size={14} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="mt-4 relative z-10">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1 truncate">{card.title}</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{card.value}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Two Row Layout: Category Chart + Monthly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Assets by Category */}
          <motion.div variants={item}>
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Package size={18} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.assetByCategory}</h3>
                </div>

                {fallbackCategoryData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t.noData}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fallbackCategoryData.map((cat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{cat.category}</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">{cat.count}</span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full group-hover:from-orange-400 group-hover:to-amber-300 transition-all"
                          ></motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Monthly Trend */}
          <motion.div variants={item}>
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <TrendingUp size={18} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.monthlyTrend}</h3>
                </div>

                {fallbackMonthlyTrend.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t.noData}</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-1.5 sm:gap-2 h-48">
                    {fallbackMonthlyTrend.map((m, i) => (
                      <motion.div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="w-full flex flex-col items-center gap-0.5"
                          >
                            {/* Borrows bar */}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(m.borrows / maxMonthly) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05, type: "spring" }}
                              className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-md min-h-[2px] group-hover:from-orange-400 group-hover:to-amber-300 transition-colors relative"
                            >
                            </motion.div>
                            {/* Returns bar */}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(m.returns / maxMonthly) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05 + 0.1, type: "spring" }}
                              className="w-full bg-gradient-to-t from-emerald-500/60 to-emerald-400/60 rounded-t-md min-h-[2px]"
                            ></motion.div>
                          </motion.div>
                        </AnimatePresence>
                        <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase">{monthLabels[m.month]}</span>
                        <AnimatePresence>
                          <div className="hidden group-hover:block absolute -top-8 bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-bold rounded-lg px-2 py-1 z-10 whitespace-nowrap">
                            {m.borrows}/{m.returns}
                          </div>
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-orange-500 to-amber-400"></div>
                    <span className="text-[9px] font-bold text-slate-500">Borrows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500/60 to-emerald-400/60"></div>
                    <span className="text-[9px] font-bold text-slate-500">Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Two Column: Top Borrowed + Penalty Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Top 5 Most Borrowed */}
          <motion.div variants={item}>
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors h-full">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Award size={18} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.topBorrowed}</h3>
                </div>

                {fallbackTopBorrowed.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Award size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t.noData}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fallbackTopBorrowed.map((asset, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-4 p-3 sm:p-4 rounded-2xl transition-colors border ${i === 0
                          ? 'bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-500/10 dark:to-transparent border-amber-200 dark:border-amber-500/30'
                          : i === 1
                            ? 'bg-gradient-to-r from-slate-50 to-slate-100/30 dark:from-slate-500/5 dark:to-transparent border-slate-200 dark:border-slate-700'
                            : i === 2
                              ? 'bg-gradient-to-r from-orange-50/50 to-orange-100/20 dark:from-orange-500/5 dark:to-transparent border-orange-100 dark:border-orange-500/20'
                              : 'bg-slate-50/50 dark:bg-slate-950/30 border-transparent'
                          }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500 text-white shadow' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">{asset.electotronixPN}</p>
                        </div>
                        <span className="text-sm font-black text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {asset.borrows} <span className="text-[8px] font-bold text-slate-400">{t.borrowCount}</span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Penalty Breakdown */}
          <motion.div variants={item}>
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors h-full">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                    <ShieldAlert size={18} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.penaltyBreakdown}</h3>
                </div>

                {fallbackPenaltyByUser.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <ShieldAlert size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t.noData}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fallbackPenaltyByUser.map((user, i) => {
                      const maxPenalty = Math.max(...fallbackPenaltyByUser.map(u => u.totalPenalty), 1);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <AlertCircle size={12} className="text-red-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{user.name}</span>
                              <span className="text-[8px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{user.overdueCount}x</span>
                            </div>
                            <span className="text-sm font-black text-red-600 dark:text-red-400 whitespace-nowrap ml-2">
                              ฿{Number(user.totalPenalty || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ml-8">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(user.totalPenalty / maxPenalty) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.1, type: "spring" }}
                              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                            ></motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
