import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Search, LayoutDashboard, ChevronLeft, ChevronRight,
  X, Eye, Image as ImageIcon, ShoppingCart, ChevronDown,
  Package, Clock, RotateCcw, Wallet, Plus, Zap, Filter, ListFilter, ArrowUpDown,
  Tag, Box, Minimize2, Truck, Info, CreditCard, ClipboardList, MapPin
} from 'lucide-react';
import CartDrawer from '../components/CartDrawer';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const translations = {
  en: {
    pageTitle: "ASSET CATALOG",
    searchPlaceholder: "Search equipment, Name, or specs...",
    allModules: "ALL CATEGORIES",
    online: "IN STOCK",
    offline: "OUT OF STOCK",
    acquire: "Acquire",
    activeAssets: "Active Borrows",
    pendingApp: "Pending",
    awaitingReturn: "Returning",
    totalCredit: "Total Penalty",
    na: "N/A",
    noMatch: "No assets found matching your criteria"
  },
  th: {
    pageTitle: "แคตตาล็อกอุปกรณ์",
    searchPlaceholder: "ค้นหาอุปกรณ์, ชื่อรายการ, หรือสเปก...",
    allModules: "ทุกหมวดหมู่",
    online: "พร้อมเบิก",
    offline: "ของหมด",
    acquire: "เบิกอุปกรณ์",
    activeAssets: "กำลังยืม",
    pendingApp: "รออนุมัติ",
    awaitingReturn: "รอส่งคืน",
    totalCredit: "ค่าปรับ",
    na: "ไม่มีข้อมูล",
    noMatch: "ไม่พบอุปกรณ์ที่ค้นหา"
  }
};

