<div align="center">

# ⌨️ RhythmType ⚡
### *The Ultimate Speed Typing Test, Real-Time Analytics & Gamified Platform*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Better--SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployable-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 🌟 Overview

**RhythmType** is a modern, high-performance, full-stack speed typing platform engineered with Node.js, Express, dual-driver PostgreSQL/SQLite database support, vanilla HTML5/CSS3/JavaScript, and Web Audio API synthesized mechanical keyboard sound effects.

Designed to deliver an award-winning user experience, RhythmType features an interactive typing arena with dynamic caret baseline alignment, real-time WPM velocity tracking, anti-cheat telemetry analysis, daily streak retention mechanics, XP leveling systems, and shareable analytics cards.

---

## ✨ Features & Highlights

- **⌨️ Interactive Typing Engine**:
  - **4 Modes**: Words (1000 top English words), Punctuation, Numbers, and Code Snippets (JavaScript, Python, HTML/CSS).
  - **4 Duration Presets**: 15s, 30s, 60s, and 120s.
  - **Dynamic Caret Alignment**: Pixel-perfect vertical baseline alignment centering the glowing cyan pointer over active characters.
  - **High-Contrast Readability**: Slate gray untyped text (`#64748b`), active target letter highlight (`#ffffff`), neon green correct characters (`#00ff88`), and bright red error alerts (`#ff4655`).

- **🔊 Web Audio API Sound FX**:
  - Zero external `.wav`/`.mp3` asset dependencies.
  - Synthesizes tactile key clicks, deep spacebar thuds, and error buzzes dynamically using audio context oscillators.
  - Organic pitch jitter (+/- 5%) for natural typing feedback + instant mute toggle with `localStorage` persistence.

- **🎨 Ambient Glassmorphism Aesthetics**:
  - High-definition cyber grid wallpaper background with dark radial vignette overlay.
  - Glassmorphism cards with `backdrop-filter: blur(16px)` and translucent borders (`rgba(255, 255, 255, 0.1)`).
  - Floating ambient neon background glow blobs.
  - **4 Themes**: `Cyber Neon`, `Midnight Slate`, `Nord Arctic`, and `Matrix Green`.

- **🛡️ Anti-Cheat & Defensive Validation**:
  - **Keystroke Variance Analysis**: Server analyzes inter-keystroke interval timing (`variance > 20ms` and `mean > 15ms`) to block macro bots and copy-paste injection.
  - **WPM Math Re-Verification**: Server recalculates WPM based on character count and duration; rejects submissions deviating > 2%.
  - **Rate Limiting**: Max 1 score submission per 10 seconds per IP via `express-rate-limit`.

- **🏆 Gamification & Retention**:
  - **Daily Streak Tracker (🔥)**: Tracks consecutive daily test completions.
  - **XP & Level System**: Earn +1 XP per correct word (~5 correct characters), leveling up every 500 XP.
  - **Achievement Badges**:
    - ⚡ `Speed Demon`: Reach 80+ WPM
    - 🎯 `Sniper`: 100% Accuracy on 30s+ test
    - 🔥 `Consistency King`: 7-day typing streak
    - 💻 `Code Monkey`: Complete 10 code snippet tests

- **📊 Advanced Post-Test Analytics**:
  - Interactive HTML5 Canvas WPM velocity chart over time.
  - Detailed metrics grid: Net WPM, Raw WPM, Accuracy %, Consistency %, Correct, Incorrect, Extra chars.
  - **Social Share Card Generator**: Canvas card image/text summary formatted for Twitter/Discord sharing.

---

## 🏗️ Architecture & Dual Database Strategy

```text
RhythmType/
├── .env.example
├── .gitignore
├── README.md
├── vercel.json
├── package.json
├── server.js
├── src/
│   ├── config/
│   │   └── database.js      <-- Async DB Adapter (PostgreSQL / SQLite)
│   ├── middleware/
│   │   ├── auth.js          <-- JWT Cookie Verification
│   │   ├── rateLimiter.js   <-- Express Rate Limiting
│   │   └── errorHandler.js  <-- Global Exception Handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── scoreRoutes.js
│   │   └── userRoutes.js
│   └── controllers/
│       ├── authController.js
│       ├── scoreController.js
│       └── userController.js
└── public/
    ├── index.html
    ├── leaderboard.html
    ├── profile.html
    ├── css/
    │   └── style.css        <-- Glassmorphism & Themes
    └── js/
        ├── app.js           <-- Core Typing Engine & Caret Math
        ├── words.js         <-- Word Corpus Bank
        ├── audio.js         <-- Web Audio API Synthesizer
        ├── leaderboard.js   <-- Global Rankings Controller
        └── profile.js       <-- User Analytics & Badges
```

### Dual Driver Support (`src/config/database.js`)
- **Production (Vercel)**: PostgreSQL via `pg` or `@neondatabase/serverless` when `DATABASE_URL` is set.
- **Local Development**: SQLite via `better-sqlite3` with an in-memory fallback for environments without prebuilt C++ binaries.
- **Unified ASYNC Interface**: Exposes `async get()`, `async all()`, `async run()`, and `async exec()`.

---

## 🔌 API Reference

### Authentication Endpoints
- `POST /api/auth/register` - Create user account with bcrypt hashing (salt 12).
- `POST /api/auth/login` - Authenticate user and issue HTTP-Only JWT cookie.
- `POST /api/auth/logout` - Clear authentication cookie.
- `GET /api/auth/me` - Fetch authenticated user profile & badges.

### Score & Analytics Endpoints
- `POST /api/scores/submit` - Submit typing score with anti-cheat telemetry validation, award XP/streaks, and unlock achievement badges.
- `GET /api/scores/leaderboard?duration=30&mode=words` - Retrieve top 50 global rankings filtered by preset.

### User Endpoints
- `GET /api/users/profile` - Retrieve user statistics, unlocked badges, and historical WPM progress.

---

## 🛠️ Local Installation & Development

```bash
# 1. Clone repository
git clone https://github.com/AvishkarRanjane/RhythmType.git
cd RhythmType

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env

# 4. Start local development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## ☁️ Vercel Serverless Deployment

RhythmType is pre-configured for instant deployment on Vercel via `vercel.json`.

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/leaderboard", "dest": "public/leaderboard.html" },
    { "src": "/profile", "dest": "public/profile.html" },
    { "src": "/(.*)", "dest": "public/$1" }
  ]
}
```

### Environment Variables on Vercel:
- `JWT_SECRET` = `rhythmtype_production_jwt_secret_key_2026`
- `NODE_ENV` = `production`
- `DATABASE_URL` = `postgres://...` (from Neon, Supabase, or Vercel Postgres)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
