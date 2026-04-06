const { getMyNotifications } = require('./controllers/notificationController.js');

const mockReq = {
    user: {
        _id: 1 // ใช้ ID มั่วๆ ก่อน หรือจะดึงมาจริงๆ ก็ได้
    }
};

const mockRes = {
    json: (data) => {
        console.log('SUCCESS:', JSON.stringify(data));
    },
    status: (code) => {
        console.log('STATUS:', code);
        return mockRes;
    }
};

async function testController() {
    try {
        await getMyNotifications(mockReq, mockRes);
    } catch (err) {
        console.error('CONTROLLER_ERROR:', err.message);
    }
}

testController();
