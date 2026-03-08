/* assets/site-ui.js */
(() => {
  // ---------- helpers ----------
  const norm = (p) => (p || "/").replace(/\/+$/, "") || "/";
  const path = norm(location.pathname);
  const isEn = path === "/en" || path.startsWith("/en/");
  const isAr = path === "/ar" || path.startsWith("/ar/");
  const siteHeader = document.querySelector(".site-header");

  // If you have <link rel="alternate" hreflang=".."> use them. Otherwise fallback.
  const alternates = {};
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
    const lang = (link.getAttribute("hreflang") || "").toLowerCase();
    alternates[lang] = link.getAttribute("href");
  });

  const fallback = {
    ar: "https://www.expenselypro.com/ar/",
    en: "https://www.expenselypro.com/en/",
  };

  const swapLangPath = (from, to) => {
    if (!path.startsWith(`/${from}`)) return null;
    return `${location.origin}${path.replace(`/${from}`, `/${to}`)}`;
  };

  const arHref =
    alternates["ar"] ||
    alternates["x-default"] ||
    swapLangPath("en", "ar") ||
    fallback.ar;

  const enHref =
    alternates["en"] ||
    alternates["x-default"] ||
    swapLangPath("ar", "en") ||
    fallback.en;

  // ---------- floating panel ----------
  const root = document.documentElement;

  const ensureStyles = () => {
    if (document.getElementById("site-ui-style")) return;
    const s = document.createElement("style");
    s.id = "site-ui-style";
    s.textContent = `
      .site-fab {
        position: fixed;
        left: 12px;
        bottom: 12px;
        z-index: 99999;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .site-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 999px;
        border: 1px solid rgba(0,0,0,.12);
        background: rgba(255,255,255,.92);
        color: #111;
        font: 600 14px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Arial;
        box-shadow: 0 10px 28px rgba(0,0,0,.12);
        backdrop-filter: blur(10px);
      }
      .dark .site-pill {
        background: rgba(18,18,18,.88);
        border-color: rgba(255,255,255,.16);
        color: #f5f5f5;
        box-shadow: 0 10px 28px rgba(0,0,0,.35);
      }
      .site-pill button,
      .site-pill a {
        all: unset;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 999px;
      }
      .site-pill a { text-decoration: none; }
      .site-pill button:focus,
      .site-pill a:focus { outline: 2px solid rgba(14,165,198,.55); outline-offset: 2px; }
      .site-pill .sep {
        width: 1px; height: 18px;
        background: rgba(0,0,0,.12);
      }
      .dark .site-pill .sep { background: rgba(255,255,255,.16); }
      @media (min-width: 900px){
        .site-fab { left: 16px; bottom: 16px; }
      }
    `;
    document.head.appendChild(s);
  };

  const applyTheme = (mode) => {
    const m = mode === "dark" ? "dark" : "light";
    root.classList.toggle("dark", m === "dark");
    try { localStorage.setItem("theme", m); } catch (e) {}
  };

  const getSavedTheme = () => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") return t;
    } catch (e) {}
    return null;
  };

  const getSystemTheme = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const initTheme = () => {
    const saved = getSavedTheme();
    applyTheme(saved || getSystemTheme());
  };

  const mountFab = () => {
    ensureStyles();
    if (document.getElementById("siteFab")) return;

    const fab = document.createElement("div");
    fab.className = "site-fab";
    fab.id = "siteFab";

    const pill = document.createElement("div");
    pill.className = "site-pill";
    pill.setAttribute("role", "group");
    pill.setAttribute("aria-label", "Site controls");

    // Language button shows the OTHER language
    const langLink = document.createElement("a");
    const langLabel = isEn ? "AR" : "EN";
    langLink.textContent = langLabel;
    langLink.href = isEn ? arHref : enHref;
    langLink.setAttribute("aria-label", `Switch language to ${langLabel}`);

    // Theme toggle
    const themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.id = "themeToggleFab";

    const updateThemeBtn = () => {
      const isDark = root.classList.contains("dark");
      themeBtn.textContent = isDark ? "☀️" : "🌙";
      themeBtn.setAttribute("aria-pressed", String(isDark));
      themeBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    };

    themeBtn.addEventListener("click", () => {
      const isDark = root.classList.contains("dark");
      applyTheme(isDark ? "light" : "dark");
      updateThemeBtn();
    });

    // React to system change only if no saved theme
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener?.("change", () => {
        if (getSavedTheme()) return;
        applyTheme(getSystemTheme());
        updateThemeBtn();
      });
    }

    const sep = document.createElement("span");
    sep.className = "sep";
    sep.setAttribute("aria-hidden", "true");

    pill.appendChild(langLink);
    pill.appendChild(sep);
    pill.appendChild(themeBtn);

    fab.appendChild(pill);
    document.body.appendChild(fab);

    updateThemeBtn();
  };

  const syncHeaderState = () => {
    if (!siteHeader) return;
    siteHeader.classList.toggle("scrolled", window.scrollY > 10);
  };

  // ---------- boot ----------
  initTheme();

  // reading progress
  const progress = document.createElement('div');
  progress.style.position = 'fixed';
  progress.style.top = '0';
  progress.style.left = '0';
  progress.style.height = '3px';
  progress.style.background = '#0EA5C6';
  progress.style.zIndex = '99999';
  progress.style.width = '0%';
  document.body.appendChild(progress);

  const updateProgress = () => {
    const total = document.body.scrollHeight - window.innerHeight;
    const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
    progress.style.width = percent + '%';
  };

  window.addEventListener('scroll', updateProgress);
  window.addEventListener('resize', updateProgress);
  window.addEventListener("scroll", syncHeaderState, { passive: true });
  updateProgress();
  syncHeaderState();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFab);
  } else {
    mountFab();
  }
})();
