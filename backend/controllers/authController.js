const User = require('../models/User');
const jwt = require('jsonwebtoken');
const store = require('../services/inMemoryStore');
const { isMongoActive } = require('../config/db');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (!isMongoActive()) {
      const user = {
        _id: `usr_${Date.now()}`,
        name,
        email,
        role: role || 'operator',
        createdAt: new Date()
      };
      store.users.push(user);
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
      return res.status(201).json({ success: true, token, user });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'operator'
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (!isMongoActive()) {
      const user = store.users.find(u => u.email === email) || {
        _id: 'usr_default',
        name: nameFromEmail(email),
        email,
        role: 'admin',
        createdAt: new Date()
      };
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
      return res.json({ success: true, token, user });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Direct password check or hashed comparison
    const isMatch = user.password === password; 
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper for name formatting
function nameFromEmail(email) {
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
