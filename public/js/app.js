/**
 * RhythmType - Core Typing Test Engine & Interactive Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. STATE & CONSTANTS
  // ==========================================================================
  
  let currentTheme = localStorage.getItem('rhythm_theme') || 'cyber-neon';
  let selectedDuration = parseInt(localStorage.getItem('rhythm_duration')) || 30;
  let selectedMode = localStorage.getItem('rhythm_mode') || 'words';
  
  let testState = 'idle'; // 'idle' | 'running' | 'finished'
  let words = [];
  let currentWordIndex = 0;
  let currentCharIndex = 0;
  
  let timerInterval = null;
  let timeRemaining = selectedDuration;
  let startTime = null;
  
  let keystrokes = []; // Telemetry for anti-cheat
  let wpmSamples = []; // Per second snapshot [{ sec, wpm, rawWpm, errors }]
  
  let totalTypedChars = 0;
  let correctTypedChars = 0;
  let incorrectTypedChars = 0;
  let extraTypedChars = 0;
  let uncorrectedErrors = 0;

  let currentUser = null;

  // DOM Elements
  const hiddenInput = document.getElementById('hidden-input');
  const wordsWrapper = document.getElementById('words-wrapper');
  const caret = document.getElementById('caret');
  const typingArena = document.getElementById('typing-arena');
  
  const liveMetricsBar = document.getElementById('live-metrics-bar');
  const liveWpmEl = document.getElementById('live-wpm');
  const liveAccEl = document.getElementById('live-acc');
  const liveTimerEl = document.getElementById('live-timer');
  
  const analyticsScreen = document.getElementById('analytics-screen');
  const testContainer = document.getElementById('test-container');
  
  const finalWpmEl = document.getElementById('final-wpm');
  const finalRawEl = document.getElementById('final-raw');
  const finalAccEl = document.getElementById('final-acc');
  const finalConsEl = document.getElementById('final-cons');
  const finalCorrectEl = document.getElementById('final-correct');
  const finalIncorrectEl = document.getElementById('final-incorrect');
  const finalExtraEl = document.getElementById('final-extra');
  const finalTimeEl = document.getElementById('final-time');

  const themeSelect = document.getElementById('theme-select');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  
  const authBtn = document.getElementById('auth-btn');
  const userPill = document.getElementById('user-pill');
  const userStreakEl = document.getElementById('user-streak');
  const userLevelEl = document.getElementById('user-level');
  
  const authModal = document.getElementById('auth-modal');
  const authClose = document.getElementById('auth-close');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  let isLoginMode = true;

  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareBtn = document.getElementById('share-btn');
  const copyCardBtn = document.getElementById('copy-card-btn');

  // ==========================================================================
  // 2. INITIALIZATION & THEME SETUP
  // ==========================================================================

  function initApp() {
    setTheme(currentTheme);
    if (themeSelect) themeSelect.value = currentTheme;

    setupControls();
    checkAuth();
    resetTest();
  }

  function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rhythm_theme', theme);
  }

  // Check authentication status
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        updateUserUI(currentUser);
      } else {
        currentUser = null;
        updateUserUI(null);
      }
    } catch (e) {
      currentUser = null;
      updateUserUI(null);
    }
  }

  function updateUserUI(user) {
    if (user) {
      if (authBtn) authBtn.style.display = 'none';
      if (userPill) {
        userPill.style.display = 'inline-flex';
        userStreakEl.textContent = user.streak || 0;
        userLevelEl.textContent = user.level || 1;
      }
    } else {
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (userPill) userPill.style.display = 'none';
    }
  }

  // ==========================================================================
  // 3. TYPING TEST ENGINE & CORPUS RENDER
  // ==========================================================================

  function resetTest() {
    clearInterval(timerInterval);
    testState = 'idle';
    timeRemaining = selectedDuration;
    currentWordIndex = 0;
    currentCharIndex = 0;
    
    totalTypedChars = 0;
    correctTypedChars = 0;
    incorrectTypedChars = 0;
    extraTypedChars = 0;
    uncorrectedErrors = 0;
    
    keystrokes = [];
    wpmSamples = [];

    // UI resets
    liveTimerEl.textContent = `${timeRemaining}s`;
    liveWpmEl.textContent = '0';
    liveAccEl.textContent = '100%';
    liveMetricsBar.classList.remove('visible');
    
    analyticsScreen.classList.remove('active');
    testContainer.style.display = 'block';

    // Generate new corpus
    words = WORDS_CORPUS.generateWords(selectedMode, 150);
    renderWords();
    updateCaret();

    hiddenInput.value = '';
    focusTypingArea();
  }

  function renderWords() {
    wordsWrapper.innerHTML = '';
    words.forEach((w, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.dataset.wordIndex = wIdx;

      w.split('').forEach((c, cIdx) => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = c;
        charSpan.dataset.charIndex = cIdx;
        wordSpan.appendChild(charSpan);
      });

      wordsWrapper.appendChild(wordSpan);
    });
  }

  function focusTypingArea() {
    hiddenInput.focus();
    typingArena.classList.add('focused');
  }

  function updateCaret() {
    const caret = document.getElementById('caret');
    const container = document.getElementById('typing-arena') || wordsWrapper;
    
    if (!caret || !container) return;

    // Clear previous active word and char highlights
    if (wordsWrapper) {
      wordsWrapper.querySelectorAll('.word.active').forEach(el => el.classList.remove('active'));
      wordsWrapper.querySelectorAll('.char.active').forEach(el => el.classList.remove('active'));
    }

    const currentWordSpan = wordsWrapper ? wordsWrapper.children[currentWordIndex] : null;
    if (currentWordSpan) {
      currentWordSpan.classList.add('active');
    }

    let targetElem = null;
    let isAfterChar = false;

    if (currentWordSpan) {
      const charSpans = currentWordSpan.querySelectorAll('.char');
      if (currentCharIndex < charSpans.length) {
        targetElem = charSpans[currentCharIndex];
        targetElem.classList.add('active');
      } else if (charSpans.length > 0) {
        targetElem = charSpans[charSpans.length - 1];
        isAfterChar = true;
      } else {
        targetElem = currentWordSpan;
      }
    }

    if (!targetElem) return;

    // Compute exact bounding rects relative to caret's offset parent (#typing-arena)
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetElem.getBoundingClientRect();

    // Compute Left Position (before char, or after char if at end of word)
    let left = isAfterChar 
      ? (targetRect.right - containerRect.left) 
      : (targetRect.left - containerRect.left);

    // Compute Top & Height matching the exact character baseline
    const fontHeight = targetRect.height || 32;
    const caretHeight = fontHeight * 0.85; // 85% of character height
    
    // Center caret vertically relative to target character box
    const top = (targetRect.top - containerRect.top) + ((fontHeight - caretHeight) / 2);

    // Apply smooth CSS positions
    caret.style.left = `${Math.round(left)}px`;
    caret.style.top = `${Math.round(top)}px`;
    caret.style.height = `${Math.round(caretHeight)}px`;

    // Auto-scroll words wrapper line if needed
    if (top > 120 && wordsWrapper) {
      wordsWrapper.scrollTop += 35;
    }
  }

  // ==========================================================================
  // 4. KEYBOARD EVENT & METRICS HANDLERS
  // ==========================================================================

  hiddenInput.addEventListener('input', (e) => {
    if (testState === 'finished') return;

    const typedVal = hiddenInput.value;
    const inputChar = typedVal.charAt(typedVal.length - 1);
    hiddenInput.value = '';

    if (testState === 'idle') {
      startTest();
    }

    handleCharacterInput(inputChar);
  });

  hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      resetTest();
      return;
    }

    if (testState === 'finished') return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      audioEngine.playKey(false, false);
    }
  });

  function startTest() {
    testState = 'running';
    startTime = Date.now();
    liveMetricsBar.classList.add('visible');

    timerInterval = setInterval(() => {
      timeRemaining--;
      liveTimerEl.textContent = `${timeRemaining}s`;

      // Record sample metrics
      const elapsedSec = (Date.now() - startTime) / 1000;
      const rawWpm = elapsedSec > 0 ? (totalTypedChars / 5) / (elapsedSec / 60) : 0;
      const netWpm = elapsedSec > 0 ? ((correctTypedChars / 5) / (elapsedSec / 60)) : 0;

      wpmSamples.push({
        sec: Math.round(elapsedSec),
        wpm: Math.max(0, Math.round(netWpm)),
        rawWpm: Math.max(0, Math.round(rawWpm)),
        errors: uncorrectedErrors
      });

      // Update live metrics
      liveWpmEl.textContent = Math.max(0, Math.round(netWpm));
      const acc = totalTypedChars > 0 ? (correctTypedChars / totalTypedChars) * 100 : 100;
      liveAccEl.textContent = `${Math.round(acc)}%`;

      if (timeRemaining <= 0) {
        finishTest();
      }
    }, 1000);
  }

  function handleCharacterInput(char) {
    if (!char) return;

    const now = Date.now();
    keystrokes.push({ char, time: now });

    const currentWordSpan = wordsWrapper.children[currentWordIndex];
    if (!currentWordSpan) return;

    const targetWord = words[currentWordIndex];
    const charSpans = currentWordSpan.querySelectorAll('.char');

    // Space key: Advance to next word
    if (char === ' ') {
      audioEngine.playKey(true, false);
      if (currentCharIndex > 0) {
        currentWordIndex++;
        currentCharIndex = 0;
        updateCaret();
      }
      return;
    }

    totalTypedChars++;

    if (currentCharIndex < targetWord.length) {
      const expectedChar = targetWord[currentCharIndex];
      const targetSpan = charSpans[currentCharIndex];

      if (char === expectedChar) {
        targetSpan.classList.add('correct');
        correctTypedChars++;
        audioEngine.playKey(false, false);
      } else {
        targetSpan.classList.add('incorrect');
        incorrectTypedChars++;
        uncorrectedErrors++;
        audioEngine.playKey(false, true);
      }
      currentCharIndex++;
    } else {
      // Extra characters typed past word length
      const extraSpan = document.createElement('span');
      extraSpan.className = 'char extra';
      extraSpan.textContent = char;
      currentWordSpan.appendChild(extraSpan);
      extraTypedChars++;
      incorrectTypedChars++;
      uncorrectedErrors++;
      currentCharIndex++;
      audioEngine.playKey(false, true);
    }

    updateCaret();
  }

  function handleBackspace() {
    const currentWordSpan = wordsWrapper.children[currentWordIndex];
    if (!currentWordSpan) return;

    if (currentCharIndex > 0) {
      currentCharIndex--;
      const charSpans = currentWordSpan.querySelectorAll('.char');
      const targetSpan = charSpans[currentCharIndex];

      if (targetSpan) {
        if (targetSpan.classList.contains('extra')) {
          targetSpan.remove();
          extraTypedChars = Math.max(0, extraTypedChars - 1);
        } else {
          if (targetSpan.classList.contains('correct')) {
            correctTypedChars = Math.max(0, correctTypedChars - 1);
          } else if (targetSpan.classList.contains('incorrect')) {
            uncorrectedErrors = Math.max(0, uncorrectedErrors - 1);
          }
          targetSpan.className = 'char';
        }
      }
      updateCaret();
    } else if (currentWordIndex > 0) {
      // Go back to previous word
      currentWordIndex--;
      const prevWordSpan = wordsWrapper.children[currentWordIndex];
      const prevCharSpans = prevWordSpan.querySelectorAll('.char');
      currentCharIndex = prevCharSpans.length;
      updateCaret();
    }
  }

  // ==========================================================================
  // 5. TEST COMPLETION & POST-TEST ANALYTICS
  // ==========================================================================

  async function finishTest() {
    clearInterval(timerInterval);
    testState = 'finished';

    const durationSec = selectedDuration;
    const durMin = durationSec / 60;

    const rawWpm = Math.round((totalTypedChars / 5) / durMin);
    const netWpm = Math.max(0, Math.round((correctTypedChars / 5) / durMin));
    const accuracy = totalTypedChars > 0 ? Math.round((correctTypedChars / totalTypedChars) * 1000) / 10 : 100;

    // Calculate Consistency % (based on standard deviation of sample WPM)
    let consistency = 88.5;
    if (wpmSamples.length > 2) {
      const avg = wpmSamples.reduce((a, b) => a + b.wpm, 0) / wpmSamples.length;
      const variance = wpmSamples.reduce((a, b) => a + Math.pow(b.wpm - avg, 2), 0) / wpmSamples.length;
      const stdDev = Math.sqrt(variance);
      consistency = Math.max(10, Math.min(100, Math.round(100 - (stdDev / (avg || 1) * 30))));
    }

    // Populate Analytics UI
    finalWpmEl.textContent = netWpm;
    finalRawEl.textContent = rawWpm;
    finalAccEl.textContent = `${accuracy}%`;
    finalConsEl.textContent = `${consistency}%`;
    finalCorrectEl.textContent = correctTypedChars;
    finalIncorrectEl.textContent = incorrectTypedChars;
    finalExtraEl.textContent = extraTypedChars;
    finalTimeEl.textContent = `${durationSec}s`;

    testContainer.style.display = 'none';
    analyticsScreen.classList.add('active');

    // Render Canvas Chart
    renderWpmChart(wpmSamples);

    // Submit Score to Server API
    try {
      const response = await fetch('/api/scores/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpm: netWpm,
          raw_wpm: rawWpm,
          accuracy,
          consistency,
          duration: selectedDuration,
          mode: selectedMode,
          correct_chars: correctTypedChars,
          incorrect_chars: incorrectTypedChars,
          total_chars: totalTypedChars,
          keystroke_timestamps: keystrokes
        })
      });

      const resData = await response.json();
      if (resData.success) {
        if (resData.userUpdates) {
          showToast(`+${resData.userUpdates.xpEarned} XP Earned! Level ${resData.userUpdates.level}`);
          checkAuth(); // Refresh profile badge
        }
        if (resData.newlyUnlockedBadges && resData.newlyUnlockedBadges.length > 0) {
          resData.newlyUnlockedBadges.forEach(b => showToast(`🏆 Badge Unlocked: ${b}`));
        }
      } else {
        if (resData.error) showToast(`Anti-Cheat Flag: ${resData.error}`);
      }
    } catch (e) {
      console.error('Score submission error:', e);
    }
  }

  // Render HTML5 Canvas Line Chart
  function renderWpmChart(samples) {
    const canvas = document.getElementById('wpm-chart');
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

    if (samples.length < 2) return;

    const padding = 35;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const maxWpm = Math.max(...samples.map(s => Math.max(s.wpm, s.rawWpm)), 60);

    // Draw Gridlines
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

    // Primary Cyan Glow Line (Net WPM)
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#00f0ff';
    
    ctx.beginPath();
    samples.forEach((s, idx) => {
      const x = padding + (idx / (samples.length - 1)) * chartW;
      const y = height - padding - (s.wpm / maxWpm) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Fill Gradient under graph
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, `${primaryColor}40`);
    gradient.addColorStop(1, `${primaryColor}00`);

    ctx.lineTo(padding + chartW, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // ==========================================================================
  // 6. SOCIAL SHARE CARD GENERATOR
  // ==========================================================================

  function renderSocialShareCard() {
    const canvas = document.getElementById('share-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 420;

    // Dark Cyber Surface Background
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, 800, 420);

    // Glowing Border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 780, 400);

    // Title & Branding
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 36px Outfit';
    ctx.fillText('RhythmType ⚡', 40, 65);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Outfit';
    ctx.fillText('Speed Typing Analytics Summary', 40, 95);

    // Hero WPM Display
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 80px JetBrains Mono';
    ctx.fillText(finalWpmEl.textContent || '0', 40, 200);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px Outfit';
    ctx.fillText('NET WPM', 40, 235);

    // Metrics Grid
    const metrics = [
      { label: 'ACCURACY', val: finalAccEl.textContent },
      { label: 'RAW WPM', val: finalRawEl.textContent },
      { label: 'CONSISTENCY', val: finalConsEl.textContent },
      { label: 'MODE / TIME', val: `${selectedMode.toUpperCase()} (${selectedDuration}s)` }
    ];

    metrics.forEach((m, idx) => {
      const x = 320 + (idx % 2) * 230;
      const y = 160 + Math.floor(idx / 2) * 100;

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 28px JetBrains Mono';
      ctx.fillText(m.val, x, y);

      ctx.fillStyle = '#475569';
      ctx.font = '14px Outfit';
      ctx.fillText(m.label, x, y + 25);
    });

    // Footer
    ctx.fillStyle = '#00ff88';
    ctx.font = '16px JetBrains Mono';
    ctx.fillText('rhythmtype.vercel.app', 40, 375);
  }

  // ==========================================================================
  // 7. CONTROLS & EVENT BINDINGS
  // ==========================================================================

  function setupControls() {
    // Typing Arena Click Focus
    if (typingArena) {
      typingArena.addEventListener('click', focusTypingArea);
    }

    // Duration & Mode Buttons
    document.querySelectorAll('[data-duration]').forEach(btn => {
      if (parseInt(btn.dataset.duration) === selectedDuration) btn.classList.add('active');
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-duration]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDuration = parseInt(btn.dataset.duration);
        localStorage.setItem('rhythm_duration', selectedDuration);
        resetTest();
      });
    });

    document.querySelectorAll('[data-mode]').forEach(btn => {
      if (btn.dataset.mode === selectedMode) btn.classList.add('active');
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
        localStorage.setItem('rhythm_mode', selectedMode);
        resetTest();
      });
    });

    // Theme selector dropdown
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => setTheme(e.target.value));
    }

    // Sound toggle
    if (soundToggleBtn) {
      soundToggleBtn.innerHTML = audioEngine.isMuted() 
        ? '<span class="material-symbols-rounded">volume_off</span> Muted' 
        : '<span class="material-symbols-rounded">volume_up</span> Sound';

      soundToggleBtn.addEventListener('click', () => {
        const muted = audioEngine.toggleMute();
        soundToggleBtn.innerHTML = muted 
          ? '<span class="material-symbols-rounded">volume_off</span> Muted' 
          : '<span class="material-symbols-rounded">volume_up</span> Sound';
        showToast(muted ? 'Audio Muted' : 'Audio Unmuted');
      });
    }

    // Restart Button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', resetTest);
    
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) retryBtn.addEventListener('click', resetTest);

    // Auth Modal Handlers
    if (authBtn) authBtn.addEventListener('click', () => openAuthModal(true));
    if (authClose) authClose.addEventListener('click', () => authModal.classList.remove('active'));
    
    if (authToggleBtn) {
      authToggleBtn.addEventListener('click', () => openAuthModal(!isLoginMode));
    }

    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('auth-username').value;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
        const bodyData = isLoginMode ? { identity: username || email, password } : { username, email, password };

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
          });
          const data = await res.json();
          if (data.success) {
            showToast(isLoginMode ? 'Welcome back!' : 'Account registered successfully!');
            authModal.classList.remove('active');
            checkAuth();
          } else {
            showToast(data.error || (data.errors && data.errors[0].msg) || 'Auth failed');
          }
        } catch (err) {
          showToast('Authentication connection error.');
        }
      });
    }

    // Share Modal Handlers
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        renderSocialShareCard();
        shareModal.classList.add('active');
      });
    }

    if (shareClose) {
      shareClose.addEventListener('click', () => shareModal.classList.remove('active'));
    }

    if (copyCardBtn) {
      copyCardBtn.addEventListener('click', () => {
        const text = `⌨️ RhythmType Test Results:\n⚡ Net WPM: ${finalWpmEl.textContent}\n🎯 Accuracy: ${finalAccEl.textContent}\n🔥 Duration: ${selectedDuration}s (${selectedMode})\nPlay at rhythmtype.vercel.app`;
        navigator.clipboard.writeText(text);
        showToast('Card Summary Copied to Clipboard!');
      });
    }
  }

  function openAuthModal(login) {
    isLoginMode = login;
    authTitle.textContent = isLoginMode ? 'Login to RhythmType' : 'Create Account';
    const emailGroup = document.getElementById('email-group');
    if (emailGroup) emailGroup.style.display = isLoginMode ? 'none' : 'block';
    authModal.classList.add('active');
  }

  // Toast Notification System
  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
  }

  // Boot Application
  initApp();
});
