// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import AdminApprovals from './pages/AdminApprovals';
import AdminDashboard from './pages/AdminDashboard';
import CreateBarcodeItem from './pages/CreateBarcodeItem';
import BorrowRequests from './pages/BorrowRequests';
import ProtectedRoute from './middleware/ProtectedRoute';
import MainLayout from './components/MainLayout';

// นำเข้ากล่องแจ้งเตือน และไฟล์ CSS ของมัน
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageTransition from './components/PageTransition';
import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';

// 🚀 หน้า 404 แบบ Inline
function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-[120px] font-black text-slate-800 leading-none">404</h1>
      <p className="text-lg font-bold text-slate-500 mt-4 mb-8">ไม่พบหน้าที่คุณต้องการ</p>
      <a href="/dashboard" className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-orange-600 transition-all">กลับหน้าหลัก</a>
    </div>
  );
}

// 🚀 LayoutWrapper สำหรับทำ SPA (Layout ยืนนิ่ง เปลี่ยนแค่เนื้อหาตรงกลาง)
function LayoutWrapper() {
  const [title, setTitle] = useState('');
  const location = useLocation();

  return (
    <MainLayout title={title}>
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Outlet context={{ setTitle }} />
        </PageTransition>
      </AnimatePresence>
    </MainLayout>
  );
}

export default function App() {
  //  1. ย้าย State ตะกร้ามาไว้ที่ไฟล์แม่สูงสุด และดึงจาก localStorage
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  //  2. สั่งบันทึกลง localStorage อัตโนมัติเมื่อตะกร้าเปลี่ยน
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  return (
    <BrowserRouter>
      {/* วาง ToastContainer ไว้ตรงนี้ เพื่อให้ใช้ได้ทุกหน้าในแอป */}
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* เลิกใช้ PageTransition กับ Navbar ถ้าไม่อยากให้หน้ากระตุก */}
        <Route path="/" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />

        {/* 🛡️ กลุ่มหน้าที่ต้องใช้ MainLayout (SPA) */}
        <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard cartItems={cartItems} setCartItems={setCartItems} />} />
          <Route path="/history" element={<History />} />
          <Route path="/borrow-requests" element={<BorrowRequests />} />
        </Route>

        {/* 🛡️ กลุ่มแอดมิน ที่ใช้ MainLayout ด้วย */}
        <Route element={<ProtectedRoute isAdminRequired><LayoutWrapper /></ProtectedRoute>}>
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create-barcode" element={<CreateBarcodeItem />} />
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </BrowserRouter>
  );
}