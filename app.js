// ==========================================================================
// State Aplikasi & Inisialisasi Data
// ==========================================================================
// Semester bisa berbeda per prodi (mis. Statistika Matematika 1: Stat smt 2, Mat smt 3).
// Untuk MK pilihan, nilainya adalah semester anjuran; null = tanpa anjuran.
function semesterFor(course, prodi) {
  if (prodi && prodi !== "all") {
    return (course.semesterProdi || {})[prodi] ?? null;
  }
  return course.semester ?? null;
}

function compareCourses(prodi) {
  return (a, b) => {
    const semA = semesterFor(a, prodi) ?? 9;
    const semB = semesterFor(b, prodi) ?? 9;
    if (semA !== semB) return semA - semB;
    return a.kode.localeCompare(b.kode, "id-ID");
  };
}

let allCourses = (window.kurikulumData || []).sort(compareCourses("all"));
let filteredCourses = [...allCourses];

// State filter & tampilan
let currentQuery = "";
let currentProdi = "all";
let currentKategori = "all";
let currentSks = "all";
let currentViewMode = "grid"; // 'grid' atau 'table'

// ==========================================================================
// DOM Elements
// ==========================================================================
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const prodiFilters = document.getElementById("filter-prodi");
const kategoriFilter = document.getElementById("filter-kategori");
const sksFilter = document.getElementById("filter-sks");

const gridViewContainer = document.getElementById("grid-view");
const tableViewContainer = document.getElementById("table-view");
const tableBody = document.getElementById("table-body");
const emptyState = document.getElementById("empty-state");

const gridViewBtn = document.getElementById("view-grid-btn");
const tableViewBtn = document.getElementById("view-table-btn");
const chartViewBtn = document.getElementById("view-chart-btn");
const chartViewContainer = document.getElementById("chart-view");
const themeToggleBtn = document.getElementById("theme-toggle");

const statTotalCourses = document.getElementById("stat-total-courses");
const statPrereqsCount = document.getElementById("stat-prereqs-count");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

// Detail Dialog
const detailDialog = document.getElementById("course-detail-dialog");
const closeDialogBtn = document.getElementById("close-dialog-btn");

// ==========================================================================
// Logika Tema Gelap/Terang (Dark/Light Mode)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeToggleIcon(true);
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    updateThemeToggleIcon(false);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const isDark = currentTheme === "dark";
  const newTheme = isDark ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeToggleIcon(!isDark);
}

function updateThemeToggleIcon(isDark) {
  const icon = themeToggleBtn.querySelector("i");
  if (isDark) {
    icon.className = "fa-solid fa-sun";
  } else {
    icon.className = "fa-solid fa-moon";
  }
}

// ==========================================================================
// Logika Pencarian & Pemfilteran Data
// ==========================================================================
function applyFilters() {
  const query = currentQuery.toLowerCase().trim();
  
  filteredCourses = allCourses.filter(course => {
    // 1. Filter Pencarian Text (Kode, Nama, Deskripsi, Prasyarat)
    const matchesQuery = !query || 
      course.nama.toLowerCase().includes(query) || 
      course.kode.toLowerCase().includes(query) || 
      course.deskripsi.toLowerCase().includes(query) ||
      (course.prasyarat && course.prasyarat.some(pre => pre.toLowerCase().includes(query)));
      
    // 2. Filter Program Studi
    const matchesProdi = currentProdi === "all" || 
      (course.prodi && course.prodi.includes(currentProdi));
      
    // 3. Filter Kategori
    const matchesKategori = currentKategori === "all" || 
      course.kategori === currentKategori;
      
    // 4. Filter SKS
    const matchesSks = currentSks === "all" || 
      course.sks.toString() === currentSks;
      
    return matchesQuery && matchesProdi && matchesKategori && matchesSks;
  }).sort(compareCourses(currentProdi));
  
  updateStatistics();
  renderContent();
}

function updateStatistics() {
  let totalSks = 0;
  let prereqsCount = 0;
  
  filteredCourses.forEach(course => {
    totalSks += course.sks;
    if (course.prasyarat && course.prasyarat.length > 0 && course.prasyarat[0] !== "Tidak ada") {
      prereqsCount++;
    }
  });
  
  statTotalCourses.innerText = filteredCourses.length;
  statPrereqsCount.innerText = prereqsCount;
}

