const { taxonomy, papers } = window.CORPUS_DATA;

const state = {
  query: "",
  group: "",
  category: "",
  minYear: Math.min(...papers.map((paper) => Number(paper.year)).filter(Boolean)),
  maxYear: Math.max(...papers.map((paper) => Number(paper.year)).filter(Boolean)),
  sort: "corpus",
};

const groupIcons = {
  "Data Specification": "DS",
  "Visualization Construction": "VC",
  "Analytical Thinking": "AT",
  "Exploratory Interaction": "EI",
  "Insight Communication": "IC",
};

const categoryIcons = {
  "Data Retrieval": "Q",
  "Data Generation": "G",
  "Chart Generation": "C",
  "Visual Editing": "E",
  "Layout Structuring": "L",
  "Aesthetic Styling": "S",
  "Epistemic Expression": "P",
  "Sensemaking": "R",
  "Knowledge Construction": "K",
  "Selection": "F",
  "Reconfigurationg": "C",
  "Annotation": "N",
  "Narrative Orchestration": "T",
  "Interpretive Augmentation": "I",
  "Collaborative Alignment": "M",
};

const els = {
  subtitle: document.querySelector("#subtitle"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  minYear: document.querySelector("#minYear"),
  maxYear: document.querySelector("#maxYear"),
  taxonomyFilters: document.querySelector("#taxonomyFilters"),
  paperGrid: document.querySelector("#paperGrid"),
  displayCount: document.querySelector("#displayCount"),
  activeLabel: document.querySelector("#activeLabel"),
  activeDetail: document.querySelector("#activeDetail"),
  sortSelect: document.querySelector("#sortSelect"),
  resetFilters: document.querySelector("#resetFilters"),
  modalBackdrop: document.querySelector("#modalBackdrop"),
  closeModal: document.querySelector("#closeModal"),
  modalTitle: document.querySelector("#modalTitle"),
  modalByline: document.querySelector("#modalByline"),
  modalTags: document.querySelector("#modalTags"),
  modalSketchRole: document.querySelector("#modalSketchRole"),
  modalEvaluation: document.querySelector("#modalEvaluation"),
  modalAbstract: document.querySelector("#modalAbstract"),
  modalBibtex: document.querySelector("#modalBibtex"),
  modalImage: document.querySelector("#modalImage"),
};

function countForGroup(group) {
  return papers.filter((paper) => paper.groups.includes(group)).length;
}

function countForCategory(category) {
  return papers.filter((paper) => paper.categories.includes(category)).length;
}

function placeholderImage(paper) {
  const title = escapeHtml(paper.title);
  const venue = escapeHtml(`${paper.conference || "Paper"} ${paper.year || ""}`.trim());
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#f1f3f4"/>
      <rect x="24" y="24" width="592" height="312" rx="10" fill="#ffffff" stroke="#d5dce0"/>
      <path d="M64 260 L150 196 L218 232 L302 132 L390 190 L494 98 L576 154" fill="none" stroke="#74a9cf" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="64" y="72" width="148" height="18" rx="4" fill="#ff8a65"/>
      <rect x="64" y="104" width="238" height="12" rx="3" fill="#cfd8dc"/>
      <rect x="64" y="126" width="196" height="12" rx="3" fill="#dfe6ea"/>
      <text x="64" y="306" fill="#60717b" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${venue}</text>
      <foreignObject x="260" y="54" width="310" height="92">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial, Helvetica, sans-serif;color:#4f5f66;font-size:22px;font-weight:700;line-height:1.15">${title}</div>
      </foreignObject>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTaxonomy() {
  els.taxonomyFilters.innerHTML = Object.entries(taxonomy).map(([group, categories]) => {
    const categoryButtons = categories.map((category) => `
      <button class="category-button" type="button" data-category="${escapeHtml(category)}" title="${escapeHtml(category)}">
        <span class="category-icon">${categoryIcons[category] || category.slice(0, 1)}</span>
        <span class="category-name">${escapeHtml(category)}</span>
        <span class="category-count">${countForCategory(category)}</span>
      </button>
    `).join("");

    return `
      <div class="group">
        <button class="group-button" type="button" data-group="${escapeHtml(group)}">
          <span>${escapeHtml(group)}</span>
          <span class="group-count">${groupIcons[group]} · ${countForGroup(group)}</span>
        </button>
        <div class="category-grid">${categoryButtons}</div>
      </div>
    `;
  }).join("");

  els.taxonomyFilters.querySelectorAll("[data-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.group;
      state.group = state.group === group ? "" : group;
      state.category = "";
      render();
    });
  });

  els.taxonomyFilters.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      state.category = state.category === category ? "" : category;
      state.group = findGroupForCategory(state.category);
      render();
    });
  });
}

function findGroupForCategory(category) {
  if (!category) return "";
  return Object.entries(taxonomy).find(([, categories]) => categories.includes(category))?.[0] || "";
}

