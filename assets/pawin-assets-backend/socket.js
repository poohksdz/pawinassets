// socket.js — ตัวกลางสำหรับเก็บ instance ของ Socket.io ให้ Controller อื่นเรียกใช้ได้
let io;

module.exports = {
    init: (server) => {
        const { Server } = require('socket.io');
        io = new Server(server, {
            cors: {
                origin: function (origin, callback) {
                    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL;
                    const allowed = !origin ||
                        origin.includes('localhost') ||
                        origin === process.env.APP_URL ||
                        (frontendUrl && origin === frontendUrl);
                    callback(null, allowed ? origin : true);
                },
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log(`🔌 Socket connected: ${socket.id}`);

            // เมื่อ user login สำเร็จ ให้ join ห้องส่วนตัวของตัวเอง (ใช้ user_id เป็นชื่อห้อง)
            socket.on('join', (userId) => {
                socket.join(`user_${userId}`);
                console.log(`👤 User ${userId} joined room user_${userId}`);
            });

            socket.on('disconnect', () => {
                console.log(`❌ Socket disconnected: ${socket.id}`);
            });
        });

        return io;
    },

    getIO: () => {
        if (!io) {
            throw new Error('Socket.io ยังไม่ได้เริ่มต้น! กรุณาเรียก init() ก่อน');
        }
        return io;
    }
};