// ==========================================================================
// Logika Rendering Antarmuka (View Mode)
// ==========================================================================
function renderContent() {
  // Kosongkan container
  gridViewContainer.innerHTML = "";
  tableBody.innerHTML = "";
  
  gridViewContainer.style.display = "none";
  tableViewContainer.style.display = "none";
  chartViewContainer.style.display = "none";

  if (filteredCourses.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  if (currentViewMode === "grid") {
    gridViewContainer.style.display = "grid";
    renderGridView();
  } else if (currentViewMode === "table") {
    tableViewContainer.style.display = "block";
    renderTableView();
  } else {
    chartViewContainer.style.display = "block";
    renderChartView();
  }
}

// Render sebagai Grid Kartu (Grid View)
function renderGridView() {
  filteredCourses.forEach(course => {
    const card = document.createElement("div");
    card.className = "course-card";
    
    // Cek irisan prodi
    const isOverlap = course.prodi && course.prodi.length > 1;
    
    // Siapkan badge prodi
    let prodiHtml = "";
    course.prodi.forEach(p => {
      let labelClass = "prodi-badge";
      if (p === "Matematika") labelClass += " mat";
      else if (p === "Statistika") labelClass += " stat";
      else if (p === "Ilmu Aktuaria") labelClass += " aktu";
      
      if (isOverlap) labelClass += " overlap";
      prodiHtml += `<span class="${labelClass}">${p}</span>`;
    });
    
    card.innerHTML = `
      <div class="card-top">
        <span class="card-code">${course.kode}</span>
        <span class="card-sks">${course.sks} SKS</span>
      </div>
      <h3 class="card-name">${course.nama}</h3>
      <div class="card-bottom">
        <span class="card-category">${course.kategori.replace("Mata Kuliah ", "")}</span>
        <div class="card-prodis">
          ${prodiHtml}
        </div>
      </div>
    `;
    
    card.addEventListener("click", () => openCourseDetail(course));
    gridViewContainer.appendChild(card);
  });
}

// Render sebagai Baris Tabel (Table View)
function renderTableView() {
  filteredCourses.forEach((course, index) => {
    const row = document.createElement("tr");
    
    row.innerHTML = `
      <td style="text-align: center; color: var(--text-faint); font-weight: 600;">${index + 1}</td>
      <td class="table-code">${course.kode}</td>
      <td class="table-name">${course.nama}</td>
      <td class="table-category">${course.kategori}</td>
      <td class="table-sks">${course.sks}</td>
      <td class="table-semester">${semesterFor(course, currentProdi) || "—"}</td>
    `;
    
    row.addEventListener("click", () => openCourseDetail(course));
    tableBody.appendChild(row);
  });
}

// ==========================================================================
// Resolusi Prasyarat (nama -> kode mata kuliah)
// Data prasyarat berupa teks nama, kadang digabung koma & ejaannya beragam.
// ==========================================================================
const PREREQ_ALIASES = {
  "praktikum pdb": "praktikum persamaan diferensial biasa",
  "aljabar linear": "aljabar linear 1",
  "pemodelan matematis": "pemodelan matematika",
  "logika dan teori himpunan": "logika dan himpunan",
  "lulus metode penelitian": "metode penelitian",
};

function normalizeName(s) {
  let n = s.toLowerCase().trim().replace(/\.+$/, "")
    .replace(/&/g, " dan ")
    .replace(/linier/g, "linear")
    .replace(/stokhastik/g, "stokastik")
    .replace(/intellegence/g, "intelligence")
    .replace(/\s+/g, " ").trim();
  return PREREQ_ALIASES[n] || n;
}

const coursesByName = new Map();
allCourses.forEach(c => {
  const key = normalizeName(c.nama);
  if (!coursesByName.has(key)) coursesByName.set(key, []);
  coursesByName.get(key).push(c);
});

// Hasil: { courses: [objek MK], notes: [syarat non-MK, mis. "Lulus minimal 80 SKS"] }
const prereqCache = new Map();
function resolvePrereqs(course) {
  if (prereqCache.has(course.kode)) return prereqCache.get(course.kode);
  const result = { courses: [], notes: [] };
  (course.prasyarat || []).forEach(raw => {
    raw.split(",").forEach(part => {
      const text = part.trim().replace(/\.+$/, "");
      if (!text || text.toLowerCase() === "tidak ada") return;
      const byCode = allCourses.find(c => c.kode === text);
      const candidates = byCode ? [byCode] : (coursesByName.get(normalizeName(text)) || []);
      if (candidates.length === 0) {
        result.notes.push(text);
        return;
      }
      // Nama ganda (mis. Model Stokastik 1 di Stat & Aktu): pilih yang prodinya sama
      const match = candidates.find(c => c.prodi.some(p => course.prodi.includes(p))) || candidates[0];
      if (match.kode !== course.kode && !result.courses.includes(match)) result.courses.push(match);
    });
  });
  prereqCache.set(course.kode, result);
  return result;
}

// ==========================================================================
// Bagan Prasyarat (Chart View)
// ==========================================================================
const chartColumns = document.getElementById("chart-columns");
const chartEdges = document.getElementById("chart-edges");
const chartCanvas = document.getElementById("chart-canvas");
const chartInfo = document.getElementById("chart-info");
const chartNotice = document.getElementById("chart-notice");
const chartInfoDefault = chartInfo.innerHTML;
let chartSelected = null;
let chartNodeEls = new Map();
let chartEdgeList = [];

function renderChartView() {
  chartColumns.innerHTML = "";
  chartNodeEls = new Map();
  const visible = new Set(filteredCourses.map(c => c.kode));
  if (chartSelected && !visible.has(chartSelected)) chartSelected = null;

  // Pisahkan MK wajib (alur utama) dan MK pilihan (pita terpisah di bawah),
  // keduanya dikelompokkan per semester milik prodi yang sedang dipilih.
  const isElective = c => c.kategori === "Mata Kuliah Pilihan";
  const nPilihan = filteredCourses.filter(isElective).length;
  const nWajib = filteredCourses.length - nPilihan;

  chartNotice.innerHTML = currentProdi === "all"
    ? '<i class="fa-solid fa-circle-info"></i><span>Bagan paling mudah dibaca per prodi. Pilih <b>Matematika</b>, <b>Statistika</b>, atau <b>Ilmu Aktuaria</b> di atas.</span>'
    : `<span><b>${currentProdi}</b> — ${nWajib} mata kuliah wajib dalam 8 semester, ditambah ${nPilihan} mata kuliah pilihan. Warna kotak makin pekat seiring semester.</span>`;
  chartNotice.classList.toggle("is-hint", currentProdi === "all");
  const groupBySemester = list => {
    const groups = new Map();
    list.forEach(c => {
      const key = semesterFor(c, currentProdi) ?? "none";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(c);
    });
    return groups;
  };
  const wajibGroups = groupBySemester(filteredCourses.filter(c => !isElective(c)));
  const pilihanGroups = groupBySemester(filteredCourses.filter(isElective));
  // Kolom yang sama untuk kedua pita, supaya MK pilihan sejajar dengan semesternya
  // Per prodi, tampilkan selalu semester 1-8 (semester MBKM yang kosong tetap terlihat)
  const baseKeys = currentProdi !== "all" ? [1, 2, 3, 4, 5, 6, 7, 8] : [];
  // MK pilihan tanpa anjuran semester tidak dapat kolom; ditaruh di grid terpisah
  const pilihanKeys = [...pilihanGroups.keys()].filter(k => k !== "none");
  const keys = [...new Set([...baseKeys, ...wajibGroups.keys(), ...pilihanKeys])]
    .sort((a, b) => (a === "none" ? 99 : a) - (b === "none" ? 99 : b));

  const makeNode = course => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "chart-node";
    if (isElective(course)) node.classList.add("elective");
    node.dataset.kode = course.kode;
    const pai = currentProdi === "Ilmu Aktuaria" && course.ujianPAI
      ? `<span class="chart-node-pai" title="Disetarakan dengan Mata Uji PAI ${course.ujianPAI}">${course.ujianPAI.split(" ")[0]}</span>`
      : "";
    node.innerHTML = `
      <span class="chart-node-name">${course.nama}</span>
      <span class="chart-node-meta">${pai}<span class="chart-node-code">${course.kode}</span> · ${course.sks} SKS</span>`;
    node.title = `${course.nama} (${course.kode}) — klik untuk sorot, klik dua kali untuk detail`;
    node.addEventListener("click", () => {
      chartSelected = chartSelected === course.kode ? null : course.kode;
      applyChartHighlight();
    });
    node.addEventListener("dblclick", () => openCourseDetail(course));
    chartNodeEls.set(course.kode, node);
    return node;
  };

  const renderBand = (groups, kind) => {
    const band = document.createElement("div");
    band.className = `chart-band ${kind}`;
    if (kind === "pilihan") {
      const total = [...groups.values()].reduce((n, l) => n + l.length, 0);
      const hasAnjuran = pilihanKeys.length > 0;
      band.innerHTML = `
        <div class="chart-band-head">
          <span class="chart-band-title">Mata Kuliah Pilihan</span>
          <span class="chart-col-meta">${total} MK${hasAnjuran ? " · disusun menurut semester anjuran" : " · dapat diambil di semester 6–7 (MBKM)"}</span>
        </div>`;
    }
    const row = document.createElement("div");
    row.className = "chart-row";
    keys.forEach(key => {
      const list = groups.get(key) || [];
      const col = document.createElement("div");
      col.className = "chart-col";
      col.dataset.sem = key;
      const totalSks = list.reduce((s, c) => s + c.sks, 0);
      if (kind === "wajib") {
        col.innerHTML = `
          <div class="chart-col-head">
            <span class="chart-col-title">${key === "none" ? "Pilihan Bebas" : "Semester " + key}</span>
            <span class="chart-col-meta">${list.length ? `${list.length} MK · ${totalSks} SKS` : key === "none" ? "Tanpa anjuran semester" : "Pilihan / MBKM"}</span>
          </div>`;
      } else if (list.length) {
        col.innerHTML = `
          <div class="chart-col-subhead">${key === "none" ? "Tanpa anjuran semester" : "Anjuran smt " + key} · ${list.length} MK</div>`;
      }
      const body = document.createElement("div");
      body.className = "chart-col-body";
      list.forEach(course => body.appendChild(makeNode(course)));
      col.appendChild(body);
      row.appendChild(col);
    });
    if (keys.some(k => (groups.get(k) || []).length)) band.appendChild(row);

    const free = kind === "pilihan" ? groups.get("none") || [] : [];
    if (free.length) {
      const grid = document.createElement("div");
      grid.className = "chart-free";
      if (pilihanKeys.length) {
        grid.innerHTML = `<div class="chart-col-subhead">Tanpa anjuran semester · ${free.length} MK</div>`;
      }
      const body = document.createElement("div");
      body.className = "chart-free-grid";
      free.forEach(course => body.appendChild(makeNode(course)));
      grid.appendChild(body);
      band.appendChild(grid);
    }
    chartColumns.appendChild(band);
  };

  if (wajibGroups.size) renderBand(wajibGroups, "wajib");
  if (pilihanGroups.size) renderBand(pilihanGroups, "pilihan");

  // Daftar garis: hanya antar MK yang sedang tampil
  chartEdgeList = [];
  filteredCourses.forEach(c => {
    resolvePrereqs(c).courses.forEach(pre => {
      if (visible.has(pre.kode)) chartEdgeList.push({ from: pre.kode, to: c.kode });
    });
  });
  // Titik sambung di sisi kotak (kiri = punya prasyarat, kanan = membuka MK lain)
  chartEdgeList.forEach(e => {
    chartNodeEls.get(e.from).classList.add("has-out");
    chartNodeEls.get(e.to).classList.add("has-in");
  });

  renderSemesterNav(keys.filter(k => k !== "none"), nPilihan > 0);

  requestAnimationFrame(() => {
    drawChartEdges();
    applyChartHighlight();
  });
}

