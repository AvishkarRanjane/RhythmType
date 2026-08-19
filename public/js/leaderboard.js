/**
 * RhythmType Leaderboard View Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  let activeDuration = 30;
  let activeMode = 'words';

  const leaderboardBody = document.getElementById('leaderboard-body');
  const durationBtns = document.querySelectorAll('[data-lb-duration]');
  const modeBtns = document.querySelectorAll('[data-lb-mode]');

  // Initialize
  fetchLeaderboard();

  // Duration Filter Listeners
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durationBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDuration = parseInt(btn.dataset.lbDuration);
      fetchLeaderboard();
    });
  });

  // Mode Filter Listeners
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMode = btn.dataset.lbMode;
      fetchLeaderboard();
    });
  });

  async function fetchLeaderboard() {
    if (!leaderboardBody) return;
    leaderboardBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">Loading Top Speed Demons...</td></tr>`;

    try {
      const res = await fetch(`/api/scores/leaderboard?duration=${activeDuration}&mode=${activeMode}`);
      const data = await res.json();

      if (!data.success || !data.leaderboard || data.leaderboard.length === 0) {
        leaderboardBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No recorded scores for this category yet. Be the first!</td></tr>`;
        return;
      }

      leaderboardBody.innerHTML = '';
      data.leaderboard.forEach((item, index) => {
        const rank = index + 1;
        const tr = document.createElement('tr');
        tr.className = 'row-item';

        let rankBadgeClass = '';
        if (rank === 1) rankBadgeClass = 'rank-1';
        else if (rank === 2) rankBadgeClass = 'rank-2';
        else if (rank === 3) rankBadgeClass = 'rank-3';

        const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        tr.innerHTML = `
          <td><span class="rank-badge ${rankBadgeClass}">${rank}</span></td>
          <td><strong>${escapeHtml(item.username)}</strong> <span style="font-size:0.78rem; color:var(--secondary-color);">Lvl ${item.level}</span></td>
          <td style="font-family: var(--font-mono); font-weight:700; color:var(--primary-color);">${item.wpm}</td>
          <td style="font-family: var(--font-mono);">${item.accuracy}%</td>
          <td style="font-family: var(--font-mono);">${item.consistency || 85}%</td>
          <td style="color:var(--text-dim); font-size:0.85rem;">${dateStr}</td>
        `;

        leaderboardBody.appendChild(tr);
      });
    } catch (e) {
      leaderboardBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--accent-color);">Failed to load leaderboard data.</td></tr>`;
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