function filteredPapers() {
  const query = state.query.trim().toLowerCase();
  const minYear = Number(state.minYear) || -Infinity;
  const maxYear = Number(state.maxYear) || Infinity;

  const result = papers.filter((paper) => {
    const year = Number(paper.year) || 0;
    const matchesYear = year >= minYear && year <= maxYear;
    const matchesGroup = !state.group || paper.groups.includes(state.group);
    const matchesCategory = !state.category || paper.categories.includes(state.category);
    const haystack = [paper.title, paper.author, paper.conference, paper.year, paper.categories.join(" ")]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesYear && matchesGroup && matchesCategory && matchesQuery;
  });

  return result.sort((a, b) => {
    if (state.sort === "yearDesc") return Number(b.year) - Number(a.year) || a.order - b.order;
    if (state.sort === "yearAsc") return Number(a.year) - Number(b.year) || a.order - b.order;
    if (state.sort === "title") return a.title.localeCompare(b.title);
    return a.order - b.order;
  });
}

function renderCards(list) {
  if (!list.length) {
    els.paperGrid.innerHTML = `<div class="empty-state">No papers match the current filters.</div>`;
    return;
  }

  els.paperGrid.innerHTML = list.map((paper) => `
    <button class="paper-card" type="button" data-order="${paper.order}" aria-label="${escapeHtml(paper.title)}">
      <span class="thumb">
        <img src="${escapeHtml(paper.image)}" alt="${escapeHtml(paper.title)} thumbnail">
      </span>
      <span class="paper-title">${escapeHtml(paper.title)}</span>
      <span class="paper-meta">${escapeHtml(paper.conference)} · ${escapeHtml(paper.year)}</span>
    </button>
  `).join("");

  els.paperGrid.querySelectorAll(".paper-card").forEach((card) => {
    const paper = papers.find((item) => String(item.order) === card.dataset.order);
    const image = card.querySelector("img");
    image.addEventListener("error", () => {
      image.src = placeholderImage(paper);
    }, { once: true });
    card.addEventListener("click", () => openModal(paper));
  });
}

function renderActiveFilters(list) {
  els.displayCount.textContent = String(list.length);
  const label = state.category || state.group || "All papers";
  els.activeLabel.textContent = label;
  const detail = [];
  if (state.query) detail.push(`search: “${state.query}”`);
  detail.push(`${state.minYear}-${state.maxYear}`);
  els.activeDetail.textContent = detail.join(" · ");

  els.taxonomyFilters.querySelectorAll("[data-group]").forEach((button) => {
    button.classList.toggle("active", button.dataset.group === state.group);
  });
  els.taxonomyFilters.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === state.category);
  });
}

function render() {
  const list = filteredPapers();
  renderActiveFilters(list);
  renderCards(list);
}

function openModal(paper) {
  els.modalTitle.textContent = `${paper.title} (${paper.year})`;
  els.modalByline.textContent = `by ${paper.author || "Unknown author"} · ${paper.conference || "Unknown venue"}`;
  els.modalTags.innerHTML = paper.categories.map((category) => `<span class="tag">${escapeHtml(category)}</span>`).join("");
  els.modalSketchRole.textContent = paper.sketchRole || "No sketch role recorded.";
  els.modalEvaluation.textContent = paper.evaluationType || paper.evaluation || "No evaluation summary recorded.";
  els.modalAbstract.textContent = paper.abstract || "No abstract recorded.";
  els.modalBibtex.textContent = paper.bibtex || "";
  els.modalImage.src = paper.image;
  els.modalImage.alt = `${paper.title} thumbnail`;
  els.modalImage.onerror = () => {
    els.modalImage.src = placeholderImage(paper);
  };
  els.modalBackdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  els.modalBackdrop.hidden = true;
  document.body.style.overflow = "";
}

function resetFilters() {
  state.query = "";
  state.group = "";
  state.category = "";
  state.minYear = Math.min(...papers.map((paper) => Number(paper.year)).filter(Boolean));
  state.maxYear = Math.max(...papers.map((paper) => Number(paper.year)).filter(Boolean));
  state.sort = "corpus";
  els.searchInput.value = "";
  els.minYear.value = state.minYear;
  els.maxYear.value = state.maxYear;
  els.sortSelect.value = state.sort;
  render();
}

function bindEvents() {
  els.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = els.searchInput.value;
    render();
  });

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    render();
  });

  els.minYear.addEventListener("change", () => {
    state.minYear = els.minYear.value;
    render();
  });

  els.maxYear.addEventListener("change", () => {
    state.maxYear = els.maxYear.value;
    render();
  });

  els.sortSelect.addEventListener("change", () => {
    state.sort = els.sortSelect.value;
    render();
  });

  els.resetFilters.addEventListener("click", resetFilters);
  els.closeModal.addEventListener("click", closeModal);
  els.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === els.modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.modalBackdrop.hidden) closeModal();
  });
}

function init() {
  els.subtitle.textContent = `${papers.length} papers organized by two-level sketch taxonomy`;
  els.minYear.value = state.minYear;
  els.maxYear.value = state.maxYear;
  buildTaxonomy();
  bindEvents();
  render();
}

init();