export default function Dashboard({ cartItems, setCartItems }) {
  const [assets, setAssets] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 🚀 State สำหรับเก็บค่า Dropdown
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [borrowQty, setBorrowQty] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  // 🚀 State และ Refs สำหรับควบคุมการเปิด/ปิด Dropdown ให้สมูท
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const categoryRef = useRef(null);
  const statusRef = useRef(null);
  const sortRef = useRef(null);

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang] || translations['en'];

  // 🚀 Set Global Title
  const { setTitle } = useOutletContext();
  useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

  // 🚀 ปิด Dropdown เมื่อคลิกพื้นที่ว่าง
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
      if (statusRef.current && !statusRef.current.contains(event.target)) setIsStatusOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target)) setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return navigate('/login');
      const userParsed = JSON.parse(storedUser);
      setUserInfo(userParsed);

      const config = { headers: { Authorization: `Bearer ${userParsed.token}` } };
      const [resAssets, resHistory] = await Promise.all([
        axios.get('/api/assets', config).catch(() => ({ data: [] })),
        axios.get('/api/borrow/my-history', config).catch(() => ({ data: { history: [], credit: 0, totalPenalty: 0 } }))
      ]);
      setAssets(Array.isArray(resAssets.data) ? resAssets.data : []);

      const historyData = resHistory.data?.history || [];
      setBorrowHistory(Array.isArray(historyData) ? historyData : []);
      setPenaltyAmount(Number(resHistory.data?.penalty ?? resHistory.data?.credit ?? 0));
    } catch (err) {
      console.error(err);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    if (!Array.isArray(borrowHistory)) return { active: 0, pending: 0, returns: 0, credit: 0 };
    return {
      active: borrowHistory.filter(b => b.status === 'active').length,
      pending: borrowHistory.filter(b => b.status === 'pending_approval').length,
      returns: borrowHistory.filter(b => b.status === 'pending_return').length,
      credit: penaltyAmount,
    };
  }, [borrowHistory, penaltyAmount]);

  const getImageUrl = (imgPath) => {
    if (!imgPath || imgPath === 'null' || imgPath === '-') return null;
    return imgPath.startsWith('http') ? imgPath : `/${imgPath.replace(/^\//, '')}`;
  };

  const uniqueCategories = [...new Set(assets.map(item => item.category).filter(Boolean))];

  // 🚀 Options สำหรับ Dropdown
  const statusOptions = [
    { value: 'all', label: `Status: ${t.allModules}` },
    { value: 'instock', label: `Status: ${t.online}` },
    { value: 'outstock', label: `Status: ${t.offline}` }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Sort: Newest First' },
    { value: 'oldest', label: 'Sort: Oldest First' },
    { value: 'name_asc', label: 'Sort: Name (A-Z)' },
    { value: 'name_desc', label: 'Sort: Name (Z-A)' }
  ];

  const processedAssets = useMemo(() => {
    if (!Array.isArray(assets)) return [];

    let filtered = assets.filter(item => {
      const matchSearch = (item.electotronixPN || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.value || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === '' || item.category === selectedCategory;
      let matchStatus = true;
      if (statusFilter === 'instock') matchStatus = item.quantity > 0;
      if (statusFilter === 'outstock') matchStatus = item.quantity <= 0;

      return matchSearch && matchCat && matchStatus;
    });

    filtered.sort((a, b) => {
      if (sortOrder === 'newest') return b.ID - a.ID;
      if (sortOrder === 'oldest') return a.ID - b.ID;
      if (sortOrder === 'name_asc') return (a.electotronixPN || '').localeCompare(b.electotronixPN || '');
      if (sortOrder === 'name_desc') return (b.electotronixPN || '').localeCompare(a.electotronixPN || '');
      return 0;
    });

    if (sortOrder === 'newest' || sortOrder === 'oldest') {
      filtered.sort((a, b) => (b.fileExists ? 1 : 0) - (a.fileExists ? 1 : 0));
    }

    return filtered;
  }, [assets, searchQuery, selectedCategory, statusFilter, sortOrder]);

  const currentItems = processedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(processedAssets.length / itemsPerPage) || 1;

  const handleConfirmBorrow = () => {
    if (borrowQty < 1 || borrowQty > selectedAsset.quantity) return toast.error("จำนวนไม่ถูกต้อง");
    if (stats.credit > 0) return toast.error("ไม่สามารถยืมได้เนื่องจากมีค่าปรับค้างชำระ!");

    setCartItems(prev => {
      const idx = prev.findIndex(i => i.ID === selectedAsset.ID);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].borrowQty = Math.min(updated[idx].borrowQty + borrowQty, selectedAsset.quantity);
        return updated;
      }
      return [...prev, { ...selectedAsset, borrowQty }];
    });
    toast.success(`เพิ่มลงตะกร้าแล้ว`);
    setShowBorrowModal(false);
  };

  return (
    <>
      <div className="max-w-[1600px] mx-auto pb-20 px-4 sm:px-0 animate-in fade-in duration-1000">

        {/* 🚀 1. USER STATS (Smooth Intro) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 100 }}>
            <CompactStatCard title={t.activeAssets} val={stats.active} icon={<Package />} color="blue" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 100 }}>
            <CompactStatCard title={t.pendingApp} val={stats.pending} icon={<Clock />} color="orange" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 100 }}>
            <CompactStatCard title={t.awaitingReturn} val={stats.returns} icon={<RotateCcw />} color="emerald" />
          </motion.div>

          {/* Penalty Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className={`p-5 sm:p-6 rounded-3xl flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-500 hover:-translate-y-2 h-32 sm:h-40 group ${stats.credit > 0 ? 'bg-gradient-to-br from-red-600 to-red-900 text-white shadow-red-500/30' : 'bg-gradient-to-br from-slate-900 to-black dark:from-orange-600 dark:to-orange-950 text-white shadow-orange-500/20'}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-inner"><Wallet size={20} className="sm:w-6 sm:h-6 text-white" /></div>
              {stats.credit > 0 && <span className="px-3 py-1 bg-red-950/80 text-red-200 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]">Penalty Active</span>}
            </div>
            <div className="mt-2 relative z-10">
              <p className="text-[9px] sm:text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">{t.totalCredit}</p>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter drop-shadow-md">฿{Number(stats.credit || 0).toLocaleString()}</h2>
            </div>
          </motion.div>
        </div>

        {/* 🚀 2. SEARCH & FILTER (Glassmorphism & Soft Shadows) */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 mb-10 relative z-30">
          <div className="relative w-full xl:flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors z-10 w-5 h-5" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300 dark:border-slate-800 rounded-full pl-14 pr-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all shadow-sm hover:shadow-md"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">

            {/* 🚀 Category Filter Dropdown */}
            <div className="relative w-full md:w-[220px]" ref={categoryRef}>
              <button
                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsStatusOpen(false); setIsSortOpen(false); }}
                className="w-full h-full bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300 dark:border-slate-800 rounded-full pl-12 pr-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm flex items-center justify-between group hover:border-orange-300 hover:shadow-md"
              >
                <Filter className="absolute left-5 text-slate-400 group-hover:text-orange-500 transition-colors w-4 h-4" />
                <span className="truncate pr-4">{selectedCategory || t.allModules}</span>
                <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180 text-orange-500' : ''} w-4 h-4`} />
              </button>
              <AnimatePresence>
                {isCategoryOpen && (
                  <DropdownMenu
                    options={[{ value: '', label: t.allModules }, ...uniqueCategories.map(c => ({ value: c, label: c }))]}
                    currentValue={selectedCategory}
                    onSelect={(val) => { setSelectedCategory(val); setCurrentPage(1); setIsCategoryOpen(false); }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* 🚀 Status Filter Dropdown */}
            <div className="relative w-full md:w-[200px]" ref={statusRef}>
              <button
                onClick={() => { setIsStatusOpen(!isStatusOpen); setIsCategoryOpen(false); setIsSortOpen(false); }}
                className="w-full h-full bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300 dark:border-slate-800 rounded-full pl-12 pr-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm flex items-center justify-between group hover:border-orange-300 hover:shadow-md"
              >
                <ListFilter className="absolute left-5 text-slate-400 group-hover:text-orange-500 transition-colors w-4 h-4" />
                <span className="truncate pr-4">{statusOptions.find(o => o.value === statusFilter)?.label}</span>
                <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isStatusOpen ? 'rotate-180 text-orange-500' : ''} w-4 h-4`} />
              </button>
              <AnimatePresence>
                {isStatusOpen && (
                  <DropdownMenu
                    options={statusOptions}
                    currentValue={statusFilter}
                    onSelect={(val) => { setStatusFilter(val); setCurrentPage(1); setIsStatusOpen(false); }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* 🚀 Sort Order Dropdown */}
            <div className="relative w-full md:w-[220px]" ref={sortRef}>
              <button
                onClick={() => { setIsSortOpen(!isSortOpen); setIsCategoryOpen(false); setIsStatusOpen(false); }}
                className="w-full h-full bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300 dark:border-slate-800 rounded-full pl-12 pr-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm flex items-center justify-between group hover:border-orange-300 hover:shadow-md"
              >
                <ArrowUpDown className="absolute left-5 text-slate-400 group-hover:text-orange-500 transition-colors w-4 h-4" />
                <span className="truncate pr-4">{sortOptions.find(o => o.value === sortOrder)?.label}</span>
                <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180 text-orange-500' : ''} w-4 h-4`} />
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <DropdownMenu
                    options={sortOptions}
                    currentValue={sortOrder}
                    onSelect={(val) => { setSortOrder(val); setCurrentPage(1); setIsSortOpen(false); }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 🚀 3. PRODUCT GRID GALLERY */}
        <AnimatePresence mode="wait">
          {processedAssets.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-24 sm:py-36 text-center flex flex-col items-center justify-center bg-white/30 dark:bg-slate-900/20 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-inner"
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Package size={40} className="text-slate-400" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-sm text-slate-500">{t.noMatch}</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              layout
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 relative z-10"
            >
              {currentItems.map((item, index) => {
                const isAvailable = item.quantity > 0;
                return (
                  <motion.div
                    key={item.ID}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.05, type: "spring", stiffness: 100 }}
                    className="group bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] p-4 sm:p-5 border border-slate-300 dark:border-slate-800 hover:border-orange-400/50 transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(249,115,22,0.15)] flex flex-col relative overflow-hidden"
                  >
                    {/* รูปภาพสินค้า */}
                    <div className="relative w-full aspect-square bg-gradient-to-tr from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 rounded-[2rem] flex items-center justify-center overflow-hidden mb-5 group-hover:shadow-inner transition-all duration-500">
                      <span className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest border border-slate-200/50 z-10 shadow-sm">
                        {item.category}
                      </span>

                      {getImageUrl(item.img) ? (
                        <motion.img
                          whileHover={{ scale: 1.15, rotate: 2 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          src={getImageUrl(item.img)}
                          className="w-[75%] h-[75%] object-contain relative z-0 drop-shadow-xl"
                          alt={item.electotronixPN}
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                      )}

                      {/* 🚀 Hover Actions (Slide up fade) */}
                      <div className="absolute inset-0 bg-slate-900/5 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20" />
                      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4 z-30 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDetailItem(item)}
                          className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-xl hover:text-orange-500 transition-colors" title="Quick Look"
                        >
                          <Eye className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!isAvailable || stats.credit < 0}
                          onClick={() => { setSelectedAsset(item); setBorrowQty(1); setShowBorrowModal(true); }}
                          className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 disabled:opacity-50 disabled:grayscale transition-all"
                        >
                          <Plus className="w-6 h-6" />
                        </motion.button>
                      </div>
                    </div>

                    {/* ข้อมูลสินค้า */}
                    <div className="px-2 flex-1 flex flex-col justify-between mb-2">
                      <div className="overflow-hidden">
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-tighter truncate group-hover:text-orange-500 transition-colors">
                          {item.electotronixPN}
                        </h3>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {item.manufacturePN && item.manufacturePN !== '-' && (
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase truncate mt-1">
                              Name: {item.manufacturePN}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 line-clamp-1 leading-relaxed overflow-hidden italic">
                            {item.value || t.na}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                          <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500'}`}></div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {isAvailable ? t.online : t.offline}
                          </span>
                        </div>
                        <div className="flex items-baseline bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors">
                          <span className="font-black text-lg text-slate-900 dark:text-white leading-none">{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚀 Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4 relative z-10">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 hover:shadow-lg hover:-translate-y-1 transition-all"><ChevronLeft size={20} /></button>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] bg-white dark:bg-slate-900/80 px-8 py-3.5 rounded-full backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 hover:shadow-lg hover:-translate-y-1 transition-all"><ChevronRight size={20} /></button>
          </div>
        )}
      </div>

      {/* 🚀 Floating Cart Button (Bouncy) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-orange-500 dark:to-amber-500 text-white p-5 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.3)] z-[100] border-4 border-white dark:border-slate-950 flex items-center justify-center group"
      >
        <ShoppingCart className="w-6 h-6" />
        <AnimatePresence>
          {cartItems.length > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg"
            >
              {cartItems.length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={id => setCartItems(c => c.filter(i => i.ID !== id))}
        onCheckoutSuccess={() => { setCartItems([]); setIsCartOpen(false); fetchData(); }}
      />

      {/* 🚀 MODAL: QUICK LOOK (Smooth Framer Motion) */}
      <AnimatePresence>
        {detailItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden relative"
            >
              <button onClick={() => setDetailItem(null)} className="absolute top-6 right-6 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-500 p-2.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"><X size={18} /></button>

              <div className="w-full md:w-1/2 p-8 sm:p-12 h-[250px] sm:h-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center relative shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05)_0%,transparent_70%)]"></div>
                {getImageUrl(detailItem.img) ? (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    src={getImageUrl(detailItem.img)}
                    className="max-h-[180px] sm:max-h-[350px] object-contain drop-shadow-2xl relative z-10"
                    alt="Item"
                  />
                ) : <ImageIcon size={60} className="opacity-10" />}
              </div>

              <div className="w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-between max-h-[60vh] md:max-h-none overflow-y-auto custom-scrollbar">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 border border-orange-200/50 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5"><Box size={10} /> {detailItem.category}</span>
                    {detailItem.subcategory && detailItem.subcategory !== '-' && (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5"><Tag size={10} /> {detailItem.subcategory}</span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none drop-shadow-sm">{detailItem.electotronixPN}</h2>

                  {detailItem.manufacturePN && detailItem.manufacturePN !== '-' && (
                    <div className="mt-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-orange-500/10 px-2 py-0.5 rounded">Common Name</span>
                      <span className="text-lg font-black tracking-tight">{detailItem.manufacturePN}</span>
                    </div>
                  )}

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Technical Specifications */}
                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Zap size={14} className="text-orange-400" /> Description & Specs</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        {detailItem.description && detailItem.description !== '-' ? detailItem.description : "No additional specifications logged for this item."}
                      </p>
                    </div>

                    {/* Stock Info */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-transparent p-5 rounded-2xl border border-orange-200/50 flex flex-col justify-center items-center text-center">
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ClipboardList size={12} /> In Stock</p>
                      <p className="text-4xl font-black text-orange-600 drop-shadow-sm leading-none">{detailItem.quantity}</p>
                    </div>

                    {/* Location Info */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center items-center text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin size={12} /> Warehouse Position</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{detailItem.position || "-"}</p>
                    </div>

                    {/* Extended Details Grid */}
                    <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Manufacturer</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{detailItem.manufacture || "-"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Footprint</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{detailItem.footprint || "-"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Price Unit</p>
                        <p className="text-xs font-black text-orange-500 truncate">฿{Number(detailItem.price || detailItem.value || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setDetailItem(null); setSelectedAsset(detailItem); setBorrowQty(1); setShowBorrowModal(true); }}
                  disabled={detailItem.quantity <= 0 || stats.credit < 0}
                  className="w-full mt-8 py-5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-slate-900/20"
                >
                  INITIATE ACQUISITION
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 MODAL: SET QUANTITY (Smooth Framer Motion) */}
      <AnimatePresence>
        {showBorrowModal && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 sm:p-10 shadow-2xl border border-slate-200/50 dark:border-slate-800"
            >
              <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 mb-2 uppercase text-center tracking-widest">Set Quantity</h3>
              <p className="text-slate-500 text-xs mb-8 text-center font-bold">{selectedAsset.electotronixPN}</p>

              <div className="relative mb-8 group">
                <input
                  type="number"
                  min="1"
                  max={selectedAsset.quantity}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] text-5xl font-black text-center outline-none text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 focus:border-orange-500 transition-colors shadow-inner"
                  value={borrowQty}
                  onChange={(e) => setBorrowQty(Number(e.target.value))}
                />
                <div className="absolute inset-0 rounded-[2rem] ring-4 ring-orange-500/0 group-focus-within:ring-orange-500/20 transition-all pointer-events-none"></div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowBorrowModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[1.5rem] transition-colors">Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmBorrow}
                  className="flex-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/30"
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// 🚀 Component ย่อยสำหรับสร้าง Dropdown List ให้เหมือนกันทุกอัน
function DropdownMenu({ options, currentValue, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 w-full mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden origin-top z-40"
    >
      <div className="p-2 max-h-[280px] overflow-y-auto custom-scrollbar">
        {options.map(opt => (
          <div key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-4 py-3.5 mb-1 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-3 ${currentValue === opt.value ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${currentValue === opt.value ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse' : 'bg-transparent'}`}></div>
            {opt.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CompactStatCard({ title, val, icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-300/60 shadow-blue-500/5",
    orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 border-orange-300/60 shadow-orange-500/5",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-300/60 shadow-emerald-500/5",
  };
  return (
    <div className={`bg-white dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border ${colors[color]} flex flex-col justify-between shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group h-32 sm:h-40`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-30 group-hover:scale-150 transition-transform duration-700 ${colors[color].split(' ')[0]}`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white dark:bg-slate-950 shadow-sm ${colors[color]}`}>{React.cloneElement(icon, { className: "w-5 h-5" })}</div>
      </div>
      <div className="relative z-10 mt-4">
        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1" title={title}>{title}</p>
        <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter" title={val}>{val}</p>
      </div>
    </div>
  );
}
