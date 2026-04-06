import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Calendar, Download, Printer, BarChart3, Package,
  Clock, DollarSign, TrendingUp, Award, AlertCircle, Search
} from 'lucide-react';

const translations = {
  en: {
    pageTitle: "REPORTS GENERATOR",
    headerTitle: "Reports",
    headerDesc: "Generate and export system reports",
    dateRange: "Date Range",
    dateFrom: "From",
    dateTo: "To",
    generate: "Generate Report",
    generating: "Generating...",
    exportCSV: "Export CSV",
    printReport: "Print Report",
    noReport: "Generate a report to see data",
    assetsByCategory: "Assets by Category",
    monthlyBorrowStats: "Monthly Borrow Statistics",
    topBorrowed: "Most Borrowed Items",
    penaltySummary: "Penalty Summary",
    totalAssets: "Total Assets",
    totalBorrows: "Total Borrows",
    totalReturns: "Total Returns",
    totalPenalty: "Total Penalty",
    category: "Category",
    count: "Count",
    month: "Month",
    borrowCount: "Borrows",
    returnCount: "Returns",
    asset: "Asset",
    timesBorrowed: "Times Borrowed",
    user: "User",
    amount: "Amount",
    reportSummary: "Report Summary",
    printFriendly: "Print-Friendly Version",
    generatedAt: "Generated at"
  },
  th: {
    pageTitle: "สร้างรายงาน",
    headerTitle: "รายงาน",
    headerDesc: "สร้างและส่งออกข้อมูลรายงานของระบบ",
    dateRange: "ช่วงวันที่",
    dateFrom: "จากวันที่",
    dateTo: "ถึงวันที่",
    generate: "สร้างรายงาน",
    generating: "กำลังสร้าง...",
    exportCSV: "ส่งออก CSV",
    printReport: "พิมพ์รายงาน",
    noReport: "สร้างรายงานเพื่อดูข้อมูล",
    assetsByCategory: "ทรัพย์สินตามหมวดหมู่",
    monthlyBorrowStats: "สถิติการยืมรายเดือน",
    topBorrowed: "สินค้ายอดนิยม",
    penaltySummary: "สรุปค่าปรับ",
    totalAssets: "ทรัพย์สินทั้งหมด",
    totalBorrows: "การยืมทั้งหมด",
    totalReturns: "การคืนทั้งหมด",
    totalPenalty: "ค่าปรับรวม",
    category: "หมวดหมู่",
    count: "จำนวน",
    month: "เดือน",
    borrowCount: "การยืม",
    returnCount: "การคืน",
    asset: "อุปกรณ์",
    timesBorrowed: "จำนวนครั้งที่ยืม",
    user: "ผู้ใช้",
    amount: "จำนวนเงิน",
    reportSummary: "สรุปรายงาน",
    printFriendly: "เวอร์ชันสำหรับพิมพ์",
    generatedAt: "สร้างเมื่อ"
  }
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function Reports() {
  const { setTitle } = useOutletContext();
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    try {
      const storedUser = localStorage.getItem('userInfo');
      const userInfo = JSON.parse(storedUser);
      if (!userInfo.user?.isAdmin) { toast.error('Admin only'); setLoading(false); return; }
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
        params: { dateFrom, dateTo }
      };

      const res = await axios.get('/api/admin/report', config);
      setReport(res.data);
      toast.success('Report generated');
    } catch (err) {
      // Fallback: generate sample report
      toast.info('Using sample report data');
      setReport(getSampleReport());
    } finally {
      setLoading(false);
    }
  };

  const getSampleReport = () => ({
    summary: {
      totalAssets: 120,
      totalBorrows: 345,
      totalReturns: 289,
      totalPenalty: 12500,
    },
    categoryStats: [
      { category: 'Monitors', count: 25, borrows: 85, returns: 70 },
      { category: 'Laptops', count: 18, borrows: 92, returns: 78 },
      { category: 'Keyboards', count: 30, borrows: 45, returns: 40 },
      { category: 'Mice', count: 22, borrows: 55, returns: 48 },
      { category: 'Cables & Adapters', count: 15, borrows: 38, returns: 30 },
      { category: 'Accessories', count: 10, borrows: 30, returns: 23 },
    ],
    monthlyBorrows: [
      { month: 'Jan 2026', borrows: 42, returns: 35 },
      { month: 'Feb 2026', borrows: 55, returns: 48 },
      { month: 'Mar 2026', borrows: 61, returns: 55 },
    ],
    topBorrowed: [
      { electotronixPN: 'UltraWide Monitor 34"', borrows: 42 },
      { electotronixPN: 'MacBook Pro 16"', borrows: 38 },
      { electotronixPN: 'Mechanical Keyboard RGB', borrows: 31 },
      { electotronixPN: 'USB-C Hub Multiport', borrows: 27 },
      { electotronixPN: 'Wireless Mouse Ergo', borrows: 23 },
    ],
    penaltyByUser: [
      { name: 'Somchai K.', totalPenalty: 2500, overdueCount: 4 },
      { name: 'Niran P.', totalPenalty: 1800, overdueCount: 3 },
      { name: 'Kanya S.', totalPenalty: 1200, overdueCount: 2 },
      { name: 'Pichit W.', totalPenalty: 800, overdueCount: 1 },
      { name: 'Mana J.', totalPenalty: 400, overdueCount: 1 },
    ],
  });

  const handleExportCSV = () => {
    if (!report) return toast.warn('Generate a report first');

    let csv = 'PAWIN ASSETS REPORT\n';
    csv += `Date Range: ${dateFrom} to ${dateTo}\n\n`;

    // Category stats
    csv += 'ASSETS BY CATEGORY\nCategory,Count,Borrows,Returns\n';
    (report.categoryStats || []).forEach(c => {
      csv += `${c.category},${c.count},${c.borrows},${c.returns}\n`;
    });

    csv += '\nMONTHLY BORROW STATISTICS\nMonth,Borrows,Returns\n';
    (report.monthlyBorrows || []).forEach(m => {
      csv += `${m.month},${m.borrows},${m.returns}\n`;
    });

    csv += '\nTOP BORROWED ITEMS\nAsset,Times Borrowed\n';
    (report.topBorrowed || []).forEach(a => {
      csv += `${a.electotronixPN},${a.borrows}\n`;
    });

    csv += '\nPENALTY SUMMARY\nUser,Total Penalty,Overdue Count\n';
    (report.penaltyByUser || []).forEach(u => {
      csv += `${u.name},${u.totalPenalty},${u.overdueCount}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pawin-report-${dateFrom}-${dateTo}.csv`;
    link.click();
    toast.success('CSV exported');
  };

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrintView(false), 1000);
    }, 300);
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto pb-20 px-4 sm:px-0"
    >
      <motion.div variants={container} initial="hidden" animate={report ? "show" : undefined} className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.headerTitle}</h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.headerDesc}</p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div variants={item}>
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 p-6 sm:p-8 transition-colors">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
              {/* Date From */}
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> {t.dateFrom}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Date To */}
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> {t.dateTo}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Generate */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <BarChart3 size={14} /> {loading ? t.generating : t.generate}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* No Report Placeholder */}
        {!report && !loading && (
          <motion.div variants={item}>
            <div className="bg-white/30 dark:bg-slate-900/20 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 py-24 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={36} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{t.noReport}</p>
            </div>
          </motion.div>
        )}

        {/* Report Results */}
        {report && (
          <>
            {/* Report Header with Export Buttons */}
            <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {t.reportSummary}
                <span className="text-slate-400 dark:text-slate-500 text-sm font-bold ml-2">
                  ({dateFrom} &rarr; {dateTo})
                </span>
              </h3>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportCSV}
                  className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Download size={14} /> {t.exportCSV}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer size={14} /> {t.printReport}
                </motion.button>
              </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={item}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { title: t.totalAssets, value: report.summary?.totalAssets || 0, icon: <Package size={18} />, color: 'blue' },
                  { title: t.totalBorrows, value: report.summary?.totalBorrows || 0, icon: <TrendingUp size={18} />, color: 'orange' },
                  { title: t.totalReturns, value: report.summary?.totalReturns || 0, icon: <Clock size={18} />, color: 'emerald' },
                  { title: t.totalPenalty, value: `฿${(report.summary?.totalPenalty || 0).toLocaleString()}`, icon: <DollarSign size={18} />, color: 'red' },
                ].map((card, i) => {
                  const colors = {
                    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30',
                    orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-500/30',
                    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30',
                    red: 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/30',
                  };
                  return (
                    <motion.div key={i} whileHover={{ y: -2 }}>
                      <div className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border ${colors[card.color]} shadow-lg relative overflow-hidden group transition-all`}>
                        <div className="flex items-start justify-between relative z-10">
                          <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-950 shadow-sm ${colors[card.color]}`}>{card.icon}</div>
                        </div>
                        <div className="mt-3 relative z-10">
                          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1 truncate">{card.title}</p>
                          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{card.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Two Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Assets by Category */}
              <motion.div variants={item}>
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Package size={18} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.assetsByCategory}</h3>
                    </div>

                    {/* Table format */}
                    <table className="w-full">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-3 text-left">{t.category}</th>
                          <th className="pb-3 text-center">{t.count}</th>
                          <th className="pb-3 text-right">{t.borrowCount}</th>
                          <th className="pb-3 text-right">{t.returnCount}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                        {(report.categoryStats || []).map((c, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 pr-2 text-sm font-bold text-slate-700 dark:text-slate-300">{c.category}</td>
                            <td className="py-3 text-center text-sm font-black text-slate-900 dark:text-white">{c.count}</td>
                            <td className="py-3 text-right text-sm font-black text-orange-600 dark:text-orange-400">{c.borrows}</td>
                            <td className="py-3 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">{c.returns}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Stats */}
              <motion.div variants={item}>
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <TrendingUp size={18} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.monthlyBorrowStats}</h3>
                    </div>

                    <div className="flex items-end gap-3 h-48">
                      {(report.monthlyBorrows || []).map((m, i) => {
                        const maxVal = Math.max(...(report.monthlyBorrows || []).map(x => x.borrows), 1);
                        return (
                          <motion.div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            <div className="w-full flex gap-1 items-end">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(m.borrows / maxVal) * 100}%` }}
                                transition={{ delay: i * 0.1, type: "spring" }}
                                className="flex-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-md min-h-[0px]"
                              ></motion.div>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(m.returns / maxVal) * 100}%` }}
                                transition={{ delay: i * 0.1 + 0.05, type: "spring" }}
                                className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-400/60 rounded-t-md min-h-[0px]"
                              ></motion.div>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">{m.month}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-orange-500 to-amber-400"></div>
                        <span className="text-[9px] font-bold text-slate-500">{t.borrowCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-500/60 to-emerald-400/60"></div>
                        <span className="text-[9px] font-bold text-slate-500">{t.returnCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Two Column: Top Borrowed + Penalty */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Top Borrowed */}
              <motion.div variants={item}>
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden h-full">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Award size={18} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.topBorrowed}</h3>
                    </div>
                    <div className="space-y-3">
                      {(report.topBorrowed || []).slice(0, 5).map((a, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-transparent hover:border-orange-200 dark:hover:border-orange-500/30 transition-all"
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-500 text-white shadow' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            {i + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex-1">{a.electotronixPN}</span>
                          <span className="text-sm font-black text-orange-600 dark:text-orange-400">{a.borrows}x</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Penalty Summary */}
              <motion.div variants={item}>
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden h-full">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle size={18} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.penaltySummary}</h3>
                    </div>
                    <div className="space-y-3">
                      {(report.penaltyByUser || []).map((u, i) => {
                        const maxPen = Math.max(...(report.penaltyByUser || []).map(x => x.totalPenalty), 1);
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <AlertCircle size={12} className="text-red-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{u.name}</span>
                                <span className="text-[8px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{u.overdueCount}x</span>
                              </div>
                              <span className="text-sm font-black text-red-600 dark:text-red-400 whitespace-nowrap ml-2">฿{u.totalPenalty.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ml-8">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(u.totalPenalty / maxPen) * 100}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                              ></motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
