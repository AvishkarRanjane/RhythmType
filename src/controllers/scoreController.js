const db = require('../config/database');

/**
 * Perform keystroke timing variance analysis
 * Checks inter-keystroke intervals to block copy-paste or bot script injection
 */
function validateKeystrokeTelemetry(timestamps) {
  if (!Array.isArray(timestamps) || timestamps.length < 5) {
    return { valid: false, reason: 'Insufficient keystroke telemetry data.' };
  }

  // Extract raw timestamp numbers if array contains objects or numbers
  const times = timestamps.map(t => typeof t === 'number' ? t : (t.time || t.t || 0));

  // Compute inter-key intervals (deltas)
  const deltas = [];
  for (let i = 1; i < times.length; i++) {
    const diff = times[i] - times[i - 1];
    if (diff > 0) {
      deltas.push(diff);
    }
  }

  if (deltas.length < 3) {
    return { valid: false, reason: 'Invalid keystroke interval sequence.' };
  }

  // Calculate Mean
  const sum = deltas.reduce((acc, val) => acc + val, 0);
  const mean = sum / deltas.length;

  // Bot check: Implausibly fast average typing speed (e.g. < 15ms per key = > 800 WPM)
  if (mean < 15) {
    return { valid: false, reason: 'Inhuman typing velocity detected.' };
  }

  // Calculate Variance
  const varianceSum = deltas.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = varianceSum / deltas.length;

  // Bot check: 0 or low variance (< 20) indicates fixed artificial delays or copy-paste bot injection
  if (variance < 20) {
    return { valid: false, reason: 'Keystroke timing variance too low (bot or macro suspected).' };
  }

  return { valid: true, mean, variance };
}

/**
 * Re-calculate WPM and verify math consistency (tolerate max 2% deviation)
 */
function validateMathConsistency(wpm, rawWpm, accuracy, duration, correctChars, totalChars) {
  const durMin = duration / 60;
  if (durMin <= 0) return { valid: false, reason: 'Invalid duration.' };

  const expectedRawWpm = (totalChars / 5) / durMin;
  const expectedWpm = (correctChars / 5) / durMin;

  // Allow small rounding tolerance (2%)
  const wpmDiff = Math.abs(wpm - expectedWpm);
  const allowedDiff = Math.max(expectedWpm * 0.02, 1.5); // 2% tolerance or 1.5 WPM

  if (wpmDiff > allowedDiff) {
    return {
      valid: false,
      reason: `WPM math mismatch. Submitted: ${wpm}, Expected: ${expectedWpm.toFixed(2)}`
    };
  }

  return { valid: true };
}

/**
 * Submit test score with Anti-Cheat verification & Gamification processing
 */
