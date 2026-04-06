import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, LogOut, Bell, Search, CheckCircle2, History, LayoutGrid, Sun, Moon, Globe, Menu, X, CheckCheck, PackagePlus, User, BarChart3, Wrench, FileText, ClipboardList, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../middleware/axiosInstance';
import axios from 'axios';
import { connectSocket, disconnectSocket } from '../middleware/socketManager';
import { toast } from 'react-toastify';

// 🔊 เสียงแจ้งเตือนแบบมินิมอล (เสียง "ding" นุ่มๆ ไม่แสบหู)
const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) { }
};

// 🌐 Dictionary สำหรับแปลภาษา
const translations = {
  en: {
    assets: 'Assets (Inventory)',
    logs: 'Operation Logs',
    approval: 'Approval (Requests)',
    command: 'Command Center',
    search: 'Search system...',
    alerts: 'Alerts Center',
    noAlerts: 'Clear Sky - No Alerts',
    logout: 'Logout System',
    admin: 'Admin',
    operator: 'Operator',
    coreSystems: 'Core Systems',
    myAccount: 'My Account',
    adminTools: 'Admin Tools',
    createBarcode: 'Create Barcode',
    profile: 'Profile',
    borrowReqs: 'Borrow Requests',
    analytics: 'Analytics',
    maintenance: 'Maintenance',
    reports: 'Reports',
  },
  th: {
    assets: 'คลังอุปกรณ์',
    logs: 'บันทึกปฏิบัติการ',
    approval: 'พิจารณาคำร้อง',
    command: 'ศูนย์บัญชาการ',
    search: 'ค้นหาในระบบ...',
    alerts: 'ศูนย์แจ้งเตือน',
    noAlerts: 'ไม่มีการแจ้งเตือนใหม่',
    logout: 'ออกจากระบบ',
    admin: 'ผู้ดูแลระบบ',
    operator: 'ผู้ปฏิบัติงาน',
    coreSystems: 'ระบบหลัก',
    myAccount: 'บัญชี',
    adminTools: 'เครื่องมือแอดมิน',
    createBarcode: 'สร้างบาร์โค้ด',
    profile: 'โปรไฟล์',
    borrowReqs: 'คำขอยืม',
    analytics: 'วิเคราะห์ข้อมูล',
    maintenance: 'ซ่อมบำรุง',
    reports: 'รายงาน',
  }
};

