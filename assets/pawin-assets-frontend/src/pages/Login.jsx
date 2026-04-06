// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, User, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = "#020617";
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = "#f8fafc";
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('/api/users/login', {
        email,
        password
      });

      if (response.data) {
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        toast.success(`Welcome back, ${response.data.user.name}`);
        setTimeout(() => navigate('/dashboard'), 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-700">

      {/* 🌌 Ambient Background Effects */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-orange-500/20 dark:bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full mx-4 relative z-10"
      >
        <div className="glass dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 dark:border-slate-800/50 p-8 sm:p-10 overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>

          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
              className="relative w-20 h-20 flex items-center justify-center mb-6"
            >
              <div className="absolute inset-0 bg-orange-500/20 dark:bg-orange-500/30 blur-2xl rounded-full"></div>
              <img src="/favicon.ico" alt="Logo" className="w-14 h-14 drop-shadow-2xl relative z-10" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white"
            >
              PAWIN-<span className="text-orange-500">ASSETS</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-500 dark:text-slate-400 font-bold mt-3 uppercase tracking-[0.3em] text-[10px]"
            >
              Management Ecosystem
            </motion.p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="email" required disabled={isLoading} value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-950/50 rounded-2xl border border-transparent dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 disabled:opacity-50"
                  placeholder="name@company.com"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest ml-1">
                Security Key
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                  <LockKeyhole size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="password" required disabled={isLoading} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-950/50 rounded-2xl border border-transparent dark:border-slate-800 text-slate-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all duration-300 disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-slate-900 dark:bg-orange-500 hover:bg-black dark:hover:bg-orange-400 text-white dark:text-slate-950 font-black py-4 rounded-2xl shadow-xl transition-all duration-300 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Enter Dashboard <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center"
          >
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Digital Infrastructure Team
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
