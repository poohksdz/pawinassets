// src/middleware/socketManager.js
// 🔌 Singleton Socket Manager — สร้าง connection แค่ครั้งเดียว ใช้ร่วมกันทั้งแอป
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;
let currentUserId = null;

/**
 * เชื่อมต่อ Socket (ถ้ายังไม่ได้เชื่อมต่อหรือ user เปลี่ยน)
 */
export function connectSocket(userId) {
    // ถ้ามี socket อยู่แล้ว และ user เดิม → ใช้ต่อ
    if (socket?.connected && currentUserId === userId) {
        return socket;
    }

    // ถ้า user เปลี่ยน → ปิดอันเก่า
    if (socket && currentUserId !== userId) {
        socket.disconnect();
        socket = null;
    }

    // สร้างใหม่ (ถ้ายังไม่มี)
    if (!socket) {
        socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 3000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });

        currentUserId = userId;

        socket.on('connect', () => {
            console.log('🔌 Socket connected (stable):', socket.id);
            socket.emit('join', userId);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
            socket.emit('join', userId);
        });

        socket.on('disconnect', (reason) => {
            console.log('⚠️ Socket disconnected:', reason);
        });
    }

    return socket;
}

/**
 * ดึง Socket instance ปัจจุบัน (ไม่สร้างใหม่)
 */
export function getSocket() {
    return socket;
}

/**
 * ตัดการเชื่อมต่อ (ใช้ตอน Logout เท่านั้น)
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentUserId = null;
    }
}
