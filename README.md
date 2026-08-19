# RhythmType ⚡ ⌨️

**RhythmType** is a modern, high-performance, full-stack speed typing test, analytics, and gamified web application. Built with Node.js, Express, dual-driver PostgreSQL/SQLite database support, standard HTML5/CSS3/JavaScript, and Web Audio API synthesized mechanical keyboard sound effects.

## 🚀 Features

- **Interactive Typing Engine**: 4 modes (Words, Punctuation, Numbers, Code Snippets) and 4 duration presets (15s, 30s, 60s, 120s).
- **Modern Themes**: Midnight Dark, Cyber Neon, Nord, and Matrix Green themes with smooth glowing caret animation.
- **Audio Feedback**: Synthesized mechanical keyboard audio FX built with Web Audio API (soft click, space thud, error beep).
- **Post-Test Analytics**: Interactive HTML5 Canvas graph displaying WPM and error cadence over time + shareable card generator.
- **Anti-Cheat Engine**: Server-side inter-keystroke variance analysis and mathematical WPM re-validation.
- **Gamification & Retention**: XP system (+1 XP per correct word), leveling system (every 500 XP), daily streak tracker (🔥), and achievement badges (⚡ Speed Demon, 🎯 Sniper, 🔥 Consistency King, 💻 Code Monkey).
- **Authentication**: Secure JWT stored in HTTP-Only cookies with guest-mode support.
- **Dual Database Architecture**: Seamless local SQLite (`better-sqlite3`) development and production PostgreSQL (`pg` / `@neondatabase/serverless`).
- **Vercel Deployable**: Pre-configured serverless function routing (`vercel.json`).

## 🛠️ Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## ☁️ Deploying to Vercel

1. Push code to GitHub repository.
2. Import project into Vercel.
3. Add Environment Variable `DATABASE_URL` pointing to your PostgreSQL instance (e.g. Neon, Supabase, or Vercel Postgres).
4. Set `JWT_SECRET` in Vercel environment variables.
5. Deploy! Vercel automatically routes `/api/*` to `server.js` and serves static files from `public/`.
