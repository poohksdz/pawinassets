// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Package, Users, Edit3, TrendingDown, RefreshCw, ArrowUpRight, Database, Lock, ChevronLeft, ChevronRight, PackagePlus, Plus, X, Image as ImageIcon, UploadCloud, FileText, Search, Eye, ClipboardList, CheckCircle, Trash2, ToggleLeft, ToggleRight, AlertTriangle, DollarSign, History, Send, Percent, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Dictionary แปลภาษาเฉพาะหน้า Admin Dashboard
const translations = {
  en: {
    pageTitle: "COMMAND CENTER",
    globalOverview: "GLOBAL OVERVIEW",
    onlineStatus: "Online",
    sysMonitorDesc: "Real-time system monitoring and tactical control interface.",
    syncing: "Syncing...",
    resyncAssets: "Resync Assets",
    totOperators: "Total Operators",
    assetDb: "Asset Database",
    activeDep: "Active Deployment",
    sysPenalties: "System Penalties",
    assetCtrl: "Asset Control",
    filterPn: "Filter Name...",
    allTypes: "All Types",
    noAssets: "No assets match.",
    personnel: "Personnel",
    filterName: "Filter Name...",
    allStatus: "All",
    clear: "Clear",
    inDebt: "In Debt",
    noOperators: "No operators found.",
    sysAuditRep: "System Audit Report",
    exportDesc: "Export master asset database and current valuations in CSV format.",
    exportMod: "Export Data Module",
    tacDepLog: "Tactical Deployment Log",
    tacDesc: "Global tracking of assets currently in field operations.",
    searchOpPn: "Search operator or P/N...",
    active: "Active",
    pendingReturn: "Pending Return",
    colOpName: "Operator Name",
    colAssetId: "Asset ID",
    colQty: "QTY",
    colDue: "Due Date",
    colExec: "Execute",
    noTacData: "No tactical data found.",
    opDep: "OPERATOR DEPLOYMENT",
    clearanceView: "Clearance View",
    noActBorrows: "No active borrows.",
    due: "Due",
    pcs: "PCS",
    closeInsp: "Close Inspection",
    addNewAsset: "Add New Asset",
    editAsset: "Edit Asset",
    browseFile: "Browse File",
    maxSize: "JPG, PNG (MAX 5MB)",
    partNum: "Item Name",
    category: "Category *",
    quantity: "Quantity *",
    valThb: "Value (฿)",
    cancel: "Cancel",
    deployAsset: "Deploy Asset",
    saveChanges: "Save Changes",
    deleteConfirm: "Are you sure you want to permanently delete",
    isLongtermLabel: "Permanent / Long-term Asset",
    isLongtermDesc: "This item requires status check-in instead of a physical return.",
    // 🚀 ฟังก์ชัน Admin ใหม่
    transHistory: "Transaction History",
    transDesc: "Financial log of all deductions and adjustments",
    forceReturn: "Force Return",
    forceReturnDesc: "Force return this item and apply penalty",
    adjustCredit: "Adjust Penalty",
    adjustCreditDesc: "Modify user penalty with a logged reason",
    clearDebtBtn: "Clear Debt",
    reason: "Reason",
    penalty: "Penalty %",
    noTransactions: "No transactions found.",
    txOverdue: "Overdue",
    txDamage: "Damage",
    txLost: "Lost",
    txAdjust: "Adjustment",
    txForce: "Force Return",
    txTotal: "Total",
    viewTrans: "Transactions",
    enterReason: "Enter reason...",
    amount: "Amount (+ or -)",
    confirm: "Confirm",
    forceReturnConfirm: "Are you sure? This action cannot be undone.",
    clearOldData: "Clear Old Data",
    clearOldDataConfirm: "Clear data older than 2 months? This action is irreversible.",
    clearOldDataSuccess: "Cleaned up old records successfully.",
    allMonths: "All Months",
    logMonthFilter: "Filter by month",
    cleanupDesc: "Removes completed borrows and transactions older than 2 months"
  },
  th: {
    pageTitle: "ศูนย์บัญชาการ",
    globalOverview: "ภาพรวมระบบ",
    onlineStatus: "ออนไลน์",
    sysMonitorDesc: "ระบบตรวจสอบและควบคุมการทำงานแบบเรียลไทม์",
    syncing: "กำลังซิงค์...",
    resyncAssets: "รีซิงค์ข้อมูล",
    totOperators: "พนักงานทั้งหมด",
    assetDb: "จำนวนอุปกรณ์",
    activeDep: "กำลังถูกใช้งาน",
    sysPenalties: "ค่าปรับสะสม",
    assetCtrl: "จัดการอุปกรณ์",
    filterPn: "ค้นหาชื่อ...",
    allTypes: "ทุกประเภท",
    noAssets: "ไม่พบอุปกรณ์",
    personnel: "จัดการพนักงาน",
    filterName: "ค้นหาชื่อ...",
    allStatus: "ทั้งหมด",
    clear: "ปกติ",
    inDebt: "ติดหนี้",
    noOperators: "ไม่พบพนักงาน",
    sysAuditRep: "รายงานระบบ",
    exportDesc: "ส่งออกข้อมูลอุปกรณ์และมูลค่าทั้งหมดในรูปแบบไฟล์ CSV",
    exportMod: "ส่งออกข้อมูล",
    tacDepLog: "รายการที่ถูกเบิกใช้งาน",
    tacDesc: "ติดตามอุปกรณ์ทั้งหมดที่กำลังถูกเบิกใช้งานอยู่ในขณะนี้",
    searchOpPn: "ค้นหาผู้ยืม หรือ P/N...",
    active: "กำลังยืม",
    pendingReturn: "รอตรวจสอบคืน",
    colOpName: "ชื่อผู้ทำรายการ",
    colAssetId: "รหัสอุปกรณ์",
    colQty: "จำนวน",
    colDue: "กำหนดคืน",
    colExec: "คำสั่ง",
    noTacData: "ไม่มีรายการเบิกของ",
    opDep: "รายการเบิกของพนักงาน",
    clearanceView: "มุมมองผู้ดูแลระบบ",
    noActBorrows: "ไม่มีรายการค้างคืน",
    due: "กำหนด:",
    pcs: "ชิ้น",
    closeInsp: "ปิดหน้าต่าง",
    addNewAsset: "เพิ่มอุปกรณ์ใหม่",
    editAsset: "แก้ไขข้อมูลอุปกรณ์",
    browseFile: "เลือกไฟล์",
    maxSize: "JPG, PNG (ไม่เกิน 5MB)",
    partNum: "ชื่อรายการสินค้า",
    category: "หมวดหมู่ *",
    quantity: "จำนวน *",
    valThb: "มูลค่า (บาท)",
    cancel: "ยกเลิก",
    deployAsset: "เพิ่มข้อมูล",
    saveChanges: "บันทึกข้อมูล",
    deleteConfirm: "คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้อย่างถาวร:",
    isLongtermLabel: "อุปกรณ์ประจำตำแหน่ง (ระยะยาว)",
    isLongtermDesc: "อุปกรณ์ชิ้นนี้จะไม่ระบุวันคืน แต่จะใช้ระบบรายงานสถานะแทน",
    // 🚀 ฟังก์ชัน Admin ใหม่
    transHistory: "ประวัติธุรกรรม",
    transDesc: "บันทึกการหักเงินและปรับเครดิตทั้งหมด",
    forceReturn: "บังคับคืน",
    forceReturnDesc: "บังคับคืนอุปกรณ์พร้อมหักเงิน",
    adjustCredit: "จัดการค่าปรับ",
    adjustCreditDesc: "ปรับเพิ่มลดค่าปรับพร้อมบันทึกเหตุผล",
    clearDebtBtn: "ล้างค่าปรับ",
    reason: "เหตุผล",
    penalty: "ค่าปรับ %",
    noTransactions: "ไม่มีรายการธุรกรรม",
    txOverdue: "ล่าช้า",
    txDamage: "ชำรุด",
    txLost: "สูญหาย",
    txAdjust: "ลด/เพิ่มค่าปรับ",
    txForce: "บังคับคืน",
    txTotal: "รวม",
    viewTrans: "ธุรกรรม",
    enterReason: "ระบุเหตุผล...",
    amount: "จำนวนเงิน (+ หรือ -)",
    confirm: "ยืนยัน",
    forceReturnConfirm: "คุณแน่ใจหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
    clearOldData: "ลบข้อมูลเก่า (>2 เดือน)",
    clearOldDataConfirm: "ระวัง: การลบข้อมูลประวัติการยืม (ที่คืนแล้ว) และธุรกรรมที่เก่ากว่า 2 เดือนจะไม่สามารถกู้คืนได้ ยืนยันหรือไม่?",
    clearOldDataSuccess: "เคลียร์ข้อมูลเก่าเรียบร้อยแล้ว",
    allMonths: "ทุกเดือน",
    logMonthFilter: "กรองตามเดือน",
    cleanupDesc: "ลบข้อมูลการยืม (ที่คืนแล้ว) และธุรกรรมที่เก่ากว่า 2 เดือน"
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalAssets: 0, borrowedItems: 0, penalties: 0 });
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [assetSearch, setAssetSearch] = useState('');
  const [assetCategory, setAssetCategory] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [borrowSearch, setBorrowSearch] = useState('');
  const [borrowStatus, setBorrowStatus] = useState('');
  const [borrowMonth, setBorrowMonth] = useState('');
  const [borrowPage, setBorrowPage] = useState(1);
  const borrowItemsPerPage = 6;

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [selectedUserDeployment, setSelectedUserDeployment] = useState(null);
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);

  const [assetPage, setAssetPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 4;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 🚀 เพิ่ม is_longterm ใน State เริ่มต้น
  const [newAsset, setNewAsset] = useState({
    electotronixPN: '', value: '', description: '', category: '',
    subcategory: '', quantity: 1, manufacture: '', manufacturePN: '', position: '', footprint: '',
    is_longterm: false
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);

  // 🚀 State สำหรับฟังก์ชัน Admin ใหม่
  const [transactions, setTransactions] = useState([]);
  const [transSummary, setTransSummary] = useState({});
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [isForceReturnModalOpen, setIsForceReturnModalOpen] = useState(false);
  const [forceReturnTarget, setForceReturnTarget] = useState(null);
  const [forceReturnReason, setForceReturnReason] = useState('');
  const [forceReturnPercent, setForceReturnPercent] = useState(100);
  const [isAdjustCreditModalOpen, setIsAdjustCreditModalOpen] = useState(false);
  const [adjustCreditTarget, setAdjustCreditTarget] = useState(null);
  const [adjustCreditAmount, setAdjustCreditAmount] = useState('');
  const [adjustCreditReason, setAdjustCreditReason] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];

  // 🚀 Set Global Title
  const { setTitle } = useOutletContext();
  useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

  useEffect(() => {
    const checkLang = setInterval(() => {
      const currentLang = localStorage.getItem('lang') || 'en';
      if (currentLang !== lang) setLang(currentLang);
    }, 300);
    return () => clearInterval(checkLang);
  }, [lang]);

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    const cleanPath = String(imgPath).trim().toLowerCase();
    const invalid = ['', 'null', '-', '/', 'undefined', 'no-image'];
    if (invalid.includes(cleanPath)) return null;
    if (imgPath.startsWith('http')) return imgPath;
    if (imgPath.startsWith('/')) return `${imgPath}`;
    return `/${imgPath}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo?.user?.isAdmin) return navigate('/dashboard');

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const [statsRes, prodRes, userRes, borrowRes] = await Promise.all([
        axios.get('/api/admin/stats', config),
        axios.get('/api/assets', config),
        axios.get('/api/admin/users', config),
        axios.get('/api/admin/active-borrows', config)
      ]);

      setStats(statsRes.data);
      setProducts(prodRes.data);
      setUsers(userRes.data);
      setActiveBorrows(borrowRes.data || []);
    } catch (error) {
      toast.error('DATABASE_SYNC_ERROR: Data Retrieval Failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const uniqueCategories = [...new Set(products.map(item => item.category).filter(Boolean))];

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchSearch = p.electotronixPN.toLowerCase().includes(assetSearch.toLowerCase());
        const matchCategory = assetCategory === '' || p.category === assetCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        const scoreA = (getImageUrl(a.img) && a.fileExists !== false) ? 1 : 0;
        const scoreB = (getImageUrl(b.img) && b.fileExists !== false) ? 1 : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.ID - a.ID;
      });
  }, [products, assetSearch, assetCategory]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
      let matchStatus = true;
      if (userStatus === 'DEBT') matchStatus = u.penalty > 0;
      if (userStatus === 'CLEAR') matchStatus = u.penalty <= 0;
      return matchSearch && matchStatus;
    });
  }, [users, userSearch, userStatus]);

  // 🚀 สร้างรายการเดือนจากข้อมูล borrow จริง
  const borrowMonthOptions = useMemo(() => {
    const monthSet = new Set();
    activeBorrows.forEach(b => {
      if (b.due_date) {
        const d = new Date(b.due_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(key);
      }
    });
    return [...monthSet].sort().reverse().map(key => {
      const [y, m] = key.split('-');
      const d = new Date(Number(y), Number(m) - 1);
      return {
        value: key,
        label: d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { month: 'long', year: 'numeric' })
      };
    });
  }, [activeBorrows, lang]);

  const filteredBorrows = useMemo(() => {
    return activeBorrows.filter(b => {
      const matchSearch = b.operator_name.toLowerCase().includes(borrowSearch.toLowerCase()) ||
        b.electotronixPN.toLowerCase().includes(borrowSearch.toLowerCase());
      const matchStatus = borrowStatus === '' || b.status === borrowStatus;
      // 🚀 กรองตามเดือน
      let matchMonth = true;
      if (borrowMonth) {
        const d = new Date(b.due_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchMonth = key === borrowMonth;
      }
      return matchSearch && matchStatus && matchMonth;
    });
  }, [activeBorrows, borrowSearch, borrowStatus, borrowMonth]);

  const handleViewUserDeployment = async (user) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get(`/api/admin/user-borrows/${user._id}`, config);
      setSelectedUserDeployment({ ...user, items: data });
      setIsDepModalOpen(true);
    } catch (err) {
      toast.error('Failed to load deployment details.');
    }
  };

  const handleApproveReturn = async (borrowId, assetName, qty) => {
    if (!window.confirm(`[SYSTEM CONFIRM] Approve return of ${qty}x ${assetName} and restock?`)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      await axios.put('/api/admin/approve-return', { borrowId }, config);

      toast.success(`RESTOCK COMPLETED: ${assetName} (+${qty})`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ERROR: Failed to process return.');
    }
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["PN,Category,Quantity,Price"].join(",") + "\n"
      + products.map(p => `${p.electotronixPN},${p.category},${p.quantity},${p.price}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pawin_assets_report.csv");
    document.body.appendChild(link);
    link.click();
    toast.success('REPORT_READY: CSV file downloaded.');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      let imageUrlPath = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await axios.post('/api/upload', formData, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        imageUrlPath = data.image;
      }
      await axios.post('/api/assets', { ...newAsset, img: imageUrlPath }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      toast.success('ASSET_DEPLOYED_SUCCESS');
      setIsAddModalOpen(false);
      setImageFile(null); setImagePreview(null);
      // เคลียร์ฟอร์ม
      setNewAsset({
        electotronixPN: '', value: '', description: '', category: '',
        subcategory: '', quantity: 1, manufacture: '', manufacturePN: '', position: '', footprint: '',
        is_longterm: false
      });
      fetchData();
    } catch (error) { toast.error('DEPLOYMENT_FAILED'); } finally { setIsUploading(false); }
  };

  // เปิดหน้าต่างแก้ไขข้อมูล (ดึงข้อมูลเก่ามาใส่ฟอร์ม)
  const openEditModal = (asset) => {
    // 🚀 เซ็ตค่าเริ่มต้น (อ่านราคาจาก price ไม่ใช่ value เพราะ value เป็นคอลัมน์เก่า)
    setEditAssetData({
      ...asset,
      value: asset.price || asset.value || 0,
      is_longterm: asset.is_longterm === 1 || asset.is_longterm === true
    });
    setImagePreview(getImageUrl(asset.img));
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  // ส่งข้อมูลที่แก้ไขไปบันทึก
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      let imageUrlPath = editAssetData.img;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await axios.post('/api/upload', formData, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        imageUrlPath = data.image;
      }

      await axios.put(`/api/assets/${editAssetData.ID}`, { ...editAssetData, img: imageUrlPath }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      toast.success('ASSET_UPDATED_SUCCESS');
      setIsEditModalOpen(false);
      setImageFile(null); setImagePreview(null);
      fetchData();
    } catch (error) { toast.error('UPDATE_FAILED'); } finally { setIsUploading(false); }
  };

  const handleDeleteAsset = async (id, name) => {
    if (!window.confirm(`${t.deleteConfirm} ${name}?`)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.delete(`/api/assets/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      toast.success('ASSET_DELETED_SUCCESS');
      fetchData();
    } catch (error) {
      toast.error('DELETE_FAILED');
    }
  };

  const paginatedBorrows = useMemo(() => {
    const start = (borrowPage - 1) * borrowItemsPerPage;
    return filteredBorrows.slice(start, start + borrowItemsPerPage);
  }, [filteredBorrows, borrowPage]);

  const totalBorrowPages = Math.ceil(filteredBorrows.length / borrowItemsPerPage) || 1;

  const handleEditQuantity = async (id, currentQty, name) => {
    const newQty = window.prompt(`ENTER NEW STOCK QUANTITY FOR: ${name}`, currentQty);
    if (newQty === null || isNaN(newQty)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await axios.put(`/api/admin/product-quantity`, { productId: id, newQuantity: Number(newQty) }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      toast.success('INVENTORY_UPDATED');
      fetchData();
    } catch (err) { toast.error('ERROR: Stock update failed.'); }
  };

  const handleEditCredit = (user) => {
    setAdjustCreditTarget(user);
    setAdjustCreditAmount('');
    setAdjustCreditReason('');
    setIsAdjustCreditModalOpen(true);
  };

  const submitAdjustCredit = async () => {
    if (!adjustCreditAmount || isNaN(adjustCreditAmount)) return toast.warn('Please enter a valid amount');
    if (!adjustCreditReason.trim()) return toast.warn('Please enter a reason');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('/api/admin/adjust-credit', {
        userId: adjustCreditTarget._id,
        amount: Number(adjustCreditAmount),
        reason: adjustCreditReason
      }, config);
      toast.success('CREDIT_ADJUSTED_SUCCESS');
      setIsAdjustCreditModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'ERROR: Credit adjustment failed.'); }
  };

  // 🚀 ดึงประวัติธุรกรรม
  const fetchTransactions = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/admin/transactions?limit=100', config);
      setTransactions(data.transactions || []);
      setTransSummary(data.summary || {});
      setIsTransModalOpen(true);
    } catch (err) { toast.error('Failed to load transactions'); }
  };

  // 🚀 เปิด modal บังคับคืน
  const openForceReturn = (borrow) => {
    setForceReturnTarget(borrow);
    setForceReturnReason('');
    setForceReturnPercent(100);
    setIsForceReturnModalOpen(true);
  };

  const submitForceReturn = async () => {
    if (!forceReturnReason.trim()) return toast.warn('Please enter a reason');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post('/api/admin/force-return', {
        borrowId: forceReturnTarget.borrow_id,
        reason: forceReturnReason,
        penaltyPercent: forceReturnPercent
      }, config);
      toast.success(`FORCE_RETURN: ${forceReturnTarget.electotronixPN} | Penalty: ฿${data.penalty?.toLocaleString() || 0}`);
      setIsForceReturnModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'ERROR: Force return failed.'); }
  };

  // 🚀 ลบข้อมูลเก่า
  const handleCleanupOldData = async () => {
    if (!window.confirm(t.clearOldDataConfirm)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.delete('/api/admin/cleanup', config);
      toast.success(`${t.clearOldDataSuccess} (Borrows: ${data.deletedBorrows}, TXs: ${data.deletedTransactions})`);
      fetchData(); // resync all data
      if (isTransModalOpen) fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ERROR: Cleanup failed.');
    }
  };

  const paginatedAssets = filteredProducts.slice((assetPage - 1) * itemsPerPage, assetPage * itemsPerPage);
  const totalAssetPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {t.globalOverview}
            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {t.onlineStatus}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">{t.sysMonitorDesc}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchData}
          disabled={loading}
          className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-600 dark:text-slate-300 hover:text-orange-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} /> {loading ? t.syncing : t.resyncAssets}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <StatCard title={t.totOperators} value={stats?.totalUsers || 0} icon={<Users />} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-500/10" border="border-purple-200 dark:border-purple-500/20" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <StatCard title={t.assetDb} value={stats?.totalAssets || 0} icon={<Package />} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" border="border-blue-200 dark:border-blue-500/20" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <StatCard title={t.activeDep} value={stats?.borrowedItems || 0} icon={<ArrowUpRight />} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-500/10" border="border-orange-200 dark:border-orange-500/20" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <StatCard title={t.sysPenalties} value={`฿${Number(stats?.penalties || 0).toLocaleString()}`} icon={<TrendingDown />} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-500/10" border="border-red-200 dark:border-red-500/20" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asset Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl flex flex-col h-[500px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Database size={16} className="text-orange-500" /> {t.assetCtrl}</h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setImagePreview(null); setIsAddModalOpen(true); }} className="p-1.5 bg-orange-500 text-white dark:text-slate-950 rounded-lg hover:bg-orange-600 transition-all"><Plus size={16} /></motion.button>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input type="text" placeholder={t.filterPn} value={assetSearch} onChange={(e) => { setAssetSearch(e.target.value); setAssetPage(1); }} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors" />
                </div>
                <select value={assetCategory} onChange={(e) => { setAssetCategory(e.target.value); setAssetPage(1); }} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-2 py-2 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 focus:border-orange-500 outline-none w-28 custom-scrollbar">
                  <option value="">{t.allTypes}</option>
                  {uniqueCategories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {paginatedAssets.length === 0 && <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 font-bold uppercase tracking-widest">{t.noAssets}</p>}
                <AnimatePresence mode="popLayout">
                  {paginatedAssets.map((p, index) => {
                    const validImg = getImageUrl(p.img);
                    const hasImage = validImg && p.fileExists !== false;

                    return (
                      <motion.div
                        key={p.ID}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 hover:border-orange-300 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {hasImage ? <img src={validImg} alt="" className="w-full h-full object-cover" /> : <Package size={16} className="text-slate-400 dark:text-slate-600" />}
                          </div>
                          <div className="overflow-hidden flex flex-col gap-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{p.electotronixPN}</p>
                            {p.manufacturePN && p.manufacturePN !== '-' && (
                              <p className="text-[9px] text-orange-600 dark:text-orange-400 font-black uppercase truncate">Name: {p.manufacturePN}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEditQuantity(p.ID, p.quantity, p.electotronixPN)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors" title="Quick Update Stock"><PackagePlus size={12} /></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEditModal(p)} className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-600 dark:hover:bg-orange-500 hover:text-white transition-colors" title="Edit Item Details"><Edit3 size={12} /></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteAsset(p.ID, p.electotronixPN)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-colors" title="Delete Item"><Trash2 size={12} /></motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                <button onClick={() => setAssetPage(prev => Math.max(prev - 1, 1))} disabled={assetPage === 1} className="disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span>{assetPage} / {totalAssetPages}</span>
                <button onClick={() => setAssetPage(prev => Math.min(prev + 1, totalAssetPages))} disabled={assetPage === totalAssetPages} className="disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </motion.div>

            {/* Personnel Clearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl flex flex-col h-[500px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Lock size={16} className="text-orange-500" /> {t.personnel}</h2>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input type="text" placeholder={t.filterName} value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors" />
                </div>
                <select value={userStatus} onChange={(e) => { setUserStatus(e.target.value); setUserPage(1); }} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-2 py-2 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 focus:border-orange-500 outline-none w-24">
                  <option value="">{t.allStatus}</option>
                  <option value="CLEAR">{t.clear}</option>
                  <option value="DEBT">{t.inDebt}</option>
                </select>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                {paginatedUsers.length === 0 && <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 font-bold uppercase tracking-widest">{t.noOperators}</p>}
                <AnimatePresence mode="popLayout">
                  {paginatedUsers.map((u, index) => {
                    return (
                      <motion.div
                        key={u._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 transition-all shadow-sm"
                      >
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{u.name}</p>
                          <p className={`text-[10px] font-black uppercase ${u.penalty > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>ค่าปรับ: ฿{Number(u.penalty || 0).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleViewUserDeployment(u)} className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-colors" title="View Active Borrows"><Eye size={12} /></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEditCredit(u)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-orange-500 hover:text-white transition-colors"><Edit3 size={12} /></motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                <button onClick={() => setUserPage(prev => Math.max(prev - 1, 1))} disabled={userPage === 1} className="disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span>{userPage} / {totalUserPages}</span>
                <button onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))} disabled={userPage === totalUserPages} className="disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="xl:col-span-4"
        >
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center text-center sticky top-8">
            <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center mb-6 shadow-sm">
              <FileText size={32} className="text-slate-600 dark:text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{t.sysAuditRep}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">{t.exportDesc}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportData}
              className="w-full bg-white dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-orange-500 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-orange-400 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm group"
            >
              <ArrowUpRight size={18} className="text-orange-500 dark:group-hover:text-slate-950" /> {t.exportMod}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchTransactions}
              className="w-full bg-white dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-purple-500 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-purple-400 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm group mt-3"
            >
              <History size={18} className="text-purple-500 dark:group-hover:text-slate-950" /> {t.viewTrans}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* GLOBAL DEPLOYMENT MONITOR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 p-8 shadow-xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight transition-colors duration-300">
              <ClipboardList className="text-orange-500" /> {t.tacDepLog}
            </h2>
            <p className="text-slate-500 dark:text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest transition-colors duration-300">{t.tacDesc}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCleanupOldData}
            className="group flex items-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-500 hover:border-red-500 text-red-600 dark:text-red-400 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm shrink-0"
            title={t.cleanupDesc}
          >
            <Trash2 size={14} /> {t.clearOldData}
          </motion.button>
        </div>

        {/* 🚀 Filters Row: Search + Status + Month */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 relative">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder={t.searchOpPn}
              value={borrowSearch}
              onChange={(e) => {
                setBorrowSearch(e.target.value);
                setBorrowPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm dark:shadow-inner"
            />
          </div>

          {/* Custom Status Dropdown */}
          <div className="relative w-full sm:w-48 group">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowMonthDropdown(false);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs uppercase font-black text-slate-700 dark:text-slate-300 flex items-center justify-between hover:border-orange-500/50 transition-all shadow-sm"
            >
              <span className="flex items-center gap-2">
                <ToggleRight size={14} className="text-orange-500" />
                {borrowStatus === '' ? t.allStatus : (borrowStatus === 'active' ? t.active : t.pendingReturn)}
              </span>
              <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${showStatusDropdown ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showStatusDropdown && (
                <DropdownMenu
                  options={[
                    { value: '', label: t.allStatus },
                    { value: 'active', label: t.active },
                    { value: 'pending_return', label: t.pendingReturn }
                  ]}
                  currentValue={borrowStatus}
                  onSelect={(val) => {
                    setBorrowStatus(val);
                    setBorrowPage(1);
                    setShowStatusDropdown(false);
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Custom Month Dropdown */}
          <div className="relative w-full sm:w-56">
            <button
              onClick={() => {
                setShowMonthDropdown(!showMonthDropdown);
                setShowStatusDropdown(false);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs uppercase font-black text-slate-700 dark:text-slate-300 flex items-center justify-between hover:border-orange-500/50 transition-all shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-orange-500" />
                {borrowMonth === '' ? t.allMonths : borrowMonthOptions.find(o => o.value === borrowMonth)?.label}
              </span>
              <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${showMonthDropdown ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showMonthDropdown && (
                <DropdownMenu
                  options={[{ value: '', label: t.allMonths }, ...borrowMonthOptions]}
                  currentValue={borrowMonth}
                  onSelect={(val) => {
                    setBorrowMonth(val);
                    setBorrowPage(1);
                    setShowMonthDropdown(false);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Closing dropdowns when clicking outside */}
        {(showStatusDropdown || showMonthDropdown) && (
          <div className="fixed inset-0 z-30" onClick={() => { setShowStatusDropdown(false); setShowMonthDropdown(false); }}></div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <tr>
                <th className="pb-4 px-4">{t.colOpName}</th>
                <th className="pb-4 px-4">{t.colAssetId}</th>
                <th className="pb-4 px-4 text-center">{t.colQty}</th>
                <th className="pb-4 px-4">{t.colDue}</th>
                <th className="pb-4 px-4 text-right">{t.colExec}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedBorrows.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-600 font-bold uppercase text-xs">{t.noTacData}</td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedBorrows.map((b, index) => {
                    return (
                      <motion.tr
                        key={b.borrow_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-5 px-4 font-bold text-slate-800 dark:text-slate-200">{b.operator_name}</td>
                        <td className="py-5 px-4">
                          <p className="font-black text-orange-600 dark:text-orange-400 text-sm">{b.electotronixPN}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase">{b.category}</p>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <span className="bg-white dark:bg-slate-950 px-3 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 font-black text-slate-900 dark:text-white text-xs shadow-sm">{b.quantity}</span>
                        </td>
                        <td className="py-5 px-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {new Date(b.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                        </td>
                        <td className="py-5 px-4 text-right flex justify-end gap-3 items-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${b.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20'}`}>{b.status === 'active' ? t.active : t.pendingReturn}</span>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleApproveReturn(b.borrow_id, b.electotronixPN, b.quantity)}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            title="Approve Return & Restock"
                          >
                            <CheckCircle size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openForceReturn(b)}
                            className="p-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title={t.forceReturn}
                          >
                            <AlertTriangle size={16} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedBorrows.length === 0 ? (
            <p className="py-12 text-center text-slate-400 font-bold uppercase text-xs">{t.noTacData}</p>
          ) : (
            paginatedBorrows.map((b, index) => {
              const delayClass = `animate-fade-in-up-${(index % 3) + 1}`;
              return (
                <div key={b.borrow_id} className={`bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm ${delayClass} overflow-hidden`}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-orange-600 dark:text-orange-400 text-sm tracking-tight truncate" title={b.electotronixPN}>{b.electotronixPN}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{b.operator_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0 ${b.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 border-emerald-300' : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 border-orange-300'}`}>
                      {b.status === 'active' ? t.active : t.pendingReturn}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.colQty}</span>
                      <span className="font-black text-slate-900 dark:text-white">{b.quantity} pcs</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.colDue}</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {new Date(b.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReturn(b.borrow_id, b.electotronixPN, b.quantity)}
                      className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => openForceReturn(b)}
                      className="flex-1 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-red-200 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={14} /> {t.forceReturn}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 🚀 Pagination Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {t.showing || 'Showing'} <span className="text-slate-900 dark:text-white">{paginatedBorrows.length}</span> / {filteredBorrows.length} {t.results || 'records'}
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBorrowPage(prev => Math.max(prev - 1, 1))}
              disabled={borrowPage === 1}
              className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <div className="flex items-center gap-1">
              {[...Array(totalBorrowPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBorrowPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${borrowPage === i + 1 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-orange-500'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBorrowPage(prev => Math.min(prev + 1, totalBorrowPages))}
              disabled={borrowPage === totalBorrowPages}
              className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* MODAL: รายละเอียดการยืมของพนักงาน */}
      {isDepModalOpen && selectedUserDeployment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 dark:bg-black/90 backdrop-blur-md dark:backdrop-blur-lg p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden flex flex-col shadow-2xl transition-colors duration-300">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight transition-colors duration-300"><Eye className="text-purple-600 dark:text-purple-500" /> {t.opDep}</h2>
                <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{selectedUserDeployment.name} {t.clearanceView}</p>
              </div>
              <button onClick={() => setIsDepModalOpen(false)} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-2 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[50vh] custom-scrollbar space-y-4">
              {selectedUserDeployment.items.length === 0 ? (
                <p className="text-center py-8 text-slate-500 dark:text-slate-600 font-bold uppercase text-xs">{t.noActBorrows}</p>
              ) : (
                selectedUserDeployment.items.map((item, idx) => {
                  const validImg = getImageUrl(item.img);
                  const hasImage = validImg && item.fileExists !== false;

                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                          {hasImage ? <img src={validImg} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Package size={18} className="text-slate-400 dark:text-slate-500" />}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-black text-sm transition-colors duration-300">{item.electotronixPN}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase mt-0.5">{t.due}: {new Date(item.due_date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-black text-orange-600 dark:text-orange-400 text-lg">{item.quantity} <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.pcs}</span></p>
                        <button
                          onClick={() => {
                            setIsDepModalOpen(false);
                            handleApproveReturn(item.borrow_id, item.electotronixPN, item.quantity);
                          }}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Approve Return"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <button onClick={() => setIsDepModalOpen(false)} className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shadow-sm dark:shadow-none">{t.closeInsp}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: เพิ่มสินค้าใหม่ (รวมสวิตช์ is_longterm) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl transition-colors duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><PackagePlus size={20} className="text-orange-500" /> {t.addNewAsset}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="add-asset-form" onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* 🚀 สวิตช์ตั้งค่า Long-term */}
                <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex justify-between items-center cursor-pointer" onClick={() => setNewAsset({ ...newAsset, is_longterm: !newAsset.is_longterm })}>
                  <div>
                    <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t.isLongtermLabel}</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t.isLongtermDesc}</p>
                  </div>
                  <div>
                    {newAsset.is_longterm ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />}
                  </div>
                </div>

                <div className="md:col-span-2 mb-2">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-4 transition-colors duration-300">
                    <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                      {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2 shadow-sm dark:shadow-none"><UploadCloud size={16} /> {t.browseFile}</label>
                      <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-2">{t.maxSize}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.colAssetId} (Electotronix PN)</label>
                  <input required type="text" value={newAsset.electotronixPN} onChange={(e) => setNewAsset({ ...newAsset, electotronixPN: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.partNum} (Description Name)</label>
                  <input type="text" value={newAsset.manufacturePN} onChange={(e) => setNewAsset({ ...newAsset, manufacturePN: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.category}</label>
                  <input required type="text" value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.quantity}</label>
                  <input required type="number" value={newAsset.quantity} onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.valThb}</label>
                  <input type="number" step="0.01" value={newAsset.value} onChange={(e) => setNewAsset({ ...newAsset, value: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 transition-colors duration-300">
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase px-6 hover:text-slate-900 dark:hover:text-white transition-colors">{t.cancel}</button>
              <button type="submit" form="add-asset-form" disabled={isUploading} className="bg-orange-500 text-white dark:text-slate-950 px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-orange-600 dark:hover:bg-orange-400 active:scale-95 transition-all shadow-md dark:shadow-none">
                {isUploading ? t.syncing : t.deployAsset}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: แก้ไขข้อมูลอุปกรณ์ (รวมสวิตช์ is_longterm) */}
      {isEditModalOpen && editAssetData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl transition-colors duration-300">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><Edit3 size={20} className="text-orange-500" /> {t.editAsset}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="edit-asset-form" onSubmit={handleUpdateAsset} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* 🚀 สวิตช์ตั้งค่า Long-term */}
                <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex justify-between items-center cursor-pointer" onClick={() => setEditAssetData({ ...editAssetData, is_longterm: !editAssetData.is_longterm })}>
                  <div>
                    <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t.isLongtermLabel}</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t.isLongtermDesc}</p>
                  </div>
                  <div>
                    {editAssetData.is_longterm ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />}
                  </div>
                </div>

                <div className="md:col-span-2 mb-2">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-4 transition-colors duration-300">
                    <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm dark:shadow-none">
                      {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="edit-image-upload" />
                      <label htmlFor="edit-image-upload" className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2 shadow-sm dark:shadow-none"><UploadCloud size={16} /> {t.browseFile}</label>
                      <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-2">{t.maxSize}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.colAssetId} (Electotronix PN)</label>
                  <input required type="text" value={editAssetData.electotronixPN} onChange={(e) => setEditAssetData({ ...editAssetData, electotronixPN: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.partNum} (Description Name)</label>
                  <input type="text" value={editAssetData.manufacturePN} onChange={(e) => setEditAssetData({ ...editAssetData, manufacturePN: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.category}</label>
                  <input required type="text" value={editAssetData.category} onChange={(e) => setEditAssetData({ ...editAssetData, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.quantity}</label>
                  <input required type="number" value={editAssetData.quantity} onChange={(e) => setEditAssetData({ ...editAssetData, quantity: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase">{t.valThb}</label>
                  <input type="number" step="0.01" value={editAssetData.value} onChange={(e) => setEditAssetData({ ...editAssetData, value: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition-colors duration-300 shadow-sm dark:shadow-none" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 transition-colors duration-300">
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase px-6 hover:text-slate-900 dark:hover:text-white transition-colors">{t.cancel}</button>
              <button type="submit" form="edit-asset-form" disabled={isUploading} className="bg-orange-500 text-white dark:text-slate-950 px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-orange-600 dark:hover:bg-orange-400 active:scale-95 transition-all shadow-md dark:shadow-none">
                {isUploading ? t.syncing : t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: ประวัติธุรกรรม (Transaction History) */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 dark:bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl max-h-[85vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><History size={20} className="text-purple-500" /> {t.transHistory}</h2>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{t.transDesc}</p>
              </div>
              <button onClick={() => setIsTransModalOpen(false)} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
            </div>

            {/* Summary Cards */}
            <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[{ label: t.txOverdue, val: transSummary.totalOverdue, color: 'text-orange-600' },
              { label: t.txDamage, val: transSummary.totalDamage, color: 'text-yellow-600' },
              { label: t.txLost, val: transSummary.totalLost, color: 'text-red-600' },
              { label: t.txForce, val: transSummary.totalForceReturn, color: 'text-purple-600' },
              { label: t.txTotal, val: transSummary.grandTotal, color: 'text-slate-900 dark:text-white' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className={`text-sm font-black ${s.color}`}>฿{Number(s.val || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-2">
              {transactions.length === 0 ? (
                <p className="text-center py-8 text-slate-500 font-bold uppercase text-xs">{t.noTransactions}</p>
              ) : (
                transactions.map((tx) => {
                  const typeColors = {
                    overdue_penalty: 'bg-orange-100 text-orange-600 border-orange-200',
                    damage_fee: 'bg-yellow-100 text-yellow-600 border-yellow-200',
                    lost_fee: 'bg-red-100 text-red-600 border-red-200',
                    credit_adjustment: 'bg-blue-100 text-blue-600 border-blue-200',
                    force_return: 'bg-purple-100 text-purple-600 border-purple-200',
                  };
                  const typeLabels = { overdue_penalty: t.txOverdue, damage_fee: t.txDamage, lost_fee: t.txLost, credit_adjustment: t.txAdjust, force_return: t.txForce };
                  return (
                    <div key={tx.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${typeColors[tx.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{typeLabels[tx.type] || tx.type}</span>
                          <span className="text-[9px] font-bold text-slate-400">{tx.userName}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 truncate">{tx.description}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{new Date(tx.created_at).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB')}</p>
                      </div>
                      <span className="text-sm font-black text-red-600 dark:text-red-400 shrink-0">฿{Number(tx.amount).toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-3">
              <button onClick={handleCleanupOldData} className="py-3 px-6 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0">
                <Trash2 size={14} className="inline mr-1 mb-0.5" /> {t.clearOldData}
              </button>
              <button onClick={() => setIsTransModalOpen(false)} className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">{t.closeInsp}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: บังคับคืน (Force Return) */}
      {isForceReturnModalOpen && forceReturnTarget && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 dark:bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-950/20">
              <div>
                <h2 className="text-sm sm:text-lg font-black text-red-600 dark:text-red-400 flex items-center gap-2 uppercase tracking-widest truncate"><AlertTriangle size={20} className="shrink-0" /> {t.forceReturn}</h2>
                <p className="text-[10px] text-slate-500 font-bold mt-1 truncate">{forceReturnTarget.operator_name} — {forceReturnTarget.electotronixPN} (x{forceReturnTarget.quantity})</p>
              </div>
              <button onClick={() => setIsForceReturnModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.penalty}</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={forceReturnPercent} onChange={(e) => setForceReturnPercent(Number(e.target.value))} className="flex-1 accent-red-500" />
                  <span className="text-lg font-black text-red-600 min-w-[4rem] text-right">{forceReturnPercent}%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">≈ ฿{Math.round((Number(forceReturnTarget.productPrice || forceReturnTarget.price || 0) * forceReturnTarget.quantity * forceReturnPercent / 100)).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.reason} *</label>
                <textarea value={forceReturnReason} onChange={(e) => setForceReturnReason(e.target.value)} placeholder={t.enterReason} rows={3} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-red-500 outline-none resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={() => setIsForceReturnModalOpen(false)} className="text-slate-500 text-xs font-black uppercase px-6 hover:text-slate-900 dark:hover:text-white transition-colors">{t.cancel}</button>
              <button onClick={submitForceReturn} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-red-700 active:scale-95 transition-all shadow-md flex items-center gap-2"><AlertTriangle size={14} /> {t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL: ปรับเครดิต (Adjust Credit) */}
      {isAdjustCreditModalOpen && adjustCreditTarget && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 dark:bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-lg font-black text-blue-600 dark:text-blue-400 flex items-center gap-2 uppercase tracking-widest truncate"><DollarSign size={20} className="shrink-0" /> {t.adjustCredit}</h2>
                <p className="text-[10px] text-slate-500 font-bold mt-1 truncate">{adjustCreditTarget.name} | ค่าปรับค้างชำระ: ฿{Number(adjustCreditTarget.penalty || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setIsAdjustCreditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-2"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">{t.amount}</label>
                  {Number(adjustCreditTarget.penalty) > 0 && (
                    <button
                      onClick={() => {
                        setAdjustCreditAmount(`-${Number(adjustCreditTarget.penalty)}`);
                        setAdjustCreditReason('ชำระล้างค่าปรับทั้งหมดเรียบร้อยแล้ว');
                      }}
                      className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 hover:bg-emerald-200 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    >
                      {t.clearDebtBtn}
                    </button>
                  )}
                </div>
                <input type="number" value={adjustCreditAmount} onChange={(e) => setAdjustCreditAmount(e.target.value)} placeholder="e.g. +500 (เพิ่มค่าปรับ) or -200 (ลดค่าปรับ)" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none" />
                {adjustCreditAmount && !isNaN(adjustCreditAmount) && (() => {
                  const newCredit = Number(adjustCreditTarget.penalty) + Number(adjustCreditAmount);
                  return <p className="text-[10px] text-slate-400 mt-1">ค่าปรับใหม่: ฿{newCredit < 0 ? 0 : newCredit.toLocaleString()}</p>;
                })()}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.reason} *</label>
                <textarea value={adjustCreditReason} onChange={(e) => setAdjustCreditReason(e.target.value)} placeholder={t.enterReason} rows={3} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={() => setIsAdjustCreditModalOpen(false)} className="text-slate-500 text-xs font-black uppercase px-6 hover:text-slate-900 dark:hover:text-white transition-colors">{t.cancel}</button>
              <button onClick={submitAdjustCredit} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center gap-2"><DollarSign size={14} /> {t.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 🚀 Dropdown Component (Same as Dashboard.jsx but adapted for Admin)
function DropdownMenu({ options, currentValue, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 w-full mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden origin-top z-[100]"
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

function StatCard({ title, value, icon, color, bg, border }) {
  return (
    <div className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-lg`}>
      <div className={`w-14 h-14 rounded-2xl ${bg} ${border} border flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon, { size: 24, className: color })}
      </div>
      <div className="overflow-hidden">
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300 truncate" title={value}>{value}</h3>
      </div>
    </div>
  );
}