// --------------------------------------------------------------------------
// Navigasi semester: tombol 1-8 (+ Pilihan) yang menandai kolom yang sedang
// terlihat dan menggulir bagan ke semester yang diklik.
// --------------------------------------------------------------------------
const chartScroll = document.getElementById("chart-scroll");
const chartSemnav = document.getElementById("chart-semnav");

function renderSemesterNav(semesters, hasPilihan) {
  chartSemnav.innerHTML = "";
  const track = document.createElement("div");
  track.className = "semnav-track";
  semesters.forEach(sem => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "semnav-btn";
    btn.dataset.sem = sem;
    btn.textContent = sem;
    btn.title = `Semester ${sem}`;
    btn.addEventListener("click", () => {
      const col = chartColumns.querySelector(`.chart-band.wajib .chart-col[data-sem="${sem}"]`);
      if (col) chartScroll.scrollTo({ left: col.offsetLeft - 16, behavior: "smooth" });
    });
    track.appendChild(btn);
  });
  chartSemnav.appendChild(track);

  if (hasPilihan) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "semnav-pilihan";
    btn.innerHTML = 'Pilihan <i class="fa-solid fa-arrow-down"></i>';
    btn.addEventListener("click", () => {
      const band = chartColumns.querySelector(".chart-band.pilihan");
      if (band) chartScroll.scrollTo({ top: band.offsetTop - 8, behavior: "smooth" });
    });
    chartSemnav.appendChild(btn);
  }
  chartSemnav.style.display = semesters.length ? "flex" : "none";
  requestAnimationFrame(updateSemesterNav);
}

