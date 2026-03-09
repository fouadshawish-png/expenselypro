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
  document
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((link) => {
      const lang = (link.getAttribute("hreflang") || "").toLowerCase();
      alternates[lang] = link.getAttribute("href");
    });

  const sectionFallback = (targetLang) => {
    if (targetLang === "ar") {
      if (path.startsWith("/en/system/"))
        return `${location.origin}/ar/system/`;
      if (path.startsWith("/en/app/")) return `${location.origin}/ar/app/`;
      if (path.startsWith("/en/about/")) return `${location.origin}/ar/about/`;
      if (path.startsWith("/en/tools/")) return `${location.origin}/ar/tools/`;
      if (path.startsWith("/en/library/"))
        return `${location.origin}/ar/library/`;
      return `${location.origin}/ar/`;
    }

    if (path.startsWith("/ar/system/")) return `${location.origin}/en/system/`;
    if (path.startsWith("/ar/app/")) return `${location.origin}/en/app/`;
    if (path.startsWith("/ar/about/")) return `${location.origin}/en/about/`;
    if (path.startsWith("/ar/tools/")) return `${location.origin}/en/tools/`;
    if (path.startsWith("/ar/library/"))
      return `${location.origin}/en/library/`;
    return `${location.origin}/en/`;
  };

  const arHref =
    alternates["ar"] || alternates["x-default"] || sectionFallback("ar");

  const enHref =
    alternates["en"] || alternates["x-default"] || sectionFallback("en");

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
    try {
      localStorage.setItem("theme", m);
    } catch (e) {}
  };

  const getSavedTheme = () => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") return t;
    } catch (e) {}
    return null;
  };

  const getSystemTheme = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
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
      themeBtn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode",
      );
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

  const syncSystemStage = () => {
    const stageEls = document.querySelectorAll(".system-stage");
    if (!stageEls.length || !path.includes("/system")) return;

    const stageBySlug = {
      "daily-expense-tracking": 1,
      "budget-framework": 2,
      "weekly-review": 3,
      "debt-control": 4,
      "savings-growth": 5,
    };

    const slugMatch = path.match(/\/system\/([^/]+)(?:\/|$)/);
    const slug = slugMatch ? slugMatch[1] : "";
    const stageNum = stageBySlug[slug];

    let label = "";
    if (typeof stageNum === "number") {
      label = isAr ? `المرحلة ${stageNum} من 5` : `Stage ${stageNum} of 5`;
    } else if (path === "/ar/system" || path === "/ar/system/") {
      label = "النظام الكامل: 5 مراحل";
    } else if (path === "/en/system" || path === "/en/system/") {
      label = "Full System: 5 Stages";
    } else if (
      path === "/ar/system/journey" ||
      path === "/ar/system/journey/"
    ) {
      label = "خريطة المسار: 5 مراحل";
    } else if (
      path === "/en/system/journey" ||
      path === "/en/system/journey/"
    ) {
      label = "Journey Map: 5 Stages";
    }

    if (!label) return;
    stageEls.forEach((el) => {
      el.textContent = label;
    });
  };

  const initDownloadShowcase = () => {
    const isArDownload = path === "/ar/download.html";
    const isEnDownload = path === "/en/download.html";
    if (!isArDownload && !isEnDownload) return;

    const defaultScreens = [
      "/assets/images/screens/screen-01.webp",
      "/assets/images/screens/screen-02.webp",
      "/assets/images/screens/screen-03.webp",
      "/assets/images/screens/screen-06.webp",
      "/assets/images/screens/screen-07.webp",
      "/assets/images/screens/screen-08.webp",
      "/assets/images/screens/screen-09.webp",
    ];

    let screenshot = document.getElementById("downloadAppScreenshot");

    if (!screenshot && isEnDownload) {
      const sections = Array.from(document.querySelectorAll("main section"));
      const faqSection = sections.find((section) => {
        const heading = section.querySelector("h2");
        return heading && heading.textContent.trim() === "FAQ";
      });

      if (faqSection) {
        const section = document.createElement("section");
        section.className = "section text-center";
        section.innerHTML = `
          <h2>Inside the app</h2>
          <img
            id="downloadAppScreenshot"
            class="download-screenshot"
            src="${defaultScreens[0]}"
            alt="App screenshot from Expensely Pro"
            loading="lazy"
            width="420"
            height="840"
            decoding="async"
          />
        `;
        faqSection.before(section);
        screenshot = section.querySelector("#downloadAppScreenshot");
      }
    }

    if (!screenshot) return;

    screenshot.classList.add("download-screenshot");
    screenshot.setAttribute("data-screens", JSON.stringify(defaultScreens));

    if (screenshot.dataset.sliderReady === "true") return;
    screenshot.dataset.sliderReady = "true";

    let current = 0;
    let timer = null;
    screenshot.style.transition = "opacity 220ms ease";

    const nextImage = () => {
      current = (current + 1) % defaultScreens.length;
      screenshot.style.opacity = "0.15";
      setTimeout(() => {
        screenshot.src = defaultScreens[current];
        screenshot.style.opacity = "1";
      }, 220);
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(nextImage, 3000);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    start();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.25 },
      ).observe(screenshot);
    }
  };

  // ---------- boot ----------
  initTheme();

  // reading progress
  const progress = document.createElement("div");
  progress.style.position = "fixed";
  progress.style.top = "0";
  progress.style.left = "0";
  progress.style.height = "3px";
  progress.style.background = "#0EA5C6";
  progress.style.zIndex = "99999";
  progress.style.width = "0%";
  document.body.appendChild(progress);

  const updateProgress = () => {
    const total = document.body.scrollHeight - window.innerHeight;
    const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
    progress.style.width = percent + "%";
  };

  window.addEventListener("scroll", updateProgress);
  window.addEventListener("resize", updateProgress);
  window.addEventListener("scroll", syncHeaderState, { passive: true });
  updateProgress();
  syncHeaderState();
  syncSystemStage();
  initDownloadShowcase();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFab);
  } else {
    mountFab();
  }
})();
