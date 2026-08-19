const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await db.get(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [cleanUsername, cleanEmail]
    );

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Username or email already taken.' });
    }

    // Hash password with salt 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const insertRes = await db.run(
      'INSERT INTO users (username, email, password_hash, xp, level, streak) VALUES ($1, $2, $3, 0, 1, 0)',
      [cleanUsername, cleanEmail, passwordHash]
    );

    const newUser = await db.get(
      'SELECT id, username, email, xp, level, streak, last_test_date, created_at FROM users WHERE username = $1',
      [cleanUsername]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: newUser,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login existing user
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { identity, password } = req.body; // identity can be email or username
    const cleanIdentity = identity.trim();

    const user = await db.get(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [cleanIdentity]
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      last_test_date: user.last_test_date,
      created_at: user.created_at
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userProfile,
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Logout user by clearing HTTP-Only cookie
 */
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

/**
 * Get current logged in user details
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await db.get(
      'SELECT id, username, email, xp, level, streak, last_test_date, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Fetch user achievements
    const achievements = await db.all(
      'SELECT badge_code, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
      [user.id]
    );

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        achievements
      }
    });
  } catch (err) {
    next(err);
  }
};
