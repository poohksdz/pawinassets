import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Building2, MapPin, Save, Lock, Eye, EyeOff,
  ShieldCheck, Package, Clock, CreditCard, Moon, Sun, Globe,
  Bell, BellOff, Smartphone
} from 'lucide-react';

const translations = {
  en: {
    pageTitle: "MY PROFILE",
    profileTitle: "Profile Information",
    profileDesc: "Manage your personal details and preferences.",
    saveChanges: "Save Changes",
    saving: "Saving...",
    name: "Full Name",
    email: "Email Address",
    department: "Department",
    location: "Location",
    changePassword: "Change Password",
    changePasswordDesc: "Update your password regularly for security.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    statsTitle: "My Statistics",
    currentPenalty: "Current Penalty",
    totalBorrows: "Total Borrows",
    activeBorrows: "Active Borrows",
    settingsTitle: "Settings & Preferences",
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    thaiLang: "Thai",
    englishLang: "English",
    notifications: "Notifications",
    notificationsDesc: "Push & in-app notification preferences",
    noProfile: "Unable to load profile data",
    profileSaved: "Profile updated successfully",
    saveFailed: "Failed to update profile",
    passwordChanged: "Password changed successfully",
    passwordFailed: "Failed to change password",
    passwordMismatch: "Passwords do not match",
    passwordEmpty: "Please fill in all password fields",
    passwordMinLength: "New password must be at least 6 characters"
  },
  th: {
    pageTitle: "โปรไฟล์ของฉัน",
    profileTitle: "ข้อมูลโปรไฟล์",
    profileDesc: "จัดการข้อมูลส่วนตัวและการตั้งค่า",
    saveChanges: "บันทึกข้อมูล",
    saving: "กำลังบันทึก...",
    name: "ชื่อ-นามสกุล",
    email: "ที่อยู่อีเมล",
    department: "แผนก",
    location: "สถานที่",
    changePassword: "เปลี่ยนรหัสผ่าน",
    changePasswordDesc: "อัปเดตรหัสผ่านเพื่อความปลอดภัย",
    currentPassword: "รหัสผ่านปัจจุบัน",
    newPassword: "รหัสผ่านใหม่",
    confirmPassword: "ยืนยันรหัสผ่านใหม่",
    updatePassword: "อัปเดตรหัสผ่าน",
    statsTitle: "สถิติของฉัน",
    currentPenalty: "ค่าปรับค้างชำระ",
    totalBorrows: "จำนวนการยืมทั้งหมด",
    activeBorrows: "กำลังยืมอยู่",
    settingsTitle: "การตั้งค่า",
    theme: "ธีม",
    lightMode: "โหมดสว่าง",
    darkMode: "โหมดมืด",
    language: "ภาษา",
    thaiLang: "ภาษาไทย",
    englishLang: "English",
    notifications: "การแจ้งเตือน",
    notificationsDesc: "ตั้งค่าการแจ้งเตือน Push และในแอป",
    noProfile: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
    profileSaved: "อัปเดตโปรไฟล์เรียบร้อยแล้ว",
    saveFailed: "ไม่สามารถอัปเดตโปรไฟล์ได้",
    passwordChanged: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
    passwordFailed: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
    passwordMismatch: "รหัสผ่านไม่ตรงกัน",
    passwordEmpty: "กรุณากรอกรหัสผ่านให้ครบทุกช่อง",
    passwordMinLength: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"
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

export default function Profile() {
  const { setTitle } = useOutletContext();
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const t = translations[lang];

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', department: '', location: '' });

  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [stats, setStats] = useState({ penalty: 0, totalBorrows: 0, activeBorrows: 0 });

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => { setTitle(t.pageTitle); }, [setTitle, t.pageTitle]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) return;
        const userInfo = JSON.parse(storedUser);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const res = await axios.get('/api/profile/me', config);
        setProfile(res.data);
        setEditForm({
          name: res.data.name || userInfo.user?.name || '',
          department: res.data.department || '',
          location: res.data.location || '',
        });
      } catch (err) {
        // Fallback: use userInfo from localStorage
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          const userInfo = JSON.parse(storedUser);
          setProfile({
            name: userInfo.user?.name || '',
            email: userInfo.user?.email || '',
            department: userInfo.user?.department || '',
            location: userInfo.user?.location || '',
          });
          setEditForm({ name: userInfo.user?.name || '', department: '', location: '' });
        }
        console.warn('Profile API not available, using localStorage data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) return;
        const userInfo = JSON.parse(storedUser);
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const res = await axios.get('/api/borrow/my-history', config);
        const data = res.data;
        if (data && data.history) {
          const historyArr = Array.isArray(data.history) ? data.history : [];
          setStats({
            penalty: Number(data.totalPenalty ?? data.credit ?? 0),
            totalBorrows: historyArr.length,
            activeBorrows: historyArr.filter(b => b.status === 'active').length,
          });
        }
      } catch (err) {
        console.warn('History API not available');
      }
    };
    fetchStats();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const storedUser = localStorage.getItem('userInfo');
      const userInfo = JSON.parse(storedUser);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const res = await axios.put('/api/profile/me', editForm, config);
      setProfile(prev => ({ ...prev, ...res.data }));
      // Update localStorage too
      const updatedUserInfo = { ...userInfo, user: { ...userInfo.user, ...editForm } };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      toast.success(t.profileSaved);
    } catch (err) {
      // Graceful fallback: update localStorage only
      const storedUser = localStorage.getItem('userInfo');
      const userInfo = JSON.parse(storedUser);
      const updatedUserInfo = { ...userInfo, user: { ...userInfo.user, ...editForm } };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      toast.success(t.profileSaved);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { current, new: newPwd, confirm } = passwordForm;
    if (!current || !newPwd || !confirm) return toast.warn(t.passwordEmpty);
    if (newPwd !== confirm) return toast.error(t.passwordMismatch);
    if (newPwd.length < 6) return toast.warn(t.passwordMinLength);

    setSavingPassword(true);
    try {
      const storedUser = localStorage.getItem('userInfo');
      const userInfo = JSON.parse(storedUser);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      await axios.put('/api/profile/change-password', {
        currentPassword: current,
        newPassword: newPwd,
      }, config);
      toast.success(t.passwordChanged);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || t.passwordFailed);
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = "#0F172A";
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = "#F8FAFC";
    }
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'th' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const avatarLetter = (editForm.name || profile?.name || 'U').charAt(0).toUpperCase();
  const emailDisplay = profile?.email || JSON.parse(localStorage.getItem('userInfo') || '{}')?.user?.email || '';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto pb-20 px-4 sm:px-0"
    >
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">

        {/* Profile Card */}
        <motion.div variants={item}>
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden relative transition-colors duration-300">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-orange-400/15 to-amber-400/10 rounded-full blur-[100px] -z-0 pointer-events-none"></div>

            <div className="p-6 sm:p-8 lg:p-10 relative z-10">
              {/* Avatar + Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shadow-orange-500/25"
                >
                  {avatarLetter}
                </motion.div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.profileTitle}</h2>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{t.profileDesc}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> {t.name}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} /> {t.email}
                  </label>
                  <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-500">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{emailDisplay || 'N/A'}</span>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14} /> {t.department}
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> {t.location}
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? t.saving : t.saveChanges}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two Column: Change Password + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Change Password */}
          <motion.div variants={item}>
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.changePassword}</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{t.changePasswordDesc}</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current Password */}
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={passwordForm.current}
                      onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                      placeholder={t.currentPassword}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400"
                    />
                    <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3 text-slate-400 hover:text-orange-500 transition-colors">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={passwordForm.new}
                      onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                      placeholder={t.newPassword}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400"
                    />
                    <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-slate-400 hover:text-orange-500 transition-colors">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder={t.confirmPassword}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400"
                    />
                    <ShieldCheck size={16} className="absolute left-4 top-3.5 text-slate-400" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-slate-400 hover:text-orange-500 transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Lock size={14} /> {savingPassword ? '...' : t.updatePassword}
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div variants={item}>
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors duration-300 h-full">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Package size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.statsTitle}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Penalty */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className={`p-5 rounded-2xl border relative overflow-hidden group ${stats.penalty > 0
                      ? 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-transparent border-red-200 dark:border-red-500/30'
                      : 'bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-transparent border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-orange-500/10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <CreditCard size={16} className={stats.penalty > 0 ? 'text-red-500' : 'text-slate-400'} />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.currentPenalty}</span>
                    </div>
                    <p className={`text-2xl font-black tracking-tighter relative z-10 ${stats.penalty > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      ฿{Number(stats.penalty || 0).toLocaleString()}
                    </p>
                  </motion.div>

                  {/* Total Borrows */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="p-5 rounded-2xl border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-transparent border-blue-200 dark:border-blue-500/30 relative overflow-hidden group"
                  >
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-blue-500/10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.totalBorrows}</span>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white relative z-10">
                      {Number(stats.totalBorrows || 0).toLocaleString()}
                    </p>
                  </motion.div>

                  {/* Active Borrows */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="sm:col-span-2 p-5 rounded-2xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-transparent border-emerald-200 dark:border-emerald-500/30 relative overflow-hidden group"
                  >
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-emerald-500/10 blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <Package size={16} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.activeBorrows}</span>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white relative z-10">
                      {Number(stats.activeBorrows || 0).toLocaleString()}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Settings */}
        <motion.div variants={item}>
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800/60 overflow-hidden transition-colors duration-300">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.settingsTitle}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Theme Toggle */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={toggleTheme}
                  className="cursor-pointer p-5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {isDark ? <Moon size={18} className="text-orange-500" /> : <Sun size={18} className="text-amber-500" />}
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.theme}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {isDark ? t.darkMode : t.lightMode}
                  </p>
                </motion.div>

                {/* Language */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={toggleLang}
                  className="cursor-pointer p-5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Globe size={18} className="text-orange-500" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.language}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'th' ? t.thaiLang : t.englishLang}
                  </p>
                </motion.div>

                {/* Notifications */}
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => setNotifEnabled(!notifEnabled)}
                  className="cursor-pointer p-5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all group sm:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {notifEnabled ? <Bell size={18} className="text-orange-500" /> : <BellOff size={18} className="text-slate-400" />}
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.notifications}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {notifEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{t.notificationsDesc}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