exports.submitScore = async (req, res, next) => {
  try {
    const {
      wpm,
      raw_wpm,
      accuracy,
      consistency,
      duration,
      mode,
      correct_chars,
      incorrect_chars,
      total_chars,
      keystroke_timestamps
    } = req.body;

    // Basic Input Validations
    if (
      typeof wpm !== 'number' ||
      typeof duration !== 'number' ||
      !mode ||
      !keystroke_timestamps
    ) {
      return res.status(400).json({ success: false, error: 'Missing required score fields.' });
    }

    // 1. ANTI-CHEAT CHECK A: Keystroke Telemetry Analysis
    const telemetryCheck = validateKeystrokeTelemetry(keystroke_timestamps);
    if (!telemetryCheck.valid) {
      return res.status(400).json({
        success: false,
        error: `Anti-cheat flag: ${telemetryCheck.reason}`
      });
    }

    // 2. ANTI-CHEAT CHECK B: Mathematical WPM Consistency Check
    const cChars = typeof correct_chars === 'number' ? correct_chars : Math.round((wpm * 5 * duration) / 60);
    const tChars = typeof total_chars === 'number' ? total_chars : Math.round(((raw_wpm || wpm) * 5 * duration) / 60);

    const mathCheck = validateMathConsistency(wpm, raw_wpm || wpm, accuracy, duration, cChars, tChars);
    if (!mathCheck.valid) {
      return res.status(400).json({
        success: false,
        error: `Anti-cheat flag: ${mathCheck.reason}`
      });
    }

    // Check if user is logged in
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      // Guest User Submission Response
      return res.status(200).json({
        success: true,
        guest: true,
        message: 'Score verified successfully! Create an account or log in to record your scores and level up.',
        score: {
          wpm: Math.round(wpm * 100) / 100,
          raw_wpm: Math.round((raw_wpm || wpm) * 100) / 100,
          accuracy: Math.round(accuracy * 10) / 10,
          consistency: Math.round(consistency * 10) / 10,
          duration,
          mode
        }
      });
    }

    // Authenticated User Flow: Save to DB & process Gamification
    const timestampsJson = JSON.stringify(keystroke_timestamps);
    const roundedWpm = Math.round(wpm * 100) / 100;
    const roundedRaw = Math.round((raw_wpm || wpm) * 100) / 100;
    const roundedAcc = Math.round(accuracy * 10) / 10;
    const roundedCons = Math.round((consistency || 85) * 10) / 10;

    await db.run(
      `INSERT INTO scores (user_id, wpm, raw_wpm, accuracy, consistency, duration, mode, keystroke_timestamps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, roundedWpm, roundedRaw, roundedAcc, roundedCons, duration, mode, timestampsJson]
    );

    // Fetch user details for XP and streak updates
    const user = await db.get('SELECT * FROM users WHERE id = $1', [userId]);

    // XP calculation: +1 XP per correct word (~5 correct chars)
    const xpEarned = Math.max(1, Math.round(cChars / 5));
    const newXp = (user.xp || 0) + xpEarned;
    const newLevel = Math.floor(newXp / 500) + 1;
    const leveledUp = newLevel > (user.level || 1);

    // Streak calculation
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let newStreak = user.streak || 0;
    if (user.last_test_date === today) {
      // Streak already maintained today
    } else if (user.last_test_date === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    // Update user record
    await db.run(
      'UPDATE users SET xp = $1, level = $2, streak = $3, last_test_date = $4 WHERE id = $5',
      [newXp, newLevel, newStreak, today, userId]
    );

    // Check & Award Achievements
    const newlyUnlocked = [];

    // Existing badges for this user
    const existingBadgesRes = await db.all('SELECT badge_code FROM achievements WHERE user_id = $1', [userId]);
    const existingBadges = new Set(existingBadgesRes.map(b => b.badge_code));

    const checkAndAward = async (badgeCode) => {
      if (!existingBadges.has(badgeCode)) {
        await db.run('INSERT INTO achievements (user_id, badge_code) VALUES ($1, $2)', [userId, badgeCode]);
        newlyUnlocked.push(badgeCode);
      }
    };

    // ⚡ "Speed Demon": 80+ WPM
    if (roundedWpm >= 80) {
      await checkAndAward('SPEED_DEMON');
    }

    // 🎯 "Sniper": 100% accuracy on 30s+ test
    if (roundedAcc >= 100 && duration >= 30) {
      await checkAndAward('SNIPER');
    }

    // 🔥 "Consistency King": 7-day streak
    if (newStreak >= 7) {
      await checkAndAward('CONSISTENCY_KING');
    }

    // 💻 "Code Monkey": 10 code snippet typing tests
    if (mode === 'code') {
      const codeCountRes = await db.get(
        "SELECT COUNT(*) as count FROM scores WHERE user_id = $1 AND mode = 'code'",
        [userId]
      );
      const codeCount = parseInt(codeCountRes.count || codeCountRes.COUNT || 0);
      if (codeCount >= 10) {
        await checkAndAward('CODE_MONKEY');
      }
    }

    return res.status(200).json({
      success: true,
      score: {
        wpm: roundedWpm,
        raw_wpm: roundedRaw,
        accuracy: roundedAcc,
        consistency: roundedCons,
        duration,
        mode
      },
      userUpdates: {
        xpEarned,
        totalXp: newXp,
        level: newLevel,
        leveledUp,
        streak: newStreak
      },
      newlyUnlockedBadges: newlyUnlocked
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Leaderboard (Top 50 scores filtered by duration & mode)
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const duration = parseInt(req.query.duration) || 30;
    const mode = req.query.mode || 'words';
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    const scores = await db.all(
      `SELECT s.id, s.wpm, s.raw_wpm, s.accuracy, s.consistency, s.duration, s.mode, s.created_at,
              u.username, u.level, u.streak
       FROM scores s
       JOIN users u ON s.user_id = u.id
       WHERE s.duration = $1 AND s.mode = $2
       ORDER BY s.wpm DESC, s.accuracy DESC
       LIMIT $3 OFFSET $4`,
      [duration, mode, limit, offset]
    );

    const totalRes = await db.get(
      'SELECT COUNT(*) as total FROM scores WHERE duration = $1 AND mode = $2',
      [duration, mode]
    );

    const total = parseInt(totalRes.total || totalRes.TOTAL || 0);

    return res.status(200).json({
      success: true,
      filter: { duration, mode },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      leaderboard: scores
    });
  } catch (err) {
    next(err);
  }
};
