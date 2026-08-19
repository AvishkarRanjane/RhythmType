const path = require('path');
const fs = require('fs');

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;
let memoryStore = null;

// Determine driver
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  isPostgres = true;
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : false
  });
} else {
  isPostgres = false;
  try {
    const Database = require('better-sqlite3');
    const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../rhythmtype.db');
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
  } catch (err) {
    console.warn('[DB] Native better-sqlite3 bindings unavailable on this Node version. Falling back to resilient JS memory store.');
    memoryStore = {
      users: [],
      scores: [],
      achievements: [],
      lastIds: { users: 0, scores: 0, achievements: 0 }
    };
  }
}

/**
 * Helper to convert `$1, $2, $3` style SQL placeholders into `?` for SQLite
 */
function normalizeSqlForSqlite(sql) {
  return sql.replace(/\$\d+/g, '?');
}

/**
 * Database abstraction interface providing unified async methods
 */
const db = {
  isPostgres,

  /**
   * Execute a query and return a single row
   */
  async get(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(sql, params);
      return res.rows[0] || null;
    } else if (sqliteDb) {
      const normalizedSql = normalizeSqlForSqlite(sql);
      const stmt = sqliteDb.prepare(normalizedSql);
      const row = stmt.get(...params);
      return row || null;
    } else {
      // Memory Store Fallback
      return this._memoryGet(sql, params);
    }
  },

  /**
   * Execute a query and return all matching rows
   */
  async all(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(sql, params);
      return res.rows;
    } else if (sqliteDb) {
      const normalizedSql = normalizeSqlForSqlite(sql);
      const stmt = sqliteDb.prepare(normalizedSql);
      return stmt.all(...params);
    } else {
      // Memory Store Fallback
      return this._memoryAll(sql, params);
    }
  },

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   */
  async run(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(sql, params);
      let lastID = null;
      if (res.rows && res.rows[0] && res.rows[0].id) {
        lastID = res.rows[0].id;
      }
      return { lastID, changes: res.rowCount };
    } else if (sqliteDb) {
      const normalizedSql = normalizeSqlForSqlite(sql);
      const stmt = sqliteDb.prepare(normalizedSql);
      const info = stmt.run(...params);
      return { lastID: info.lastInsertRowid, changes: info.changes };
    } else {
      // Memory Store Fallback
      return this._memoryRun(sql, params);
    }
  },

  /**
   * Execute raw multi-statement DDL scripts
   */
  async exec(sql) {
    if (isPostgres) {
      await pgPool.query(sql);
    } else if (sqliteDb) {
      sqliteDb.exec(sql);
    } else {
      // Memory Store Fallback
      // DDL scripts (CREATE TABLE / INDEX) no-op in memory store
    }
  },

  /**
   * In-Memory database query helper for environments without native bindings
   */
  _memoryGet(sql, params) {
    const rows = this._memoryAll(sql, params);
    return rows[0] || null;
  },

  _memoryAll(sql, params) {
    if (!memoryStore) return [];
    const lower = sql.toLowerCase();

    if (lower.includes('from users')) {
      let filtered = [...memoryStore.users];
      if (lower.includes('where lower(username) = lower($1) or lower(email) = lower($2)') || lower.includes('where lower(username) = lower($1) or lower(email) = lower($1)')) {
        const val = (params[0] || '').toLowerCase();
        const val2 = (params[1] || val).toLowerCase();
        filtered = filtered.filter(u => u.username.toLowerCase() === val || u.email.toLowerCase() === val2);
      } else if (lower.includes('where username = $1')) {
        filtered = filtered.filter(u => u.username === params[0]);
      } else if (lower.includes('where id = $1')) {
        filtered = filtered.filter(u => u.id === parseInt(params[0]));
      }
      return filtered;
    }

    if (lower.includes('from scores')) {
      let filtered = [...memoryStore.scores];
      if (lower.includes('where user_id = $1 and mode = \'code\'')) {
        filtered = filtered.filter(s => s.user_id === parseInt(params[0]) && s.mode === 'code');
      } else if (lower.includes('where duration = $1 and mode = $2')) {
        filtered = filtered.filter(s => s.duration === parseInt(params[0]) && s.mode === params[1]);
      } else if (lower.includes('where user_id = $1')) {
        filtered = filtered.filter(s => s.user_id === parseInt(params[0]));
      }

      if (lower.includes('count(*)')) {
        return [{ total: filtered.length, count: filtered.length, TOTAL: filtered.length, COUNT: filtered.length }];
      }

      if (lower.includes('avg(wpm)')) {
        const total = filtered.length;
        const highest_wpm = total ? Math.max(...filtered.map(s => s.wpm)) : 0;
        const avg_wpm = total ? filtered.reduce((a, b) => a + b.wpm, 0) / total : 0;
        const avg_accuracy = total ? filtered.reduce((a, b) => a + b.accuracy, 0) / total : 0;
        return [{ total_tests: total, highest_wpm, avg_wpm, avg_accuracy }];
      }

      // Sort by WPM desc
      if (lower.includes('order by s.wpm desc') || lower.includes('order by wpm desc')) {
        filtered.sort((a, b) => b.wpm - a.wpm);
      } else if (lower.includes('order by created_at asc')) {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      // Pagination / Limit
      if (params.length >= 4 && lower.includes('limit $3 offset $4')) {
        const limit = params[2];
        const offset = params[3];
        filtered = filtered.slice(offset, offset + limit);
      } else if (lower.includes('limit 30')) {
        filtered = filtered.slice(0, 30);
      }

      return filtered;
    }

    if (lower.includes('from achievements')) {
      let filtered = [...memoryStore.achievements];
      if (lower.includes('where user_id = $1')) {
        filtered = filtered.filter(a => a.user_id === parseInt(params[0]));
      }
      return filtered;
    }

    return [];
  },

  _memoryRun(sql, params) {
    if (!memoryStore) return { lastID: null, changes: 0 };
    const lower = sql.toLowerCase();

    if (lower.includes('insert into users')) {
      memoryStore.lastIds.users++;
      const newUser = {
        id: memoryStore.lastIds.users,
        username: params[0],
        email: params[1],
        password_hash: params[2],
        xp: 0,
        level: 1,
        streak: 0,
        last_test_date: null,
        created_at: new Date().toISOString()
      };
      memoryStore.users.push(newUser);
      return { lastID: newUser.id, changes: 1 };
    }

    if (lower.includes('insert into scores')) {
      memoryStore.lastIds.scores++;
      const newScore = {
        id: memoryStore.lastIds.scores,
        user_id: parseInt(params[0]),
        wpm: params[1],
        raw_wpm: params[2],
        accuracy: params[3],
        consistency: params[4],
        duration: parseInt(params[5]),
        mode: params[6],
        keystroke_timestamps: params[7],
        created_at: new Date().toISOString()
      };

      // Attach username & level for leaderboard JOIN
      const user = memoryStore.users.find(u => u.id === newScore.user_id);
      if (user) {
        newScore.username = user.username;
        newScore.level = user.level;
        newScore.streak = user.streak;
      }

      memoryStore.scores.push(newScore);
      return { lastID: newScore.id, changes: 1 };
    }

    if (lower.includes('insert into achievements')) {
      memoryStore.lastIds.achievements++;
      const newAch = {
        id: memoryStore.lastIds.achievements,
        user_id: parseInt(params[0]),
        badge_code: params[1],
        unlocked_at: new Date().toISOString()
      };
      memoryStore.achievements.push(newAch);
      return { lastID: newAch.id, changes: 1 };
    }

    if (lower.includes('update users set xp = $1')) {
      const xp = params[0];
      const level = params[1];
      const streak = params[2];
      const last_test_date = params[3];
      const userId = parseInt(params[4]);

      const user = memoryStore.users.find(u => u.id === userId);
      if (user) {
        user.xp = xp;
        user.level = level;
        user.streak = streak;
        user.last_test_date = last_test_date;
      }
      return { lastID: null, changes: 1 };
    }

    return { lastID: null, changes: 0 };
  },

  /**
   * Initialize database tables
   */
  async initDb() {
    console.log(`[DB] Initializing database using driver: ${isPostgres ? 'PostgreSQL' : (sqliteDb ? 'SQLite' : 'JS Memory Store')}`);
    
    if (isPostgres) {
      const pgSchema = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          xp INT DEFAULT 0,
          level INT DEFAULT 1,
          streak INT DEFAULT 0,
          last_test_date VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scores (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          wpm REAL NOT NULL,
          raw_wpm REAL NOT NULL,
          accuracy REAL NOT NULL,
          consistency REAL NOT NULL,
          duration INT NOT NULL,
          mode VARCHAR(50) NOT NULL,
          keystroke_timestamps TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS achievements (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          badge_code VARCHAR(50) NOT NULL,
          unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, badge_code)
        );

        CREATE INDEX IF NOT EXISTS idx_scores_duration_mode ON scores(duration, mode, wpm DESC);
        CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
      `;
      await this.exec(pgSchema);
    } else if (sqliteDb) {
      const sqliteSchema = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          xp INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          streak INTEGER DEFAULT 0,
          last_test_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          wpm REAL NOT NULL,
          raw_wpm REAL NOT NULL,
          accuracy REAL NOT NULL,
          consistency REAL NOT NULL,
          duration INTEGER NOT NULL,
          mode TEXT NOT NULL,
          keystroke_timestamps TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          badge_code TEXT NOT NULL,
          unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, badge_code),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_scores_duration_mode ON scores(duration, mode, wpm DESC);
        CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
      `;
      await this.exec(sqliteSchema);
    }
    console.log('[DB] Schema initialization complete.');
  }
};

module.exports = db;
