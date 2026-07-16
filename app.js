// =========================================================
// ÇİMENTO TEKNİK EĞİTİMLERİ — App logic
// =========================================================
(function () {
  "use strict";

  var CATEGORY_LABELS = {
    talimatnameler: "Talimatnameler",
    egitimler: "Eğitimler",
    cimsaustam: "Çimsa Ustam Eğitimleri"
  };

  var state = {
    data: { talimatnameler: [], egitimler: [], cimsaustam: [] },
    currentCategory: null
  };

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    document.getElementById("year").textContent = new Date().getFullYear();
    loadData();
    safeRun(bindEvents, "bindEvents");
    safeRun(setupInstallPrompt, "setupInstallPrompt");
    safeRun(registerServiceWorker, "registerServiceWorker");
    safeRun(setupShare, "setupShare");
    safeRun(handleInitialRoute, "handleInitialRoute");
  }

  function safeRun(fn, label) {
    try {
      fn();
    } catch (err) {
      console.error("[" + label + "] başlatılamadı:", err);
    }
  }

  // Null-safe event binding: if an expected element is momentarily
  // missing (e.g. mid-update cache mismatch), skip it instead of
  // throwing and taking down the rest of initialization with it.
  function on(el, eventName, handler) {
    if (el) el.addEventListener(eventName, handler);
  }

  function cacheElements() {
    els.viewHome = document.getElementById("view-home");
    els.viewList = document.getElementById("view-list");
    els.searchInput = document.getElementById("search-input");
    els.searchClear = document.getElementById("search-clear");
    els.searchResults = document.getElementById("search-results");
    els.categoryCards = document.getElementById("category-cards");
    els.backButton = document.getElementById("back-button");
    els.listTitle = document.getElementById("list-title");
    els.listItems = document.getElementById("list-items");
    els.listEmpty = document.getElementById("list-empty");
    els.listFilterInput = document.getElementById("list-filter-input");
    els.installBanner = document.getElementById("install-banner");
    els.installButton = document.getElementById("install-button");
    els.installModal = document.getElementById("install-modal");
    els.installModalClose = document.getElementById("install-modal-close");
    els.homeButton = document.getElementById("home-button");
    els.shareButton = document.getElementById("share-button");
    els.shareModal = document.getElementById("share-modal");
    els.shareModalClose = document.getElementById("share-modal-close");
    els.shareWhatsapp = document.getElementById("share-whatsapp");
    els.shareSms = document.getElementById("share-sms");
    els.shareEmail = document.getElementById("share-email");
    els.shareCopy = document.getElementById("share-copy");
    els.shareCopyLabel = document.getElementById("share-copy-label");
  }

  // ---------------- Data loading ----------------
  function loadData() {
    fetch("data.json", { cache: "no-cache" })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        state.data.talimatnameler = json.talimatnameler || [];
        state.data.egitimler = json.egitimler || [];
        state.data.cimsaustam = json.cimsaustam || [];
        updateCounts();
        // If a list view is currently open, refresh it
        if (state.currentCategory) renderList(state.currentCategory);
      })
      .catch(function (err) {
        console.error("data.json yüklenemedi:", err);
        updateCounts();
      });
  }

  function updateCounts() {
    document.getElementById("count-talimatnameler").textContent =
      state.data.talimatnameler.length + " doküman";
    document.getElementById("count-egitimler").textContent =
      state.data.egitimler.length + " doküman";
    document.getElementById("count-cimsaustam").textContent =
      state.data.cimsaustam.length + " doküman";
  }

  // ---------------- Turkish-aware text normalize ----------------
  function normalize(str) {
    if (!str) return "";
    var map = { "ı": "i", "İ": "i", "I": "i", "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g",
                "ü": "u", "Ü": "u", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c" };
    return str
      .split("")
      .map(function (ch) { return map[ch] !== undefined ? map[ch] : ch; })
      .join("")
      .toLowerCase();
  }

  function fileExt(path) {
    var m = /\.([a-zA-Z0-9]+)$/.exec(path || "");
    return m ? m[1].toUpperCase() : "DOSYA";
  }

  // ---------------- Routing ----------------
  function handleInitialRoute() {
    var hash = window.location.hash.replace("#", "");
    if (CATEGORY_LABELS.hasOwnProperty(hash)) {
      openCategory(hash, false);
    }
  }

  function showHome() {
    els.viewList.hidden = true;
    els.viewHome.hidden = false;
    state.currentCategory = null;
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  function openCategory(category, pushHash) {
    state.currentCategory = category;
    els.viewHome.hidden = true;
    els.viewList.hidden = false;
    els.listFilterInput.value = "";
    clearSearch();
    renderList(category);
    if (pushHash !== false) window.location.hash = category;
    els.viewList.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function renderList(category, filterQuery) {
    var items = state.data[category] || [];
    els.listTitle.textContent = CATEGORY_LABELS[category] || "Dokümanlar";

    if (filterQuery) {
      var q = normalize(filterQuery);
      items = items.filter(function (it) { return normalize(it.title).indexOf(q) !== -1; });
    }

    els.listItems.innerHTML = "";

    if (items.length === 0) {
      els.listEmpty.hidden = false;
      els.listEmpty.textContent = filterQuery
        ? "Bu aramayla eşleşen bir doküman bulunamadı."
        : "Bu kategoride henüz doküman eklenmedi.";
      return;
    }
    els.listEmpty.hidden = true;

    items.forEach(function (item) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "doc-item";
      a.href = item.file;
      a.target = "_blank";
      a.rel = "noopener";

      a.innerHTML =
        '<span class="doc-item-icon"><svg class="icon"><use href="#icon-file"></use></svg></span>' +
        '<span class="doc-item-body">' +
          '<span class="doc-item-title"></span>' +
          '<span class="doc-item-badge"></span>' +
        '</span>';

      a.querySelector(".doc-item-title").textContent = item.title;
      a.querySelector(".doc-item-badge").textContent = fileExt(item.file);

      li.appendChild(a);
      els.listItems.appendChild(li);
    });
  }

  // ---------------- Global search (home page) ----------------
  function runGlobalSearch(query) {
    var q = normalize(query);
    if (!q) {
      clearSearch();
      return;
    }

    var results = [];
    Object.keys(CATEGORY_LABELS).forEach(function (cat) {
      (state.data[cat] || []).forEach(function (item) {
        if (normalize(item.title).indexOf(q) !== -1) {
          results.push({ item: item, category: cat });
        }
      });
    });

    els.categoryCards.hidden = true;
    els.installBanner.hidden = true;
    els.searchResults.hidden = false;
    els.searchClear.hidden = false;
    els.searchResults.innerHTML = "";

    if (results.length === 0) {
      var empty = document.createElement("div");
      empty.className = "no-results";
      empty.textContent = 'Sonuç bulunamadı: "' + query + '"';
      els.searchResults.appendChild(empty);
      return;
    }

    results.slice(0, 30).forEach(function (r) {
      var a = document.createElement("a");
      a.className = "search-result-item";
      a.href = r.item.file;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML =
        '<span class="search-result-icon"><svg class="icon"><use href="#icon-file"></use></svg></span>' +
        '<span class="search-result-body">' +
          '<span class="search-result-title"></span>' +
          '<span class="search-result-meta"></span>' +
        '</span>';
      a.querySelector(".search-result-title").textContent = r.item.title;
      a.querySelector(".search-result-meta").textContent =
        CATEGORY_LABELS[r.category] + " · " + fileExt(r.item.file);
      els.searchResults.appendChild(a);
    });
  }

  function clearSearch() {
    els.searchInput.value = "";
    els.searchResults.hidden = true;
    els.searchClear.hidden = true;
    els.categoryCards.hidden = false;
    updateInstallBannerVisibility();
  }

  // ---------------- Events ----------------
  function bindEvents() {
    on(els.categoryCards, "click", function (e) {
      var btn = e.target.closest(".nav-card");
      if (!btn) return;
      openCategory(btn.getAttribute("data-category"));
    });

    on(els.backButton, "click", showHome);
    on(els.homeButton, "click", showHome);

    on(els.searchInput, "input", function () {
      runGlobalSearch(els.searchInput.value.trim());
    });
    on(els.searchClear, "click", clearSearch);

    on(els.listFilterInput, "input", function () {
      renderList(state.currentCategory, els.listFilterInput.value.trim());
    });

    window.addEventListener("hashchange", function () {
      var hash = window.location.hash.replace("#", "");
      if (CATEGORY_LABELS.hasOwnProperty(hash)) {
        openCategory(hash, false);
      } else {
        showHome();
      }
    });

    on(els.installModalClose, "click", function () {
      els.installModal.hidden = true;
    });
    on(els.installModal, "click", function (e) {
      if (e.target === els.installModal) els.installModal.hidden = true;
    });
  }

  // ---------------- Add to Home Screen ----------------
  var deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function isIOS() {
    var ua = window.navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) return true;
    // iPadOS 13+ reports as "MacIntel" but has touch support
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }

  function isAndroid() {
    return /android/i.test(window.navigator.userAgent);
  }

  function detectPlatform() {
    if (isIOS()) return "ios";
    if (isAndroid()) return "android";
    return "desktop";
  }

  function showInstallModal() {
    var platform = detectPlatform();
    var lists = els.installModal.querySelectorAll(".install-steps");
    lists.forEach(function (list) {
      list.hidden = list.getAttribute("data-platform") !== platform;
    });
    els.installModal.hidden = false;
  }

  function updateInstallBannerVisibility() {
    if (isStandalone()) {
      els.installBanner.hidden = true;
      return;
    }
    if (!els.searchResults.hidden) return; // don't show while search results are open
    els.installBanner.hidden = false;
  }

  function setupInstallPrompt() {
    if (isStandalone()) {
      els.installBanner.hidden = true;
      return;
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      updateInstallBannerVisibility();
    });

    on(els.installButton, "click", function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
      } else {
        // Native prompt not available (iOS never has it, or Chrome/Android
        // hasn't offered it yet) — show the matching manual instructions.
        showInstallModal();
      }
    });

    // Show banner by default (covers iOS + browsers without beforeinstallprompt yet)
    updateInstallBannerVisibility();

    window.addEventListener("appinstalled", function () {
      els.installBanner.hidden = true;
      deferredPrompt = null;
    });
  }

  // ---------------- Share ----------------
  function getShareUrl() {
    return window.location.origin + window.location.pathname;
  }

  function setupShare() {
    var title = "Çimento Teknik Eğitimleri";
    var text = "Çimento Teknik Eğitimleri — Talimatname ve Eğitim Arşivi";
    var url = getShareUrl();

    on(els.shareButton, "click", function () {
      if (navigator.share) {
        navigator.share({ title: title, text: text, url: url }).catch(function () {
          // User cancelled the native share sheet — nothing to do.
        });
      } else {
        openShareModal(title, text, url);
      }
    });

    on(els.shareModalClose, "click", function () {
      els.shareModal.hidden = true;
    });
    on(els.shareModal, "click", function (e) {
      if (e.target === els.shareModal) els.shareModal.hidden = true;
    });

    on(els.shareCopy, "click", function () {
      copyToClipboard(url);
    });
  }

  function openShareModal(title, text, url) {
    var message = text + " " + url;
    els.shareWhatsapp.href = "https://wa.me/?text=" + encodeURIComponent(message);
    els.shareSms.href = "sms:?body=" + encodeURIComponent(message);
    els.shareEmail.href = "mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(message);
    els.shareCopyLabel.textContent = "Linki Kopyala";
    els.shareModal.hidden = false;
  }

  function copyToClipboard(url) {
    function onCopied() {
      els.shareCopyLabel.textContent = "Kopyalandı ✓";
      setTimeout(function () { els.shareCopyLabel.textContent = "Linki Kopyala"; }, 1800);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(onCopied).catch(function () { legacyCopy(url, onCopied); });
    } else {
      legacyCopy(url, onCopied);
    }
  }

  function legacyCopy(url, onDone) {
    var input = document.createElement("textarea");
    input.value = url;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.focus();
    input.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(input);
    if (onDone) onDone();
  }

  // ---------------- Service worker ----------------
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js").catch(function (err) {
          console.error("Service worker kaydı başarısız:", err);
        });
      });
    }
  }
})();
