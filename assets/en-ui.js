(() => {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const toggleBtn = header.querySelector(".nav-toggle");
  const drawer = header.querySelector("#mobileNav");
  const closeBtn = header.querySelector(".mobile-close");
  const backdrop = header.querySelector(".mobile-drawer__backdrop");

  const openMenu = () => {
    drawer.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    // focus close
    setTimeout(() => closeBtn && closeBtn.focus(), 0);
  };

  const closeMenu = () => {
    drawer.hidden = true;
    toggleBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
    toggleBtn && toggleBtn.focus();
  };

  toggleBtn && toggleBtn.addEventListener("click", () => {
    const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
    expanded ? closeMenu() : openMenu();
  });

  closeBtn && closeBtn.addEventListener("click", closeMenu);
  backdrop && backdrop.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && !drawer.hidden) closeMenu();
  });

  // Close menu on navigation click
  header.querySelectorAll(".mobile-links a").forEach(a => {
    a.addEventListener("click", () => closeMenu());
  });
})();

// Mobile system modules drawer
document.addEventListener("DOMContentLoaded", function(){
  const toggle = document.querySelector(".mobile-module-toggle");
  const drawer = document.querySelector(".mobile-module-drawer");
  const closeBtn = document.querySelector(".mobile-module-close");

  if(!drawer || !toggle) return;

  const openDrawer = () => {
    drawer.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  };

  const closeDrawer = () => {
    drawer.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    expanded ? closeDrawer() : openDrawer();
  });

  closeBtn && closeBtn.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) closeDrawer();
  });
});
