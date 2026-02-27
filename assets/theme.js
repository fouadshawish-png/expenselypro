(() => {
  const STORAGE_KEY = 'expensely-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = saved ? saved : (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', initial === 'dark');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle-btn';

  const setLabel = () => {
    const isDark = document.documentElement.classList.contains('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  };

  setLabel();

  btn.addEventListener('click', () => {
    const isDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    setLabel();
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(btn);
  });
})();