function updateSemesterNav() {
  const left = chartScroll.scrollLeft;
  const right = left + chartScroll.clientWidth;
  const buttons = [...chartSemnav.querySelectorAll(".semnav-btn")];
  const inView = buttons.map(btn => {
    const col = chartColumns.querySelector(`.chart-band.wajib .chart-col[data-sem="${btn.dataset.sem}"]`);
    if (!col) return false;
    const mid = col.offsetLeft + col.offsetWidth / 2;
    return mid >= left && mid <= right;
  });
  // Tombol yang terlihat digabung jadi satu "pil" bersambung
  buttons.forEach((btn, i) => {
    btn.classList.toggle("in-view", inView[i]);
    btn.classList.toggle("run-start", inView[i] && !inView[i - 1]);
    btn.classList.toggle("run-end", inView[i] && !inView[i + 1]);
  });
}

let semnavTicking = false;
chartScroll.addEventListener("scroll", () => {
  if (semnavTicking) return;
  semnavTicking = true;
  requestAnimationFrame(() => {
    updateSemesterNav();
    semnavTicking = false;
  });
});

function drawChartEdges() {
  const base = chartCanvas.getBoundingClientRect();
  chartEdges.setAttribute("width", chartCanvas.scrollWidth);
  chartEdges.setAttribute("height", chartCanvas.scrollHeight);
  chartEdges.innerHTML = "";
  chartEdgeList.forEach(edge => {
    const a = chartNodeEls.get(edge.from).getBoundingClientRect();
    const b = chartNodeEls.get(edge.to).getBoundingClientRect();
    let x1, y1 = a.top + a.height / 2 - base.top, x2, y2 = b.top + b.height / 2 - base.top, d;
    if (Math.abs(a.left - b.left) < 4) {
      // Satu kolom yang sama: lengkungkan di sisi kanan
      x1 = a.right - base.left; x2 = b.right - base.left;
      const bulge = 28 + Math.min(40, Math.abs(y2 - y1) * 0.15);
      d = `M${x1},${y1} C${x1 + bulge},${y1} ${x2 + bulge},${y2} ${x2},${y2}`;
    } else {
      x1 = a.right - base.left; x2 = b.left - base.left;
      const dx = Math.max(30, (x2 - x1) * 0.5);
      d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
    }
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.dataset.from = edge.from;
    path.dataset.to = edge.to;
    // Garis ke/dari MK pilihan hanya muncul saat disorot, agar alur wajib tetap terbaca
    const fromEl = chartNodeEls.get(edge.from), toEl = chartNodeEls.get(edge.to);
    if (fromEl.classList.contains("elective") || toEl.classList.contains("elective")) {
      path.classList.add("via-elective");
    }
    chartEdges.appendChild(path);
  });
}

