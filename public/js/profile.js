/**
 * RhythmType User Profile & Analytics View Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileContainer = document.getElementById('profile-container');
  const loginPrompt = document.getElementById('login-prompt');

  const BADGE_DEFINITIONS = {
    'SPEED_DEMON': { icon: '⚡', name: 'Speed Demon', desc: 'Reach 80+ WPM in any test mode' },
    'SNIPER': { icon: '🎯', name: 'Sniper', desc: 'Achieve 100% accuracy on a 30s+ test' },
    'CONSISTENCY_KING': { icon: '🔥', name: 'Consistency King', desc: 'Maintain a 7-day typing streak' },
    'CODE_MONKEY': { icon: '💻', name: 'Code Monkey', desc: 'Complete 10 code snippet typing tests' }
  };

  fetchProfileData();

  async function fetchProfileData() {
    try {
      const res = await fetch('/api/users/profile');
      const data = await res.json();

      if (!data.success || !data.profile) {
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (profileContainer) profileContainer.style.display = 'none';
        return;
      }

      if (loginPrompt) loginPrompt.style.display = 'none';
      if (profileContainer) profileContainer.style.display = 'block';

      populateProfile(data.profile);
    } catch (e) {
      if (loginPrompt) loginPrompt.style.display = 'block';
      if (profileContainer) profileContainer.style.display = 'none';
    }
  }

  function populateProfile(profile) {
    // Header Stats
    document.getElementById('profile-username').textContent = profile.username;
    document.getElementById('profile-level').textContent = `Level ${profile.level}`;
    document.getElementById('profile-streak').textContent = `${profile.streak} Days 🔥`;
    
    // XP Bar
    const xpInLevel = profile.xp % 500;
    const xpPct = Math.min(100, Math.round((xpInLevel / 500) * 100));
    document.getElementById('xp-bar-fill').style.width = `${xpPct}%`;
    document.getElementById('xp-label').textContent = `${xpInLevel} / 500 XP (${profile.xp} Total XP)`;

    // Stats Grid
    document.getElementById('stat-total-tests').textContent = profile.stats.totalTests || 0;
    document.getElementById('stat-highest-wpm').textContent = profile.stats.highestWpm || 0;
    document.getElementById('stat-avg-wpm').textContent = profile.stats.avgWpm || 0;
    document.getElementById('stat-avg-acc').textContent = `${profile.stats.avgAccuracy || 0}%`;

    // Badges Grid
    const unlockedBadges = new Set((profile.achievements || []).map(a => a.badge_code));
    const badgesContainer = document.getElementById('profile-badges');
    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      Object.keys(BADGE_DEFINITIONS).forEach(code => {
        const def = BADGE_DEFINITIONS[code];
        const isUnlocked = unlockedBadges.has(code);

        const badgeDiv = document.createElement('div');
        badgeDiv.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
        badgeDiv.innerHTML = `
          <div class="badge-icon">${def.icon}</div>
          <div>
            <div class="badge-title">${def.name}</div>
            <div class="badge-desc">${def.desc}</div>
          </div>
        `;
        badgesContainer.appendChild(badgeDiv);
      });
    }

    // Historical Progress Chart
    if (profile.history && profile.history.length > 0) {
      renderProfileChart(profile.history);
      populateHistoryTable(profile.history);
    }
  }

  function renderProfileChart(history) {
    const canvas = document.getElementById('profile-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const padding = 35;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const maxWpm = Math.max(...history.map(h => h.wpm), 60);

    // Grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#1e2c4d';
    ctx.lineWidth = 1;
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#475569';

    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((maxWpm / 4) * i);
      const yPos = height - padding - (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding, yPos);
      ctx.lineTo(width - padding, yPos);
      ctx.stroke();
      ctx.fillText(yVal.toString(), 8, yPos + 4);
    }

    // Historical WPM Line
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#00f0ff';
    ctx.beginPath();
    history.forEach((h, idx) => {
      const x = padding + (idx / (history.length - 1 || 1)) * chartW;
      const y = height - padding - (h.wpm / maxWpm) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function populateHistoryTable(history) {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    // Show newest first
    const reversed = [...history].reverse();
    reversed.forEach(h => {
      const tr = document.createElement('tr');
      tr.className = 'row-item';

      const dateStr = new Date(h.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--primary-color);">${h.wpm}</td>
        <td style="font-family:var(--font-mono);">${h.raw_wpm || h.wpm}</td>
        <td style="font-family:var(--font-mono);">${h.accuracy}%</td>
        <td>${h.mode.toUpperCase()} (${h.duration}s)</td>
        <td style="color:var(--text-dim); font-size:0.85rem;">${dateStr}</td>
      `;
      tableBody.appendChild(tr);
    });
  }
});
