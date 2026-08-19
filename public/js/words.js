/**
 * RhythmType Word Corpus Bank
 * Includes standard English words, punctuation variants, number integration, and code snippets.
 */
const WORDS_CORPUS = {
  // Top English Words
  standard: [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "i", "with",
    "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which",
    "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no",
    "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state",
    "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like",
    "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even",
    "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through",
    "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good",
    "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still",
    "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both",
    "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general",
    "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave",
    "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late",
    "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present",
    "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program",
    "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face",
    "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line", "city",
    "sound", "rock", "fast", "space", "echo", "cyber", "neon", "matrix", "synth", "pulse", "rhythm",
    "code", "logic", "flow", "pixel", "vector", "orbit", "stream", "hyper", "turbo", "quantum",
    "binary", "spectrum", "circuit", "portal", "vortex", "signal", "shadow", "future", "vision",
    "light", "energy", "velocity", "core", "grid", "data", "engine", "byte", "stack", "buffer",
    "system", "cluster", "node", "array", "socket", "cipher", "daemon", "thread", "kernel", "packet",
    "router", "script", "terminal", "nexus", "zenith", "apex", "stride", "glide", "tempo", "beat",
    "melody", "cadence", "harmony", "symphony", "crescendo", "acoustics", "frequency", "wave",
    "resonate", "dynamic", "groove", "pitch", "chime", "vibe", "groove", "octave", "tremolo"
  ],

  // Code Snippets across JS, Python, HTML/CSS
  code: [
    "const calculateWpm = (chars, timeSec) => Math.round((chars / 5) / (timeSec / 60));",
    "function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }",
    "async function fetchData(url) { const res = await fetch(url); return await res.json(); }",
    "document.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); resetTest(); } });",
    "const uniqueValues = [...new Set(array.filter(x => x !== null && x !== undefined))];",
    "def bubble_sort(arr): n = len(arr); for i in range(n): for j in range(0, n-i-1): if arr[j] > arr[j+1]: arr[j], arr[j+1] = arr[j+1], arr[j]",
    "import asyncio\nasync def main(): print('Hello'); await asyncio.sleep(1); print('World')",
    "class UserProfile:\n    def __init__(self, username, email):\n        self.username = username\n        self.email = email",
    "const theme = localStorage.getItem('rhythm_theme') || 'cyber-neon'; document.documentElement.setAttribute('data-theme', theme);",
    "<div class=\"metric-card\"><span class=\"metric-value\" id=\"wpm\">0</span><span class=\"metric-label\">WPM</span></div>",
    ".caret { position: absolute; width: 2px; height: 1.2em; background: var(--primary); animation: blink 1s infinite; }",
    "export default function App() { return <main className=\"flex center\"><h1>RhythmType</h1></main>; }"
  ],

  /**
   * Generate words array based on mode
   */
  generateWords(mode = 'words', count = 100) {
    const list = [];
    const baseWords = this.standard;

    if (mode === 'code') {
      // Pick random code snippets and join them with spaces
      for (let i = 0; i < Math.min(count / 10, 15); i++) {
        const snippet = this.code[Math.floor(Math.random() * this.code.length)];
        list.push(...snippet.split(/\s+/));
      }
      return list;
    }

    const punctuationMarks = [".", ",", "!", "?", ";", ":", "'", "\""];

    for (let i = 0; i < count; i++) {
      let word = baseWords[Math.floor(Math.random() * baseWords.length)];

      if (mode === 'punctuation') {
        // 20% chance of capitalization
        if (Math.random() < 0.25) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        // 20% chance of trailing punctuation
        if (Math.random() < 0.25) {
          const mark = punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
          if (mark === '"' || mark === "'") {
            word = `${mark}${word}${mark}`;
          } else {
            word = `${word}${mark}`;
          }
        }
      } else if (mode === 'numbers') {
        // 20% chance of inserting a number instead of a word
        if (Math.random() < 0.22) {
          const numType = Math.random();
          if (numType < 0.4) {
            word = Math.floor(Math.random() * 100).toString();
          } else if (numType < 0.8) {
            word = Math.floor(Math.random() * 10000).toString();
          } else {
            word = (Math.floor(Math.random() * 90) + 10).toString() + "%";
          }
        }
      }

      list.push(word);
    }

    return list;
  }
};
