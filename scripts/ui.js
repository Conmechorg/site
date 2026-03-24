/* ============================
   CM Site UI — shared behaviors
   /scripts/ui.js
   ============================ */

(function () {
  "use strict";

  // ---------- Helpers ----------
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  const normalise = (p) => {
    const x = (p || "/").toLowerCase();
    if (x === "/") return "/index.html";
    return x;
  };

  // ---------- Footer year ----------
  function initYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  // ---------- Back to top ----------
  function initBackToTop() {
    const btn = document.getElementById("toTop") || document.querySelector("[data-to-top]");
    if (!btn) return;

    const threshold = 60;

    function toggle() {
      const show = window.scrollY > threshold;
      btn.classList.toggle("is-visible", show);
    }

    window.addEventListener("scroll", toggle, { passive: true });
    toggle();

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- Partials ----------
  async function initPartials() {
    const partialMap = {
      header: "/partials/header.html",
      footer: "/partials/footer.html",
      model_menu: "/partials/model_menu.html"
    };

    const hosts = $$("[data-include]");
    if (!hosts.length) return;

    async function loadInto(host) {
      const key = (host.getAttribute("data-include") || "").trim();
      const url = partialMap[key];
      if (!url) return;

      try {
        const res = await fetch(url);
        if (!res.ok) return;
        host.innerHTML = await res.text();
      } catch (e) {
        /* silent */
      }
    }

    await Promise.all(hosts.map(loadInto));
  }

  // ---------- Mobile nav toggle ----------
  function initMobileNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primaryNav") || document.querySelector(".nav");
    if (!header || !toggle || !nav) return;

    const close = () => {
      header.classList.remove("is-nav-open");
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    const open = () => {
      header.classList.add("is-nav-open");
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      isOpen() ? close() : open();
    });

    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      close();
    });

    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      if (e.target.closest(".site-header")) return;
      close();
    });

    window.addEventListener(
      "resize",
      () => {
        if (window.matchMedia("(min-width: 721px)").matches) close();
      },
      { passive: true }
    );

    close();
  }

  // ---------- Nav active ----------
  function initActiveNav() {
    const links = $$(".nav .nav-link");
    if (!links.length) return;

    const curPath = normalise(location.pathname || "/");

    if (curPath === "/index.html") {
      links.forEach((a) => {
        a.removeAttribute("aria-current");
        a.classList.remove("is-current");
      });
      return;
    }

    links.forEach((a) => {
      a.removeAttribute("aria-current");
      a.classList.remove("is-current");
    });

    let best = null;

    links.forEach((a) => {
      if (a.hasAttribute("data-keep-active")) return;

      const href = (a.getAttribute("href") || "").trim();
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;

      let u;
      try {
        u = new URL(href, location.origin);
      } catch {
        return;
      }

      const linkPath = normalise(u.pathname || "/");
      if (linkPath === curPath) best = a;
    });

    if (best) {
      best.setAttribute("aria-current", "page");
      best.classList.add("is-current");
    }
  }

  // ---------- Model drawer ----------
  function initModelDrawer() {
    function getBits() {
      return {
        drawer: document.getElementById("modelDrawer"),
        backdrop: document.querySelector("[data-model-map-backdrop]"),
        openBtns: $$("[data-model-map-open]"),
        closeBtn: document.querySelector("[data-model-map-close]")
      };
    }

    function markCurrentLink() {
      const drawer = document.getElementById("modelDrawer");
      if (!drawer) return;

      const currentPath = normalise(window.location.pathname || "/");
      const links = $$(".model-link", drawer);

      links.forEach((link) => {
        const href = (link.getAttribute("href") || "").trim();
        if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
          link.classList.remove("is-current");
          link.removeAttribute("aria-current");
          return;
        }

        let url;
        try {
          url = new URL(href, location.origin);
        } catch {
          link.classList.remove("is-current");
          link.removeAttribute("aria-current");
          return;
        }

        const isCurrent = normalise(url.pathname || "/") === currentPath;
        link.classList.toggle("is-current", isCurrent);

        if (isCurrent) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    function openDrawer() {
      const { drawer, backdrop, openBtns } = getBits();
      if (!drawer || !backdrop) return;

      drawer.setAttribute("aria-hidden", "false");
      backdrop.hidden = false;
      requestAnimationFrame(() => backdrop.classList.add("is-open"));

      openBtns.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
      document.body.classList.add("is-model-drawer-open");
    }

    function closeDrawer() {
      const { drawer, backdrop, openBtns } = getBits();
      if (!drawer || !backdrop) return;

      drawer.setAttribute("aria-hidden", "true");
      backdrop.classList.remove("is-open");

      openBtns.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
      document.body.classList.remove("is-model-drawer-open");

      window.setTimeout(() => {
        if (drawer.getAttribute("aria-hidden") === "true") {
          backdrop.hidden = true;
        }
      }, 180);
    }

    document.addEventListener("click", (e) => {
      const openTrigger = e.target.closest("[data-model-map-open]");
      const closeTrigger = e.target.closest("[data-model-map-close]");
      const backdropTrigger = e.target.closest("[data-model-map-backdrop]");
      const modelLink = e.target.closest("#modelDrawer .model-link");

      if (openTrigger) {
        e.preventDefault();
        openDrawer();
        return;
      }

      if (closeTrigger || backdropTrigger) {
        e.preventDefault();
        closeDrawer();
        return;
      }

      if (modelLink) {
        closeDrawer();
      }
    });

    document.addEventListener("keydown", (e) => {
      const drawer = document.getElementById("modelDrawer");
      if (!drawer) return;

      if (e.key === "Escape" && drawer.getAttribute("aria-hidden") === "false") {
        closeDrawer();
      }
    });

    markCurrentLink();
  }

  // ---------- Signals ----------
  function initSignals() {
    const cards = $$(".signal-card");
    const pills = $$(".signals-pill");
    const expandAllBtn = document.getElementById("expandAll");
    const collapseAllBtn = document.getElementById("collapseAll");

    if (!cards.length || !pills.length) return;

    function applyFilter(filter) {
      cards.forEach((card) => {
        const t = (card.getAttribute("data-type") || "").toLowerCase();
        const show = filter === "all" || t === filter;
        card.style.display = show ? "" : "none";
      });
    }

    function setExpanded(card, expanded) {
      const moreBtn = $(".signal-more", card);
      const detail = $(".signal-detail", card);
      if (!moreBtn || !detail) return;

      moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      detail.hidden = !expanded;

      const chev = $(".chev", moreBtn);
      if (chev) chev.textContent = expanded ? "▲" : "▼";
    }

    pills.forEach((btn) => {
      btn.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        applyFilter((btn.getAttribute("data-filter") || "all").toLowerCase());
      });
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".signal-more");
      if (!btn) return;

      const card = btn.closest(".signal-card");
      if (!card) return;

      const isOpen = btn.getAttribute("aria-expanded") === "true";
      setExpanded(card, !isOpen);
    });

    if (expandAllBtn) {
      expandAllBtn.addEventListener("click", () => {
        cards.forEach((card) => {
          if (card.style.display === "none") return;
          setExpanded(card, true);
        });
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener("click", () => {
        cards.forEach((card) => {
          if (card.style.display === "none") return;
          setExpanded(card, false);
        });
      });
    }

    applyFilter("all");
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", async () => {
    await initPartials();

    initMobileNav();
    initActiveNav();
    initYear();
    initBackToTop();
    initModelDrawer();
    initSignals();
  });
})();

(() => {
  const form = document.getElementById("cm-signals-form");
  if (!form) return;

  const emailInput = form.querySelector('input[name="email"]');
  const msg = document.getElementById("cm-signals-msg");

  const endpoint = "https://buttondown.email/api/emails/embed-subscribe/rtipple01";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailInput.value || "").trim();
    if (!email) return;

    msg.textContent = "Submitting…";
    msg.classList.remove("is-error", "is-ok");

    try {
      const body = new URLSearchParams({ email });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body
      });

      if (!res.ok) throw new Error("Request failed");

      msg.textContent = "✓ Thanks — check your inbox to confirm your subscription.";
      msg.classList.add("is-ok");
      form.reset();
    } catch (err) {
      msg.textContent = "Something went wrong. Please try again in a moment.";
      msg.classList.add("is-error");
    }
  });
})();