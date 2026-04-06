// src/pages/History.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { History as HistoryIcon, Clock, CheckCircle2, AlertCircle, UploadCloud, X, Package, Fingerprint, Calendar, Wallet, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const translations = {
  en: {
    pageTitle: "DATABASE MODULE: LOGS",
    opLogs: "Operation Logs",
    historyDesc: "Personal Acquisition History",
    colTime: "Timestamp / Deadline",
    colAsset: "Asset Identity",
    colVol: "Volume",
    colState: "State",
    colCmd: "Command",
    due: "Due",
    execReturn: "Execute Return",
    processing: "Processing",
    concluded: "Operation Concluded",
    noLogs: "No Logs Detected in Database",
    evUpload: "Evidence Upload",
    target: "Target",
    initScanner: "Initialize Scanner",
    capture: "Capture clear visual data",
    transmit: "Transmit Data",
    warnEv: "Awaiting visual evidence for verification.",
    errId: "System Error: Cannot identify asset ID.",
    errUpload: "Upload failed. Connection interrupted.",
    succEv: "Evidence submitted. Awaiting Admin clearance.",
    stCleared: "Cleared",
    stVerify: "Verifying",
    stBreach: "Breach: Overdue",
    stActive: "Active Use",
    borrowDate: "Borrowed",
    dueDate: "Deadline",
    checkInBtn: "Report Status",
    checkInTitle: "Condition Check-in",
    stCheckInReq: "Check-in Req.",
    conditionLabel: "Asset Condition",
    condGood: "Operational",
    condDamaged: "Damaged",
    condLost: "Lost",
    condWarning: "* In case of damage or loss, a penalty fee may apply.",
    creditLabel: "Initial Penalty",
    penaltyLabel: "Unpaid Penalties",
    monthFilter: "Filter by Month",
    allMonths: "All Months",
    penaltyPreview: "Estimated Deduction",
    penaltyOverdue: "Overdue Fee",
    penaltyCondition: "Condition Fee",
    penaltyTotal: "Total Deduction",
    lostNoImage: "Photo not required for lost items",
    condDamagedWarn: "Damaged: 50% of unit price will be deducted",
    condLostWarn: "Lost: 100% of unit price will be deducted"
  },
  th: {
    pageTitle: "โมดูลฐานข้อมูล: บันทึกปฏิบัติการ",
    opLogs: "บันทึกปฏิบัติการ",
    historyDesc: "ประวัติการเบิกอุปกรณ์ส่วนตัว",
    colTime: "เวลาที่ยืม / กำหนดคืน",
    colAsset: "ข้อมูลอุปกรณ์",
    colVol: "จำนวน",
    colState: "สถานะ",
    colCmd: "คำสั่ง",
    due: "กำหนดคืน",
    execReturn: "ดำเนินการคืน",
    processing: "กำลังตรวจสอบ",
    concluded: "เสร็จสิ้นภารกิจ",
    noLogs: "ไม่พบประวัติการทำรายการในระบบ",
    evUpload: "อัปโหลดหลักฐาน",
    target: "เป้าหมาย",
    initScanner: "เริ่มต้นการสแกน",
    capture: "ถ่ายภาพหลักฐานให้ชัดเจน",
    transmit: "ส่งข้อมูล",
    warnEv: "กรุณาแนบภาพหลักฐานก่อนยืนยัน",
    errId: "ข้อผิดพลาดของระบบ: ไม่พบรหัสอุปกรณ์",
    errUpload: "การอัปโหลดล้มเหลว การเชื่อมต่อขัดข้อง",
    succEv: "ส่งหลักฐานสำเร็จ รอการอนุมัติจาก Admin",
    stCleared: "อนุมัติแล้ว",
    stVerify: "รอตรวจสอบ",
    stBreach: "เลยกำหนดคืน",
    stActive: "กำลังใช้งาน",
    borrowDate: "วันที่ยืม",
    dueDate: "กำหนดคืน",
    checkInBtn: "รายงานสถานะ",
    checkInTitle: "รายงานสภาพอุปกรณ์",
    stCheckInReq: "ต้องรายงานสถานะ",
    conditionLabel: "สภาพอุปกรณ์ปัจจุบัน",
    condGood: "ใช้งานได้ปกติ",
    condDamaged: "ชำรุดรอซ่อม",
    condLost: "สูญหาย",
    condWarning: "* กรณีอุปกรณ์ชำรุดหรือสูญหาย อาจมีการหักเงินค่าปรับ",
    creditLabel: "ค่าปรับค้างชำระ",
    monthFilter: "กรองตามเดือน",
    allMonths: "ทุกเดือน",
    penaltyPreview: "ประมาณการหักเงิน",
    penaltyOverdue: "ค่าปรับล่าช้า",
    penaltyCondition: "ค่าปรับตามสภาพ",
    penaltyTotal: "หักรวมทั้งสิ้น",
    lostNoImage: "ไม่จำเป็นต้องแนบรูป — อุปกรณ์สูญหาย",
    condDamagedWarn: "ชำรุด: จะโดนหัก 50% ของราคาสินค้า",
    condLostWarn: "สูญหาย: จะโดนหัก 100% ของราคาสินค้า"
  }
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [returnImage, setReturnImage] = useState(null);

  const [modalMode, setModalMode] = useState('return');
  const [assetCondition, setAssetCondition] = useState('good');
  const [credit, setCredit] = useState(0);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('all');

  // 🚀 สำหรับ Dropdown เดือนที่สมูทขึ้น
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthRef = useRef(null);

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];

  // 🚀 Set Global Title
  const { setTitle } = useOutletContext();
  useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setIsMonthOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    const cleanPath = String(imgPath).trim().toLowerCase();
    const invalid = ['', 'null', '-', '/', 'undefined', 'no-image'];
    if (invalid.includes(cleanPath)) return null;

    if (imgPath.startsWith('http')) return imgPath;
    if (imgPath.startsWith('/')) return `${imgPath}`;
    return `/${imgPath}`;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) return navigate('/login');
        const userInfo = JSON.parse(storedUser);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const { data } = await axios.get('/api/borrow/my-history', config);
        if (isMounted) {
          if (data && data.history) {
            setHistory(Array.isArray(data.history) ? data.history : []);
            setCredit(data.credit || 0);
            setTotalPenalty(data.totalPenalty || 0);
          } else {
            setHistory(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        toast.error(t.errUpload);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnImage && assetCondition !== 'lost') return toast.warn(t.warnEv);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const formData = new FormData();
      if (returnImage) formData.append('return_image', returnImage);
      formData.append('asset_condition', assetCondition);

      if (modalMode === 'checkin') {
        formData.append('is_checkin', 'true');
      }

      const targetId = selectedBorrow.borrow_id || selectedBorrow.ID || selectedBorrow.id;

      if (!targetId) {
        return toast.error(t.errId);
      }

      await axios.post(`/api/borrow/${targetId}/return`, formData, config);

      toast.success(t.succEv);
      setShowReturnModal(false);
      setReturnImage(null);
      setAssetCondition('good');
      fetchHistory();
    } catch (error) {
      const message = error.response?.data?.message || t.errUpload;
      toast.error(`ERROR: ${message}`);
    }
  };

  const getStatusDisplay = (status, dueDate, is_longterm) => {
    const now = new Date();
    const due = new Date(dueDate);
    const isLate = now > due && status === 'active';

    if (status === 'returned') return <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5 w-max"><CheckCircle2 size={12} /> {t.stCleared}</span>;
    if (status === 'pending_return') return <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)] animate-pulse flex items-center justify-center gap-1.5 w-max"><Clock size={12} /> {t.stVerify}</span>;

    if (isLate) {
      if (is_longterm) {
        return <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] flex items-center justify-center gap-1.5 w-max animate-pulse"><AlertCircle size={12} /> {t.stCheckInReq}</span>;
      }
      return <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-bounce flex items-center justify-center gap-1.5 w-max"><AlertCircle size={12} /> {t.stBreach}</span>;
    }

    return <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm flex items-center justify-center gap-1.5 w-max">{t.stActive}</span>;
  };

  // สร้าง Options สำหรับ Month Dropdown
  const monthOptions = useMemo(() => {
    const months = new Set();
    history.forEach(item => {
      const d = new Date(item.borrow_date);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const options = [...months].sort().reverse().map(m => {
      const [y, mo] = m.split('-');
      const label = new Date(y, mo - 1).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { year: 'numeric', month: 'long' });
      return { value: m, label };
    });
    return [{ value: 'all', label: t.allMonths }, ...options];
  }, [history, lang, t.allMonths]);

  const filteredHistory = selectedMonth === 'all' ? history : history.filter(item => {
    const d = new Date(item.borrow_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  });

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className="max-w-7xl mx-auto pb-10 sm:pb-20 px-4 sm:px-0">

        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-200/50 dark:border-slate-800/60 overflow-hidden mt-6 relative">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-rose-400/20 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

          {/* 🚀 Header Section */}
          <div className="p-6 sm:p-10 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-900 border border-orange-200/50 dark:border-slate-700 text-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <HistoryIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t.opLogs}</h2>
                <p className="text-[9px] sm:text-[10px] font-black text-orange-500 mt-1 uppercase tracking-widest">{t.historyDesc}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Credit Balance */}
              <motion.div whileHover={{ scale: 1.02 }} className={`flex items-center gap-3 px-5 py-3 border rounded-2xl shadow-sm ${credit > 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-950/20 border-red-200 dark:border-red-800/50' : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50'}`}>
                <div className={`p-2 rounded-xl ${credit > 0 ? 'bg-red-500/10 text-red-500' : 'bg-slate-200/50 dark:bg-slate-700 text-slate-400'}`}>
                  <Wallet size={16} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${credit > 0 ? 'text-red-500/80' : 'text-slate-500'}`}>{t.creditLabel}</span>
                  <span className={`text-base font-black tracking-tighter ${credit > 0 ? 'text-red-600 dark:text-red-400 drop-shadow-sm' : 'text-slate-700 dark:text-slate-300'}`}>฿{Number(credit || 0).toLocaleString()}</span>
                </div>
              </motion.div>

              {/* 🚀 Custom Month Dropdown (Smooth) */}
              <div className="relative" ref={monthRef}>
                <button onClick={() => setIsMonthOpen(!isMonthOpen)} className="flex items-center justify-between gap-3 px-5 py-3 h-[52px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest outline-none hover:border-orange-500 transition-all shadow-sm min-w-[180px] group">
                  <span className="flex items-center gap-2 text-slate-400 group-hover:text-orange-500 transition-colors"><Calendar size={14} /> {monthOptions.find(o => o.value === selectedMonth)?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isMonthOpen ? 'rotate-180 text-orange-500' : ''}`} />
                </button>
                <AnimatePresence>
                  {isMonthOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-full min-w-[180px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden origin-top z-40"
                    >
                      <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {monthOptions.map(opt => (
                          <div key={opt.value}
                            onClick={() => { setSelectedMonth(opt.value); setIsMonthOpen(false); }}
                            className={`px-4 py-3 mb-1 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-3 ${selectedMonth === opt.value ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedMonth === opt.value ? 'bg-orange-500 animate-pulse' : 'bg-transparent'}`}></div>
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 📱 MOBILE VIEW (Card Layout) */}
          <div className="block md:hidden p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            <AnimatePresence mode="popLayout">
              {filteredHistory.length > 0 ? filteredHistory.map((item, index) => {
                const validImg = getImageUrl(item.img);
                const rowKey = item.borrow_id || item.ID || item.id || Math.random().toString();
                const isLate = new Date() > new Date(item.due_date) && item.status === 'active';

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    key={rowKey}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-orange-300 transition-colors">
                          {validImg ? <img src={validImg} alt={item.electotronixPN} className="w-full h-full object-contain p-1.5 drop-shadow-md" /> : <Package size={24} className="text-slate-300" />}
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <p className="font-black text-base text-slate-900 dark:text-white leading-tight truncate tracking-tighter">{item.electotronixPN}</p>
                          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1 truncate">{item.category}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 dark:border-slate-800">
                        {getStatusDisplay(item.status, item.due_date, item.is_longterm)}
                        <div className="text-right">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{t.colVol}</span>
                          <span className="font-black text-sm text-slate-900 dark:text-white">{item.quantity}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Calendar size={12} className="text-slate-300" /> {t.borrowDate}</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(item.borrow_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Clock size={12} className={isLate ? 'text-red-400' : 'text-slate-300'} /> {t.dueDate}</p>
                          <p className={`text-xs font-bold ${isLate ? (item.is_longterm ? 'text-blue-500' : 'text-red-500') : 'text-orange-500'}`}>
                            {new Date(item.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {item.status === 'active' && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedBorrow(item); setModalMode(item.is_longterm ? 'checkin' : 'return'); setShowReturnModal(true); }}
                        className={`w-full py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${item.is_longterm ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/40' : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/20 hover:shadow-orange-500/40'}`}
                      >
                        {item.is_longterm ? t.checkInBtn : t.execReturn}
                      </motion.button>
                    )}
                    {item.status === 'pending_return' && (
                      <div className="w-full py-3.5 text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                        <Fingerprint size={14} className="animate-pulse" /> {t.processing}
                      </div>
                    )}
                  </motion.div>
                );
              }) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center opacity-50 text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <HistoryIcon size={32} className="text-slate-400" />
                  </div>
                  <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">{t.noLogs}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 💻 DESKTOP VIEW (Table Layout) */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar bg-white dark:bg-slate-900">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-orange-600 dark:text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-6 whitespace-nowrap">{t.colTime}</th>
                  <th className="p-6 whitespace-nowrap">{t.colAsset}</th>
                  <th className="p-6 text-center whitespace-nowrap">{t.colVol}</th>
                  <th className="p-6 text-center whitespace-nowrap">{t.colState}</th>
                  <th className="p-6 text-right whitespace-nowrap">{t.colCmd}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 font-medium">
                <AnimatePresence>
                  {filteredHistory.length > 0 ? filteredHistory.map((item, index) => {
                    const validImg = getImageUrl(item.img);
                    const rowKey = item.borrow_id || item.ID || item.id || Math.random().toString();
                    const isLate = new Date() > new Date(item.due_date) && item.status === 'active';

                    return (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        key={rowKey}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="p-6">
                          <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2"><Calendar size={14} className="text-slate-300" /> {new Date(item.borrow_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className={isLate ? 'text-red-400' : 'text-slate-300'} />
                            <span className={isLate ? (item.is_longterm ? 'text-blue-500' : 'text-red-500') : 'text-orange-500'}>
                              {t.due}: {new Date(item.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                            </span>
                          </p>
                        </td>
                        <td className="p-6 flex items-center gap-5">
                          <div className="w-14 h-14 bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative group-hover:border-orange-300 dark:group-hover:border-orange-500/50 transition-colors shadow-inner">
                            {validImg ? <motion.img whileHover={{ scale: 1.1 }} src={validImg} alt={item.electotronixPN} className="w-full h-full object-contain p-2 opacity-90 group-hover:opacity-100 drop-shadow-md" /> : <Package size={20} className="text-slate-300" />}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tighter group-hover:text-orange-500 transition-colors">{item.electotronixPN}</p>
                            <p className="text-[9px] font-black text-orange-500/80 mt-1.5 uppercase tracking-widest">{item.category}</p>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className="font-black text-xl text-slate-900 dark:text-white">{item.quantity}</span>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex justify-center">
                            {getStatusDisplay(item.status, item.due_date, item.is_longterm)}
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          {item.status === 'active' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setSelectedBorrow(item); setModalMode(item.is_longterm ? 'checkin' : 'return'); setShowReturnModal(true); }}
                              className={`px-6 py-3.5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${item.is_longterm ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/40' : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/20 hover:shadow-orange-500/40'}`}
                            >
                              {item.is_longterm ? t.checkInBtn : t.execReturn}
                            </motion.button>
                          )}
                          {item.status === 'pending_return' && (
                            <span className="px-5 py-3 text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-2 w-max ml-auto shadow-inner">
                              <Fingerprint size={14} className="animate-pulse" /> {t.processing}
                            </span>
                          )}
                          {item.status === 'returned' && (
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">{t.concluded}</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="p-24 text-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center opacity-40">
                          <HistoryIcon size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
                          <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-500">{t.noLogs}</p>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* 🚀 Modal สแกนหลักฐาน (Premium Framer Motion + Custom Cards) */}
      <AnimatePresence>
        {showReturnModal && selectedBorrow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl relative border border-slate-200/50 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">

                {/* เส้นสแกนเรืองแสง */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${modalMode === 'checkin' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]'} animate-[scan_2s_ease-in-out_infinite]`}></div>

                <button onClick={() => { setShowReturnModal(false); setReturnImage(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-3 rounded-full transition-colors z-20 hover:scale-110 active:scale-95">
                  <X size={18} />
                </button>

                <h3 className={`text-xl sm:text-2xl font-black mb-1 tracking-tighter uppercase ${modalMode === 'checkin' ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500'}`}>
                  {modalMode === 'checkin' ? t.checkInTitle : t.evUpload}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 font-bold truncate border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2"><Package size={14} /> {selectedBorrow.electotronixPN}</p>

                <form onSubmit={handleReturnSubmit} className="relative z-10">

                  {/* 🚀 อัปเกรด: Select เป็นกล่อง Card 3 สีสวยๆ */}
                  <div className="mb-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><AlertCircle size={14} className="text-slate-300" /> {t.conditionLabel}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Good */}
                      <div
                        onClick={() => setAssetCondition('good')}
                        className={`cursor-pointer border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all ${assetCondition === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-300 grayscale'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${assetCondition === 'good' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}><CheckCircle2 size={16} /></div>
                        <span className={`text-[10px] font-black uppercase ${assetCondition === 'good' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>{t.condGood}</span>
                      </div>
                      {/* Damaged */}
                      <div
                        onClick={() => setAssetCondition('damaged')}
                        className={`cursor-pointer border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all ${assetCondition === 'damaged' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-yellow-300 grayscale'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${assetCondition === 'damaged' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-200 text-slate-400'}`}><AlertCircle size={16} /></div>
                        <span className={`text-[10px] font-black uppercase ${assetCondition === 'damaged' ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-500'}`}>{t.condDamaged}</span>
                      </div>
                      {/* Lost */}
                      <div
                        onClick={() => setAssetCondition('lost')}
                        className={`cursor-pointer border-2 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all ${assetCondition === 'lost' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-red-300 grayscale'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${assetCondition === 'lost' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-400'}`}><X size={16} /></div>
                        <span className={`text-[10px] font-black uppercase ${assetCondition === 'lost' ? 'text-red-700 dark:text-red-400' : 'text-slate-500'}`}>{t.condLost}</span>
                      </div>
                    </div>

                    {/* แจ้งเตือนค่าปรับตามสภาพ */}
                    <AnimatePresence>
                      {assetCondition === 'damaged' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-3 bg-yellow-50/80 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl flex items-center justify-between">
                          <p className="text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">⚠️ {t.condDamagedWarn}</p>
                          {selectedBorrow?.price > 0 && <p className="text-xs font-black text-yellow-700 dark:text-yellow-300">≈ ฿{Math.round(Number(selectedBorrow.price) * (selectedBorrow.quantity || 1) * 0.5).toLocaleString()}</p>}
                        </motion.div>
                      )}
                      {assetCondition === 'lost' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-3 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center justify-between">
                          <p className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">🔴 {t.condLostWarn}</p>
                          {selectedBorrow?.price > 0 && <p className="text-xs font-black text-red-700 dark:text-red-300">≈ ฿{Math.round(Number(selectedBorrow.price) * (selectedBorrow.quantity || 1) * 1.0).toLocaleString()}</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 🚀 กรอบอัปโหลดรูปภาพ */}
                  {assetCondition === 'lost' ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-red-300 dark:border-red-700 rounded-[2rem] bg-red-50/50 dark:bg-red-950/20">
                      <AlertCircle className="w-12 h-12 mb-3 text-red-300 dark:text-red-800" />
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center px-4">{t.lostNoImage}</p>
                    </motion.div>
                  ) : (
                    <motion.div className="mb-8" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-[2rem] cursor-pointer transition-colors group relative overflow-hidden ${modalMode === 'checkin' ? 'border-blue-200 hover:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 hover:border-orange-400'}`}>
                        {returnImage ? (
                          <img src={URL.createObjectURL(returnImage)} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${modalMode === 'checkin' ? 'text-blue-300 group-hover:text-blue-500' : 'text-slate-300 group-hover:text-orange-500'}`} />
                            <p className={`mb-1 text-[11px] font-black uppercase tracking-widest transition-colors ${modalMode === 'checkin' ? 'text-blue-600' : 'text-slate-500 group-hover:text-orange-500'}`}>{t.initScanner}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">{t.capture}</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => setReturnImage(e.target.files[0])} />
                      </label>
                    </motion.div>
                  )}

                  {/* 🚀 Preview ค่าปรับรวม */}
                  <AnimatePresence>
                    {(assetCondition !== 'good' || (selectedBorrow && new Date() > new Date(selectedBorrow.due_date) && selectedBorrow.status === 'active')) && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-slate-800 pb-2">{t.penaltyPreview}</p>
                        <div className="space-y-2 mt-2">
                          {selectedBorrow && new Date() > new Date(selectedBorrow.due_date) && modalMode !== 'checkin' && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-500">{t.penaltyOverdue}</span>
                              <span className="font-black text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md">฿{(Math.ceil(Math.abs(new Date() - new Date(selectedBorrow.due_date)) / (1000 * 60 * 60 * 24)) * 50).toLocaleString()}</span>
                            </div>
                          )}
                          {assetCondition !== 'good' && selectedBorrow?.price > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-500">{t.penaltyCondition} ({assetCondition === 'damaged' ? '50%' : '100%'})</span>
                              <span className="font-black text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md">฿{Math.round(Number(selectedBorrow.price) * (selectedBorrow.quantity || 1) * (assetCondition === 'damaged' ? 0.5 : 1.0)).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`w-full py-4 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl transition-all ${assetCondition === 'lost' ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/30' : modalMode === 'checkin' ? 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-blue-500/30' : 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30'}`}
                  >
                    {t.transmit}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
