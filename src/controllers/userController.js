const db = require('../config/database');

/**
 * Get user profile, statistics, achievements, and WPM score history
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await db.get(
      'SELECT id, username, email, xp, level, streak, last_test_date, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    // User aggregate statistics
    const statsRes = await db.get(
      `SELECT 
        COUNT(*) as total_tests,
        MAX(wpm) as highest_wpm,
        AVG(wpm) as avg_wpm,
        AVG(accuracy) as avg_accuracy
       FROM scores WHERE user_id = $1`,
      [userId]
    );

    const totalTests = parseInt(statsRes.total_tests || statsRes.TOTAL_TESTS || 0);
    const highestWpm = parseFloat(statsRes.highest_wpm || statsRes.HIGHEST_WPM || 0);
    const avgWpm = parseFloat(statsRes.avg_wpm || statsRes.AVG_WPM || 0);
    const avgAccuracy = parseFloat(statsRes.avg_accuracy || statsRes.AVG_ACCURACY || 0);

    // Achievements
    const achievements = await db.all(
      'SELECT badge_code, unlocked_at FROM achievements WHERE user_id = $1 ORDER BY unlocked_at ASC',
      [userId]
    );

    // Recent test history for progress chart (last 30 scores)
    const history = await db.all(
      `SELECT id, wpm, raw_wpm, accuracy, duration, mode, created_at 
       FROM scores WHERE user_id = $1 
       ORDER BY created_at ASC 
       LIMIT 30`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      profile: {
        ...user,
        stats: {
          totalTests,
          highestWpm: Math.round(highestWpm * 10) / 10,
          avgWpm: Math.round(avgWpm * 10) / 10,
          avgAccuracy: Math.round(avgAccuracy * 10) / 10
        },
        achievements,
        history
      }
    });
  } catch (err) {
    next(err);
  }
};
