// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdminRequired = false }) => {
  const stored = localStorage.getItem('userInfo');
  const userInfo = stored ? JSON.parse(stored) : null;

  // 1. ถ้ายังไม่ได้ Login ให้ดีดไปหน้า Login
  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  // 2. ถ้าหน้านี้ต้องการสิทธิ์ Admin แต่ User ไม่ใช่ Admin ให้ดีดกลับ
  if (isAdminRequired && !userInfo?.user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;