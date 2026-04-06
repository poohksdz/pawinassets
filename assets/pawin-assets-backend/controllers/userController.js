// src/controllers/userController.js

const asyncHandler = require('../middleware/asyncHandler.js');
const connectToDatabase = require('../config/db.js');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken.js');

// ------------------------------------------------------------------

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const connection = await connectToDatabase();
  try {
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          isAdmin: user.isAdmin === 1,
          isPCBAdmin: user.isPCBAdmin === 1,
          isStore: user.isStore === 1,
          isStaff: user.isStaff === 1,
          penalty: Number(user.penalty || 0),
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  } finally {
    if (connection) connection.release();
  }
});

// ------------------------------------------------------------------
module.exports = {
  authUser,
};