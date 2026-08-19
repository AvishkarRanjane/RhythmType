# RhythmType ⌨️⚡

> Production-ready speed typing test, real-time analytics, and gamified platform with Web Audio API keyboard sound synthesis, anti-cheat telemetry, and ambient glassmorphism aesthetics.

🌐 **Live Demo**: [https://rhythmtype-six.vercel.app](https://rhythmtype-six.vercel.app)

---

## Features ✨

- **⌨️ Interactive Typing Arena**:
  - **4 Modes**: Words (1000 top English words), Punctuation, Numbers, and Code Snippets (JavaScript, Python, HTML/CSS).
  - **4 Duration Presets**: 15s, 30s, 60s, and 120s.
  - **Dynamic Caret Alignment**: Pixel-perfect vertical baseline alignment centering the glowing cyan pointer over active characters.
  - **High-Contrast Readability**: Slate gray untyped text (`#64748b`), active target letter highlight (`#ffffff`), neon green correct characters (`#00ff88`), and bright red error alerts (`#ff4655`).

- **🔊 Web Audio API Keyboard Synthesizer**:
  - Zero external `.wav`/`.mp3` asset dependencies.
  - Synthesizes tactile key clicks, deep spacebar thuds, and error buzzes dynamically using Web Audio API oscillators.
  - Organic pitch jitter (+/- 5%) for natural typing feedback + instant mute toggle saved in `localStorage`.

- **🎨 Glassmorphism & Theme Engine**:
  - High-definition cyber grid wallpaper background with dark radial vignette overlay.
  - Glassmorphism cards with `backdrop-filter: blur(16px)` and translucent borders (`rgba(255, 255, 255, 0.1)`).
  - Floating ambient neon background glow blobs behind the active typing arena.

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

- **📊 Advanced Analytics & Social Sharing**:
  - Interactive HTML5 Canvas WPM velocity chart over time.
  - Detailed metrics breakdown: Net WPM, Raw WPM, Accuracy %, Consistency %, Correct, Incorrect, Extra chars.
  - **Social Share Card Generator**: Canvas card image/text summary formatted for Twitter/Discord sharing.

---

## Color Palette 🎨

- **Cyber Neon**:
  - Primary Cyan: `#00f0ff`
  - Neon Green: `#00ff88`
  - Accent Red: `#ff4655`
- **Midnight Slate**:
  - Indigo Accent: `#6366f1`
  - Purple Glow: `#a855f7`
- **Nord Arctic**:
  - Ice Blue: `#88c0d0`
  - Nordic Gold: `#ebcb8b`
- **Matrix Green**:
  - Terminal Green: `#00ff66`
  - Deep Dark Green: `#003311`

---

## Tech Stack 🛠️

- **Backend**: Node.js, Express.js
- **Database**: Dual Driver Adapter (SQLite via `better-sqlite3` / PostgreSQL via `pg`)
- **Authentication**: JWT stored in HTTP-Only Cookies + `bcryptjs` (salt 12)
- **Security & Rate Limiting**: Helmet, CORS, `express-rate-limit`, `express-validator`
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+)
- **Typography & Icons**: Plus Jakarta Sans, JetBrains Mono, Google Material Symbols Rounded
- **Audio Synthesis**: Web Audio API Oscillators
- **Deployment**: Vercel Serverless (`vercel.json`)

---

## Folder Structure 📂

```
RhythmType/
├── server.js               # Express application entry point
├── vercel.json             # Vercel serverless routing configuration
├── package.json            # Dependencies & scripts
├── src/
│   ├── config/
│   │   └── database.js     # Dual PostgreSQL/SQLite async DB wrapper
│   ├── middleware/
│   │   ├── auth.js         # JWT cookie authentication middleware
│   │   ├── rateLimiter.js  # Score submission anti-spam rate limiting
│   │   └── errorHandler.js # Global error handler
│   ├── routes/             # API routes (auth, scores, users)
│   └── controllers/        # Controllers (anti-cheat, scores, profile)
└── public/
    ├── index.html          # Main typing test arena & analytics
    ├── leaderboard.html    # Global rankings view
    ├── profile.html        # User analytics dashboard & badges
    ├── css/
    │   └── style.css       # Themes & glassmorphism layout
    └── js/
        ├── app.js          # Core typing engine & caret math
        ├── words.js        # 1000 word corpus bank & code snippets
        ├── audio.js        # Web Audio API mechanical sound synthesizer
        ├── leaderboard.js  # Global rankings controller
        └── profile.js      # User profile dashboard & chart logic
```

---

## Setup & Installation 🚀

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AvishkarRanjane/RhythmType.git
   cd RhythmType
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## API Reference 🔌

- `POST /api/auth/register` - Create user account.
- `POST /api/auth/login` - Authenticate user & set HTTP-Only JWT cookie.
- `POST /api/auth/logout` - Clear cookie.
- `GET /api/auth/me` - Get current authenticated user details.
- `POST /api/scores/submit` - Submit score with anti-cheat telemetry validation.
- `GET /api/scores/leaderboard?duration=30&mode=words` - Get top 50 global scores.
- `GET /api/users/profile` - Get user statistics, unlocked badges, and history.

---

## License 📜

This project is licensed under the MIT License.