export default function MainLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);

  // 🚀 State สำหรับเปิด/ปิดเมนูมือถือ
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ปิดเมนูมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // 🌓 State สำหรับ ธีม และ ภาษา
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');

    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = "#0F172A";
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = "#e2e8f0";
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = "#0F172A";
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = "#F8FAFC";
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = translations[lang];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userInfo?.token) return;
    let isMounted = true;

    // ดึงข้อมูลแจ้งเตือนเฉพาะตอนโหลดหน้าเว็บครั้งแรก (จากนั้น Socket จะคอยอัปเดต)
    const fetchNotifications = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('/api/notifications', config);
        if (isMounted) setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Notification Sync Error:", error);
      }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [userInfo?.token]);

  const handleRead = async (id, isRead) => {
    if (isRead || !userInfo?.token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`/api/notifications/${id}/read`, {}, config);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) { console.error(error); }
  };

  // ✅ อ่านทั้งหมดแล้ว (Mark All As Read)
  const handleMarkAllRead = async () => {
    if (!userInfo?.token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put('/api/notifications/read-all', {}, config);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) { console.error(error); }
  };

  // 🔔 ขอสิทธิ์ Browser Push Notification
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 🔌 Socket.io: รับแจ้งเตือนแบบ real-time (ใช้ Singleton Socket — ไม่สร้างใหม่ทุกหน้า)
  useEffect(() => {
    if (!userInfo?.token) return;
    const userId = userInfo?.user?._id || userInfo?.user?.id;
    if (!userId) return;

    const socket = connectSocket(userId);

    const handleNotification = async (payload) => {
      // 🔊 เล่นเสียง
      playNotifSound();

      // 🍞 Toast Popup
      toast.info(payload?.title || 'คุณมีการแจ้งเตือนใหม่', {
        position: 'top-right',
        autoClose: 5000,
        icon: '🔔',
      });

      // 🌐 Browser Push Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload?.title || 'PAWIN-ASSETS', {
          body: payload?.message || 'คุณมีการแจ้งเตือนใหม่',
          icon: '/favicon.ico',
        });
      }

      // ดึงข้อมูลใหม่
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('/api/notifications', config);
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) { console.error(error); }
    };

    socket.on('new_notification', handleNotification);

    // ⚠️ ไม่ disconnect ตอนเปลี่ยนหน้า — แค่ถอด listener เพื่อป้องกันซ้ำ
    return () => {
      socket.off('new_notification', handleNotification);
    };
  }, [userInfo?.token]);

  const isAdmin = userInfo?.user?.isAdmin || false;
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.is_read).length;

  const menuItems = [
    { title: t.assets, path: '/dashboard', icon: <LayoutGrid size={20} /> },
    { title: t.logs, path: '/history', icon: <History size={20} /> },
  ];

  const accountItems = [
    { title: t.profile, path: '/profile', icon: <User size={20} /> },
    { title: t.borrowReqs, path: '/borrow-requests', icon: <ClipboardList size={20} /> },
  ];

  const adminItems = [
    { title: t.approval, path: '/admin/approvals', icon: <ShieldCheck size={20} /> },
    { title: t.command, path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { title: t.createBarcode, path: '/admin/create-barcode', icon: <PackagePlus size={20} /> },
    { title: t.analytics, path: '/analytics', icon: <BarChart3 size={20} /> },
    { title: t.maintenance, path: '/maintenance', icon: <Wrench size={20} /> },
    { title: t.reports, path: '/reports', icon: <FileText size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-300 selection:bg-orange-500/30 selection:text-orange-200 bg-slate-200 dark:bg-slate-950 text-slate-800 dark:text-slate-300">

      {/* 🚀 Mobile Overlay Background (ฉากกั้นสีดำตอนเปิดเมนูในมือถือ) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[90] lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 🌌 Sidebar (ปรับให้รองรับ Slide บนมือถือ) */}
      <aside className={`fixed inset-y-0 left-0 w-[280px] backdrop-blur-2xl border-r flex flex-col z-[100] transform transition-transform duration-500 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white dark:bg-slate-900/90 border-slate-300 dark:border-slate-800/50 shadow-lg dark:shadow-none`}>

        <div className="absolute top-0 left-0 w-full h-32 bg-orange-500/10 blur-3xl rounded-full -z-10"></div>

        <div className="h-16 sm:h-24 flex items-center justify-between px-6 border-b transition-colors duration-300 border-slate-200/80 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="PAWIN Logo" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <div className="flex flex-col mt-1">
              <span className="font-black text-lg sm:text-[22px] tracking-tighter leading-none transition-colors duration-300 text-slate-900 dark:text-white">
                PAWIN-<span className="text-orange-500">ASSETS</span>
              </span>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Technology</span>
            </div>
          </div>

          {/* 🚀 ปุ่มปิดเมนู (เฉพาะมือถือ) */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-500 hover:text-red-500 p-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 custom-scrollbar">
          {/* 🚀 Core Systems */}
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">{t.coreSystems}</p>
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 sm:py-3.5 rounded-2xl mb-2 font-bold transition-all duration-300 relative group overflow-hidden border ${isActive
                    ? 'bg-orange-100 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-transparent text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/30 shadow-[inset_4px_0_0_rgba(249,115,22,1)] shadow-sm'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                    }`}
                >
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className="shrink-0"
                  >
                    {item.icon}
                  </motion.span>
                  <span className="text-sm tracking-wide">{item.title}</span>
                </Link>
              </motion.div>
            );
          })}

          {/* 🚀 My Account Section */}
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-8 sm:mt-10 mb-4 px-2">{t.myAccount}</p>
          {accountItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (menuItems.length + idx) * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 sm:py-3.5 rounded-2xl mb-2 font-bold transition-all duration-300 relative group overflow-hidden border ${isActive
                    ? 'bg-orange-100 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-transparent text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/30 shadow-[inset_4px_0_0_rgba(249,115,22,1)] shadow-sm'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                    }`}
                >
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className="shrink-0"
                  >
                    {item.icon}
                  </motion.span>
                  <span className="text-sm tracking-wide">{item.title}</span>
                </Link>
              </motion.div>
            );
          })}

          {isAdmin && (
            <>
              {/* 🚀 Admin Tools Section */}
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-8 sm:mt-10 mb-4 px-2">{t.adminTools}</p>
              {adminItems.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (menuItems.length + accountItems.length + idx) * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-4 px-4 py-3 sm:py-3.5 rounded-2xl mb-2 font-bold transition-all duration-300 relative group overflow-hidden border ${isActive
                        ? 'bg-orange-100 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-transparent text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/30 shadow-[inset_4px_0_0_rgba(249,115,22,1)] shadow-sm'
                        : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
                        }`}
                    >
                      <motion.span
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        className="shrink-0"
                      >
                        {item.icon}
                      </motion.span>
                      <span className="text-sm tracking-wide">{item.title}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t transition-colors duration-300 border-slate-200/80 dark:border-slate-800/50">
          <button onClick={() => { disconnectSocket(); localStorage.removeItem('userInfo'); navigate('/'); }} className="flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 w-full rounded-2xl font-black transition-all shadow-sm border bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/30">
            <LogOut size={18} /> <span className="text-[10px] sm:text-xs uppercase tracking-widest">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* 🌌 Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 sm:h-24 sticky top-0 backdrop-blur-xl flex items-center justify-between px-3 sm:px-8 z-[60] border-b transition-colors duration-300 bg-white/90 dark:bg-slate-950/70 border-slate-300 dark:border-slate-800/50 shadow-sm dark:shadow-none">

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 🚀 ปุ่ม Hamburger (แสดงเฉพาะมือถือ) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors"
            >
              <Menu size={22} className="sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-base sm:text-2xl font-black tracking-tight transition-colors duration-300 text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-none">{title}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 ml-auto">

            {/* Search (ซ่อนในมือถือ) */}
            <div className="hidden md:flex items-center px-5 py-3 rounded-2xl w-64 lg:w-72 focus-within:border-orange-500/50 transition-all border bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800">
              <Search size={18} className="mr-3 text-slate-400 dark:text-slate-500" />
              <input type="text" placeholder={t.search} className="bg-transparent border-none outline-none text-sm font-bold w-full text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600" />
            </div>

            {/* 🌐 Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
              className="flex items-center justify-center gap-2 p-2 sm:p-3 rounded-xl transition-all font-black text-[10px] sm:text-xs uppercase border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm dark:shadow-none"
              title="Switch Language"
            >
              <Globe size={18} className="sm:w-5 sm:h-5" /> <span className="hidden sm:block">{lang}</span>
            </button>

            {/* 🌓 Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-3 rounded-xl transition-all border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm dark:shadow-none"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative static sm:relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 sm:p-3 rounded-xl transition-all outline-none border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm dark:shadow-none"
              >
                <Bell size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 border-2 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border-slate-100 dark:border-slate-950 animate-pulse"></span>}
              </button>

              {/* 🚀 กล่องแจ้งเตือน: แยกโหมด Fixed บนมือถือ และ Absolute บน PC */}
              {isNotifOpen && (
                <div className="fixed inset-x-3 top-[70px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-4 w-auto sm:w-80 rounded-[1.5rem] sm:rounded-3xl shadow-2xl border overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-4 transition-colors duration-300 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
                  <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 flex justify-between items-center">
                    <h3 className="font-black uppercase text-[10px] sm:text-xs tracking-widest text-slate-900 dark:text-white">{t.alerts}</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && <span className="bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase italic">New {unreadCount}</span>}
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[8px] sm:text-[9px] font-bold text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 transition-colors flex items-center gap-1 uppercase tracking-wider"
                        title="อ่านทั้งหมดแล้ว"
                      >
                        <CheckCheck size={12} /> Read All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {safeNotifications.length > 0 ? safeNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleRead(notif.id, notif.is_read)}
                        className={`p-3 sm:p-4 border-b cursor-pointer flex gap-3 sm:gap-4 transition-colors border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 ${notif.is_read ? 'opacity-70' : ''}`}
                      >
                        <div className={`mt-0.5 sm:mt-1 shrink-0 ${notif.is_read ? 'text-slate-400 dark:text-slate-600' : 'text-orange-500'}`}><CheckCircle2 size={16} className="sm:w-5 sm:h-5" /></div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm truncate ${notif.is_read ? 'font-bold text-slate-500 dark:text-slate-400' : 'font-black text-slate-900 dark:text-slate-200'}`}>{notif.title}</p>
                          {/* 🚀 เพิ่ม break-words ให้ข้อความยาวๆ ตัดขึ้นบรรทัดใหม่ */}
                          <p className="text-[10px] sm:text-xs mt-1 leading-normal break-words whitespace-pre-wrap text-slate-600 dark:text-slate-500">{notif.message}</p>
                          <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1.5 sm:mt-2 uppercase tracking-tighter">
                            {new Date(notif.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    )) : <div className="p-6 sm:p-8 text-center text-[10px] sm:text-xs font-bold uppercase text-slate-500 dark:text-slate-600">{t.noAlerts}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Section */}
            <motion.div
              whileHover={{ y: -2 }}
              className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-3 lg:pl-6 border-l cursor-pointer group transition-colors duration-300 border-slate-300 dark:border-slate-800"
            >
              <div className="text-right hidden lg:block">
                <p className="font-black leading-none transition-colors text-slate-900 dark:text-slate-200 group-hover:text-orange-500 dark:group-hover:text-orange-400">{userInfo?.user?.name || 'User'}</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1.5 text-orange-600 dark:text-orange-500">{isAdmin ? t.admin : t.operator}</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border rounded-xl flex items-center justify-center font-black text-sm sm:text-base shadow-sm sm:shadow-lg transition-all bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white group-hover:border-orange-400 dark:group-hover:border-orange-500/50"
              >
                {userInfo?.user?.name ? userInfo.user.name.charAt(0).toUpperCase() : 'U'}
              </motion.div>
            </motion.div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 relative scroll-smooth custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}