// Telusuri seluruh rantai ke belakang (prasyarat) atau ke depan (membuka)
function collectChain(start, direction) {
  const out = new Set();
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    chartEdgeList.forEach(e => {
      const [src, dst] = direction === "up" ? [e.to, e.from] : [e.from, e.to];
      if (src === cur && !out.has(dst)) { out.add(dst); stack.push(dst); }
    });
  }
  return out;
}

function applyChartHighlight() {
  const sel = chartSelected;
  chartColumns.classList.toggle("has-selection", !!sel);
  chartEdges.classList.toggle("has-selection", !!sel);
  const ups = sel ? collectChain(sel, "up") : new Set();
  const downs = sel ? collectChain(sel, "down") : new Set();

  chartNodeEls.forEach((el, kode) => {
    el.classList.toggle("is-selected", kode === sel);
    el.classList.toggle("is-pre", ups.has(kode));
    el.classList.toggle("is-next", downs.has(kode));
  });
  chartEdges.querySelectorAll("path").forEach(p => {
    const { from, to } = p.dataset;
    const pre = sel && (to === sel || ups.has(to)) && (ups.has(from));
    const next = sel && (from === sel || downs.has(from)) && downs.has(to);
    p.classList.toggle("is-pre", !!pre);
    p.classList.toggle("is-next", !!next);
    if (pre || next) chartEdges.appendChild(p); // bawa ke lapisan atas
  });

  if (!sel) {
    chartInfo.innerHTML = chartInfoDefault;
    return;
  }
  const course = allCourses.find(c => c.kode === sel);
  const notes = resolvePrereqs(course).notes;
  chartInfo.innerHTML = `
    <span class="chart-info-name">${course.nama}</span>
    <span class="chart-info-stat pre">${ups.size} prasyarat</span>
    <span class="chart-info-stat next">membuka ${downs.size} MK</span>
    ${notes.length ? `<span class="chart-info-note">Syarat lain: ${notes.join(", ")}</span>` : ""}
    <button type="button" class="chart-info-btn" id="chart-detail-btn">Lihat detail</button>`;
  document.getElementById("chart-detail-btn").addEventListener("click", () => openCourseDetail(course));
}

