// src/middleware/axiosInstance.js
// 🛡️ Global Axios interceptor สำหรับ auto-logout เมื่อ Token หมดอายุ
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// กำหนด default ให้ทุก axios call ชี้ไปที่ backend (ไม่ต้องใส่ http://localhost:5000 บ่อยๆ ก็ได้)
// แต่ไม่จำเป็นต้องบังคับ ตอนนี้แค่ดัก Request/Response
axios.defaults.baseURL = API_BASE;

// 🚀 Request Interceptor: แนบ Token อัตโนมัติทุก request (ที่มีการข้ามไป backend ของเรา)
axios.interceptors.request.use(
    (config) => {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            try {
                const userInfo = JSON.parse(stored);
                if (userInfo?.token) {
                    config.headers.Authorization = `Bearer ${userInfo.token}`;
                }
            } catch (e) {
                localStorage.removeItem('userInfo');
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🚀 Response Interceptor: ถ้าได้ 401 → Token หมดอายุ → Logout อัตโนมัติ
let isLoggingOut = false; // 🛑 ตัวแปรล็อกป้องกันการเตะออกแบบซ้ำซ้อนรัวๆ

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isLoggingOut) {
            const currentPath = window.location.pathname;
            // ไม่ redirect ถ้าอยู่หน้า Login อยู่แล้ว
            if (currentPath !== '/' && currentPath !== '/login') {
                isLoggingOut = true; // ล็อกทันที ไม่ให้ Request อื่นที่ตามมาส่ง Error ซ้ำ

                // ลบข้อมูลทันทีเพื่อไม่ให้ Request ในคิวถัดไปมี Token คาดเคลื่อน
                localStorage.removeItem('userInfo');
                localStorage.removeItem('cartItems');

                // 🛑 ตัด Socket ทันที ไม่ให้มันพยายาม Reconnect ไปหา Backend รัวๆ (ลด Token Error Spams)
                import('../middleware/socketManager.js').then(sm => {
                    if (sm && typeof sm.disconnectSocket === 'function') {
                        sm.disconnectSocket();
                    }
                }).catch(e => console.error("Failed to disconnect socket:", e));

                toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', {
                    position: 'top-center',
                    autoClose: 3000,
                    icon: '🔒',
                });

                // เด้งไปหน้า Login ทันที (ลดจาก 1500ms เป็น 500ms เพื่อตัดช่องโหว่)
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
            }
        }
        return Promise.reject(error);
    }
);
