const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/profile', apiLimiter, authenticateToken, userController.getProfile);

module.exports = router;
