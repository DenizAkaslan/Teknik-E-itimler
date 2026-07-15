(function () {
  "use strict";

  const appEl = document.getElementById("app");
  let CATEGORIES = [];

  const PDF_ICON_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6C4.9,2 4,2.9 4,4v16c0,1.1 0.89,2 1.99,2H18c1.1,0 2,-0.9 2,-2V8L14,2zM13,9V3.5L18.5,9H13z"/></svg>`;

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  async function loadData() {
    const res = await fetch("data/trainings.json");
    const json = await res.json();
    CATEGORIES = json.categories;
  }

  // ---------- Router ----------
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    if (parts.length === 0) return { view: "categories" };
    if (parts[0] === "kategori" && parts[1]) return { view: "trainings", categoryId: parts[1] };
    if (parts[0] === "egitim" && parts[1]) return { view: "pdf", trainingId: parts[1] };
    return { view: "categories" };
  }

  function navigate(hash) {
    location.hash = hash;
  }

  window.addEventListener("hashchange", render);

  // ---------- Views ----------
  function renderToolbar(title, showBack) {
    return `
      <div class="toolbar ${showBack ? "has-back" : ""}">
        <button class="back-btn" onclick="history.back()" aria-label="Geri">&#8592;</button>
        <h1>${escapeHtml(title)}</h1>
      </div>
    `;
  }

  function renderCategoriesView() {
    const cards = CATEGORIES.map((cat) => {
      const mustCount = cat.trainings.filter((t) => t.level === "MUST").length;
      return `
        <div class="card" onclick="location.hash='#/kategori/${cat.id}'">
          <h3>${escapeHtml(cat.name)}</h3>
          <p>${escapeHtml(cat.description)}</p>
          <div class="meta">${cat.trainings.length} eğitim &nbsp;•&nbsp; ${mustCount} zorunlu (Must)</div>
        </div>
      `;
    }).join("");

    appEl.innerHTML = `
      ${renderToolbar("Bakım Eğitimleri", false)}
      <div class="content">${cards}</div>
    `;
  }

  function renderTrainingsView(categoryId, filter) {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (!category) { navigate("#/"); return; }

    const currentFilter = filter || "all";
    let list = category.trainings;
    if (currentFilter === "must") list = list.filter((t) => t.level === "MUST");
    if (currentFilter === "basic") list = list.filter((t) => t.level !== "MUST");

    const chips = `
      <div class="chip-row">
        <div class="chip ${currentFilter === "all" ? "active" : ""}" data-filter="all">Tümü</div>
        <div class="chip ${currentFilter === "must" ? "active" : ""}" data-filter="must">Zorunlu (Must)</div>
        <div class="chip ${currentFilter === "basic" ? "active" : ""}" data-filter="basic">Temel (Basic)</div>
      </div>
    `;

    const items = list.length === 0
      ? `<div class="empty">Bu kategoride henüz doküman yok.</div>`
      : list.map((t) => {
          const isMust = t.level === "MUST";
          return `
            <div class="card training-card" onclick="location.hash='#/egitim/${t.id}'">
              <div class="icon">${PDF_ICON_SVG}</div>
              <div class="body">
                <h3>${escapeHtml(t.title)}</h3>
              </div>
              <div class="badge ${isMust ? "must" : "basic"}">${isMust ? "MUST" : "BASIC"}</div>
            </div>
          `;
        }).join("");

    appEl.innerHTML = `
      ${renderToolbar(category.name, true)}
      <div class="content">${chips}${items}</div>
    `;

    appEl.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        currentTrainingsFilter = chip.dataset.filter;
        renderTrainingsView(categoryId, currentTrainingsFilter);
      });
    });
  }

  let currentTrainingsFilter = "all";

  function findTraining(trainingId) {
    for (const cat of CATEGORIES) {
      const t = cat.trainings.find((tr) => tr.id === trainingId);
      if (t) return t;
    }
    return null;
  }

  function renderPdfView(trainingId) {
    const training = findTraining(trainingId);
    if (!training) { navigate("#/"); return; }

    appEl.innerHTML = `
      ${renderToolbar(training.title, true)}
      <embed class="pdf-frame" src="pdfs/${training.pdfFileName}" type="application/pdf" />
    `;
  }

  function render() {
    const route = parseHash();
    if (route.view === "categories") renderCategoriesView();
    else if (route.view === "trainings") renderTrainingsView(route.categoryId, currentTrainingsFilter);
    else if (route.view === "pdf") renderPdfView(route.trainingId);
  }

  // ---------- Boot ----------
  loadData().then(render);

  // ---------- Offline indicator ----------
  const pill = document.createElement("div");
  pill.className = "offline-pill";
  pill.textContent = "Çevrimdışı";
  document.body.appendChild(pill);
  function updateOnlineState() {
    pill.classList.toggle("show", !navigator.onLine);
  }
  window.addEventListener("online", updateOnlineState);
  window.addEventListener("offline", updateOnlineState);
  updateOnlineState();

  // ---------- Service worker registration ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }

  // ---------- Install prompt (Android/Chrome) ----------
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById("installBanner")) return;
    const banner = document.createElement("div");
    banner.className = "install-banner";
    banner.id = "installBanner";
    banner.innerHTML = `
      <span style="flex:1">Bu uygulamayı ana ekranınıza ekleyin</span>
      <button id="installBtn">Ekle</button>
      <button class="dismiss" id="dismissBtn">&times;</button>
    `;
    document.body.appendChild(banner);
    document.getElementById("installBtn").addEventListener("click", async () => {
      banner.remove();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      }
    });
    document.getElementById("dismissBtn").addEventListener("click", () => banner.remove());
  }
})();