let chartResizeTimer;
window.addEventListener("resize", () => {
  if (currentViewMode !== "chart") return;
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    drawChartEdges();
    applyChartHighlight();
    updateSemesterNav();
  }, 120);
});

// ==========================================================================
// Logika Dialog Detail & MathJax (UI/UX Enhance)
// ==========================================================================
function openCourseDetail(course) {
  document.getElementById("modal-course-name").innerText = course.nama;
  document.getElementById("modal-course-code").innerText = course.kode;
  document.getElementById("modal-sks").innerText = `${course.sks} SKS`;
  
  const modalCategory = document.getElementById("modal-category");
  modalCategory.innerText = course.kategori;
  
  // Render prodi tags di modal
  const modalProdiList = document.getElementById("modal-prodi-list");
  modalProdiList.innerHTML = "";
  course.prodi.forEach(p => {
    const tag = document.createElement("span");
    let labelClass = "dialog-prodi-tag";
    if (p === "Matematika") labelClass += " mat";
    else if (p === "Statistika") labelClass += " stat";
    else if (p === "Ilmu Aktuaria") labelClass += " aktu";
    
    tag.className = labelClass;
    const sem = course.semesterProdi && course.semesterProdi[p];
    const semLabel = course.kategori === "Mata Kuliah Pilihan" ? "anjuran smt" : "smt";
    tag.innerText = sem ? `${p} · ${semLabel} ${sem}` : p;
    modalProdiList.appendChild(tag);
  });
  if (course.ujianPAI) {
    const pai = document.createElement("span");
    pai.className = "dialog-prodi-tag pai";
    pai.innerText = `Setara Mata Uji PAI ${course.ujianPAI}`;
    pai.title = "Disetarakan dengan Mata Uji Profesi Ajun Aktuaris (Persatuan Aktuaris Indonesia)";
    modalProdiList.appendChild(pai);
  }
  
  // Render deskripsi (LaTeX support)
  const modalDescription = document.getElementById("modal-description");
  modalDescription.innerHTML = course.deskripsi || "Tidak ada deskripsi mata kuliah pada berkas sumber.";
  
  // Render prasyarat
  const modalPrereqs = document.getElementById("modal-prereqs");
  modalPrereqs.innerHTML = "";
  
  const resolved = resolvePrereqs(course);
  if (resolved.courses.length > 0 || resolved.notes.length > 0) {
    resolved.courses.forEach(foundPre => {
      const link = document.createElement("a");
      link.className = "prereq-link";
      link.innerText = `${foundPre.kode} - ${foundPre.nama}`;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        // Buka langsung detail prasyarat tersebut
        openCourseDetail(foundPre);
      });
      modalPrereqs.appendChild(link);
    });
    resolved.notes.forEach(note => {
      const span = document.createElement("span");
      span.className = "prereq-link";
      span.innerText = note;
      modalPrereqs.appendChild(span);
    });
  } else {
    modalPrereqs.innerHTML = '<span class="prereq-empty">Tidak ada prasyarat</span>';
  }
  
  // Render referensi buku wajib
  const modalReferences = document.getElementById("modal-references");
  modalReferences.innerHTML = "";
  if (course.referensi && course.referensi.length > 0) {
    course.referensi.forEach(ref => {
      const li = document.createElement("li");
      li.innerText = ref;
      modalReferences.appendChild(li);
    });
  } else {
    modalReferences.innerHTML = '<li class="prereq-empty">Tidak ada referensi buku terdaftar</li>';
  }
  
  // Buka Dialog Native
  detailDialog.showModal();
  
  // Render ulang rumus LaTeX dinamis di dalam modal menggunakan MathJax
  if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
    window.MathJax.typesetPromise([modalDescription]).catch((err) => console.log(err.message));
  }
}

