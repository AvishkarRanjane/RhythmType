const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { optionalAuth } = require('../middleware/auth');
const { scoreSubmitLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Submit test score (Protected by optionalAuth so guest or logged-in user can submit)
router.post('/submit', scoreSubmitLimiter, optionalAuth, scoreController.submitScore);

// Fetch global leaderboard
router.get('/leaderboard', apiLimiter, scoreController.getLeaderboard);

module.exports = router;