// Close dialog
closeDialogBtn.addEventListener("click", () => {
  detailDialog.close();
});

// Close dialog click outside (backdrop)
detailDialog.addEventListener("click", (e) => {
  const dialogDimensions = detailDialog.getBoundingClientRect();
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    detailDialog.close();
  }
});

// ==========================================================================
// Bootstrapping & Event Listeners
// ==========================================================================
function initApp() {
  initTheme();
  
  // Search input listeners
  searchInput.addEventListener("input", (e) => {
    currentQuery = e.target.value;
    applyFilters();
  });
  
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentQuery = "";
    applyFilters();
  });
  

  
  // Prodi Filter Pills click listeners
  prodiFilters.addEventListener("click", (e) => {
    if (e.target.classList.contains("pill-btn")) {
      prodiFilters.querySelectorAll(".pill-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      currentProdi = e.target.dataset.value;
      applyFilters();
    }
  });
  
  // Select Dropdown listeners
  kategoriFilter.addEventListener("change", (e) => {
    currentKategori = e.target.value;
    applyFilters();
  });
  
  sksFilter.addEventListener("change", (e) => {
    currentSks = e.target.value;
    applyFilters();
  });
  
  // Reset all filters button
  const resetAll = () => {
    searchInput.value = "";
    currentQuery = "";
    currentKategori = "all";
    currentSks = "all";
    currentProdi = "all";
    
    kategoriFilter.value = "all";
    sksFilter.value = "all";
    
    prodiFilters.querySelectorAll(".pill-btn").forEach(btn => btn.classList.remove("active"));
    prodiFilters.querySelector('[data-value="all"]').classList.add("active");
    
    applyFilters();
  };
  
  resetFiltersBtn.addEventListener("click", resetAll);
  
  // View Toggle listeners
  const viewButtons = { grid: gridViewBtn, table: tableViewBtn, chart: chartViewBtn };
  Object.entries(viewButtons).forEach(([mode, btn]) => {
    btn.addEventListener("click", () => {
      if (currentViewMode === mode) return;
      currentViewMode = mode;
      Object.values(viewButtons).forEach(b => b.classList.toggle("active", b === btn));
      renderContent();
    });
  });
  
  // Theme Toggle listener
  themeToggleBtn.addEventListener("click", toggleTheme);
  
  // Jalankan render awal
  applyFilters();
}

window.addEventListener("DOMContentLoaded", initApp);
