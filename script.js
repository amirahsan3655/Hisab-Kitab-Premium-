const STORAGE_KEY_BASE = "hisabKitabTransactionsV1";
const THEME_KEY_BASE = "hisabKitabThemeV1";
const BUDGET_KEY_BASE = "hisabKitabBudgetV1";
const SIDEBAR_KEY = "hisabKitabSidebarV1";
const NAV_POS_KEY = "hisabKitabNavPosV1";
const LOCK_KEY_BASE = "hisabKitabLockPinV1";
const LOCK_SESSION_KEY = "hisabKitabUnlockedV1";
const USERS_KEY = "hisabKitabUsersV1";
const SESSION_USER_KEY = "hisabKitabSessionUserV1";
const GOOGLE_CLIENT_KEY = "hisabKitabGoogleClientIdV1";
const STREAK_KEY_BASE = "hisabKitabStreakV1";
const GOALS_KEY_BASE = "hisabKitabGoalsV1";
const DEBTS_KEY_BASE = "hisabKitabDebtsV1";
const CATBUDGET_KEY_BASE = "hisabKitabCatBudgetV1";
const GUEST_USER_ID = "guest_local";

let currentUserId = null;

function userScope(base) {
  return currentUserId ? base + "__" + currentUserId : base;
}
function STORAGE_KEY() { return userScope(STORAGE_KEY_BASE); }
function THEME_KEY() { return userScope(THEME_KEY_BASE); }
function BUDGET_KEY() { return userScope(BUDGET_KEY_BASE); }
function LOCK_KEY() { return userScope(LOCK_KEY_BASE); }
const THEMES = ["dark", "light", "aurora", "sunset", "ocean", "neon", "blush", "graphite", "orchid", "citrus", "midnight", "sakura", "oled", "ramadan", "emerald", "slate", "coral", "forest", "royal", "desert", "arctic", "rose", "amethyst", "coffee", "crimson", "indigo", "mint", "lavender", "honey", "steel", "berry", "moss", "sky", "peach", "plum", "jade", "bronze", "ice", "wine", "lime", "navy", "sand", "violet", "charcoal", "flamingo", "teal", "amber", "grape", "olive", "ruby", "aqua", "mocha", "electric", "blossom"];
const THEME_NAMES = {dark:"Dark", light:"Light", aurora:"Aurora", sunset:"Sunset", ocean:"Ocean", neon:"Neon", blush:"Blush", graphite:"Graphite", orchid:"Orchid", citrus:"Citrus", midnight:"Midnight", sakura:"Sakura", oled:"OLED Black", ramadan:"Ramadan Gold", emerald:"Emerald", slate:"Slate", coral:"Coral", forest:"Forest", royal:"Royal", desert:"Desert", arctic:"Arctic", rose:"Rose", amethyst:"Amethyst", coffee:"Coffee", crimson:"Crimson", indigo:"Indigo", mint:"Mint", lavender:"Lavender", honey:"Honey", steel:"Steel", berry:"Berry", moss:"Moss", sky:"Sky", peach:"Peach", plum:"Plum", jade:"Jade", bronze:"Bronze", ice:"Ice", wine:"Wine", lime:"Lime", navy:"Navy", sand:"Sand", violet:"Violet", charcoal:"Charcoal", flamingo:"Flamingo", teal:"Teal", amber:"Amber", grape:"Grape", olive:"Olive", ruby:"Ruby", aqua:"Aqua", mocha:"Mocha", electric:"Electric", blossom:"Blossom"};
const THEME_MIGRATE = { blue:"ocean", emerald:"neon", rose:"sakura", violet:"orchid", amber:"sunset", cyan:"aurora", indigo:"midnight", slate:"graphite", coral:"blush", mint:"citrus" };
const DEFAULT_CATEGORIES = ["Salary", "Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Other"];
const DESC_OPTIONS = {
  expense: ["Grocery", "Restaurant / Food", "Fuel / Petrol", "Uber / Transport", "Rent", "Electricity Bill", "Water Bill", "Internet / Mobile", "Shopping", "Clothes", "Health / Medicine", "School / Fees", "Entertainment", "Subscription", "Gift", "Family support", "Other / Custom"],
  income: ["Salary", "Bonus", "Overtime", "Freelance", "Business income", "Investment return", "Rental income", "Gift received", "Refund", "Other / Custom"]
};
const CATEGORY_OPTIONS = {
  expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Education", "Rent", "Family", "Other"],
  income: ["Salary", "Business", "Freelance", "Investment", "Rental", "Gift", "Refund", "Other"],
  remittance: ["Family support", "Friends", "Business remittance", "Gift received", "Other"]
};
const BASE_CURRENCY_KEY = "hisabKitabBaseCurrencyV1";
const CURRENCY_META = {
  SAR: { name: "Saudi Riyal", locale: "en-SA", flag: "🇸🇦" },
  AED: { name: "UAE Dirham", locale: "en-AE", flag: "🇦🇪" },
  PKR: { name: "Pakistani Rupee", locale: "en-PK", flag: "🇵🇰" },
  INR: { name: "Indian Rupee", locale: "en-IN", flag: "🇮🇳" },
  GBP: { name: "British Pound", locale: "en-GB", flag: "🇬🇧" }
};
const CURRENCY_CODES = Object.keys(CURRENCY_META);
// 1 unit → SAR (approx). Used only to convert totals into base currency.
const RATES_TO_SAR = { SAR: 1, AED: 1.02, PKR: 0.0135, INR: 0.043, GBP: 4.85 };
const $ = (id) => document.getElementById(id);
let transactions = [];
let cashflowChart, categoryChart, reportChart;
let editingId = null;

function baseCurrencyKey() {
  return userScope("hisabKitabBaseCurrencyV1");
}
function getBaseCurrency() {
  const c = localStorage.getItem(baseCurrencyKey());
  return CURRENCY_CODES.includes(c) ? c : "SAR";
}
function setBaseCurrency(code) {
  if (!CURRENCY_CODES.includes(code)) code = "SAR";
  localStorage.setItem(baseCurrencyKey(), code);
}
function txCurrency(t) {
  const c = t && t.currency;
  return CURRENCY_CODES.includes(c) ? c : "SAR";
}
function convertAmount(amount, from, to) {
  const a = Number(amount) || 0;
  const f = CURRENCY_CODES.includes(from) ? from : "SAR";
  const tcur = CURRENCY_CODES.includes(to) ? to : "SAR";
  if (f === tcur) return a;
  const inSar = a * (RATES_TO_SAR[f] || 1);
  return inSar / (RATES_TO_SAR[tcur] || 1);
}
function money(value, code = null) {
  const c = CURRENCY_CODES.includes(code) ? code : getBaseCurrency();
  const n = Number(value) || 0;
  // Compact display (2026 preference)
  try {
    if (typeof getCompactMoney === "function" && getCompactMoney() && Math.abs(n) >= 1000) {
      const abs = Math.abs(n);
      let s;
      if (abs >= 1e6) s = (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
      else s = (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
      return c + " " + s;
    }
  } catch (_) {}
  const meta = CURRENCY_META[c] || CURRENCY_META.SAR;
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency", currency: c, minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(n);
  } catch {
    return c + " " + n.toFixed(2);
  }
}
function moneyTx(t) { return money(t.amount, txCurrency(t)); }
function amountInBase(t) { return convertAmount(t.amount, txCurrency(t), getBaseCurrency()); }
function isIncomeType(t) {
  const ty = typeof t === "string" ? t : (t && t.type);
  return ty === "income" || ty === "remittance";
}

/* ===== Dash period (must be early — used on first refresh before rest of pro-dashboard) ===== */
const DASH_PERIOD_KEY = "hisabKitabDashPeriodV1";
const DASH_PERIODS = ["day", "week", "month", "year", "all"];
function loadDashPeriod() {
  try {
    const v = localStorage.getItem(DASH_PERIOD_KEY);
    // Always boot on "all" so Total Balance / history are visible after refresh.
    // User can still switch Day/Week/Month afterward.
    if (v && DASH_PERIODS.includes(v) && v === "all") return "all";
  } catch (_) {}
  return "all";
}
function saveDashPeriod(period) {
  try { localStorage.setItem(DASH_PERIOD_KEY, period); } catch (_) {}
}
let dashPeriod = loadDashPeriod();

function getTheme() {
  let t = localStorage.getItem(THEME_KEY());
  if (t && THEME_MIGRATE[t]) {
    t = THEME_MIGRATE[t];
    try { localStorage.setItem(THEME_KEY(), t); } catch (_) {}
  }
  return THEMES.includes(t) ? t : "dark";
}
function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = "dark";
  document.documentElement.setAttribute("data-theme", theme);
  const label = $("themeLabel");
  if (label) label.textContent = THEME_NAMES[theme] || theme;
  const tsel = $("themeSelect");
  if (tsel && tsel.value !== theme) tsel.value = theme;
  document.querySelectorAll(".theme-option").forEach(opt => {
    opt.classList.toggle("active", opt.dataset.themeSet === theme);
  });
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = {
      dark:"#0c0d10", light:"#f4f2ec", aurora:"#0a1218", sunset:"#160e0c",
      ocean:"#071018", neon:"#07120c", blush:"#140e12", graphite:"#0d1014",
      orchid:"#100c16", citrus:"#0e1208", midnight:"#070b14", sakura:"#140c10",
      oled:"#000",
      ramadan:"#120e08",
      emerald:"#06140f",
      slate:"#0f1218",
      coral:"#160c0c",
      forest:"#0a1208",
      royal:"#0c0814",
      desert:"#14100a",
      arctic:"#0a1014",
      rose:"#140c10",
      amethyst:"#100c18",
      coffee:"#12100c",
      crimson:"#140808",
      indigo:"#080c18",
      mint:"#081412",
      lavender:"#100e16",
      honey:"#141008",
      steel:"#0c1014",
      berry:"#140810",
      moss:"#0c140a",
      sky:"#081018",
      peach:"#16100c",
      plum:"#120810",
      jade:"#061410",
      bronze:"#14100a",
      ice:"#0a1014",
      wine:"#14080c",
      lime:"#0c1408",
      navy:"#060c18",
      sand:"#16140e",
      violet:"#0e0a18",
      charcoal:"#0a0a0c",
      flamingo:"#160c10",
      teal:"#061416",
      amber:"#141008",
      grape:"#100c18",
      olive:"#10140a",
      ruby:"#14080a",
      aqua:"#061418",
      mocha:"#12100e",
      electric:"#060a14",
      blossom:"#140c12"
    };
    meta.setAttribute("content", colors[theme] || "#0c0d10");
  }
  refreshIcons();
}
function openThemePanel() {
  const picker = $("themePicker");
  const panel = $("themePanel");
  const btn = $("themeToggle");
  if (!picker || !panel) return;
  panel.hidden = false;
  void panel.offsetHeight;
  picker.classList.add("open");
  if (btn) btn.setAttribute("aria-expanded", "true");
}
function closeThemePanel() {
  const picker = $("themePicker");
  const panel = $("themePanel");
  const btn = $("themeToggle");
  if (!picker || !panel) return;
  picker.classList.remove("open");
  if (btn) btn.setAttribute("aria-expanded", "false");
  const onEnd = (e) => {
    if (e.propertyName !== "grid-template-rows" && e.propertyName !== "opacity") return;
    panel.removeEventListener("transitionend", onEnd);
    if (!picker.classList.contains("open")) panel.hidden = true;
  };
  panel.addEventListener("transitionend", onEnd);
  setTimeout(() => {
    if (!picker.classList.contains("open")) panel.hidden = true;
  }, 360);
}
function toggleThemePanel() {
  const picker = $("themePicker");
  if (picker && picker.classList.contains("open")) closeThemePanel();
  else openThemePanel();
}
function setTheme(theme) {
  localStorage.setItem(THEME_KEY(), theme);
  applyTheme(theme);
  if (typeof renderCharts === "function") renderCharts();
  showToast((THEME_NAMES[theme] || theme) + " theme on");
}
function cycleTheme() {
  const cur = getTheme();
  const idx = THEMES.indexOf(cur);
  setTheme(THEMES[(idx + 1) % THEMES.length]);
}

function loadTransactions() {
  try {
    const key = STORAGE_KEY();
    let raw = localStorage.getItem(key);
    let list = [];
    try { list = raw ? JSON.parse(raw) : []; } catch { list = []; }
    if (!Array.isArray(list)) list = [];

    // Migrate legacy unscoped data into this user's key when empty
    if (list.length === 0 && currentUserId) {
      const legacyKeys = [STORAGE_KEY_BASE];
      // Also try guest bucket if logging in as a real user (one-time pull when empty)
      if (currentUserId !== GUEST_USER_ID) {
        legacyKeys.push(STORAGE_KEY_BASE + "__" + GUEST_USER_ID);
      }
      for (const lk of legacyKeys) {
        if (lk === key) continue;
        try {
          const lr = localStorage.getItem(lk);
          if (!lr) continue;
          const legacy = JSON.parse(lr);
          if (Array.isArray(legacy) && legacy.length > 0) {
            list = legacy;
            try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {}
            break;
          }
        } catch (_) {}
      }
    }
    return list;
  } catch {
    return [];
  }
}
function saveTransactions() {
  try { localStorage.setItem(STORAGE_KEY(), JSON.stringify(transactions || [])); } catch (e) { console.error(e); }
}

function loadBudget() {
  try {
    const v = localStorage.getItem(BUDGET_KEY());
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch { return 0; }
}
function saveBudget(amount) {
  localStorage.setItem(BUDGET_KEY(), String(amount));
}

function animateValue(el, end, duration = 650) {
  if (!el) return;
  const isMoney = el.id !== "countValue" && el.id !== "budgetPageDays";
  // Parse current displayed number so refresh doesn't always count from 0 (jump)
  let start = 0;
  try {
    const raw = String(el.textContent || "").replace(/[^0-9.-]/g, "");
    const n = parseFloat(raw);
    if (Number.isFinite(n)) start = n;
  } catch (_) {}
  // Skip pointless animation when already at target
  if (Math.abs(start - end) < 0.005) {
    el.textContent = isMoney ? money(end) : Math.round(end).toString();
    return;
  }
  if (el._animRaf) {
    try { cancelAnimationFrame(el._animRaf); } catch (_) {}
    el._animRaf = null;
  }
  const startTime = performance.now();
  el.classList.add("tick");
  function frame(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = start + (end - start) * eased;
    el.textContent = isMoney ? money(current) : Math.round(current).toString();
    if (t < 1) el._animRaf = requestAnimationFrame(frame);
    else {
      el._animRaf = null;
      el.textContent = isMoney ? money(end) : Math.round(end).toString();
      setTimeout(() => el.classList.remove("tick"), 300);
    }
  }
  el._animRaf = requestAnimationFrame(frame);
}
function dateLabel(value) {
  if (!value) return "";
  return new Date(value + "T00:00:00").toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" });
}
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function prevMonthKey() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return monthKey(d);
}
function monthTotals(key) {
  const list = transactions.filter(t => t.date && t.date.startsWith(key));
  const income = list.filter(t => isIncomeType(t)).reduce((s, t) => s + amountInBase(t), 0);
  const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + amountInBase(t), 0);
  return { income, expense };
}
function totals(list = transactions) {
  const income = list.filter(t => isIncomeType(t)).reduce((s, t) => s + amountInBase(t), 0);
  const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + amountInBase(t), 0);
  return { income, expense, balance: income - expense };
}
function safe(text) {
  return String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function pctChange(current, previous) {
  if (!previous && !current) return { text: "—", cls: "" };
  if (!previous) return { text: "New", cls: "positive" };
  const diff = ((current - previous) / previous) * 100;
  const sign = diff > 0 ? "+" : "";
  const cls = diff > 0 ? "positive" : diff < 0 ? "negative" : "";
  return { text: `${sign}${diff.toFixed(0)}% vs last month`, cls };
}

function renderStats(animate = true) {
  const t = totals();
  // Overview KPIs owned by renderProDashboard when period filter exists
  const proOwnsMain = typeof renderProDashboard === "function" && $("periodFilter");
  // Always paint balance first so refresh never leaves Total Balance blank
  if ($("balanceValue")) $("balanceValue").textContent = money(t.balance);
  if (!proOwnsMain) {
    if (animate) {
      animateValue($("balanceValue"), t.balance);
      animateValue($("incomeValue"), t.income);
      animateValue($("expenseValue"), t.expense);
      animateValue($("countValue"), transactions.length, 500);
    } else {
      if ($("balanceValue")) $("balanceValue").textContent = money(t.balance);
      if ($("incomeValue")) $("incomeValue").textContent = money(t.income);
      if ($("expenseValue")) $("expenseValue").textContent = money(t.expense);
      if ($("countValue")) $("countValue").textContent = transactions.length;
    }
    const cur = monthTotals(monthKey());
    const prev = monthTotals(prevMonthKey());
    const incCh = pctChange(cur.income, prev.income);
    const expCh = pctChange(cur.expense, prev.expense);
    const incEl = $("incomeChange");
    const expEl = $("expenseChange");
    if (incEl) {
      if (incCh && typeof incCh === "object") incEl.innerHTML = `<span class="${incCh.cls || ""}">${incCh.text || "—"}</span>`;
      else incEl.innerHTML = `<span>—</span>`;
    }
    if (expEl) {
      if (expCh && typeof expCh === "object") expEl.innerHTML = `<span class="${expCh.cls || ""}">${expCh.text || "—"}</span>`;
      else expEl.innerHTML = `<span>—</span>`;
    }
  }
  if ($("donutTotal")) $("donutTotal").textContent = money(t.expense);
  if ($("reportIncome")) $("reportIncome").textContent = money(t.income);
  if ($("reportExpense")) $("reportExpense").textContent = money(t.expense);
}

function rowHTML(t, includeActions = false) {
  const isTransfer = t.type === "transfer";
  const icon = isTransfer ? "arrow-left-right" : (isIncomeType(t) ? "arrow-down-left" : "shopping-bag");
  const amountClass = isTransfer ? "" : (isIncomeType(t) ? "amount-income" : "amount-expense");
  const sign = isTransfer ? "" : (isIncomeType(t) ? "+" : "−");
  const sub = isTransfer
    ? `${safe(t.account || "Cash")} → ${safe(t.transferTo || "?")}`
    : safe(t.category) + (Array.isArray(t.tags) && t.tags.length ? " · " + t.tags.slice(0, 3).map(safe).join(", ") : "");
  return `<tr>
    <td><div class="detail-cell"><div class="transaction-icon"><i data-lucide="${icon}"></i></div><div><strong>${safe(t.description)}</strong><span>${sub}</span></div></div></td>
    ${includeActions ? `<td><span class="type-chip">${t.type}</span></td><td>${safe(t.category)}</td>` : `<td>${safe(t.category)}</td>`}
    <td>${dateLabel(t.date)}</td><td class="${amountClass}">${sign} ${moneyTx(t)}</td>
    ${includeActions ? `<td class="row-actions">
      <button class="icon-action edit-btn" data-edit="${t.id}" title="Edit"><i data-lucide="pencil"></i></button>
      <button class="icon-action dup-btn" data-dup="${t.id}" title="Duplicate"><i data-lucide="copy"></i></button>
      <button class="icon-action delete-btn" data-delete="${t.id}" title="Delete"><i data-lucide="trash-2"></i></button>
    </td>` : ""}
  </tr>`;
}
function renderRecent() {
  // Respect overview period filter when available
  let source = transactions || [];
  try {
    if (typeof dashPeriod === "string" && dashPeriod !== "all" && typeof txsInPeriod === "function") {
      source = txsInPeriod(dashPeriod);
    } else if (typeof dashPeriod === "string" && dashPeriod !== "all" && typeof periodRange === "function" && typeof inRange === "function") {
      const range = periodRange(dashPeriod);
      source = source.filter(t => t && inRange(t.date, range));
    }
  } catch (_) {}
  const list = [...source].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8);
  const rows = $("recentRows");
  if (rows) rows.innerHTML = list.map(t => rowHTML(t)).join("");
  const empty = $("recentEmpty");
  if (empty) {
    const none = list.length === 0;
    empty.classList.toggle("show", none);
    if (!none) empty.classList.remove("show");
    if (none) {
      const strong = empty.querySelector("strong");
      const span = empty.querySelector("span");
      const hasAny = (transactions || []).length > 0;
      if (strong) strong.textContent = hasAny ? "No entries in this period" : "No transactions yet";
      if (span) span.textContent = hasAny
        ? "Try Week, Month, Year or All to see your history."
        : "Add your first income or expense to get started.";
    }
  }
  refreshIcons();
}
function populateCategoryFilter() {
  const sel = $("categoryFilter");
  if (!sel) return;
  const used = [...new Set(transactions.map(t => t.category).filter(Boolean))];
  const all = [...new Set([...DEFAULT_CATEGORIES, ...used])].sort((a, b) => a.localeCompare(b));
  const current = sel.value || "all";
  sel.innerHTML = `<option value="all">All categories</option>` + all.map(c => `<option value="${safe(c)}">${safe(c)}</option>`).join("");
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}
function renderAll() {
  const searchEl = $("searchInput");
  const typeEl = $("typeFilter");
  const catEl = $("categoryFilter");
  const search = (searchEl ? searchEl.value : "").trim().toLowerCase();
  const type = typeEl ? typeEl.value : "all";
  const category = catEl ? catEl.value : "all";
  const list = [...transactions].filter(t => {
    const tagStr = Array.isArray(t.tags) ? t.tags.join(" ") : (t.tags || "");
    const matchesText = (t.description + " " + t.category + " " + (t.account || "") + " " + tagStr).toLowerCase().includes(search);
    return matchesText && (type === "all" || t.type === type) && (category === "all" || t.category === category);
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const rows = $("allRows");
  if (rows) rows.innerHTML = list.map(t => rowHTML(t, true)).join("");
  const empty = $("allEmpty");
  if (empty) {
    empty.classList.toggle("show", list.length === 0);
    empty.style.display = list.length === 0 ? "flex" : "none";
  }
  refreshIcons();
}
function lastSixMonths() {
  const labels = [], keys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString("en", { month: "short" }));
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return { labels, keys };
}
function monthlyValues() {
  const { labels, keys } = lastSixMonths();
  const income = keys.map(k => transactions.filter(t => isIncomeType(t) && t.date.startsWith(k)).reduce((s, t) => s + amountInBase(t), 0));
  const expense = keys.map(k => transactions.filter(t => t.type === "expense" && t.date.startsWith(k)).reduce((s, t) => s + amountInBase(t), 0));
  return { labels, income, expense };
}
const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 750, easing: "easeOutQuart" },
  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#25272d", titleColor: "#fff", bodyColor: "#ddd", padding: 11, displayColors: true } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#858690", font: { family: "DM Sans", size: 10 } }, border: { display: false } },
    y: { grid: { color: "#ffffff0b" }, ticks: { color: "#858690", font: { family: "DM Sans", size: 9 }, callback: v => v >= 1000 ? (v / 1000) + "k" : v }, border: { display: false } }
  }
};
function getAccentColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    income: s.getPropertyValue("--chart-income").trim() || "#d8b46a",
    expense: s.getPropertyValue("--chart-expense").trim() || "#5a5d67",
    accent: s.getPropertyValue("--accent").trim() || "#d8b46a",
    green: s.getPropertyValue("--green").trim() || "#5ac69a",
    red: s.getPropertyValue("--red").trim() || "#f17e82"
  };
}
function renderCharts() {
  if (typeof Chart === "undefined") {
    const wrap = document.querySelector(".chart-wrap");
    if (wrap && !wrap.dataset.chartWarn) {
      wrap.dataset.chartWarn = "1";
      wrap.innerHTML = '<div class="empty-mini" style="padding:40px 12px">Charts need internet once to load Chart.js</div>';
    }
    return;
  }
  const m = monthlyValues();
  const c = getAccentColors();
  const cashData = {
    labels: m.labels,
    datasets: [
      { label: "Income", data: m.income, backgroundColor: c.income, borderRadius: 5, maxBarThickness: 19 },
      { label: "Expenses", data: m.expense, backgroundColor: c.expense, borderRadius: 5, maxBarThickness: 19 }
    ]
  };
  if (cashflowChart) cashflowChart.destroy();
  const cashCanvas = $("cashflowChart");
  if (cashCanvas) {
    cashflowChart = new Chart(cashCanvas, { type: "bar", data: cashData, options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true } } } });
  }
  if (reportChart) reportChart.destroy();
  const reportCanvas = $("reportChart");
  if (reportCanvas) {
    reportChart = new Chart(reportCanvas, {
      type: "line",
      data: {
        labels: m.labels,
        datasets: [
          { label: "Income", data: m.income, borderColor: c.income, backgroundColor: c.income + "33", fill: true, tension: 0.38, pointRadius: 3 },
          { label: "Expenses", data: m.expense, borderColor: c.red, backgroundColor: c.red + "26", fill: true, tension: 0.38, pointRadius: 3 }
        ]
      },
      options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, beginAtZero: true } } }
    });
  }
  const colors = [c.accent, c.green, "#8199d8", "#c18bd0", "#d88976", "#8ba9b6", "#a4a5ad"];
  const cats = {};
  transactions.filter(t => t.type === "expense").forEach(t => { cats[t.category] = (cats[t.category] || 0) + amountInBase(t); });
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  if (categoryChart) categoryChart.destroy();
  const catCanvas = $("categoryChart");
  if (catCanvas) {
    categoryChart = new Chart(catCanvas, {
      type: "doughnut",
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{ data: entries.map(e => e[1]), backgroundColor: entries.map((_, i) => colors[i % colors.length]), borderColor: "#191b20", borderWidth: 4, hoverOffset: 5 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: "76%", plugins: { legend: { display: false }, tooltip: chartOptions.plugins.tooltip } }
    });
  }
  const legend = $("categoryLegend");
  if (legend) {
    legend.innerHTML = entries.length
      ? entries.map(([name, value], i) => `<div class="legend-row"><span class="legend-left"><span class="legend-dot" style="background:${colors[i % colors.length]}"></span>${safe(name)}</span><strong>${money(value)}</strong></div>`).join("")
      : `<div class="empty-mini">Add expenses to see categories.</div>`;
  }
  const reportCats = $("reportCategories");
  if (reportCats) {
    reportCats.innerHTML = entries.length
      ? entries.map(([name, value], i) => {
          const max = Math.max(...entries.map(e => e[1]), 1);
          return `<div class="report-category"><div class="report-category-top"><span>${safe(name)}</span><strong>${money(value)}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${Math.max(3, (value / max) * 100)}%;background:${colors[i % colors.length]}"></div></div></div>`;
        }).join("")
      : `<div class="empty-mini">No expense data yet. Add an expense to create your report.</div>`;
  }
}

function daysLeftInMonth() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(0, last - now.getDate() + 1);
}
function renderBudget() {
  const limit = loadBudget();
  const spent = monthTotals(monthKey()).expense;
  const remaining = limit > 0 ? limit - spent : 0;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit > 0 && spent > limit;
  const daysLeft = daysLeftInMonth();
  const daily = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;

  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };

  setText("budgetSpent", money(spent));
  setText("budgetLimit", limit > 0 ? money(limit) : "Not set");
  setText("budgetPercent", limit > 0 ? `${pct.toFixed(0)}% used` : "No budget");
  setText("budgetRemaining", limit > 0 ? (over ? money(spent - limit) + " over" : money(remaining) + " remaining") : "—");
  setText("budgetSubtitle", limit > 0 ? "Tracking this month’s spending" : "Set a budget to track your spending");

  const bar = $("budgetProgressBar");
  if (bar) {
    bar.style.width = limit > 0 ? `${pct}%` : "0%";
    bar.classList.toggle("over-budget", over);
  }

  setText("budgetPageLimit", limit > 0 ? money(limit) : "Not set");
  setText("budgetPageSpent", money(spent));
  setText("budgetPageRemaining", limit > 0 ? money(Math.max(0, remaining)) : "—");
  setText("budgetPageDaily", limit > 0 ? money(daily) : "—");
  setText("budgetPageDays", String(daysLeft));
  setText("budgetRingPercent", limit > 0 ? `${Math.round(pct)}%` : "—");

  const ring = $("budgetPageRing");
  if (ring) {
    const r = 52;
    const circ = 2 * Math.PI * r;
    ring.style.strokeDasharray = String(circ);
    ring.style.strokeDashoffset = String(circ * (1 - (limit > 0 ? pct / 100 : 0)));
    ring.classList.toggle("over-budget", over);
  }
}

function updateInsight() {
  const el = $("insightText");
  if (!el) return;
  if (!transactions.length) {
    el.textContent = "Add a few transactions to unlock personalized spending insights.";
    return;
  }
  const t = totals();
  const cur = monthTotals(monthKey());
  const cats = {};
  transactions.filter(x => x.type === "expense").forEach(x => { cats[x.category] = (cats[x.category] || 0) + amountInBase(x); });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const budget = loadBudget();
  const saveRate = t.income > 0 ? Math.round(((t.income - t.expense) / t.income) * 100) : null;

  // Bills overdue tip if available
  try {
    if (typeof loadBills === "function") {
      const overdue = loadBills().filter(b => !b.paid && b.due && b.due < new Date().toISOString().slice(0, 10));
      if (overdue.length) {
        el.textContent = `You have ${overdue.length} overdue bill${overdue.length > 1 ? "s" : ""} (e.g. ${overdue[0].name}). Check Bills page.`;
        return;
      }
    }
  } catch (_) {}

  if (budget > 0 && cur.expense > budget) {
    el.textContent = `You’ve exceeded this month’s budget by ${money(cur.expense - budget)}. Consider cutting back on ${top ? top[0] : "top categories"}.`;
  } else if (budget > 0 && cur.expense > budget * 0.85) {
    el.textContent = `You’ve used ${Math.round((cur.expense / budget) * 100)}% of your monthly budget. Stay mindful.`;
  } else if (t.expense > t.income && t.income > 0) {
    el.textContent = `Expenses exceed income by ${money(t.expense - t.income)}. Review your top categories.`;
  } else if (saveRate !== null && saveRate >= 20 && top) {
    el.textContent = `Strong month: saving ~${saveRate}%. Top spend is ${top[0]} (${money(top[1])}).`;
  } else if (top && t.expense > 0) {
    const share = Math.round((top[1] / t.expense) * 100);
    el.textContent = `${top[0]} is ${share}% of spending (${money(top[1])}). Balance: ${money(t.balance)}.`;
  } else if (t.income > 0) {
    el.textContent = `Looking good — income recorded is ${money(t.income)}. Add expenses to see a full picture.`;
  } else {
    el.textContent = `You have ${transactions.length} entries. Keep tracking to unlock better insights.`;
  }
}

let __hkBootQuietUntil = Date.now() + 1200;
function refresh() {
  try { populateCategoryFilter(); } catch (e) { console.warn(e); }
  try { if (typeof processRecurringTransactions === "function") processRecurringTransactions(); } catch (e) { console.warn(e); }
  try { renderStats(Date.now() > __hkBootQuietUntil); } catch (e) { console.warn(e); }
  try { renderRecent(); } catch (e) { console.warn(e); }
  try { renderAll(); } catch (e) { console.warn(e); }
  try { renderCharts(); } catch (e) { console.warn(e); }
  try { renderBudget(); } catch (e) { console.warn(e); }
  try { updateInsight(); } catch (e) { console.warn(e); }
  try { if (typeof renderGoals === "function") renderGoals(); } catch (e) { console.warn(e); }
  try { if (typeof renderDebts === "function") renderDebts(); } catch (e) { console.warn(e); }
  try { if (typeof renderCatBudgets === "function") renderCatBudgets(); } catch (e) { console.warn(e); }
  try { if (typeof renderReminders === "function") renderReminders(); } catch (e) { console.warn(e); }
  try { if (typeof applyI18n === "function") applyI18n(); } catch (e) { console.warn(e); }
  try { if (typeof renderProDashboard === "function") renderProDashboard(); } catch (e) { console.warn(e); }
  try { if (typeof updateGreeting === "function") updateGreeting(); } catch (e) { console.warn(e); }
  try { if (typeof renderForecastCard === "function") renderForecastCard(); } catch (e) {}
  try { if (typeof applyPrivacyMode === "function") applyPrivacyMode(getPrivacyMode()); } catch (e) {}
  try { refreshIcons(); } catch (e) {}
}
function refreshIcons() { if (window.lucide) lucide.createIcons(); }

function openModal(editTx = null) {
  editingId = editTx ? editTx.id : null;
  const eyebrow = $("modalEyebrow");
  const title = $("modalTitle");
  const submitLabel = $("submitLabel");
  const editInput = $("editId");
  if (editInput) editInput.value = editingId || "";

  if (editTx) {
    if (eyebrow) eyebrow.textContent = "EDIT ENTRY";
    if (title) title.textContent = "Edit transaction";
    if (submitLabel) {
      const sp = submitLabel.querySelector("span");
      if (sp) sp.textContent = "Update";
      else submitLabel.innerHTML = '<i data-lucide="check"></i> Update';
    }
    // Type first (rebuilds category/description lists), then fill fields so edit values stick
    const tType = editTx.type === "transfer" ? "transfer" : (editTx.type === "remittance" ? "remittance" : (isIncomeType(editTx) ? "income" : "expense"));
    setEntryType(tType);
    const preferCat = editTx.category || (isIncomeType(editTx) ? "Salary" : "Food");
    try { fillCategoryOptions(tType === "transfer" ? "expense" : (tType === "remittance" ? "income" : tType), preferCat); } catch (_) {}
    if ($("category")) {
      const sel = $("category");
      if (![...sel.options].some(o => o.value === preferCat)) {
        const opt = document.createElement("option");
        opt.value = preferCat;
        opt.textContent = preferCat;
        sel.appendChild(opt);
      }
      sel.value = preferCat;
    }
    if ($("txNote")) $("txNote").value = editTx.description || "";
    try { setDescriptionValue(editTx.description || ""); } catch (_) {}
    if ($("amount")) $("amount").value = editTx.amount;
    if ($("date")) $("date").value = editTx.date || "";
    if ($("txCurrency")) $("txCurrency").value = txCurrency(editTx);
    if ($("txAccount")) $("txAccount").value = editTx.account || "Cash";
    if ($("txTransferTo")) $("txTransferTo").value = editTx.transferTo || "Bank";
    if ($("txTags")) $("txTags").value = Array.isArray(editTx.tags) ? editTx.tags.join(", ") : (editTx.tags || "");
    if ($("txRecurring")) $("txRecurring").checked = !!editTx.recurring;
    if ($("txRecurringFreq")) $("txRecurringFreq").value = editTx.recurringFreq || "monthly";
    if ($("txRecurringFreqWrap")) $("txRecurringFreqWrap").hidden = !editTx.recurring;
    if ($("txReceiptData")) $("txReceiptData").value = editTx.receipt || "";
    if ($("txReceipt")) {
      $("txReceipt").value = "";
      delete $("txReceipt").dataset.dataUrl;
    }
  } else {
    if (eyebrow) eyebrow.textContent = "NEW ENTRY";
    if (title) title.textContent = "Add transaction";
    if (submitLabel) {
      submitLabel.innerHTML = '<i data-lucide="check"></i> Save';
    }
    $("transactionForm").reset();
    if ($("txNote")) $("txNote").value = "";
    const today = new Date();
    $("date").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setEntryType("income");
    if ($("txCurrency")) $("txCurrency").value = getBaseCurrency();
    if ($("txAccount")) $("txAccount").value = "Cash";
    if ($("txTransferTo")) $("txTransferTo").value = "Bank";
    if ($("txTags")) $("txTags").value = "";
    if ($("txRecurring")) $("txRecurring").checked = false;
    if ($("txRecurringFreq")) $("txRecurringFreq").value = "monthly";
    if ($("txRecurringFreqWrap")) $("txRecurringFreqWrap").hidden = true;
    if ($("txReceiptData")) $("txReceiptData").value = "";
    if ($("txReceipt")) $("txReceipt").value = "";
  }
  const backdrop = $("modalBackdrop");
  if (backdrop) {
    backdrop.style.display = "flex";
    backdrop.classList.add("open");
  }
  setTimeout(() => {
    const s = $("amount");
    if (s) s.focus();
    try { toggleCustomDescription(); } catch (_) {}
    try { syncCategorySelectUi(); } catch (_) {}
    try { if (window.enhanceAnimatedSelects) window.enhanceAnimatedSelects(); } catch (_) {}
    refreshIcons();
  }, 50);
}
function closeModal() {
  const backdrop = $("modalBackdrop");
  if (backdrop) {
    backdrop.classList.remove("open");
    backdrop.style.display = "none";
  }
  const form = $("transactionForm");
  if (form) form.reset();
  editingId = null;
  const editInput = $("editId");
  if (editInput) editInput.value = "";
  try { setEntryType("expense"); } catch (_) {}
  const wrap = $("customDescWrap");
  if (wrap) { wrap.hidden = true; wrap.setAttribute("hidden", "hidden"); }
}
function fillDescriptionOptions(type) {
  const sel = $("descriptionSelect");
  if (!sel) return;
  const list = DESC_OPTIONS[type] || DESC_OPTIONS.expense;
  const prev = sel.value;
  sel.innerHTML = `<option value="">Select description…</option>` +
    list.map(d => `<option value="${d === "Other / Custom" ? "__custom__" : d}">${d}</option>`).join("");
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  else sel.value = "";
  toggleCustomDescription();
}
function fillCategoryOptions(type, preferred) {
  const sel = $("category");
  if (!sel) return;
  const list = CATEGORY_OPTIONS[type] || CATEGORY_OPTIONS.expense;
  const prev = preferred || sel.value;
  sel.innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join("");
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
  else sel.value = list[0] || "";
  try { syncCategorySelectUi(); } catch (_) {}
}
function syncCategorySelectUi() {
  const sel = $("category");
  const menu = $("categoryMenu");
  const label = $("categoryTriggerLabel");
  if (!sel || !menu || !label) return;
  const val = sel.value || "";
  label.textContent = val || "Select category…";
  menu.innerHTML = [...sel.options].map(o => {
    const active = o.value === val ? " active" : "";
    return `<button type="button" class="hk-select-option${active}" role="option" data-value="${o.value.replace(/"/g, "&quot;")}">${o.textContent}</button>`;
  }).join("");
  try { refreshIcons(); } catch (_) {}
}
function openCategoryMenu() {
  const ui = $("categorySelectUi");
  const menu = $("categoryMenu");
  const trig = $("categoryTrigger");
  if (!ui || !menu || !trig) return;
  syncCategorySelectUi();
  menu.hidden = false;
  menu.removeAttribute("hidden");
  ui.classList.add("open");
  trig.setAttribute("aria-expanded", "true");
}
function closeCategoryMenu() {
  const ui = $("categorySelectUi");
  const menu = $("categoryMenu");
  const trig = $("categoryTrigger");
  if (!ui || !menu || !trig) return;
  menu.hidden = true;
  menu.setAttribute("hidden", "");
  ui.classList.remove("open");
  trig.setAttribute("aria-expanded", "false");
}
function toggleCategoryMenu() {
  const menu = $("categoryMenu");
  if (!menu) return;
  if (menu.hidden) openCategoryMenu();
  else closeCategoryMenu();
}
function toggleCustomDescription() {
  const sel = $("descriptionSelect");
  const wrap = $("customDescWrap");
  const input = $("description");
  if (!sel) return;
  const custom = sel.value === "__custom__";
  if (wrap) {
    wrap.hidden = !custom;
    if (custom) wrap.removeAttribute("hidden");
    else wrap.setAttribute("hidden", "hidden");
  }
  if (input) {
    input.required = false;
    input.removeAttribute("required");
    if (!custom) input.value = "";
  }
}
function getFormDescription() {
  const note = ($("txNote") && $("txNote").value || "").trim();
  if (note) return note;
  const cat = ($("category") && $("category").value || "").trim();
  if (cat) return cat;
  const sel = $("descriptionSelect");
  const input = $("description");
  if (sel && sel.value === "__custom__") return (input && input.value || "").trim();
  if (sel && sel.value) return sel.value.trim();
  return (input && input.value || "").trim();
}
function setDescriptionValue(text) {
  const sel = $("descriptionSelect");
  const input = $("description");
  const wrap = $("customDescWrap");
  if (!sel) {
    if (input) input.value = text || "";
    return;
  }
  const match = [...sel.options].find(o => o.value === text);
  if (match) {
    sel.value = text;
    if (wrap) wrap.hidden = true;
    if (input) { input.value = ""; input.required = false; }
  } else if (text) {
    sel.value = "__custom__";
    if (wrap) wrap.hidden = false;
    if (input) { input.value = text; input.required = true; }
  } else {
    sel.value = "";
    if (wrap) wrap.hidden = true;
  }
}
function setEntryType(type) {
  if (!["income", "expense", "remittance", "transfer"].includes(type)) type = "expense";
  if ($("entryType")) $("entryType").value = type;
  document.querySelectorAll(".type-choice, .tx-type-tab").forEach(b => {
    b.classList.toggle("selected", b.dataset.type === type);
  });
  // Show/hide transfer-to field
  const transferWrap = $("txTransferToWrap");
  if (transferWrap) transferWrap.hidden = type !== "transfer";
  try {
    if (type === "transfer") {
      fillDescriptionOptions("expense");
      fillCategoryOptions("expense");
      if ($("category")) $("category").value = "Other";
      try { syncCategorySelectUi(); } catch (_) {}
    } else {
      fillDescriptionOptions(type === "remittance" ? "income" : type);
      if (!editingId) fillCategoryOptions(type);
      else fillCategoryOptions(type, $("category") && $("category").value);
    }
  } catch (_) {}
}
let _toastTimer = null, _toastActionHandler = null;
function showToast(message, opts) {
  const toast = $("toast");
  if (!toast) return;
  const span = $("toastMsg") || toast.querySelector("span");
  if (span) span.textContent = message;
  const actionBtn = $("toastAction");
  if (_toastTimer) clearTimeout(_toastTimer);
  if (_toastActionHandler && actionBtn) {
    actionBtn.removeEventListener("click", _toastActionHandler);
    _toastActionHandler = null;
  }
  if (actionBtn) {
    if (opts && typeof opts.onAction === "function") {
      actionBtn.hidden = false;
      actionBtn.textContent = opts.actionLabel || "Undo";
      _toastActionHandler = (e) => {
        e.preventDefault();
        try { opts.onAction(); } catch (_) {}
        toast.classList.remove("show");
        actionBtn.hidden = true;
      };
      actionBtn.addEventListener("click", _toastActionHandler);
    } else actionBtn.hidden = true;
  }
  toast.classList.add("show");
  _toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    if (actionBtn) actionBtn.hidden = true;
  }, (opts && opts.duration) || 2800);
}

function openBudgetModal() {
  const limit = loadBudget();
  const input = $("budgetAmount");
  if (input) input.value = limit > 0 ? limit : "";
  const b = $("budgetModalBackdrop");
  if (b) {
    b.classList.add("open");
    b.style.display = "flex";
    b.style.zIndex = "200";
  }
  setTimeout(() => input && input.focus(), 50);
}
function closeBudgetModal() {
  const b = $("budgetModalBackdrop");
  if (b) {
    b.classList.remove("open");
    b.style.display = "none";
  }
  const form = $("budgetForm");
  if (form) form.reset();
}

const PAGE_ORDER = ["overview", "transactions", "reports", "budget", "goals", "debts", "bills", "insights", "settings", "profile"];
let currentPage = "overview";
let isPageSliding = false;

function switchPage(name) {
  // Tools moved into Settings
  if (name === "tools") name = "settings";
  const dict = (typeof I18N !== "undefined" && I18N[getLang()]) ? I18N[getLang()] : null;
  const titles = {
    overview: (dict && dict.page_overview) || "Overview",
    transactions: (dict && dict.page_transactions) || "Transactions",
    reports: (dict && dict.page_reports) || "Reports",
    budget: (dict && dict.page_budget) || "Budget",
    goals: (dict && dict.page_goals) || "Goals",
    debts: (dict && dict.page_debts) || "Debts",
    bills: (dict && dict.page_bills) || "Bills",
    insights: "Insights Lab",
    tools: (dict && dict.page_tools) || "Tools",
    settings: "Settings",
    profile: "Profile"
  };
  if (!titles[name]) {
    if (isMobileNav()) closeSidebar();
    return;
  }
  if (name === currentPage) {
    if (isMobileNav()) closeSidebar();
    if (name === "goals" && typeof renderGoals === "function") renderGoals();
    if (name === "debts" && typeof renderDebts === "function") renderDebts();
    if (name === "bills" && typeof renderBills === "function") renderBills();
    if (name === "insights" && typeof renderInsightsPage === "function") renderInsightsPage();
    if (name === "settings") {
      try {
        if (typeof renderToolsPage === "function") renderToolsPage();
        const grid = document.getElementById("settingsCardsGrid");
        if (grid) {
          grid.querySelectorAll(".settings-card-main").forEach((card) => {
            card.classList.remove("settings-card-in");
            card.style.animation = "none";
            card.style.opacity = "1";
            card.style.visibility = "visible";
          });
        }
        refreshIcons();
      } catch (_) {}
    }
    if (name === "profile") {
      try {
        if (typeof updateProfileUI === "function") updateProfileUI();
        try { refreshProfileCountryUI(); } catch (_) {}
        ["profCurrentPass", "profNewPass", "profNewPass2"].forEach(id => {
          const el = $(id);
          if (el) el.value = "";
        });
        const err = $("profileStudioError");
        if (err) { err.hidden = true; err.textContent = ""; }
        try { if (typeof setProfileEditMode === "function") setProfileEditMode(false); } catch (_) {}
        try { if (typeof fillProfileViewMode === "function") fillProfileViewMode(); } catch (_) {}
        refreshIcons();
      } catch (_) {}
    }
    return;
  }
  // Instant page switch — no slide overlap (old data no longer flashes  ~2s on next page)
  isPageSliding = false;

  const outPage = $(currentPage + "Page");
  const inPage = $(name + "Page");
  if (!inPage) return;

  document.querySelectorAll(".page-section").forEach(p => {
    p.classList.remove("page-visible", "slide-in-left", "slide-in-right", "slide-out-left", "slide-out-right");
    p.style.position = "";
    p.style.pointerEvents = "";
  });

  // Hide old page first so its data cannot show under the new page
  if (outPage && outPage !== inPage) {
    outPage.classList.remove("page-visible");
  }

  document.querySelectorAll(".nav-link").forEach(b =>
    b.classList.toggle("active", b.dataset.page === name)
  );
  try {
    const sBtn = document.getElementById("sbSettingsToggle");
    if (sBtn) {
      const onSettings = name === "settings";
      sBtn.classList.toggle("active", onSettings);
      if (onSettings) sBtn.setAttribute("aria-current", "page");
      else sBtn.removeAttribute("aria-current");
    }
  } catch (_) {}
  if ($("pageTitle")) $("pageTitle").textContent = titles[name];
  currentPage = name;

  // Render page data BEFORE making it visible
  try {
    if (name === "reports" || name === "overview" || name === "budget") {
      if (typeof renderCharts === "function") renderCharts();
      if (typeof renderBudget === "function") renderBudget();
    }
    if (name === "overview" && typeof renderProDashboard === "function") renderProDashboard();
    if (name === "goals" && typeof renderGoals === "function") renderGoals();
    if (name === "debts" && typeof renderDebts === "function") renderDebts();
    if (name === "bills" && typeof renderBills === "function") renderBills();
    if (name === "insights" && typeof renderInsightsPage === "function") renderInsightsPage();
    if (name === "settings" && typeof renderToolsPage === "function") renderToolsPage();
    if (name === "profile") {
      if (typeof updateProfileUI === "function") updateProfileUI();
      if (typeof setProfileEditMode === "function") setProfileEditMode(false);
      if (typeof fillProfileViewMode === "function") fillProfileViewMode();
    }
  } catch (err) {
    console.warn("switchPage render", err);
  }

  inPage.classList.add("page-visible");
  try {
    inPage.querySelectorAll(".panel, .stat-card, article, .section-intro, .prem-stat, .kpi-mini").forEach((el) => {
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.animation = "none";
    });
  } catch (_) {}

  try { if (typeof refreshIcons === "function") refreshIcons(); } catch (_) {}

  if (isMobileNav()) closeSidebar();
}

function isMobileNav() {
  return window.matchMedia("(max-width: 760px)").matches;
}
function openSidebar() {
  const sb = $("sidebar");
  const shell = document.querySelector(".app-shell");
  if (!sb) return;
  if (isMobileNav()) {
    sb.classList.add("open");
    sb.classList.remove("collapsed");
    const ov = $("mobileOverlay");
    if (ov) ov.classList.add("show");
  } else {
    sb.classList.remove("collapsed");
    if (shell) shell.classList.remove("sidebar-collapsed");
    localStorage.setItem(SIDEBAR_KEY, "open");
  }
}
function closeSidebar() {
  const sb = $("sidebar");
  const shell = document.querySelector(".app-shell");
  if (!sb) return;
  if (isMobileNav()) {
    sb.classList.remove("open");
    const ov = $("mobileOverlay");
    if (ov) ov.classList.remove("show");
  } else {
    sb.classList.add("collapsed");
    if (shell) shell.classList.add("sidebar-collapsed");
    localStorage.setItem(SIDEBAR_KEY, "collapsed");
  }
}
function toggleSidebar() {
  if (isMobileNav()) {
    if ($("sidebar").classList.contains("open")) closeSidebar();
    else openSidebar();
  } else {
    if ($("sidebar").classList.contains("collapsed")) openSidebar();
    else closeSidebar();
  }
}
function getNavPos() {
  const p = localStorage.getItem(NAV_POS_KEY);
  return ["left", "right", "top", "bottom"].includes(p) ? p : "left";
}
function applyNavPos(pos) {
  if (!["left", "right", "top", "bottom"].includes(pos)) pos = "left";
  const shell = document.querySelector(".app-shell");
  const sb = $("sidebar");
  if (shell) shell.setAttribute("data-nav-pos", pos);
  try { localStorage.setItem(NAV_POS_KEY, pos); } catch (_) {}
  const sel = $("navPosSelect");
  if (sel && sel.value !== pos) sel.value = pos;
  // Always show nav when switching position (avoid black/empty feel)
  if (sb) {
    sb.classList.remove("collapsed", "open");
  }
  if (shell) shell.classList.remove("sidebar-collapsed");
  try { localStorage.setItem(SIDEBAR_KEY, "open"); } catch (_) {}
  const ov = $("mobileOverlay");
  if (ov) ov.classList.remove("show");
  try { initSidebarState(); } catch (_) {}
  // Ensure a page is visible
  try {
    const vis = document.querySelector(".page-section.page-visible");
    if (!vis) {
      const ovw = $("overviewPage");
      if (ovw) ovw.classList.add("page-visible");
    }
  } catch (_) {}
  try { refreshIcons(); } catch (_) {}
  try { if (typeof renderProDashboard === "function") renderProDashboard(); } catch (_) {}
  try {
    if (typeof closeSidebarSettings === "function") closeSidebarSettings();
  } catch (_) {}
  try {
    const ovw = document.getElementById("overviewPage");
    if (ovw && !document.querySelector(".page-section.page-visible")) {
      ovw.classList.add("page-visible");
    }
  } catch (_) {}
  try {
    requestAnimationFrame(() => {
      try {
        if (typeof renderCharts === "function") renderCharts();
        if (typeof cashflowChart !== "undefined" && cashflowChart && cashflowChart.resize) cashflowChart.resize();
        if (typeof categoryChart !== "undefined" && categoryChart && categoryChart.resize) categoryChart.resize();
        if (typeof reportChart !== "undefined" && reportChart && reportChart.resize) reportChart.resize();
      } catch (_) {}
    });
  } catch (_) {}
}
function setNavPos(pos) {
  applyNavPos(pos);
  showToast("Nav: " + (pos.charAt(0).toUpperCase() + pos.slice(1)));
}
function initSidebarState() {
  const shell = document.querySelector(".app-shell");
  const sb = $("sidebar");
  if (!sb) return;
  // always keep data-nav-pos in sync
  const pos = getNavPos();
  if (shell && shell.getAttribute("data-nav-pos") !== pos) {
    shell.setAttribute("data-nav-pos", pos);
  }
  if (isMobileNav()) {
    sb.classList.remove("open", "collapsed");
    if (shell) shell.classList.remove("sidebar-collapsed");
    const ov = $("mobileOverlay");
    if (ov) ov.classList.remove("show");
    return;
  }
  // Desktop: restore preference; default OPEN so nav never "disappears"
  const saved = localStorage.getItem(SIDEBAR_KEY);
  if (saved === "collapsed") {
    sb.classList.add("collapsed");
    if (shell) shell.classList.add("sidebar-collapsed");
  } else {
    sb.classList.remove("collapsed");
    if (shell) shell.classList.remove("sidebar-collapsed");
    try { localStorage.setItem(SIDEBAR_KEY, "open"); } catch (_) {}
  }
}


/* ===== Auth (local accounts on this device) ===== */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  catch (e) { console.error(e); throw new Error("Storage blocked — allow site data / exit private mode"); }
}
function hashPass(str) {
  let h = 2166136261;
  const s = "hkauth:" + String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "p:" + (h >>> 0).toString(16);
}
function getSessionUserId() {
  try {
    return localStorage.getItem(SESSION_USER_KEY) || sessionStorage.getItem(SESSION_USER_KEY) || "";
  } catch { return ""; }
}
function setSessionUserId(id) {
  try {
    if (id) {
      localStorage.setItem(SESSION_USER_KEY, id);
      sessionStorage.setItem(SESSION_USER_KEY, id);
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
    }
  } catch {}
}
function findUserByEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  const users = loadUsers();
  if (!Array.isArray(users)) return null;
  return users.find(u => u && u.email === e) || null;
}
function getCurrentUser() {
  if (!currentUserId) return null;
  return loadUsers().find(u => u.id === currentUserId) || null;
}
function profilePhotoKey() {
  return userScope("hisabKitabProfilePhotoV1");
}
function getProfilePhoto() {
  try { return localStorage.getItem(profilePhotoKey()) || ""; } catch { return ""; }
}
function setProfilePhoto(dataUrl) {
  if (!dataUrl) localStorage.removeItem(profilePhotoKey());
  else localStorage.setItem(profilePhotoKey(), dataUrl);
}
function processProfilePhotoFile(file) {
  if (!file) return;
  if (!String(file.type || "").startsWith("image/")) {
    showToast("Please choose an image file");
    return;
  }
  if (file.size > 2.5 * 1024 * 1024) {
    showToast("Image too large (max 2.5MB)");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const data = canvas.toDataURL("image/jpeg", 0.85);
        setProfilePhoto(data);
        applyAvatarPhoto(data);
        try { if (typeof updateProfileUI === "function") updateProfileUI(); } catch (_) {}
        showToast("Profile photo updated");
      } catch (err) {
        console.error(err);
        showToast("Could not process image");
      }
    };
    img.onerror = () => showToast("Invalid image");
    img.src = reader.result;
  };
  reader.onerror = () => showToast("Could not read file");
  reader.readAsDataURL(file);
}
function openProfilePhotoPicker() {
  const input = $("profilePhotoInput");
  if (input) {
    input.value = "";
    input.click();
  }
}

function initialsFromName(name) {
  const parts = String(name || "U").trim().split(/\s+/);
  return ((parts[0][0] || "U") + (parts[1] ? parts[1][0] : "")).toUpperCase();
}
function applyAvatarPhoto(photo) {
  const pairs = [
    ["userAvatarInitials", "userAvatarImg"],
    ["userAvatarInitialsLg", "userAvatarImgLg"],
    ["profileHubInitials", "profileHubImg"]
  ];
  pairs.forEach(([iniId, imgId]) => {
    const ini = $(iniId);
    const img = $(imgId);
    if (photo && img) {
      img.src = photo;
      img.hidden = false;
      if (ini) ini.hidden = true;
    } else {
      if (img) { img.removeAttribute("src"); img.hidden = true; }
      if (ini) ini.hidden = false;
    }
  });
  const removeBtn = $("removePhotoBtn");
  if (removeBtn) removeBtn.hidden = !photo;
  const hubRemove = $("hubRemovePhotoBtn");
  if (hubRemove) hubRemove.hidden = !photo;
}
function updateProfileUI() {
  const u = getCurrentUser();
  let name, email, initials;
  if (isGuestUser()) {
    name = "Guest";
    email = "Local guest workspace";
    initials = "G";
  } else if (u) {
    name = u.name || "User";
    email = u.email || "";
    initials = initialsFromName(u.name);
  } else {
    name = "My Workspace";
    email = "Premium Plan";
    initials = "HK";
  }
  ["userNameLabel", "userNameLabelDrop"].forEach(id => { const el = $(id); if (el) el.textContent = name; });
  // Sidebar footer: email only (short)
  const emailEl = $("userEmailLabel");
  if (emailEl) emailEl.textContent = email || (isGuestUser() ? "Local guest workspace" : "—");
  // Dropdown: email + separate mobile line
  const emailDrop = $("userEmailLabelDrop");
  if (emailDrop) emailDrop.textContent = email || "—";
  const mobileDrop = $("userMobileLabelDrop");
  if (mobileDrop) {
    const m = (u && u.mobile) ? String(u.mobile).trim() : "";
    if (m) {
      mobileDrop.hidden = false;
      mobileDrop.textContent = m;
    } else {
      mobileDrop.hidden = true;
      mobileDrop.textContent = "";
    }
  }
  ["userAvatarInitials", "userAvatarInitialsLg"].forEach(id => { const el = $(id); if (el) el.textContent = initials; });
  applyAvatarPhoto((u || isGuestUser()) ? getProfilePhoto() : "");
  const plan = document.querySelector(".profile-plan");
  if (plan) plan.textContent = isGuestUser() ? "Guest · Local only" : "Premium · Local account";
  const guest = isGuestUser();
  const cab = $("profileCreateAccountBtn");
  if (cab) {
    cab.hidden = !guest;
    cab.style.display = guest ? "" : "none";
  }
  const accBtn = $("profileAccountBtn");
  if (accBtn) {
    accBtn.hidden = guest;
    accBtn.style.display = guest ? "none" : "";
  }
  const logoutLabel = $("logoutBtn") && $("logoutBtn").querySelector("span");
  if (logoutLabel) logoutLabel.textContent = guest ? "Exit guest" : "Log out";
  // Profile hub page header
  const hn = $("profileHubName");
  if (hn) hn.textContent = name;
  const he = $("profileHubEmail");
  if (he) he.textContent = email || (guest ? "Local guest workspace" : "—");
  const hp = $("profileHubPlan");
  if (hp) hp.textContent = guest ? "Guest · Local only" : "Premium · Local account";
  const hi = $("profileHubInitials");
  if (hi) hi.textContent = initials;
  const himg = $("profileHubImg");
  const photo = (u || guest) ? getProfilePhoto() : "";
  if (himg) {
    if (photo) { himg.src = photo; himg.hidden = false; if (hi) hi.hidden = true; }
    else { himg.removeAttribute("src"); himg.hidden = true; if (hi) hi.hidden = false; }
  }

  // Profile studio form fields
  try {
    const u = getCurrentUser();
    const guest = isGuestUser();
    const pn = $("profName");
    const pe = $("profEmail");
    const pm = $("profMobile");
    const pc = $("profCountry");
    if (pn) {
      pn.value = guest ? "Guest" : (u && u.name) || "";
      pn.disabled = guest;
    }
    if (pe) {
      pe.value = guest ? "" : (u && u.email) || "";
      pe.disabled = guest;
    }
    try {
      ensureCountrySelect();
      fillMobileUI(guest ? "" : (u && u.mobile) || "");
      if (pm) pm.disabled = guest;
      if (pc) pc.disabled = guest;
    } catch (_) {
      if (pm) {
        pm.value = guest ? "" : (u && u.mobile) || "";
        pm.disabled = guest;
      }
    }
    ["profCurrentPass","profNewPass","profNewPass2"].forEach(id => {
      const el = $(id);
      if (el) { el.value = ""; el.disabled = guest; }
    });
    const wrap = $("profCurrentPassWrap");
    if (wrap && u) {
      const noLocal = u.provider === "google" && !u.pass;
      wrap.style.display = noLocal ? "none" : "";
    }
    const saveBtn = $("profileSaveBtn");
    if (saveBtn) saveBtn.disabled = guest;
    const err = $("profileStudioError");
    if (err) { err.hidden = true; err.textContent = ""; }
  } catch (_) {}
  try { if (typeof syncProfilePrefsUI === "function") syncProfilePrefsUI(); } catch (_) {}
  try { if (typeof fillProfileStatus === "function") fillProfileStatus(); } catch (_) {}
  try { if (typeof wireProfilePrefs === "function") wireProfilePrefs(); } catch (_) {}
}
function openProfileMenu() {
  const menu = $("profileMenu");
  const drop = $("profileDropdown");
  const trig = $("profileTrigger");
  if (!menu || !drop) return;
  menu.classList.add("open");
  drop.hidden = false;
  if (trig) trig.setAttribute("aria-expanded", "true");
  refreshIcons();
}
function closeProfileMenu() {
  const menu = $("profileMenu");
  const drop = $("profileDropdown");
  const trig = $("profileTrigger");
  if (!menu || !drop) return;
  menu.classList.remove("open");
  drop.hidden = true;
  if (trig) trig.setAttribute("aria-expanded", "false");
}
function toggleProfileMenu() {
  const drop = $("profileDropdown");
  if (!drop) return;
  if (drop.hidden) openProfileMenu();
  else closeProfileMenu();
}

function showAuthScreen(tab = "login") {
  const screen = $("authScreen");
  if (!screen) return;
  screen.hidden = false;
  screen.classList.add("show");
  screen.style.display = "flex";
  document.body.style.overflow = "hidden";
  switchAuthTab(tab || "login");
  refreshIcons();
  setTimeout(() => {
    const focusId = (tab === "register") ? "registerName" : "loginEmail";
    const el = $(focusId);
    if (el) el.focus();
  }, 50);
  setTimeout(initGoogleSignIn, 200);
}
function hideAuthScreen() {
  const screen = $("authScreen");
  if (!screen) return;
  screen.hidden = true;
  screen.classList.remove("show");
  screen.style.display = "none";
  document.body.style.overflow = "";
}
function switchAuthTab(tab) {
  tab = tab === "register" ? "register" : "login";
  document.querySelectorAll(".auth-tab").forEach(b => {
    b.classList.toggle("active", b.dataset.authTab === tab);
  });
  const login = $("loginForm");
  const reg = $("registerForm");
  if (login) {
    login.hidden = tab !== "login";
    login.style.display = tab === "login" ? "grid" : "none";
  }
  if (reg) {
    reg.hidden = tab !== "register";
    reg.style.display = tab === "register" ? "grid" : "none";
  }
  const err = $("authError");
  if (err) { err.textContent = ""; err.hidden = true; err.setAttribute("hidden", ""); }
  try { refreshIcons(); } catch (_) {}
}
function setAuthError(msg) {
  const err = $("authError");
  if (err) {
    err.textContent = msg || "";
    err.hidden = !msg;
    if (msg) err.removeAttribute("hidden");
    else err.setAttribute("hidden", "");
  }
}
function loadUserData() {
  transactions = loadTransactions();
  // Prefer "all" on boot so Total Balance / history never look empty after refresh
  try {
    if (typeof dashPeriod === "string" && dashPeriod !== "all") {
      // keep saved period, but if zero activity in that period while all-time has data, switch to all
      const hasAny = (transactions || []).length > 0;
      if (hasAny && typeof periodTotals === "function") {
        const cur = periodTotals(dashPeriod);
        if (cur && cur.count === 0) {
          dashPeriod = "all";
          try { saveDashPeriod("all"); } catch (_) {}
        }
      }
    }
  } catch (_) {}
  applyTheme(getTheme());
  const baseSel = $("baseCurrencySelect");
  if (baseSel) baseSel.value = getBaseCurrency();
  updateProfileUI();
  refresh();
  // Hard guarantee: paint balance from loaded transactions
  try {
    const t = totals();
    if ($("balanceValue")) $("balanceValue").textContent = money(t.balance);
    if ($("incomeValue") && typeof dashPeriod === "string" && dashPeriod === "all") {
      $("incomeValue").textContent = money(t.income);
      if ($("expenseValue")) $("expenseValue").textContent = money(t.expense);
      if ($("countValue")) $("countValue").textContent = String((transactions || []).length);
    }
  } catch (_) {}
  try { if (typeof applyPeriodButtons === "function") applyPeriodButtons(); } catch (_) {}
  try { if (typeof renderProDashboard === "function") renderProDashboard(); } catch (_) {}
  refreshIcons();
}
function isGuestUser() {
  return currentUserId === GUEST_USER_ID;
}
function enterAsGuest() {
  try {
    currentUserId = GUEST_USER_ID;
    setSessionUserId(GUEST_USER_ID);
    appUnlocked = false;
    hideAuthScreen();
    loadUserData();
    // Guest: skip lock unless they set PIN while in guest mode
    try { enforceLock(); } catch (_) {}
    updateProfileUI();
    showToast("Welcome — guest mode");
  } catch (err) {
    console.error(err);
    setAuthError(err.message || "Could not continue");
  }
}
function loginUser(user) {

  try {
    currentUserId = user.id;
    setSessionUserId(user.id);
    appUnlocked = false;
    hideAuthScreen();
    loadUserData();
    try { updateGreeting(); } catch (_) {}
    enforceLock();
    showToast("Welcome, " + (user.name || "user"));
  } catch (err) {
    console.error(err);
    setAuthError(err.message || "Login error");
    showAuthScreen("login");
  }
}
function logoutUser() {
  try { closeProfileMenu(); } catch (_) {}
  currentUserId = null;
  setSessionUserId("");
  appUnlocked = false;
  transactions = [];
  clearAutoLockTimer();
  hideLockScreen();
  updateProfileUI();
  showAuthScreen("login");
  showToast("Logged out");
}
function registerUser(name, email, password, mobile = "") {
  const users = loadUsers();
  const e = email.trim().toLowerCase();
  if (users.some(u => u.email === e)) throw new Error("Email already registered");
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim().slice(0, 40),
    email: e,
    mobile: String(mobile || "").trim().slice(0, 20),
    pass: hashPass(password),
    createdAt: Date.now()
  };
  users.push(user);
  saveUsers(users);
  return user;
}
function updateCurrentUser(patch) {
  if (!currentUserId || isGuestUser()) throw new Error("No account logged in");
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === currentUserId);
  if (idx < 0) throw new Error("Account not found");
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return users[idx];
}
function changePassword(currentPass, newPass) {
  const u = getCurrentUser();
  if (!u) throw new Error("No account logged in");
  if (u.provider === "google" && !u.pass) {
    // allow setting first local password for Google accounts
  } else if (u.pass !== hashPass(currentPass)) {
    throw new Error("Current password is incorrect");
  }
  if (!newPass || newPass.length < 4) throw new Error("New password min 4 characters");
  return updateCurrentUser({ pass: hashPass(newPass) });
}

/* ===== Google Sign-In ===== */
function getGoogleClientId() {
  try { return (localStorage.getItem(GOOGLE_CLIENT_KEY) || "").trim(); }
  catch { return ""; }
}
function setGoogleClientId(id) {
  localStorage.setItem(GOOGLE_CLIENT_KEY, String(id || "").trim());
}
function parseJwtPayload(token) {
  try {
    const part = String(token).split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function loginOrRegisterGoogle(profile) {
  const email = String(profile.email || "").trim().toLowerCase();
  if (!email) throw new Error("Google account has no email");
  let user = findUserByEmail(email);
  if (!user) {
    const users = loadUsers();
    user = {
      id: "g_" + (profile.sub || Date.now().toString(36)),
      name: String(profile.name || email.split("@")[0]).slice(0, 40),
      email,
      pass: "",
      provider: "google",
      googleSub: profile.sub || "",
      createdAt: Date.now()
    };
    users.push(user);
    saveUsers(users);
  } else {
    // link google if local account exists with same email
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], provider: users[idx].provider || "google", googleSub: profile.sub || users[idx].googleSub || "" };
      if (!users[idx].name && profile.name) users[idx].name = profile.name;
      saveUsers(users);
      user = users[idx];
    }
  }
  loginUser(user);
}
function handleGoogleCredential(response) {
  try {
    const payload = parseJwtPayload(response.credential);
    if (!payload || !payload.email) {
      setAuthError("Google sign-in failed (no email)");
      return;
    }
    loginOrRegisterGoogle(payload);
  } catch (err) {
    setAuthError(err.message || "Google sign-in failed");
  }
}
function initGoogleSignIn() {
  const clientId = getGoogleClientId();
  // Google UI optional — skip quietly if not present
  if (!$("googleSignInBtn") && !$("googleBtnHost") && !$("googleSetupBox")) return;
  const setup = $("googleSetupBox");
  const input = $("googleClientIdInput");
  if (input && !input.value) input.value = clientId;
  if (setup) setup.style.display = clientId ? "none" : "block";

  if (!clientId) return;
  if (!(window.google && google.accounts && google.accounts.id)) return;

  try {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    const host = $("googleBtnHost");
    if (host) {
      host.innerHTML = "";
      google.accounts.id.renderButton(host, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: 320
      });
    }
  } catch (err) {
    console.error(err);
  }
}
function promptGoogleSignIn() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    const setup = $("googleSetupBox");
    if (setup) setup.style.display = "block";
    setAuthError("Pehle Google Client ID save karo (neeche box)");
    return;
  }
  if (!(window.google && google.accounts && google.accounts.id)) {
    setAuthError("Google script loading... 2 sec baad phir try karo");
    setTimeout(initGoogleSignIn, 600);
    return;
  }
  try {
    initGoogleSignIn();
    // Official button is rendered under the custom button; also try One Tap
    google.accounts.id.prompt();
    setAuthError("");
    
  } catch (err) {
    setAuthError(err.message || "Google sign-in error");
  }
}

function enforceAuth() {
  const sid = getSessionUserId();
  const users = loadUsers();
  // Restore registered user session
  if (sid && users.some(u => u.id === sid)) {
    currentUserId = sid;
    hideAuthScreen();
    loadUserData();
    try { updateGreeting(); } catch (_) {}
    enforceLock();
    return true;
  }
  // Restore guest session
  if (sid === GUEST_USER_ID) {
    currentUserId = GUEST_USER_ID;
    hideAuthScreen();
    loadUserData();
    try { enforceLock(); } catch (_) {}
    return true;
  }
  currentUserId = null;
  showAuthScreen(users.length ? "login" : "register");
  return false;
}

/* ===== App Lock ===== */
function getStoredPin() {
  try { return localStorage.getItem(LOCK_KEY()) || ""; }
  catch { return ""; }
}
function isLockEnabled() {
  return !!getStoredPin();
}

const LOCK_HIDE_KEY = "hisabKitabLockOnHideV1";
const LOCK_BACKUP_KEY = "hisabKitabLockBackupV1";
const LOCK_FAIL_KEY = "hisabKitabLockFailV1";
function getLockOnHide() {
  try { return localStorage.getItem(userScope(LOCK_HIDE_KEY)) === "1"; } catch { return false; }
}
function setLockOnHide(on) {
  localStorage.setItem(userScope(LOCK_HIDE_KEY), on ? "1" : "0");
}
function getLockBackupGuard() {
  try { return localStorage.getItem(userScope(LOCK_BACKUP_KEY)) === "1"; } catch { return false; }
}
function setLockBackupGuard(on) {
  localStorage.setItem(userScope(LOCK_BACKUP_KEY), on ? "1" : "0");
}
function getFailState() {
  try { return JSON.parse(localStorage.getItem(userScope(LOCK_FAIL_KEY)) || "{}") || {}; }
  catch { return {}; }
}
function setFailState(st) {
  localStorage.setItem(userScope(LOCK_FAIL_KEY), JSON.stringify(st));
}
function clearFailState() { setFailState({ count: 0, until: 0 }); }
function isLockCooldown() {
  const st = getFailState();
  return st.until && Date.now() < st.until;
}
function remainingCooldownSec() {
  const st = getFailState();
  return Math.max(0, Math.ceil(((st.until || 0) - Date.now()) / 1000));
}
function registerFailedUnlock() {
  const st = getFailState();
  const count = (Number(st.count) || 0) + 1;
  let until = 0;
  if (count >= 5) until = Date.now() + 60 * 1000; // 60s after 5 fails
  else if (count >= 3) until = Date.now() + 15 * 1000; // 15s after 3
  setFailState({ count, until });
  return { count, until };
}
function pinStrength(pin) {
  const p = String(pin || "");
  // weak patterns
  const weak = /^(0123|1234|2345|3456|4567|5678|6789|9876|0000|1111|2222|3333|4444|5555|6666|7777|8888|9999)$/.test(p);
  const need = (typeof getPinLength === "function") ? getPinLength() : 4;
  if (p.length < need) return { pct: 18, label: "Too short", level: "weak", color: "#f17e82", tip: "Need " + need + " digits", segs: 1 };
  if (weak) return { pct: 30, label: "Weak", level: "weak", color: "#f17e82", tip: "Avoid simple sequences like 1234", segs: 1 };
  if (p.length === 4) return { pct: 48, label: "Basic", level: "basic", color: "#e0b84a", tip: "OK — 6+ digits is safer", segs: 2 };
  if (p.length <= 6) return { pct: 72, label: "Good", level: "good", color: "#7dd3a0", tip: "Solid PIN length", segs: 3 };
  return { pct: 100, label: "Strong", level: "strong", color: "#5ac69a", tip: "Great — hard to guess", segs: 4 };
}
function updatePinStrengthUI() {
  const pin = ($("lockNewPin") && $("lockNewPin").value) || "";
  const wrap = $("pinStrengthWrap");
  const fill = $("pinStrengthFill");
  const text = $("pinStrengthText");
  const badge = $("pinStrengthBadge");
  const segs = $("pinStrengthSegments");
  if (!wrap) return;
  if (!pin) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  wrap.removeAttribute("hidden");
  const s = pinStrength(pin);
  if (fill) {
    fill.style.width = s.pct + "%";
    fill.style.background = s.color;
  }
  if (badge) {
    badge.textContent = s.label;
    badge.className = "pin-strength-badge lvl-" + s.level;
  }
  if (text) text.textContent = s.tip + " · " + pin.length + " digit" + (pin.length === 1 ? "" : "s");
  if (segs) {
    const dots = segs.querySelectorAll("i");
    dots.forEach((el, i) => {
      el.className = "";
      if (i < s.segs) el.classList.add("on-" + s.level);
    });
  }
}

// In-memory only: refresh / new tab always requires PIN again
let appUnlocked = false;
const AUTO_LOCK_KEY = "hisabKitabAutoLockMinV1";
let autoLockTimer = null;
function getAutoLockMode() {
  try {
    const v = localStorage.getItem(AUTO_LOCK_KEY);
    if (v == null || v === "") return "auto";
    return v;
  } catch { return "auto"; }
}
function getAutoLockMinutes() {
  try {
    const v = getAutoLockMode();
    if (v === "auto") return 2; // smart default
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 2;
  } catch { return 2; }
}
function setAutoLockMinutes(min) {
  const v = String(min);
  if (v === "auto") {
    localStorage.setItem(AUTO_LOCK_KEY, "auto");
    return;
  }
  const n = Number(v);
  localStorage.setItem(AUTO_LOCK_KEY, String(Number.isFinite(n) && n >= 0 ? n : 2));
}
function getAutoLockMs() {
  const min = getAutoLockMinutes();
  return min > 0 ? min * 60 * 1000 : 0;
}
function autoLockLabel() {
  const mode = getAutoLockMode();
  if (mode === "0" || getAutoLockMinutes() <= 0) return "Auto-lock Off";
  if (mode === "auto") return "Automatic";
  const m = getAutoLockMinutes();
  return m === 1 ? "1m idle" : `${m}m idle`;
}

function isSessionUnlocked() {
  return appUnlocked === true;
}
function setSessionUnlocked(on) {
  appUnlocked = !!on;
  if (on) resetAutoLockTimer();
  else clearAutoLockTimer();
}
function clearAutoLockTimer() {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
}
function resetAutoLockTimer() {
  clearAutoLockTimer();
  if (!isLockEnabled() || !appUnlocked) return;
  const ms = getAutoLockMs();
  if (!ms) return; // Off
  autoLockTimer = setTimeout(() => {
    if (!isLockEnabled()) return;
    appUnlocked = false;
    showLockScreen();
    showToast("Locked due to inactivity");
  }, ms);
}
function armAutoLockListeners() {
  if (window.__hkLockArmed) return;
  window.__hkLockArmed = true;
  const bump = () => {
    if (isLockEnabled() && appUnlocked) resetAutoLockTimer();
  };
  ["pointerdown", "keydown", "touchstart", "mousemove", "scroll"].forEach(evt => {
    document.addEventListener(evt, bump, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (isLockEnabled() && appUnlocked && getLockOnHide()) {
        appUnlocked = false;
        showLockScreen();
      }
      return;
    }
    if (isLockEnabled() && !appUnlocked) showLockScreen();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "L" || e.key === "l")) {
      e.preventDefault(); e.stopPropagation();
      try {
        if (!isLockEnabled()) {
          showToast("Set a PIN first: Profile → App lock & PIN");
          try { openLockModal(); } catch (_) {}
          return;
        }
        if (!appUnlocked) { showLockScreen(); showToast("Already locked"); return; }
        setSessionUnlocked(false); showLockScreen(); showToast("Locked");
      } catch (err) { console.error(err); showToast("Could not lock"); }
    }
  }, true);
}

const PIN_LEN_KEY = "hisabKitabPinLenV1";
function getPinLength() {
  try {
    const v = Number(localStorage.getItem(userScope(PIN_LEN_KEY)));
    return v === 6 ? 6 : 4;
  } catch { return 4; }
}
function setPinLength(n) {
  const len = Number(n) === 6 ? 6 : 4;
  localStorage.setItem(userScope(PIN_LEN_KEY), String(len));
  applyPinLengthToInputs();
  return len;
}
function applyPinLengthToInputs() {
  const len = getPinLength();
  ["unlockPin", "lockCurrentPin", "lockNewPin", "lockConfirmPin"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.maxLength = len;
      el.setAttribute("maxlength", String(len));
    }
  });
  document.querySelectorAll(".pin-len-btn").forEach(b => {
    b.classList.toggle("active", Number(b.dataset.pinLen) === len);
  });
}
function pinLenRegex() {
  const n = getPinLength();
  return new RegExp("^\\d{" + n + "}$");
}
function fnvHash(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function simpleHash(str) {
  // v3: PIN only (user isolation is via LOCK_KEY userScope)
  return "hk3:" + fnvHash("hk-vault-v3|" + String(str));
}
function pinHashCandidates(pin) {
  const p = String(pin);
  const uid = currentUserId || "guest";
  return [
    simpleHash(p), // current
    "hk2:" + fnvHash("hk-vault-v2:" + uid + p), // previous salted
    "hk2:" + fnvHash("hk-vault-v2:guest" + p),
    "hk:" + fnvHash(p) // oldest
  ];
}
function setPin(pin) {
  const p = String(pin).replace(/\D/g, "").slice(0, getPinLength());
  localStorage.setItem(LOCK_KEY(), simpleHash(p));
}
function clearPin() {
  try { localStorage.removeItem(LOCK_KEY()); } catch (_) {}
  try {
    // also clear any legacy non-scoped key
    localStorage.removeItem(LOCK_KEY_BASE);
  } catch (_) {}
  appUnlocked = true;
  clearAutoLockTimer();
}
function verifyPin(pin) {
  const stored = getStoredPin();
  if (!stored) return false;
  const p = String(pin).replace(/\D/g, "");
  if (!p) return false;
  const ok = pinHashCandidates(p).some(h => h === stored);
  // migrate old hash to v3 on successful unlock
  if (ok && stored !== simpleHash(p)) {
    try { localStorage.setItem(LOCK_KEY(), simpleHash(p)); } catch (_) {}
  }
  return ok;
}
function showLockScreen() {
  const screen = document.getElementById("lockScreen");
  if (!screen) return;
  screen.hidden = false;
  screen.removeAttribute("hidden");
  screen.style.removeProperty("display");
  screen.style.display = "flex";
  screen.style.zIndex = "220";
  document.body.style.overflow = "hidden";
  try { applyPinLengthToInputs(); } catch (_) {}
  try { wirePinFields(); } catch (_) {}
  const input = document.getElementById("unlockPin");
  if (input) {
    input.value = "";
    input.disabled = isLockCooldown();
    setPinVisibility("unlockPin", false);
    syncPinDots("unlockPin");
    setTimeout(() => { if (!input.disabled) input.focus(); }, 80);
  }
  const hint = document.getElementById("lockHint");
  if (hint) hint.textContent = "";
  const att = document.getElementById("lockAttempts");
  if (att) {
    if (isLockCooldown()) att.textContent = "Too many attempts — wait " + remainingCooldownSec() + "s";
    else {
      const c = Number(getFailState().count) || 0;
      att.textContent = c ? (c + " failed attempt" + (c > 1 ? "s" : "")) : "";
    }
  }
  const ut = document.getElementById("unlockIdleTag");
  if (ut) ut.textContent = "Protection Active · " + autoLockLabel();
  const dial = document.querySelector("#lockScreen .vault-dial");
  if (dial) dial.classList.remove("unlock-ok");
  const sub = document.getElementById("unlockSubText");
  if (sub) sub.textContent = "Enter your " + getPinLength() + "-digit security PIN";
  try { refreshIcons(); } catch (_) {}
}
function hideLockScreen() {
  const screen = document.getElementById("lockScreen");
  if (!screen) return;
  screen.hidden = true;
  screen.setAttribute("hidden", "");
  screen.style.display = "none";
  screen.style.removeProperty("z-index");
  document.body.style.overflow = "";
}
function enforceLock() {
  try {
    if (!isLockEnabled()) {
      hideLockScreen();
      appUnlocked = true;
      return;
    }
    if (appUnlocked) {
      hideLockScreen();
      resetAutoLockTimer();
      return;
    }
    showLockScreen();
  } catch (e) {
    console.error("enforceLock", e);
    try { hideLockScreen(); } catch (_) {}
  }
}
function updateLockModalUI() {
  const on = isLockEnabled();
  const statusText = document.getElementById("lockStatusText");
  const currentWrap = document.getElementById("lockCurrentWrap");
  const removeBtn = document.getElementById("removeLockBtn");
  const lockNow = document.getElementById("lockNowBtn");
  const idleTag = document.getElementById("lockIdleTag");
  const submitBtn = document.getElementById("lockSubmitLabel");
  const dial = document.getElementById("settingsDial");
  if (statusText) statusText.textContent = on ? ("Protection On · " + autoLockLabel()) : "Protection Off";
  if (currentWrap) {
    currentWrap.hidden = !on;
    if (on) currentWrap.removeAttribute("hidden");
    else currentWrap.setAttribute("hidden", "");
  }
  if (removeBtn) {
    removeBtn.hidden = !on;
    if (on) removeBtn.removeAttribute("hidden");
    else removeBtn.setAttribute("hidden", "");
  }
  if (lockNow) {
    lockNow.hidden = !on;
    if (on) lockNow.removeAttribute("hidden");
    else lockNow.setAttribute("hidden", "");
  }
  if (idleTag) idleTag.textContent = on
    ? ("Protection active · auto-lock: " + autoLockLabel())
    : "Set a PIN to protect your data on this device.";
  if (submitBtn) {
    const label = on ? "Update PIN" : "Set PIN";
    const span = submitBtn.querySelector("span");
    if (span) span.textContent = label;
    else submitBtn.textContent = label;
  }
  if (dial) dial.classList.toggle("on", on);
  const autoSel = document.getElementById("autoLockSelect");
  if (autoSel) {
    const mode = getAutoLockMode();
    const ok = ["auto", "0", "1", "2", "5", "10", "15", "30"];
    autoSel.value = ok.includes(mode) ? mode : "auto";
  }
  if (document.getElementById("lockOnHide")) document.getElementById("lockOnHide").checked = getLockOnHide();
  if (document.getElementById("lockBackupGuard")) document.getElementById("lockBackupGuard").checked = getLockBackupGuard();
  try { applyPinLengthToInputs(); } catch (_) {}
  try { updatePinStrengthUI(); } catch (_) {}
  ["lockCurrentPin", "lockNewPin", "lockConfirmPin"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = "";
      setPinVisibility(id, false);
      syncPinDots(id);
    }
  });
}
function syncPinDots(inputId) {
  const input = document.getElementById(inputId);
  const dots = document.querySelector('.pin-dots[data-for="' + inputId + '"]');
  const field = input ? input.closest(".pin-field") : null;
  if (!input || !dots) return;
  const visible = field && field.classList.contains("show-pin");
  const need = getPinLength();
  const clipped = String(input.value || "").replace(/\D/g, "").slice(0, need);
  if (input.value !== clipped) input.value = clipped;
  const len = clipped.length;
  if (visible) {
    dots.innerHTML = "";
    dots.style.display = "none";
    return;
  }
  dots.style.display = "flex";
  let html = "";
  for (let i = 0; i < need; i++) {
    html += '<span class="pin-dot' + (i < len ? " filled" : "") + '"></span>';
  }
  dots.innerHTML = html;
}
function setPinVisibility(inputId, show) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const field = input.closest(".pin-field");
  const btn = document.querySelector('.pin-eye[data-toggle="' + inputId + '"]');
  const on = !!show;
  input.type = on ? "text" : "password";
  input.setAttribute("inputmode", "numeric");
  if (field) field.classList.toggle("show-pin", on);
  if (btn) {
    btn.innerHTML = on ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
    btn.setAttribute("aria-label", on ? "Hide PIN" : "Show PIN");
  }
  syncPinDots(inputId);
  try { if (window.lucide) lucide.createIcons(); } catch (_) {}
}
function wirePinFields() {
  if (!window.__hkPinWired) {
    window.__hkPinWired = true;
    document.querySelectorAll(".pin-field input").forEach(input => {
      if (!input.id) return;
      setPinVisibility(input.id, false);
      input.addEventListener("input", () => {
        const max = getPinLength();
        input.value = String(input.value || "").replace(/\D/g, "").slice(0, max);
        syncPinDots(input.id);
        // auto-submit unlock when full PIN typed
        if (input.id === "unlockPin" && input.value.length === max) {
          const form = document.getElementById("unlockForm");
          if (form && !isLockCooldown()) {
            setTimeout(() => {
              if (input.value.length === getPinLength()) form.requestSubmit();
            }, 120);
          }
        }
      });
    });
    document.querySelectorAll(".pin-eye").forEach(btn => {
      btn.type = "button";
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute("data-toggle");
        const input = id && document.getElementById(id);
        if (!input) return;
        const field = input.closest(".pin-field");
        const shown = !!(field && field.classList.contains("show-pin"));
        setPinVisibility(id, !shown);
        setTimeout(() => input.focus(), 20);
      });
    });
  }
  document.querySelectorAll(".pin-field input").forEach(input => {
    if (input.id) syncPinDots(input.id);
  });
}

function wireSettingsPinInputs() {
  ["lockCurrentPin", "lockNewPin", "lockConfirmPin"].forEach(id => {
    const input = document.getElementById(id);
    if (!input || input.dataset.hkWired) return;
    input.dataset.hkWired = "1";
    input.addEventListener("input", () => {
      const max = getPinLength();
      input.value = String(input.value || "").replace(/\D/g, "").slice(0, max);
      try { updatePinStrengthUI(); } catch (_) {}
    });
  });
}

function openLockModal() {
  const b = document.getElementById("lockModalBackdrop");
  if (!b) {
    showToast("Lock panel missing — reload app");
    return;
  }
  const form = document.getElementById("lockForm");
  if (form) form.reset();
  try { updateLockModalUI(); } catch (e) { console.error(e); }
  try { wireSettingsPinInputs(); } catch (_) {}
  b.classList.add("open");
  b.style.display = "flex";
  b.style.zIndex = "210";
  try { wirePinFields(); } catch (_) {}
  try { refreshIcons(); } catch (_) {}
  setTimeout(() => {
    const first = isLockEnabled()
      ? document.getElementById("lockCurrentPin")
      : document.getElementById("lockNewPin");
    if (first) first.focus();
  }, 50);
}
function closeLockModal() {
  const b = document.getElementById("lockModalBackdrop");
  if (b) {
    b.classList.remove("open");
    b.style.display = "none";
  }
  const form = document.getElementById("lockForm");
  if (form) form.reset();
  ["lockCurrentPin", "lockNewPin", "lockConfirmPin"].forEach(id => {
    try { setPinVisibility(id, false); syncPinDots(id); } catch (_) {}
  });
}

/* ===== Backup / Restore / Gmail ===== */
function buildBackupPayload() {
  return {
    app: "Hisab Kitab Premium",
    version: 2,
    exportedAt: new Date().toISOString(),
    transactions,
    budget: loadBudget(),
    theme: getTheme(),
    baseCurrency: getBaseCurrency(),
    lockEnabled: isLockEnabled()
  };
}
function downloadBackupFile() {
  const data = buildBackupPayload();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hisab-kitab-backup-${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return a.download;
}
function exportFullBackup() {
  const name = downloadBackupFile();
  showToast("Backup downloaded: " + name);
}
function emailBackupViaGmail() {
  const name = downloadBackupFile();
  const subject = encodeURIComponent("Hisab Kitab Backup " + new Date().toLocaleDateString("en"));
  const body = encodeURIComponent(
    "Assalam o Alaikum / Hello,\n\n" +
    "Please find my Hisab Kitab backup attached (file: " + name + ").\n\n" +
    "How to restore:\n" +
    "1. Open Hisab Kitab\n" +
    "2. Sidebar → Backup → Restore from file\n" +
    "3. Select this JSON file\n\n" +
    "Exported: " + new Date().toLocaleString() + "\n" +
    "Transactions: " + transactions.length + "\n"
  );
  // Open Gmail compose; user attaches the just-downloaded file
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
  window.open(gmail, "_blank", "noopener,noreferrer");
  showToast("Backup downloaded — attach it in Gmail");
}
function restoreFromBackupObject(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid backup");
  if (!Array.isArray(data.transactions)) throw new Error("Backup missing transactions");
  // basic sanitize
  transactions = data.transactions.filter(t => t && t.id && t.type && t.amount != null).map(t => ({
    id: String(t.id),
    description: String(t.description || "").slice(0, 60),
    amount: Number(t.amount) || 0,
    type: isIncomeType(t) ? (t.type === "remittance" ? "remittance" : "income") : "expense",
    category: String(t.category || "Other"),
    date: String(t.date || "").slice(0, 10),
    currency: CURRENCY_CODES.includes(t.currency) ? t.currency : "SAR",
    createdAt: Number(t.createdAt) || Date.now()
  }));
  saveTransactions();
  if (data.budget != null && Number(data.budget) > 0) saveBudget(Number(data.budget));
  if (data.theme && THEMES.includes(data.theme)) {
    localStorage.setItem(THEME_KEY(), data.theme);
    applyTheme(data.theme);
  }
  if (data.baseCurrency && CURRENCY_CODES.includes(data.baseCurrency)) {
    setBaseCurrency(data.baseCurrency);
    const sel = $("baseCurrencySelect");
    if (sel) sel.value = data.baseCurrency;
  }
  refresh();
}
function handleImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!confirm("Restore will replace current transactions and budget. Continue?")) return;
      restoreFromBackupObject(data);
      showToast("Backup restored successfully");
      try { closeBackupModal(); } catch (_) {}
      try { closeLockModal(); } catch (_) {}
    } catch (err) {
      console.error(err);
      showToast("Invalid backup file");
    }
  };
  reader.onerror = () => showToast("Could not read file");
  reader.readAsText(file);
}
function requirePinForSensitive(actionLabel) {
  if (!isLockEnabled() || !getLockBackupGuard()) return true;
  if (appUnlocked) return true;
  const pin = prompt((actionLabel || "This action") + " requires PIN");
  if (pin == null) return false;
  if (!verifyPin(pin)) { showToast("Wrong PIN"); return false; }
  return true;
}

function loadSampleData() {
  const base = getBaseCurrency();
  const today = new Date();
  const d = (offset) => {
    const x = new Date(today);
    x.setDate(x.getDate() - offset);
    return x.toISOString().slice(0, 10);
  };
  const samples = [
    { description: "Salary", amount: 12000, type: "income", category: "Salary", date: d(12), currency: base, account: "Bank" },
    { description: "Grocery", amount: 320, type: "expense", category: "Food", date: d(10), currency: base, account: "Cash" },
    { description: "Fuel / Petrol", amount: 180, type: "expense", category: "Transport", date: d(8), currency: base, account: "Card" },
    { description: "Electricity Bill", amount: 450, type: "expense", category: "Bills", date: d(6), currency: base, account: "Bank" },
    { description: "Freelance", amount: 2500, type: "income", category: "Freelance", date: d(5), currency: base, account: "Bank" },
    { description: "Restaurant / Food", amount: 95, type: "expense", category: "Food", date: d(3), currency: base, account: "Card" },
    { description: "Internet / Mobile", amount: 120, type: "expense", category: "Bills", date: d(2), currency: base, account: "Card" },
    { description: "Shopping", amount: 260, type: "expense", category: "Shopping", date: d(1), currency: base, account: "Cash" }
  ];
  samples.forEach((s, i) => {
    transactions.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + i,
      description: s.description,
      amount: s.amount,
      type: s.type,
      category: s.category,
      date: s.date,
      currency: s.currency,
      account: s.account,
      recurring: false,
      receipt: "",
      createdAt: Date.now() - i * 1000
    });
  });
  saveTransactions();
  if (!loadBudget()) saveBudget(5000);
  refresh();
  showToast("Sample data loaded");
  try { closeLockModal(); } catch (_) {}
}

function openBackupModal() {
  if (!requirePinForSensitive("Backup")) return;

  $("backupModalBackdrop").classList.add("open");
  refreshIcons();
}
function closeBackupModal() {
  $("backupModalBackdrop").classList.remove("open");
  const input = $("importBackupInput");
  if (input) input.value = "";
}

function exportCSV() {
  const header = ["Description", "Type", "Category", "Account", "TransferTo", "Date", "Amount", "Currency", "Tags", "Recurring"];
  const rows = transactions.map(t => [
    t.description, t.type, t.category, t.account || "Cash", t.transferTo || "",
    t.date, Number(t.amount).toFixed(2), txCurrency(t),
    Array.isArray(t.tags) ? t.tags.join(";") : (t.tags || ""),
    t.recurring ? (t.recurringFreq || "monthly") : "no"
  ]);
  const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hisab-kitab-transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV file exported");
}

/* ===== Event bindings ===== */
document.querySelectorAll(".nav-link").forEach(b => b.addEventListener("click", () => switchPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => switchPage(b.dataset.go)));
["addTopBtn", "addTransactionsBtn", "emptyAddBtn"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("click", () => openModal(null));
});
if ($("closeModal")) $("closeModal").addEventListener("click", closeModal);
if ($("cancelModal")) $("cancelModal").addEventListener("click", closeModal);
if ($("modalBackdrop")) {
  $("modalBackdrop").addEventListener("click", e => {
    if (e.target === $("modalBackdrop")) closeModal();
  });
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
    closeBudgetModal();
    closeLockModal();
    closeBackupModal();
    // Only close mobile drawer on Esc — never collapse desktop nav
    if (typeof isMobileNav === "function" && isMobileNav()) closeSidebar();
    closeThemePanel();
  }
});
document.querySelectorAll(".type-choice, .tx-type-tab").forEach(b => b.addEventListener("click", () => setEntryType(b.dataset.type)));
if ($("categoryTrigger")) {
  $("categoryTrigger").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCategoryMenu();
  });
}
if ($("categoryMenu")) {
  $("categoryMenu").addEventListener("click", (e) => {
    const opt = e.target.closest(".hk-select-option");
    if (!opt) return;
    e.preventDefault();
    const sel = $("category");
    if (sel) sel.value = opt.dataset.value || "";
    syncCategorySelectUi();
    closeCategoryMenu();
  });
}
document.addEventListener("click", (e) => {
  const ui = $("categorySelectUi");
  if (ui && ui.classList.contains("open") && !ui.contains(e.target)) closeCategoryMenu();
});

if ($("txMoreToggle")) {
  $("txMoreToggle").addEventListener("click", () => {
    const box = $("txAdvanced");
    if (!box) return;
    const open = box.classList.toggle("open");
    $("txMoreToggle").textContent = open ? "Hide options" : "More options";
  });
}
if ($("descriptionSelect")) {
  $("descriptionSelect").addEventListener("change", toggleCustomDescription);
}
fillDescriptionOptions("expense");
fillCategoryOptions("expense");


if ($("transactionForm")) {
  $("transactionForm").addEventListener("submit", e => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const amount = Number($("amount").value);
      if (!Number.isFinite(amount) || amount <= 0) {
        showToast("Please enter a valid amount");
        return;
      }
      const desc = getFormDescription();
      if (!desc) {
        showToast("Please choose a category or add a note");
        return;
      }
      let dateVal = $("date") && $("date").value;
      if (!dateVal) {
        const t = new Date();
        dateVal = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
      }
      const cur = ($("txCurrency") && $("txCurrency").value) || getBaseCurrency();
      let cat = ($("category") && $("category").value) || "Other";
      const entryType = ($("entryType") && $("entryType").value) || "expense";
      // Smart rules only for NEW transactions — never overwrite category on edit
      try {
        if (!editingId && typeof matchSmartRule === "function" && entryType !== "transfer") {
          const ruled = matchSmartRule(desc + " " + (($("txNote") && $("txNote").value) || ""));
          if (ruled) cat = ruled;
        }
      } catch (_) {}
      const tagsRaw = ($("txTags") && $("txTags").value) || "";
      const tags = tagsRaw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 8);
      let receiptData = ($("txReceiptData") && $("txReceiptData").value) || "";
      try {
        const fileEl = $("txReceipt");
        if (fileEl && fileEl.dataset.dataUrl) receiptData = fileEl.dataset.dataUrl;
      } catch (_) {}
      const payload = {
        description: desc,
        amount,
        type: entryType,
        category: entryType === "transfer" ? "Transfer" : cat,
        date: dateVal,
        currency: CURRENCY_CODES.includes(cur) ? cur : "SAR",
        account: ($("txAccount") && $("txAccount").value) || "Cash",
        transferTo: entryType === "transfer" ? (($("txTransferTo") && $("txTransferTo").value) || "Bank") : "",
        tags,
        recurring: !!( $("txRecurring") && $("txRecurring").checked ),
        recurringFreq: ($("txRecurringFreq") && $("txRecurringFreq").value) || "monthly",
        receipt: receiptData || ""
      };
      if (entryType === "transfer" && payload.account === payload.transferTo) {
        showToast("Transfer From and To must be different");
        return;
      }
      if (!currentUserId) {
        showToast("Please login first");
        return;
      }
      if (editingId) {
        const idx = transactions.findIndex(t => t.id === editingId);
        if (idx >= 0) {
          // Keep original id + createdAt; only update edited fields
          const prev = transactions[idx];
          transactions[idx] = {
            ...prev,
            ...payload,
            id: prev.id,
            createdAt: prev.createdAt || Date.now(),
            updatedAt: Date.now()
          };
          showToast("Transaction updated");
        } else {
          showToast("Could not find transaction to edit");
          return;
        }
      } else {
        transactions.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          ...payload,
          createdAt: Date.now()
        });
        showToast("Transaction saved successfully");
      }
      saveTransactions();
      try { bumpStreak(); } catch (_) {}
      closeModal();
      try { refresh(); } catch (err2) { console.error(err2); }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save transaction");
    }
  });
}

if ($("allRows")) {
  $("allRows").addEventListener("click", e => {
    const delBtn = e.target.closest("[data-delete]");
    if (delBtn) {
      const id = delBtn.dataset.delete;
      const removed = transactions.find(t => t.id === id);
      if (!removed) return;
      if (!confirm("Delete this transaction?")) return;
      transactions = transactions.filter(t => t.id !== id);
      saveTransactions();
      refresh();
      showToast("Transaction deleted", {
        actionLabel: "Undo", duration: 5000,
        onAction: () => {
          if (!transactions.some(t => t.id === removed.id)) {
            transactions.push(removed);
            saveTransactions(); refresh();
            showToast("Restored");
          }
        }
      });
      return;
    }
    const dupBtn = e.target.closest("[data-dup]");
    if (dupBtn) {
      const tx = transactions.find(t => t.id === dupBtn.dataset.dup);
      if (!tx) return;
      const copy = { ...tx, id: Date.now().toString(36)+Math.random().toString(36).slice(2,7),
        createdAt: Date.now(), description: (tx.description||"")+" (copy)",
        recurring: false, recurringParent: "", receipt: "" };
      transactions.push(copy); saveTransactions(); refresh();
      showToast("Duplicated");
      try { openModal(copy); } catch(_){}
      return;
    }
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      const tx = transactions.find(t => t.id === editBtn.dataset.edit);
      if (tx) openModal(tx);
    }
  });
}

["searchInput", "typeFilter", "categoryFilter"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("input", renderAll);
});
if ($("exportBtn")) $("exportBtn").addEventListener("click", exportCSV);
if ($("menuBtn")) $("menuBtn").addEventListener("click", toggleSidebar);
if ($("sidebarMenuBtn")) $("sidebarMenuBtn").addEventListener("click", toggleSidebar);
if ($("mobileOverlay")) $("mobileOverlay").addEventListener("click", closeSidebar);

/* Budget modal */
if ($("setBudgetBtn")) $("setBudgetBtn").addEventListener("click", openBudgetModal);
if ($("closeBudgetModal")) $("closeBudgetModal").addEventListener("click", closeBudgetModal);
if ($("cancelBudgetModal")) $("cancelBudgetModal").addEventListener("click", closeBudgetModal);
if ($("budgetModalBackdrop")) {
  $("budgetModalBackdrop").addEventListener("click", e => {
    if (e.target === $("budgetModalBackdrop")) closeBudgetModal();
  });
}
if ($("budgetForm")) {
  $("budgetForm").addEventListener("submit", e => {
    e.preventDefault();
    const amount = Number($("budgetAmount").value);
    if (!Number.isFinite(amount) || amount < 1) {
      showToast("Please enter a valid budget amount");
      return;
    }
    saveBudget(amount);
    renderBudget();
    updateInsight();
    closeBudgetModal();
    showToast("Budget saved");
  });
}

const today = new Date();
if ($("todayLabel")) {
  $("todayLabel").textContent = today.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
}
if ($("date")) {
  $("date").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
if ($("year")) $("year").textContent = today.getFullYear();

/* Theme */
if ($("themeToggle")) {
  $("themeToggle").addEventListener("click", e => {
    e.stopPropagation();
    toggleThemePanel();
  });
}
if ($("themePanel")) {
  $("themePanel").addEventListener("click", e => {
    const opt = e.target.closest(".theme-option");
    if (!opt) return;
    e.stopPropagation();
    setTheme(opt.dataset.themeSet);
    closeThemePanel();
  });
}
/* no auto-hide theme/settings on outside click */

/* insight stays open */
if ($("insightCard")) $("insightCard").classList.remove("collapsed");


/* Lock + Backup events */
if ($("backupBtn")) $("backupBtn").addEventListener("click", openBackupModal);
if ($("lockSettingsBtn")) $("lockSettingsBtn").addEventListener("click", openLockModal);
if ($("closeBackupModal")) $("closeBackupModal").addEventListener("click", closeBackupModal);
if ($("backupModalBackdrop")) {
  $("backupModalBackdrop").addEventListener("click", e => {
    if (e.target === $("backupModalBackdrop")) closeBackupModal();
  });
}

if ($("exportBackupBtn")) $("exportBackupBtn").addEventListener("click", exportFullBackup);
if ($("settingsBackupBtn")) $("settingsBackupBtn").addEventListener("click", () => {
  try {
    if (typeof requirePinForSensitive === "function" && !requirePinForSensitive("Backup")) return;
  } catch (_) {}
  exportFullBackup();
});
if ($("settingsImportInput")) {
  $("settingsImportInput").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      if (typeof requirePinForSensitive === "function" && !requirePinForSensitive("Restore backup")) {
        e.target.value = "";
        return;
      }
    } catch (_) {}
    handleImportFile(file);
    e.target.value = "";
  });
}
if ($("settingsSampleBtn")) {
  $("settingsSampleBtn").addEventListener("click", () => {
    if (!currentUserId) { showToast("Open the app first"); return; }
    if (!confirm("Load sample transactions? This adds demo data (does not erase your existing entries).")) return;
    loadSampleData();
  });
}

if ($("emailBackupBtn")) $("emailBackupBtn").addEventListener("click", emailBackupViaGmail);
if ($("importBackupInput")) {
  $("importBackupInput").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    handleImportFile(file);
  });
}
if ($("closeLockModal")) $("closeLockModal").addEventListener("click", closeLockModal);
if ($("cancelLockModal")) $("cancelLockModal").addEventListener("click", closeLockModal);
if ($("lockModalBackdrop")) {
  $("lockModalBackdrop").addEventListener("click", e => {
    if (e.target === $("lockModalBackdrop")) closeLockModal();
  });
}
if ($("lockForm")) {
  $("lockForm").addEventListener("submit", e => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!currentUserId) {
        showToast("Open the app first (login or guest)");
        return;
      }
      const current = (($("lockCurrentPin") && $("lockCurrentPin").value) || "").replace(/\D/g, "");
      const pin = (($("lockNewPin") && $("lockNewPin").value) || "").replace(/\D/g, "");
      const confirmPin = (($("lockConfirmPin") && $("lockConfirmPin").value) || "").replace(/\D/g, "");
      if (isLockEnabled()) {
        if (!current) {
          showToast("Enter current PIN");
          return;
        }
        if (!verifyPin(current)) {
          showToast("Current PIN is incorrect");
          return;
        }
      }
      const need = getPinLength();
      if (!(new RegExp("^\\d{" + need + "}$")).test(pin)) {
        showToast("PIN must be exactly " + need + " digits");
        return;
      }
      if (pin !== confirmPin) {
        showToast("New PIN and confirm do not match");
        return;
      }
      const wasOn = isLockEnabled();
      setPin(pin);
      setSessionUnlocked(true);
      clearFailState();
      updateLockModalUI();
      closeLockModal();
      hideLockScreen();
      showToast(wasOn ? "Security PIN updated" : "App lock enabled");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save PIN");
    }
  });
}
if ($("removeLockBtn")) {
  $("removeLockBtn").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!isLockEnabled()) {
        showToast("Lock already off");
        return;
      }
      const current = (($("lockCurrentPin") && $("lockCurrentPin").value) || "").replace(/\D/g, "");
      if (!current) {
        showToast("Type current PIN above, then Remove Lock");
        const el = $("lockCurrentPin");
        if (el) el.focus();
        return;
      }
      if (!verifyPin(current)) {
        showToast("Current PIN is wrong");
        return;
      }
      if (!confirm("Remove app lock from this device?")) return;
      clearPin();
      setSessionUnlocked(true);
      clearAutoLockTimer();
      clearFailState();
      hideLockScreen();
      updateLockModalUI();
      closeLockModal();
      showToast("App lock removed");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not remove lock");
    }
  });
}

if ($("autoLockSelect")) {
  $("autoLockSelect").addEventListener("change", () => {
    setAutoLockMinutes($("autoLockSelect").value);
    updateLockModalUI();
    if (appUnlocked) resetAutoLockTimer();
    const mode = getAutoLockMode();
    if (mode === "auto") showToast("Auto-lock: Automatic");
    else {
      const m = getAutoLockMinutes();
      showToast(m > 0 ? `Auto-lock: ${m} min` : "Auto-lock Off");
    }
  });
}

if ($("lockNowBtn")) {
  $("lockNowBtn").addEventListener("click", () => {
    setSessionUnlocked(false);
    closeLockModal();
    closeSidebar();
    showLockScreen();
    showToast("App locked");
  });
}
if ($("unlockForm")) {
  $("unlockForm").addEventListener("submit", e => {
    e.preventDefault();
    const hint = $("lockHint");
    const att = $("lockAttempts");
    const field = $("unlockPinField");
    if (isLockCooldown()) {
      if (hint) hint.textContent = "Locked out — wait " + remainingCooldownSec() + "s";
      return;
    }
    const pin = ($("unlockPin") && $("unlockPin").value) || "";
    const need = getPinLength();
    if (!(new RegExp("^\\d{" + need + "}$")).test(pin)) {
      if (hint) hint.textContent = "Enter " + need + "-digit PIN";
      return;
    }
    if (verifyPin(pin)) {
      clearFailState();
      setSessionUnlocked(true);
      const dial = document.querySelector("#lockScreen .vault-dial");
      if (dial) dial.classList.add("unlock-ok");
      if (hint) hint.textContent = "";
      if (att) att.textContent = "";
      setTimeout(() => {
        hideLockScreen();
        showToast("Unlocked");
      }, 280);
    } else {
      const st = registerFailedUnlock();
      if (field) {
        field.classList.remove("shake");
        void field.offsetWidth;
        field.classList.add("shake");
      }
      if (hint) hint.textContent = st.until > Date.now()
        ? ("Too many tries — wait " + Math.ceil((st.until - Date.now()) / 1000) + "s")
        : "Wrong PIN. Try again.";
      if (att) att.textContent = st.count + " failed attempt" + (st.count > 1 ? "s" : "");
      if ($("unlockPin")) {
        $("unlockPin").value = "";
        syncPinDots("unlockPin");
        if (!isLockCooldown()) $("unlockPin").focus();
        else $("unlockPin").disabled = true;
      }
    }
  });
}
// Keypad
if ($("pinKeypad")) {
  $("pinKeypad").addEventListener("click", e => {
    const btn = e.target.closest("[data-key]");
    if (!btn || isLockCooldown()) return;
    const input = $("unlockPin");
    if (!input) return;
    const k = btn.dataset.key;
    if (k === "clear") input.value = "";
    else if (k === "del") input.value = input.value.slice(0, -1);
    else if (/^[0-9]$/.test(k) && input.value.length < getPinLength()) input.value += k;
    syncPinDots("unlockPin");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
if ($("lockNewPin")) {
  $("lockNewPin").addEventListener("input", updatePinStrengthUI);
}
if ($("lockConfirmPin")) {
  $("lockConfirmPin").addEventListener("input", updatePinStrengthUI);
}
if ($("lockOnHide")) {
  $("lockOnHide").addEventListener("change", () => {
    setLockOnHide($("lockOnHide").checked);
    showToast($("lockOnHide").checked ? "Lock on tab switch: ON" : "Lock on tab switch: OFF");
  });
}
if ($("lockBackupGuard")) {
  $("lockBackupGuard").addEventListener("change", () => {
    setLockBackupGuard($("lockBackupGuard").checked);
    showToast($("lockBackupGuard").checked ? "Backup PIN guard: ON" : "Backup PIN guard: OFF");
  });
}

/* Auth UI events */
function doLogin() {
  try {
    const email = ($("loginEmail") && $("loginEmail").value || "").trim();
    const pass = ($("loginPassword") && $("loginPassword").value) || "";
    if (!email || !pass) {
      setAuthError("Email and password required");
      return;
    }
    const user = findUserByEmail(email);
    if (!user) {
      setAuthError("No account found. Create an account first.");
      return;
    }
    if (user.provider === "google" && !user.pass) {
      setAuthError("This email uses Google sign-in. Set a password via Register or use Google.");
      return;
    }
    if (user.pass !== hashPass(pass)) {
      setAuthError("Incorrect password. Please try again.");
      return;
    }
    setAuthError("");
    loginUser(user);
  } catch (err) {
    setAuthError(err.message || "Login failed");
  }
}
function doRegister() {
  try {
    const name = ($("registerName") && $("registerName").value || "").trim();
    const email = ($("registerEmail") && $("registerEmail").value || "").trim();
    const mobile = ($("registerMobile") && $("registerMobile").value || "").trim();
    const p1 = ($("registerPassword") && $("registerPassword").value) || "";
    const p2 = ($("registerPassword2") && $("registerPassword2").value) || "";
    if (!name || !email || !p1) {
      setAuthError("Please fill all fields");
      return;
    }
    if (!email.includes("@")) {
      setAuthError("Enter a valid email");
      return;
    }
    if (p1.length < 4) {
      setAuthError("Password min 4 characters");
      return;
    }
    if (p1 !== p2) {
      setAuthError("Passwords do not match");
      return;
    }
    const user = registerUser(name, email, p1, mobile);
    setAuthError("");
    loginUser(user);
    showToast("Account created");
  } catch (err) {
    setAuthError(err.message || "Could not register");
  }
}
document.querySelectorAll(".auth-tab").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    switchAuthTab(btn.dataset.authTab);
  });
});
if ($("loginForm")) {
  $("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    e.stopPropagation();
    doLogin();
  });
}
if ($("registerForm")) {
  $("registerForm").addEventListener("submit", e => {
    e.preventDefault();
    e.stopPropagation();
    doRegister();
  });
}
if ($("loginBtn")) $("loginBtn").addEventListener("click", e => { e.preventDefault(); doLogin(); });
if ($("registerBtn")) $("registerBtn").addEventListener("click", e => { e.preventDefault(); doRegister(); });
if ($("logoutBtn")) {
  $("logoutBtn").addEventListener("click", () => {
    closeProfileMenu();
    if (confirm("Logout from Hisab Kitab?")) logoutUser();
  });
}
if ($("profileTrigger")) {
  $("profileTrigger").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { closeProfileMenu(); } catch (_) {}
    if (typeof switchPage === "function") switchPage("profile");
    if (typeof isMobileNav === "function" && isMobileNav()) {
      try { closeSidebar(); } catch (_) {}
    }
  });
}
if ($("changePhotoBtn")) {
  $("changePhotoBtn").addEventListener("click", () => {
    openProfilePhotoPicker();
  });
}
if ($("profilePhotoInput")) {
  $("profilePhotoInput").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    processProfilePhotoFile(file);
    e.target.value = "";
    try { closeProfileMenu(); } catch (_) {}
    try {
      const hp = $("hubPhotoPop");
      if (hp) { hp.hidden = true; hp.setAttribute("hidden", ""); }
    } catch (_) {}
  });
}

/* Profile page photo change */
(function wireHubPhoto() {
  let hubPopHome = null;

  function getHubPop() {
    return document.getElementById("hubPhotoPop");
  }

  function closeHubPop() {
    const hp = getHubPop();
    if (!hp) return;
    hp.hidden = true;
    hp.setAttribute("hidden", "");
    hp.style.position = "";
    hp.style.top = "";
    hp.style.left = "";
    hp.style.right = "";
    hp.style.bottom = "";
    hp.style.zIndex = "";
    hp.style.width = "";
    // restore into original parent if we moved it
    if (hubPopHome && hp.parentNode !== hubPopHome) {
      hubPopHome.appendChild(hp);
    }
    const head = document.getElementById("profileHubHead");
    if (head) head.classList.remove("photo-pop-open");
  }

  function openHubPop() {
    const hp = getHubPop();
    const av = document.getElementById("profileHubAvatar");
    if (!hp || !av) return;

    // Remember original parent once
    if (!hubPopHome) hubPopHome = hp.parentNode;

    // Move to body so parent transforms don't offset fixed coords
    if (hp.parentNode !== document.body) {
      document.body.appendChild(hp);
    }

    const head = document.getElementById("profileHubHead");
    if (head) head.classList.add("photo-pop-open");

    const r = av.getBoundingClientRect();
    const pad = 10;
    const popW = 180;
    let top = r.bottom + pad;
    let left = r.left;

    // Keep on screen
    if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
    if (left < 12) left = 12;
    // If not enough space below, open upward
    if (top + 100 > window.innerHeight - 12) {
      top = Math.max(12, r.top - 100 - pad);
    }

    hp.hidden = false;
    hp.removeAttribute("hidden");
    hp.style.position = "fixed";
    hp.style.top = Math.round(top) + "px";
    hp.style.left = Math.round(left) + "px";
    hp.style.right = "auto";
    hp.style.bottom = "auto";
    hp.style.zIndex = "10000";
    hp.style.minWidth = popW + "px";
    try { if (window.lucide) lucide.createIcons({ nodes: hp.querySelectorAll("[data-lucide]") }); } catch (_) {}
    try { refreshIcons(); } catch (_) {}
  }

  function bind() {
    const av = document.getElementById("profileHubAvatar");
    if (av && !av.dataset.photoBound) {
      av.dataset.photoBound = "1";
      av.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const hp = getHubPop();
        if (hp && hp.hidden) openHubPop();
        else closeHubPop();
      });
    }
    const ch = document.getElementById("hubChangePhotoBtn");
    if (ch && !ch.dataset.bound) {
      ch.dataset.bound = "1";
      ch.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeHubPop();
        openProfilePhotoPicker();
      });
    }
    const rm = document.getElementById("hubRemovePhotoBtn");
    if (rm && !rm.dataset.bound) {
      rm.dataset.bound = "1";
      rm.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setProfilePhoto("");
        applyAvatarPhoto("");
        try { if (typeof updateProfileUI === "function") updateProfileUI(); } catch (_) {}
        closeHubPop();
        showToast("Photo removed");
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 400);

  document.addEventListener("click", (e) => {
    const hp = getHubPop();
    if (!hp || hp.hidden) return;
    if (e.target.closest && (e.target.closest("#hubPhotoPop") || e.target.closest("#profileHubAvatar"))) return;
    closeHubPop();
  });
  window.addEventListener("scroll", () => { try { closeHubPop(); } catch (_) {} }, true);
  window.addEventListener("resize", () => { try { closeHubPop(); } catch (_) {} });
})();

if ($("removePhotoBtn")) {
  $("removePhotoBtn").addEventListener("click", () => {
    setProfilePhoto("");
    applyAvatarPhoto("");
    showToast("Photo removed");
  });
}
if ($("profileBackupBtn")) {
  $("profileBackupBtn").addEventListener("click", () => { closeProfileMenu(); openBackupModal(); });
}
if ($("profileLockBtn")) {
  $("profileLockBtn").addEventListener("click", () => { closeProfileMenu(); switchPage("settings"); });
}
if ($("profileToolsBtn")) {
  $("profileToolsBtn").addEventListener("click", () => { closeProfileMenu(); switchPage("settings"); });
}
if ($("profileSettingsBtn")) {
  $("profileSettingsBtn").addEventListener("click", () => { closeProfileMenu(); switchPage("settings"); });
}
if ($("profileAccountBtn")) {
  $("profileAccountBtn").addEventListener("click", () => {
    closeProfileMenu();
    if (typeof openAccountModal === "function") openAccountModal();
  });
}
document.addEventListener("click", (e) => {
  const menu = $("profileMenu");
  if (menu && menu.classList.contains("open") && !menu.contains(e.target)) closeProfileMenu();
});

if ($("googleSignInBtn")) {
  $("googleSignInBtn").addEventListener("click", () => promptGoogleSignIn());
}
if ($("saveGoogleClientBtn")) {
  $("saveGoogleClientBtn").addEventListener("click", () => {
    const id = ($("googleClientIdInput") && $("googleClientIdInput").value || "").trim();
    if (!id || !id.includes(".apps.googleusercontent.com")) {
      setAuthError("Valid Google Client ID paste karo (…apps.googleusercontent.com)");
      return;
    }
    setGoogleClientId(id);
    setAuthError("");
    showToast("Google Client ID saved");
    initGoogleSignIn();
    const setup = $("googleSetupBox");
    if (setup) setup.style.display = "none";
  });
}
// Init Google when script ready
window.addEventListener("load", () => {
  setTimeout(initGoogleSignIn, 300);
});


initSidebarState();
const baseSel = $("baseCurrencySelect");
if (baseSel) {
  baseSel.addEventListener("change", () => {
    if (!currentUserId) return;
    setBaseCurrency(baseSel.value);
    refresh();
    showToast("Base currency: " + baseSel.value);
  });
}
(function wireNavPos() {
  try { applyNavPos(getNavPos()); } catch (_) {}
  const navSel = $("navPosSelect");
  if (navSel) {
    navSel.value = getNavPos();
    const onNavChange = () => {
      const v = navSel.value || "left";
      try { setNavPos(v); } catch (e) { console.error(e); try { applyNavPos(v); } catch (_) {} }
    };
    navSel.addEventListener("change", onNavChange);
    navSel.addEventListener("input", onNavChange);
  }
  // Safety: Ctrl+Shift+0 resets nav to left (Ctrl+Shift+L = App Lock)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "0") {
      e.preventDefault();
      try { setNavPos("left"); } catch (_) { try { applyNavPos("left"); } catch (__) {} }
      const sel = document.getElementById("navPosSelect");
      if (sel) sel.value = "left";
      try { showToast("Nav reset to Left"); } catch (_) {}
    }
  });
})();
/* wireLangSelect deferred */
window.addEventListener("resize", () => {
  initSidebarState();
});
if (typeof armAutoLockListeners === "function") armAutoLockListeners();
wirePinFields();
try {
  enforceAuth();
} catch (err) {
  console.error("enforceAuth", err);
  try { showAuthScreen("login"); } catch (_) {}
}

/* Button ripple */
document.querySelectorAll(".primary-btn").forEach(btn => {
  btn.addEventListener("click", function (e) {
    this.classList.remove("ripple");
    void this.offsetWidth;
    const rect = this.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    this.style.setProperty("--rx", x + "%");
    this.style.setProperty("--ry", y + "%");
    this.classList.add("ripple");
  });
});

refreshIcons();



/* ========== EXTRA FEATURES ========== */
const LANG_KEY = "hisabKitabLangV1";
const ONBOARD_KEY = "hisabKitabOnboardV1";

function goalsKey() { return userScope(GOALS_KEY_BASE); }
function debtsKey() { return userScope(DEBTS_KEY_BASE); }
function catBudgetKey() { return userScope(CATBUDGET_KEY_BASE); }

function loadGoals() {
  try {
    const d = JSON.parse(localStorage.getItem(goalsKey()) || "[]");
    return Array.isArray(d) ? d : [];
  } catch (e) { console.warn(e); return []; }
}
function saveGoals(list) {
  try { localStorage.setItem(goalsKey(), JSON.stringify(list || [])); } catch (e) { console.error(e); }
}
function loadDebts() {
  try {
    const d = JSON.parse(localStorage.getItem(debtsKey()) || "[]");
    return Array.isArray(d) ? d : [];
  } catch (e) { console.warn(e); return []; }
}
function saveDebts(list) {
  try { localStorage.setItem(debtsKey(), JSON.stringify(list || [])); } catch (e) { console.error(e); }
}
function loadCatBudgets() {
  try { return JSON.parse(localStorage.getItem(catBudgetKey()) || "{}") || {}; } catch { return {}; }
}
function saveCatBudgets(obj) { localStorage.setItem(catBudgetKey(), JSON.stringify(obj)); }

function processRecurringTransactions() {
  if (!currentUserId) return;
  const now = new Date();
  const ym = monthKey(now);
  let changed = false;
  const stampKey = userScope("hisabKitabRecurringStampV1");
  // For each recurring template, ensure current period has a copy
  const templates = transactions.filter(t => t.recurring && t._recurringRoot !== false);
  templates.forEach(t => {
    if (t.recurringParent) return;
    const freq = t.recurringFreq || "monthly";
    if (freq === "weekly") return; // handled in improvement pack
    const todayStr = now.toISOString().slice(0, 10);
    if (freq === "yearly") {
      const y = String(now.getFullYear());
      const md = (t.date || "").slice(5, 10);
      if (!md) return;
      const newDate = y + "-" + md;
      if (newDate <= t.date || newDate > todayStr) return;
      if (transactions.some(x => x.recurringParent === t.id && x.date === newDate)) return;
      transactions.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        description: t.description, amount: t.amount, type: t.type, category: t.category,
        date: newDate, currency: txCurrency(t), account: t.account || "Cash",
        transferTo: t.transferTo || "", tags: Array.isArray(t.tags) ? t.tags.slice() : [],
        recurring: false, recurringParent: t.id, receipt: "", createdAt: Date.now()
      });
      changed = true;
      return;
    }
    // monthly
    const exists = transactions.some(x => x.recurringParent === t.id && x.date && x.date.startsWith(ym));
    if (exists) return;
    const day = (t.date || "").slice(8, 10) || "01";
    const newDate = ym + "-" + day;
    if (newDate <= t.date) return;
    if (newDate > todayStr) return;
    transactions.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: newDate,
      currency: txCurrency(t),
      account: t.account || "Cash",
      transferTo: t.transferTo || "",
      tags: Array.isArray(t.tags) ? t.tags.slice() : [],
      recurring: false,
      recurringParent: t.id,
      receipt: "",
      createdAt: Date.now()
    });
    changed = true;
  });
  if (changed) saveTransactions();
}

function renderGoals() {
  const list = loadGoals();
  const box = $("goalsList");
  const empty = $("goalsEmpty");
  if (!box) return;
  box.innerHTML = list.map(g => {
    const pct = g.target > 0 ? Math.min(100, (Number(g.saved) / Number(g.target)) * 100) : 0;
    return `<article class="goal-card" data-goal="${g.id}">
      <h4>${safe(g.name)}</h4>
      <div class="goal-meta"><span>${money(g.saved)} / ${money(g.target)}</span><span>${pct.toFixed(0)}%</span></div>
      <div class="progress-track large"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="goal-actions">
        <button type="button" class="outline-btn" data-goal-add="${g.id}">+ Add saving</button>
        <button type="button" class="outline-btn" data-goal-del="${g.id}">Delete</button>
      </div>
    </article>`;
  }).join("");
  if (empty) {
    empty.classList.toggle("show", list.length === 0);
    empty.style.display = list.length === 0 ? "flex" : "none";
  }
  refreshIcons();
}

function renderDebts() {
  const all = loadDebts();
  const list = all.filter(d => !d.settled);
  let receive = 0, pay = 0;
  list.forEach(d => {
    const a = Number(d.amount) || 0;
    if (d.type === "lend") receive += a; else pay += a;
  });
  if ($("debtReceive")) $("debtReceive").textContent = money(receive);
  if ($("debtPay")) $("debtPay").textContent = money(pay);
  const box = $("debtsList");
  const empty = $("debtsEmpty");
  if (!box) return;
  box.innerHTML = list.map(d => `<div class="debt-row">
    <div><strong>${safe(d.person)}</strong><div class="muted">${d.type === "lend" ? "To receive" : "To pay"} · ${money(d.amount)}${d.note ? " · " + safe(d.note) : ""}${d.due ? " · due " + d.due : ""}</div></div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button type="button" class="outline-btn" data-debt-settle="${d.id}">Settle</button>
      <button type="button" class="outline-btn" data-debt-del="${d.id}" title="Delete">✕</button>
    </div>
  </div>`).join("");
  if (empty) {
    empty.classList.toggle("show", list.length === 0);
    empty.style.display = list.length === 0 ? "" : "none";
  }
}

function renderCatBudgets() {
  const box = $("catBudgetList");
  if (!box) return;
  const saved = loadCatBudgets();
  const cats = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Other"];
  box.innerHTML = cats.map(c => `<div class="cat-budget-row"><span>${c}</span><input type="number" min="0" step="1" data-cat-budget="${c}" value="${saved[c] || ""}" placeholder="Limit"></div>`).join("");
}

function renderReminders() {
  const box = $("remindersList");
  if (!box) return;
  const items = [];
  const ym = monthKey();
  transactions.filter(t => t.recurring && !t.recurringParent).forEach(t => {
    items.push(`Recurring: ${t.description} (${moneyTx(t)})`);
  });
  loadDebts().filter(d => !d.settled && d.due).forEach(d => {
    items.push(`Debt ${d.type === "lend" ? "receive" : "pay"}: ${d.person} by ${d.due}`);
  });
  const cb = loadCatBudgets();
  const spent = {};
  transactions.filter(t => t.type === "expense" && t.date && t.date.startsWith(ym)).forEach(t => {
    spent[t.category] = (spent[t.category] || 0) + amountInBase(t);
  });
  Object.keys(cb).forEach(c => {
    if (cb[c] > 0 && (spent[c] || 0) > cb[c]) items.push(`Over category budget: ${c}`);
  });
  box.innerHTML = items.length ? items.map(i => `<div class="reminder-item">${safe(i)}</div>`).join("") : `<div class="muted">No reminders right now.</div>`;
}

/* i18n */
const SUPPORTED_LANGS = ["en", "ar", "ur", "hi", "tr", "fr", "id"];
const RTL_LANGS = ["ar", "ur"];
const LANG_NAMES = {
  en: "English", ar: "العربية", ur: "اردو", hi: "हिन्दी", tr: "Türkçe", fr: "Français", id: "Indonesia"
};
const I18N = {
  en: {
    nav_overview: "Overview", nav_transactions: "Transactions", nav_reports: "Reports", nav_budget: "Budget",
    nav_goals: "Goals", nav_debts: "Debts", nav_bills: "Bills", nav_tools: "Tools",
    goals_title: "Saving Goals", goals_sub: "Track targets like phone, travel, emergency fund.", add_goal: "Add goal",
    no_goals: "No goals yet", no_goals_sub: "Create a saving goal to stay motivated.",
    debts_title: "Debts & Loans", debts_sub: "Money you lent or borrowed.", add_debt: "Add debt",
    to_receive: "To receive", to_pay: "To pay", no_debts: "No debts recorded",
    tools_title: "Tools", tools_sub: "Zakat, language, install app, category budgets.",
    zakat_title: "Zakat calculator", zakat_sub: "2.5% of eligible wealth (simple estimate).", zakat_due: "Zakat due",
    lang_title: "Language", lang_sub: "Choose your interface language.",
    pwa_title: "Install app", pwa_sub: "Add Hisab Kitab to your phone home screen.",
    cat_budget_title: "Category budgets", cat_budget_sub: "Monthly limit per category (base currency).",
    reminders_title: "Reminders", reminders_sub: "Due recurring items and open debts.",
    export_title: "Export",
    label_settings: "Settings", label_theme: "Theme", label_currency: "Base currency",
    label_nav_pos: "Nav position", label_language: "Language", label_workspace: "WORKSPACE",
    label_financial_space: "YOUR FINANCIAL SPACE", add_tx: "Add transaction",
    stat_balance: "Total Balance", stat_balance_sub: "Income − Expenses",
    stat_income: "Income", stat_expense: "Expenses", stat_tx: "Transactions",
    page_overview: "Overview", page_transactions: "Transactions", page_reports: "Reports",
    page_budget: "Budget", page_goals: "Goals", page_debts: "Debts", page_bills: "Bills", page_tools: "Tools"
  },
  ar: {
    nav_overview: "نظرة عامة", nav_transactions: "المعاملات", nav_reports: "التقارير", nav_budget: "الميزانية",
    nav_goals: "الأهداف", nav_debts: "الديون", nav_bills: "الفواتير", nav_tools: "أدوات",
    goals_title: "أهداف الادخار", goals_sub: "تتبع أهداف مثل الهاتف والسفر وصندوق الطوارئ.", add_goal: "إضافة هدف",
    no_goals: "لا توجد أهداف بعد", no_goals_sub: "أنشئ هدف ادخار للبقاء متحفزاً.",
    debts_title: "الديون والقروض", debts_sub: "أموال أقرضتها أو اقترضتها.", add_debt: "إضافة دين",
    to_receive: "للتحصيل", to_pay: "للسداد", no_debts: "لا ديون مسجلة",
    tools_title: "أدوات", tools_sub: "زكاة، لغة، تثبيت التطبيق، ميزانيات الفئات.",
    zakat_title: "حاسبة الزكاة", zakat_sub: "2.5٪ من المال الخاضع للزكاة (تقدير بسيط).", zakat_due: "الزكاة المستحقة",
    lang_title: "اللغة", lang_sub: "اختر لغة الواجهة.",
    pwa_title: "تثبيت التطبيق", pwa_sub: "أضف Hisab Kitab إلى الشاشة الرئيسية.",
    cat_budget_title: "ميزانيات الفئات", cat_budget_sub: "حد شهري لكل فئة.",
    reminders_title: "تذكيرات", reminders_sub: "العناصر المتكررة والديون المفتوحة.",
    export_title: "تصدير",
    label_settings: "الإعدادات", label_theme: "المظهر", label_currency: "العملة الأساسية",
    label_nav_pos: "موضع القائمة", label_language: "اللغة", label_workspace: "مساحة العمل",
    label_financial_space: "مساحتك المالية", add_tx: "إضافة معاملة",
    stat_balance: "الرصيد الإجمالي", stat_balance_sub: "الدخل − المصروفات",
    stat_income: "الدخل", stat_expense: "المصروفات", stat_tx: "المعاملات",
    page_overview: "نظرة عامة", page_transactions: "المعاملات", page_reports: "التقارير",
    page_budget: "الميزانية", page_goals: "الأهداف", page_debts: "الديون", page_bills: "الفواتير", page_tools: "أدوات"
  },
  ur: {
    nav_overview: "جائزہ", nav_transactions: "لین دین", nav_reports: "رپورٹس", nav_budget: "بجٹ",
    nav_goals: "اہداف", nav_debts: "قرضے", nav_bills: "بلز", nav_tools: "ٹولز",
    goals_title: "بچت کے اہداف", goals_sub: "فون، سفر، ایمرجنسی فنڈ جیسے اہداف ٹریک کریں۔", add_goal: "ہدف شامل کریں",
    no_goals: "ابھی کوئی ہدف نہیں", no_goals_sub: "تحریک کے لیے ہدف بنائیں۔",
    debts_title: "قرضے", debts_sub: "جو رقم دی یا لی۔", add_debt: "قرض شامل کریں",
    to_receive: "وصول کرنا ہے", to_pay: "ادا کرنا ہے", no_debts: "کوئی قرض درج نہیں",
    tools_title: "ٹولز", tools_sub: "زکوٰۃ، زبان، ایپ انسٹال، کیٹیگری بجٹ۔",
    zakat_title: "زکوٰۃ کیلکولیٹر", zakat_sub: "قابل زکوٰۃ مال کا 2.5٪ (سادہ اندازہ)۔", zakat_due: "واجب زکوٰۃ",
    lang_title: "زبان", lang_sub: "انٹرفیس کی زبان منتخب کریں۔",
    pwa_title: "ایپ انسٹال", pwa_sub: "ہوم اسکرین پر Hisab Kitab شامل کریں۔",
    cat_budget_title: "کیٹیگری بجٹ", cat_budget_sub: "ہر کیٹیگری کی ماہانہ حد۔",
    reminders_title: "یاد دہانیاں", reminders_sub: "ریکرنگ اور کھلے قرضے۔",
    export_title: "ایکسپورٹ",
    label_settings: "ترتیبات", label_theme: "تھیم", label_currency: "بنیادی کرنسی",
    label_nav_pos: "مینو کی جگہ", label_language: "زبان", label_workspace: "ورکسپیس",
    label_financial_space: "آپ کی مالیاتی جگہ", add_tx: "لین دین شامل کریں",
    stat_balance: "کل بیلنس", stat_balance_sub: "آمدنی − اخراجات",
    stat_income: "آمدنی", stat_expense: "اخراجات", stat_tx: "لین دین",
    page_overview: "جائزہ", page_transactions: "لین دین", page_reports: "رپورٹس",
    page_budget: "بجٹ", page_goals: "اہداف", page_debts: "قرضے", page_bills: "بلز", page_tools: "ٹولز"
  },
  hi: {
    nav_overview: "अवलोकन", nav_transactions: "लेन-देन", nav_reports: "रिपोर्ट्स", nav_budget: "बजट",
    nav_goals: "लक्ष्य", nav_debts: "कर्ज", nav_bills: "बिल", nav_tools: "टूल्स",
    goals_title: "बचत लक्ष्य", goals_sub: "फोन, यात्रा, इमरजेंसी फंड जैसे लक्ष्य ट्रैक करें।", add_goal: "लक्ष्य जोड़ें",
    no_goals: "अभी कोई लक्ष्य नहीं", no_goals_sub: "प्रेरित रहने के लिए लक्ष्य बनाएं।",
    debts_title: "कर्ज और उधार", debts_sub: "जो पैसे दिए या लिए।", add_debt: "कर्ज जोड़ें",
    to_receive: "प्राप्त करना है", to_pay: "चुकाना है", no_debts: "कोई कर्ज दर्ज नहीं",
    tools_title: "टूल्स", tools_sub: "ज़कात, भाषा, ऐप इंस्टॉल, श्रेणी बजट।",
    zakat_title: "ज़कात कैलकुलेटर", zakat_sub: "पात्र संपत्ति का 2.5% (सरल अनुमान)।", zakat_due: "देय ज़कात",
    lang_title: "भाषा", lang_sub: "इंटरफ़ेस भाषा चुनें।",
    pwa_title: "ऐप इंस्टॉल", pwa_sub: "होम स्क्रीन पर Hisab Kitab जोड़ें।",
    cat_budget_title: "श्रेणी बजट", cat_budget_sub: "प्रत्येक श्रेणी की मासिक सीमा।",
    reminders_title: "रिमाइंडर", reminders_sub: "आवर्ती और खुले कर्ज।",
    export_title: "एक्सपोर्ट",
    label_settings: "सेटिंग्स", label_theme: "थीम", label_currency: "मुख्य मुद्रा",
    label_nav_pos: "मेनू स्थिति", label_language: "भाषा", label_workspace: "वर्कस्पेस",
    label_financial_space: "आपका वित्तीय स्थान", add_tx: "लेन-देन जोड़ें",
    stat_balance: "कुल बैलेंस", stat_balance_sub: "आय − खर्च",
    stat_income: "आय", stat_expense: "खर्च", stat_tx: "लेन-देन",
    page_overview: "अवलोकन", page_transactions: "लेन-देन", page_reports: "रिपोर्ट्स",
    page_budget: "बजट", page_goals: "लक्ष्य", page_debts: "कर्ज", page_bills: "बिल", page_tools: "टूल्स"
  },
  tr: {
    nav_overview: "Genel Bakış", nav_transactions: "İşlemler", nav_reports: "Raporlar", nav_budget: "Bütçe",
    nav_goals: "Hedefler", nav_debts: "Borçlar", nav_bills: "Faturalar", nav_tools: "Araçlar",
    goals_title: "Tasarruf Hedefleri", goals_sub: "Telefon, seyahat, acil fon gibi hedefleri takip edin.", add_goal: "Hedef ekle",
    no_goals: "Henüz hedef yok", no_goals_sub: "Motive kalmak için bir hedef oluşturun.",
    debts_title: "Borçlar ve Krediler", debts_sub: "Verdiğiniz veya aldığınız paralar.", add_debt: "Borç ekle",
    to_receive: "Alınacak", to_pay: "Ödenecek", no_debts: "Kayıtlı borç yok",
    tools_title: "Araçlar", tools_sub: "Zekat, dil, uygulama yükle, kategori bütçeleri.",
    zakat_title: "Zekat hesaplayıcı", zakat_sub: "Uygun servetin %2,5'i (basit tahmin).", zakat_due: "Zekat tutarı",
    lang_title: "Dil", lang_sub: "Arayüz dilini seçin.",
    pwa_title: "Uygulamayı yükle", pwa_sub: "Hisab Kitab'ı ana ekrana ekleyin.",
    cat_budget_title: "Kategori bütçeleri", cat_budget_sub: "Kategori başına aylık limit.",
    reminders_title: "Hatırlatıcılar", reminders_sub: "Tekrarlayan öğeler ve açık borçlar.",
    export_title: "Dışa aktar",
    label_settings: "Ayarlar", label_theme: "Tema", label_currency: "Temel para birimi",
    label_nav_pos: "Menü konumu", label_language: "Dil", label_workspace: "ÇALIŞMA ALANI",
    label_financial_space: "FİNANSAL ALANINIZ", add_tx: "İşlem ekle",
    stat_balance: "Toplam Bakiye", stat_balance_sub: "Gelir − Gider",
    stat_income: "Gelir", stat_expense: "Gider", stat_tx: "İşlemler",
    page_overview: "Genel Bakış", page_transactions: "İşlemler", page_reports: "Raporlar",
    page_budget: "Bütçe", page_goals: "Hedefler", page_debts: "Borçlar", page_bills: "Faturalar", page_tools: "Araçlar"
  },
  fr: {
    nav_overview: "Aperçu", nav_transactions: "Transactions", nav_reports: "Rapports", nav_budget: "Budget",
    nav_goals: "Objectifs", nav_debts: "Dettes", nav_bills: "Factures", nav_tools: "Outils",
    goals_title: "Objectifs d'épargne", goals_sub: "Suivez des objectifs comme téléphone, voyage, fonds d'urgence.", add_goal: "Ajouter un objectif",
    no_goals: "Aucun objectif", no_goals_sub: "Créez un objectif pour rester motivé.",
    debts_title: "Dettes et prêts", debts_sub: "Argent prêté ou emprunté.", add_debt: "Ajouter une dette",
    to_receive: "À recevoir", to_pay: "À payer", no_debts: "Aucune dette enregistrée",
    tools_title: "Outils", tools_sub: "Zakat, langue, installer l'app, budgets par catégorie.",
    zakat_title: "Calculateur de zakat", zakat_sub: "2,5 % de la richesse éligible (estimation simple).", zakat_due: "Zakat due",
    lang_title: "Langue", lang_sub: "Choisissez la langue de l'interface.",
    pwa_title: "Installer l'app", pwa_sub: "Ajoutez Hisab Kitab à l'écran d'accueil.",
    cat_budget_title: "Budgets par catégorie", cat_budget_sub: "Limite mensuelle par catégorie.",
    reminders_title: "Rappels", reminders_sub: "Éléments récurrents et dettes ouvertes.",
    export_title: "Exporter",
    label_settings: "Paramètres", label_theme: "Thème", label_currency: "Devise de base",
    label_nav_pos: "Position du menu", label_language: "Langue", label_workspace: "ESPACE DE TRAVAIL",
    label_financial_space: "VOTRE ESPACE FINANCIER", add_tx: "Ajouter une transaction",
    stat_balance: "Solde total", stat_balance_sub: "Revenus − Dépenses",
    stat_income: "Revenus", stat_expense: "Dépenses", stat_tx: "Transactions",
    page_overview: "Aperçu", page_transactions: "Transactions", page_reports: "Rapports",
    page_budget: "Budget", page_goals: "Objectifs", page_debts: "Dettes", page_bills: "Factures", page_tools: "Outils"
  },
  id: {
    nav_overview: "Ringkasan", nav_transactions: "Transaksi", nav_reports: "Laporan", nav_budget: "Anggaran",
    nav_goals: "Target", nav_debts: "Utang", nav_bills: "Tagihan", nav_tools: "Alat",
    goals_title: "Target Tabungan", goals_sub: "Lacak target seperti HP, liburan, dana darurat.", add_goal: "Tambah target",
    no_goals: "Belum ada target", no_goals_sub: "Buat target agar tetap termotivasi.",
    debts_title: "Utang & Pinjaman", debts_sub: "Uang yang Anda pinjamkan atau pinjam.", add_debt: "Tambah utang",
    to_receive: "Akan diterima", to_pay: "Harus dibayar", no_debts: "Tidak ada utang tercatat",
    tools_title: "Alat", tools_sub: "Zakat, bahasa, instal aplikasi, anggaran kategori.",
    zakat_title: "Kalkulator zakat", zakat_sub: "2,5% dari harta yang wajib (perkiraan sederhana).", zakat_due: "Zakat terutang",
    lang_title: "Bahasa", lang_sub: "Pilih bahasa antarmuka.",
    pwa_title: "Instal aplikasi", pwa_sub: "Tambahkan Hisab Kitab ke layar utama.",
    cat_budget_title: "Anggaran kategori", cat_budget_sub: "Batas bulanan per kategori.",
    reminders_title: "Pengingat", reminders_sub: "Item berulang dan utang terbuka.",
    export_title: "Ekspor",
    label_settings: "Pengaturan", label_theme: "Tema", label_currency: "Mata uang dasar",
    label_nav_pos: "Posisi menu", label_language: "Bahasa", label_workspace: "RUANG KERJA",
    label_financial_space: "RUANG KEUANGAN ANDA", add_tx: "Tambah transaksi",
    stat_balance: "Total Saldo", stat_balance_sub: "Pemasukan − Pengeluaran",
    stat_income: "Pemasukan", stat_expense: "Pengeluaran", stat_tx: "Transaksi",
    page_overview: "Ringkasan", page_transactions: "Transaksi", page_reports: "Laporan",
    page_budget: "Anggaran", page_goals: "Target", page_debts: "Utang", page_bills: "Tagihan", page_tools: "Alat"
  }
};
function getLang() {
  const l = localStorage.getItem(LANG_KEY);
  return SUPPORTED_LANGS.includes(l) ? l : "en";
}
function setLang(l) {
  if (!SUPPORTED_LANGS.includes(l)) l = "en";
  localStorage.setItem(LANG_KEY, l);
  document.documentElement.lang = l;
  document.documentElement.dir = RTL_LANGS.includes(l) ? "rtl" : "ltr";
  const sel = $("langSelect");
  if (sel && sel.value !== l) sel.value = l;
  applyI18n();
  // refresh page title for current page
  try {
    const map = {
      overview: "page_overview", transactions: "page_transactions", reports: "page_reports",
      budget: "page_budget", goals: "page_goals", debts: "page_debts",
      bills: "page_bills", tools: "page_tools", settings: "page_tools"
    };
    const key = map[typeof currentPage !== "undefined" ? currentPage : "overview"];
    const dict = I18N[l] || I18N.en;
    if (key && dict[key] && $("pageTitle")) $("pageTitle").textContent = dict[key];
  } catch (_) {}
  showToast((LANG_NAMES[l] || l) + " ✓");
}
function applyI18n() {
  const dict = I18N[getLang()] || I18N.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (dict[k]) el.textContent = dict[k];
  });
}

(function wireLangSelect() {
  const sel = $("langSelect");
  if (!sel) return;
  try { sel.value = getLang(); } catch (_) {}
  sel.addEventListener("change", () => setLang(sel.value));
  try {
    document.documentElement.lang = getLang();
    document.documentElement.dir = RTL_LANGS.includes(getLang()) ? "rtl" : "ltr";
  } catch (_) {}
})();


function openGoalModal() {
  const b = document.getElementById("goalModalBackdrop");
  if (!b) {
    showToast("Goal form missing — reload app");
    return;
  }
  b.classList.add("open");
  b.style.cssText = (b.style.cssText || "") + ";display:flex!important;opacity:1;pointer-events:auto;z-index:200;";
  const f = document.getElementById("goalForm");
  if (f) f.reset();
  setTimeout(() => {
    const n = document.getElementById("goalName");
    if (n) n.focus();
    if (window.lucide) lucide.createIcons();
  }, 30);
}
function closeGoalModal() {
  const b = document.getElementById("goalModalBackdrop");
  if (b) {
    b.classList.remove("open");
    b.style.display = "none";
  }
  const f = document.getElementById("goalForm");
  if (f) f.reset();
}
function openDebtModal() {
  const b = document.getElementById("debtModalBackdrop");
  if (!b) {
    showToast("Debt form missing — reload app");
    return;
  }
  b.classList.add("open");
  b.style.cssText = (b.style.cssText || "") + ";display:flex!important;opacity:1;pointer-events:auto;z-index:200;";
  const f = document.getElementById("debtForm");
  if (f) f.reset();
  setTimeout(() => {
    const p = document.getElementById("debtPerson");
    if (p) p.focus();
    if (window.lucide) lucide.createIcons();
  }, 30);
}
function closeDebtModal() {
  const b = document.getElementById("debtModalBackdrop");
  if (b) {
    b.classList.remove("open");
    b.style.display = "none";
  }
  const f = document.getElementById("debtForm");
  if (f) f.reset();
}

function maybeOnboard() {
  if (!currentUserId) return;
  if (localStorage.getItem(userScope(ONBOARD_KEY))) return;
  const b = $("onboardBackdrop");
  if (b) b.classList.add("open");
}
function finishOnboard() {
  localStorage.setItem(userScope(ONBOARD_KEY), "1");
  const b = $("onboardBackdrop");
  if (b) b.classList.remove("open");
}

let deferredPwaPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
});

/* Wire extra UI */
if ($("addGoalBtn")) $("addGoalBtn").addEventListener("click", openGoalModal);
if ($("closeGoalModal")) $("closeGoalModal").addEventListener("click", closeGoalModal);
if ($("cancelGoalModal")) $("cancelGoalModal").addEventListener("click", closeGoalModal);
if ($("goalForm")) $("goalForm").addEventListener("submit", e => {
  e.preventDefault();
  e.stopPropagation();
  try {
    if (!currentUserId) { showToast("Please login first"); return; }
    const name = ($("goalName") && $("goalName").value || "").trim();
    const target = Number($("goalTarget") && $("goalTarget").value);
    const saved = Number($("goalSaved") && $("goalSaved").value) || 0;
    if (!name) { showToast("Enter goal name"); return; }
    if (!Number.isFinite(target) || target <= 0) { showToast("Enter valid target amount"); return; }
    const list = loadGoals();
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      target,
      saved: Number.isFinite(saved) ? Math.max(0, saved) : 0,
      createdAt: Date.now()
    });
    saveGoals(list);
    closeGoalModal();
    renderGoals();
    showToast("Goal saved");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Could not save goal");
  }
});
if ($("goalsList")) $("goalsList").addEventListener("click", e => {
  const add = e.target.closest("[data-goal-add]");
  const del = e.target.closest("[data-goal-del]");
  if (add) {
    const id = add.dataset.goalAdd;
    const amt = prompt("Amount to add to this goal?");
    if (amt == null) return;
    const n = Number(amt);
    if (!Number.isFinite(n) || n <= 0) return showToast("Invalid amount");
    const list = loadGoals().map(g => g.id === id ? { ...g, saved: Number(g.saved) + n } : g);
    saveGoals(list); renderGoals(); showToast("Saving updated");
  }
  if (del) {
    if (!confirm("Delete goal?")) return;
    saveGoals(loadGoals().filter(g => g.id !== del.dataset.goalDel));
    renderGoals(); showToast("Goal deleted");
  }
});

if ($("addDebtBtn")) $("addDebtBtn").addEventListener("click", openDebtModal);
if ($("closeDebtModal")) $("closeDebtModal").addEventListener("click", closeDebtModal);
if ($("cancelDebtModal")) $("cancelDebtModal").addEventListener("click", closeDebtModal);
if ($("debtForm")) $("debtForm").addEventListener("submit", e => {
  e.preventDefault();
  e.stopPropagation();
  try {
    if (!currentUserId) { showToast("Please login first"); return; }
    const person = ($("debtPerson") && $("debtPerson").value || "").trim();
    const amount = Number($("debtAmount") && $("debtAmount").value);
    const type = ($("debtType") && $("debtType").value) || "lend";
    if (!person) { showToast("Enter person name"); return; }
    if (!Number.isFinite(amount) || amount <= 0) { showToast("Enter valid amount"); return; }
    const list = loadDebts();
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      person,
      type,
      amount,
      note: ($("debtNote") && $("debtNote").value || "").trim(),
      due: ($("debtDue") && $("debtDue").value) || "",
      settled: false,
      createdAt: Date.now()
    });
    saveDebts(list);
    closeDebtModal();
    renderDebts();
    try { if (typeof renderReminders === "function") renderReminders(); } catch (_) {}
    showToast("Debt saved");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Could not save debt");
  }
});
if ($("addDebtBtn2")) $("addDebtBtn2").addEventListener("click", openDebtModal);
if ($("debtModalBackdrop")) {
  $("debtModalBackdrop").addEventListener("click", e => {
    if (e.target === $("debtModalBackdrop")) closeDebtModal();
  });
}
if ($("debtsList")) $("debtsList").addEventListener("click", e => {
  const settle = e.target.closest("[data-debt-settle]");
  const del = e.target.closest("[data-debt-del]");
  if (settle) {
    const list = loadDebts().map(d => d.id === settle.dataset.debtSettle ? { ...d, settled: true } : d);
    saveDebts(list); renderDebts();
    try { if (typeof renderReminders === "function") renderReminders(); } catch (_) {}
    showToast("Marked settled");
    return;
  }
  if (del) {
    if (!confirm("Delete this debt?")) return;
    saveDebts(loadDebts().filter(d => d.id !== del.dataset.debtDel));
    renderDebts();
    showToast("Debt deleted");
  }
});

if ($("calcZakatBtn")) $("calcZakatBtn").addEventListener("click", () => {
  const w = Number($("zakatWealth").value) || 0;
  if ($("zakatResult")) $("zakatResult").textContent = money(w * 0.025);
});
if ($("langEnBtn")) $("langEnBtn").addEventListener("click", () => { setLang("en"); showToast("English"); });
if ($("langUrBtn")) $("langUrBtn").addEventListener("click", () => { setLang("ur"); showToast("اردو"); });
if ($("saveCatBudgetsBtn")) $("saveCatBudgetsBtn").addEventListener("click", () => {
  const obj = {};
  document.querySelectorAll("[data-cat-budget]").forEach(inp => {
    const v = Number(inp.value);
    if (v > 0) obj[inp.dataset.catBudget] = v;
  });
  saveCatBudgets(obj); renderReminders(); showToast("Category budgets saved");
});
if ($("exportCsvToolsBtn")) $("exportCsvToolsBtn").addEventListener("click", exportCSV);
if ($("printReportBtn")) $("printReportBtn").addEventListener("click", () => {
  switchPage("reports");
  setTimeout(() => window.print(), 400);
});
if ($("replayOnboardBtn")) $("replayOnboardBtn").addEventListener("click", () => {
  localStorage.removeItem(userScope(ONBOARD_KEY));
  maybeOnboard();
});
if ($("onboardNextBtn")) $("onboardNextBtn").addEventListener("click", finishOnboard);
if ($("installPwaBtn")) $("installPwaBtn").addEventListener("click", async () => {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt = null;
  } else {
    alert("Install: Browser menu → Add to Home Screen / Install App.\nChrome mobile: ⋮ → Install app / Add to Home screen.");
  }
});

// Receipt compress
if ($("txReceipt")) {
  $("txReceipt").addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (!file) { if ($("txReceiptData")) $("txReceiptData").value = ""; return; }
    if (file.size > 2.5 * 1024 * 1024) { showToast("Image too large (max ~2.5MB)"); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max) { h = h * (max / w); w = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL("image/jpeg", 0.6);
        if ($("txReceiptData")) $("txReceiptData").value = data;
        showToast("Receipt attached");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Escape closes new modals
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeGoalModal();
    closeDebtModal();
  }
});

// After successful login path, show onboard
const _loginUser = loginUser;
loginUser = function(user) {
  _loginUser(user);
  setTimeout(maybeOnboard, 400);
  setTimeout(() => { renderGoals(); renderDebts(); renderCatBudgets(); renderReminders(); applyI18n(); }, 200);
};

applyI18n();



/* ===== Premium unique features ===== */
function streakKey() {
  try {
    return userScope(typeof STREAK_KEY_BASE !== "undefined" ? STREAK_KEY_BASE : "hisabKitabStreakV1");
  } catch {
    return "hisabKitabStreakV1";
  }
}

function updateGreeting() {
  const h = new Date().getHours();
  let hi = "Hello";
  if (h < 12) hi = "Good morning";
  else if (h < 17) hi = "Good afternoon";
  else hi = "Good evening";
  const u = getCurrentUser();
  const name = u && u.name ? u.name.split(" ")[0] : "";
  const title = $("greetingTitle");
  const sub = $("greetingSub");
  if (title) title.innerHTML = `${hi}${name ? ", " + safe(name) : ""} <span class="gold-text">✨</span>`;
  if (sub) {
    const t = totals();
    sub.textContent = t.balance >= 0
      ? "Your money is under control — keep the streak going."
      : "Expenses are ahead — a small cut this week can flip the balance.";
  }
}

function bumpStreak() {
  try {
    if (!currentUserId) return;
    const key = streakKey();
    let data = { last: "", count: 0 };
    try { data = JSON.parse(localStorage.getItem(key) || "{}") || data; } catch {}
    const today = new Date().toISOString().slice(0, 10);
    if (data.last === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    data.count = data.last === yesterday ? (Number(data.count) || 0) + 1 : 1;
    data.last = today;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("streak", e);
  }
}
function renderStreak() {
  const el = $("streakText");
  if (!el) return;
  let data = { count: 0 };
  try { data = JSON.parse(localStorage.getItem(streakKey()) || "{}") || data; } catch {}
  const n = Number(data.count) || 0;
  el.textContent = n === 1 ? "1 day streak" : `${n} day streak`;
}

function renderHealthScore() {
  const t = totals();
  const cur = monthTotals(monthKey());
  let score = 35;
  if (transactions.length >= 3) score += 10;
  if (transactions.length >= 10) score += 10;
  if (t.income > 0) score += 15;
  if (t.balance >= 0) score += 15;
  if (cur.income > 0 && cur.expense / cur.income < 0.7) score += 10;
  if (cur.income > 0 && cur.expense / cur.income < 0.5) score += 5;
  if (loadBudget() > 0 && cur.expense <= loadBudget()) score += 10;
  if (loadGoals().length) score += 5;
  score = Math.max(0, Math.min(100, score));

  let label = "Building habits";
  let note = "Add a few more transactions for a clearer score.";
  if (score >= 85) { label = "Excellent control"; note = "Strong balance and spending discipline."; }
  else if (score >= 70) { label = "Healthy"; note = "On track — keep logging daily."; }
  else if (score >= 50) { label = "Fair"; note = "Watch top expense categories this week."; }
  else if (transactions.length) { label = "Needs attention"; note = "Try a budget limit and cut one non-essential category."; }

  if ($("healthScore")) $("healthScore").textContent = String(score);
  if ($("healthLabel")) $("healthLabel").textContent = label;
  if ($("healthNote")) $("healthNote").textContent = note;
  if ($("healthFill")) $("healthFill").style.width = score + "%";
}

function renderMonthStory() {
  const el = $("monthStory");
  const spark = $("miniSpark");
  if (!el) return;
  const cur = monthTotals(monthKey());
  const m = monthlyValues();
  if (!transactions.length) {
    el.textContent = "Your monthly story will appear here after a few entries.";
  } else if (cur.income === 0 && cur.expense === 0) {
    el.textContent = "No activity this month yet — log today’s first entry.";
  } else {
    const rate = cur.income > 0 ? Math.round((cur.expense / cur.income) * 100) : 0;
    el.textContent = `This month you earned ${money(cur.income)} and spent ${money(cur.expense)}` +
      (cur.income > 0 ? ` (${rate}% of income).` : ".");
  }
  if (spark) {
    const vals = m.expense.map((e, i) => e + (m.income[i] || 0));
    const max = Math.max(...vals, 1);
    spark.innerHTML = vals.map(v => `<span style="height:${Math.max(8, (v / max) * 100)}%"></span>`).join("");
  }
}

function renderPremium() {
  updateGreeting();
  renderStreak();
  renderHealthScore();
  renderMonthStory();
}

/* Command palette */
const CMD_ITEMS = [
  { id: "overview", label: "Go to Overview (Dashboard)", hint: "Alt+1", icon: "layout-dashboard", run: () => switchPage("overview") },
  { id: "add", label: "Add transaction", hint: "Alt+N", icon: "plus", run: () => openModal(null) },
  { id: "tx", label: "Go to Transactions", hint: "Alt+2", icon: "arrow-left-right", run: () => switchPage("transactions") },
  { id: "navL", label: "Nav: Left", hint: "Alt+Shift+Left", icon: "panel-left", run: () => setNavPos("left") },
  { id: "navR", label: "Nav: Right", hint: "Alt+Shift+Right", icon: "panel-right", run: () => setNavPos("right") },
  { id: "navT", label: "Nav: Top", hint: "Alt+Shift+Up", icon: "panel-top", run: () => setNavPos("top") },
  { id: "navB", label: "Nav: Bottom", hint: "Alt+Shift+Down", icon: "panel-bottom", run: () => setNavPos("bottom") },
  { id: "rep", label: "Go to Reports", hint: "Page", icon: "chart-no-axes-combined", run: () => switchPage("reports") },
  { id: "bud", label: "Go to Budget", hint: "Page", icon: "target", run: () => switchPage("budget") },
  { id: "goal", label: "Add saving goal", hint: "Goals", icon: "flag", run: () => { switchPage("goals"); openGoalModal(); } },
  { id: "debt", label: "Add debt", hint: "Debts", icon: "hand-coins", run: () => { switchPage("debts"); openDebtModal(); } },
  { id: "backup", label: "Backup & restore", hint: "Data", icon: "cloud-upload", run: () => openBackupModal() },
  { id: "theme", label: "Cycle theme", hint: "Appearance", icon: "palette", run: () => cycleTheme() },
  { id: "lock", label: "App lock & PIN", hint: "Security", icon: "shield", run: () => openLockModal() },
  { id: "wallet", label: "Show wallet balance", hint: "Quick view", icon: "wallet", run: () => openWalletModal() },
];
let cmdIndex = 0;
function openCommandPalette() {
  const b = $("cmdBackdrop");
  if (!b) return;
  b.hidden = false;
  const input = $("cmdInput");
  if (input) { input.value = ""; input.focus(); }
  renderCmdList("");
  refreshIcons();
}
function closeCommandPalette() {
  const b = $("cmdBackdrop");
  if (b) b.hidden = true;
}
function renderCmdList(q) {
  const list = $("cmdList");
  if (!list) return;
  const query = (q || "").toLowerCase().trim();
  const items = CMD_ITEMS.filter(c => !query || c.label.toLowerCase().includes(query) || c.hint.toLowerCase().includes(query));
  cmdIndex = 0;
  list.innerHTML = items.map((c, i) =>
    `<button type="button" class="cmd-item${i === 0 ? " active" : ""}" data-cmd="${c.id}"><i data-lucide="${c.icon}"></i>${safe(c.label)}<span>${safe(c.hint)}</span></button>`
  ).join("") || `<div class="muted" style="padding:12px">No commands</div>`;
  refreshIcons();
}
function runCmd(id) {
  const c = CMD_ITEMS.find(x => x.id === id);
  closeCommandPalette();
  if (c) c.run();
}
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const b = $("cmdBackdrop");
    if (b && !b.hidden) closeCommandPalette();
    else openCommandPalette();
  }
  const b = $("cmdBackdrop");
  if (!b || b.hidden) return;
  if (e.key === "Escape") closeCommandPalette();
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const items = [...document.querySelectorAll(".cmd-item")];
    if (!items.length) return;
    cmdIndex = e.key === "ArrowDown" ? (cmdIndex + 1) % items.length : (cmdIndex - 1 + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("active", i === cmdIndex));
    items[cmdIndex].scrollIntoView({ block: "nearest" });
  }
  if (e.key === "Enter") {
    const items = [...document.querySelectorAll(".cmd-item")];
    if (items[cmdIndex]) runCmd(items[cmdIndex].dataset.cmd);
  }
});
if ($("cmdInput")) $("cmdInput").addEventListener("input", e => renderCmdList(e.target.value));
if ($("cmdList")) $("cmdList").addEventListener("click", e => {
  const btn = e.target.closest("[data-cmd]");
  if (btn) runCmd(btn.dataset.cmd);
});
if ($("cmdBackdrop")) $("cmdBackdrop").addEventListener("click", e => {
  if (e.target === $("cmdBackdrop")) closeCommandPalette();
});

// Hook into transaction save streak + premium refresh
const _refreshPremium = refresh;
refresh = function() {
  _refreshPremium();
  try { renderPremium(); } catch (err) { console.error(err); }
};

// When adding transaction, bump streak
document.addEventListener("click", () => {}, true);



/* ===== Pro dashboard helpers (dashPeriod declared early above) ===== */
function periodRange(period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start;
  if (period === "day") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (period === "week") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else if (period === "all") {
    start = new Date(1970, 0, 1, 0, 0, 0, 0);
  } else {
    // month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  return { start, end };
}
function prevPeriodRange(period) {
  if (period === "day") {
    const now = new Date();
    const pStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const pEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { start: pStart, end: pEnd };
  }
  if (period === "week") {
    const { start } = periodRange("week");
    const pEnd = new Date(start.getTime() - 1);
    const pStart = new Date(pEnd);
    pStart.setDate(pStart.getDate() - 6);
    pStart.setHours(0, 0, 0, 0);
    return { start: pStart, end: pEnd };
  }
  if (period === "year") {
    const y = new Date().getFullYear() - 1;
    return { start: new Date(y, 0, 1, 0, 0, 0, 0), end: new Date(y, 11, 31, 23, 59, 59, 999) };
  }
  if (period === "all") {
    return periodRange("all");
  }
  // month → previous calendar month
  const now = new Date();
  const pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const pEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start: pStart, end: pEnd };
}
function inRange(dateStr, range) {
  if (!dateStr) return false;
  // Parse YYYY-MM-DD as local calendar day
  const parts = String(dateStr).slice(0, 10).split("-");
  if (parts.length !== 3) return false;
  const y = Number(parts[0]), m = Number(parts[1]) - 1, d = Number(parts[2]);
  if (!y || m < 0 || !d) return false;
  const dt = new Date(y, m, d, 12, 0, 0, 0);
  return dt >= range.start && dt <= range.end;
}
function periodTotals(period) {
  const range = periodRange(period);
  let income = 0, expense = 0, count = 0;
  (transactions || []).forEach(t => {
    if (!t || !inRange(t.date, range)) return;
    count++;
    if (t.type === "transfer") return; // move between accounts, not income/expense
    const a = amountInBase(t);
    if (isIncomeType(t)) income += a;
    else if (t.type === "expense") expense += a;
  });
  return { income, expense, balance: income - expense, count, range };
}
function prevPeriodTotals(period) {
  const range = prevPeriodRange(period);
  let income = 0, expense = 0;
  (transactions || []).forEach(t => {
    if (!t || !inRange(t.date, range)) return;
    if (t.type === "transfer") return;
    const a = amountInBase(t);
    if (isIncomeType(t)) income += a;
    else if (t.type === "expense") expense += a;
  });
  return { income, expense, balance: income - expense };
}
function dashPctChange(cur, prev) {
  if (!prev && !cur) return 0;
  if (!prev) return cur > 0 ? 100 : 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
}
function periodLabel(period) {
  return ({ day: "Today", week: "This week", month: "This month", year: "This year", all: "All time" })[period] || period;
}
function applyPeriodButtons() {
  document.querySelectorAll(".period-btn").forEach(b => {
    const p = b.dataset.period || "";
    b.classList.toggle("active", p === dashPeriod);
  });
}
function txsInPeriod(period) {
  const range = periodRange(period || dashPeriod);
  return (transactions || []).filter(t => t && inRange(t.date, range));
}
function setDashPeriod(period) {
  if (!DASH_PERIODS.includes(period)) period = "all";
  dashPeriod = period;
  saveDashPeriod(period);
  applyPeriodButtons();
  // Instant numbers — cancel any leftover count-up so old period data never sticks
  try {
    ["balanceValue","incomeValue","expenseValue","countValue","savingsRateValue","burnRateValue","vsLastValue","forecastValue"].forEach(id => {
      const el = $(id);
      if (el && el._animRaf) { try { cancelAnimationFrame(el._animRaf); } catch(_){} el._animRaf = null; }
    });
  } catch (_) {}
  try { renderProDashboard(); } catch (e) { console.error(e); }
  try { renderStats(false); } catch (_) {}
  try { renderRecent(); } catch (_) {}
  try { renderCharts(); } catch (_) {}
  try { renderBudgetOverviewForPeriod(); } catch (_) {}
  try { if (typeof renderForecastCard === "function") renderForecastCard(); } catch (_) {}
}
function renderBudgetOverviewForPeriod() {
  // Budget card stays monthly by design; no-op unless elements exist
  try {
    if (typeof renderBudget === "function") renderBudget();
  } catch (_) {}
}
function renderProDashboard() {
  const cur = periodTotals(dashPeriod);
  const prev = prevPeriodTotals(dashPeriod);
  const overall = totals();
  const allCount = (transactions || []).length;

  // Balance ALWAYS all-time so money never disappears on Day/Week filter
  try {
    if ($("balanceValue")) $("balanceValue").textContent = money(overall.balance);
  } catch (_) {
    try { if ($("balanceValue")) $("balanceValue").textContent = "SAR " + (Number(overall.balance) || 0).toFixed(2); } catch (__) {}
  }
  if ($("incomeValue")) $("incomeValue").textContent = money(cur.income);
  if ($("expenseValue")) $("expenseValue").textContent = money(cur.expense);
  if ($("countValue")) $("countValue").textContent = String(cur.count);

  // Clarify count subtitle
  const countFoot = document.querySelector("#countValue") && $("countValue").closest(".stat-card");
  if (countFoot) {
    const foot = countFoot.querySelector(".stat-foot span:last-child, .stat-foot");
    // update soft label if present
  }
  const countSub = document.querySelector(".stat-card #countValue");
  try {
    const card = $("countValue") && $("countValue").closest(".stat-card");
    if (card) {
      let foot = card.querySelector(".stat-foot");
      if (foot) {
        const label = dashPeriod === "all"
          ? "All recorded entries"
          : (cur.count + " in " + periodLabel(dashPeriod).toLowerCase() + (allCount ? " · " + allCount + " total" : ""));
        foot.innerHTML = `<span>${label}</span>`;
      }
    }
  } catch (_) {}

  const incCh = dashPctChange(cur.income, prev.income);
  const expCh = dashPctChange(cur.expense, prev.expense);
  const hasActivity = cur.income > 0 || cur.expense > 0 || cur.count > 0;
  const hasPrev = prev.income > 0 || prev.expense > 0;
  const fmtCh = (ch, invert) => {
    if (!hasActivity && !hasPrev) return `<span class="muted">—</span>`;
    if (!hasPrev) return hasActivity ? `<span class="positive">New</span>` : `<span class="muted">—</span>`;
    if (Math.abs(ch) < 0.5) return `<span class="muted">0% vs last</span>`;
    const good = invert ? ch <= 0 : ch >= 0;
    return `<span class="${good ? "positive" : "negative"}">${ch >= 0 ? "▲" : "▼"} ${Math.abs(ch).toFixed(0)}% vs last</span>`;
  };
  if ($("incomeChange")) $("incomeChange").innerHTML = fmtCh(incCh, false);
  if ($("expenseChange")) $("expenseChange").innerHTML = fmtCh(expCh, true);

  // KPIs
  const saveRate = cur.income > 0 ? (cur.balance / cur.income) * 100 : 0;
  if ($("savingsRateValue")) $("savingsRateValue").textContent = cur.income > 0 ? (saveRate.toFixed(0) + "%") : "—";
  if ($("savingsRateSub")) {
    $("savingsRateSub").textContent = !hasActivity
      ? ("No activity · " + periodLabel(dashPeriod))
      : (cur.balance >= 0 ? "Positive cash flow" : "Spending above income");
  }

  const msSpan = Math.max(1, (cur.range.end - cur.range.start) / 86400000);
  const days = Math.max(1, Math.ceil(msSpan));
  const burn = cur.expense / days;
  if ($("burnRateValue")) $("burnRateValue").textContent = hasActivity ? money(burn) : "—";
  if ($("burnRateSub")) $("burnRateSub").textContent = "Avg / day · " + periodLabel(dashPeriod);

  if ($("vsLastValue")) {
    if (!hasActivity && !hasPrev) {
      $("vsLastValue").textContent = "—";
      $("vsLastValue").style.color = "";
    } else {
      const e = dashPctChange(cur.expense, prev.expense);
      $("vsLastValue").textContent = (e >= 0 ? "+" : "") + e.toFixed(0) + "%";
      $("vsLastValue").style.color = e > 5 ? "var(--red, #f17e82)" : "var(--green, #5ac69a)";
    }
  }
  if ($("vsLastSub")) $("vsLastSub").textContent = "Expenses vs previous period";

  const limit = loadBudget();
  const monthExp = monthTotals(monthKey()).expense;
  const budPct = limit > 0 ? Math.min(100, (monthExp / limit) * 100) : 0;
  const goals = typeof loadGoals === "function" ? loadGoals() : [];
  let gSaved = 0, gTarget = 0;
  goals.forEach(g => { gSaved += Number(g.saved) || 0; gTarget += Number(g.target) || 0; });
  const goalPct = gTarget > 0 ? Math.min(100, (gSaved / gTarget) * 100) : 0;
  const savePct = Math.max(0, Math.min(100, saveRate));
  const setRing = (id, pct, labelId) => {
    const el = $(id);
    if (el) el.setAttribute("stroke-dasharray", `${Number(pct).toFixed(1)}, 100`);
    if ($(labelId)) $(labelId).textContent = Math.round(pct) + "%";
  };
  setRing("goalRing", goalPct, "goalRingPct");
  setRing("saveRing", savePct, "saveRingPct");

  // alerts
  const alerts = [];
  if (allCount > 0 && !hasActivity && dashPeriod !== "all") {
    alerts.push({ type: "ok", text: "No entries in " + periodLabel(dashPeriod).toLowerCase() + " — try Week, Month or All" });
  }
  if (limit > 0 && monthExp > limit) alerts.push({ type: "danger", text: "Monthly budget exceeded by " + money(monthExp - limit) });
  else if (limit > 0 && monthExp > limit * 0.85) alerts.push({ type: "warning", text: "Budget almost used (" + budPct.toFixed(0) + "%)" });
  if (cur.expense > cur.income && cur.income > 0) alerts.push({ type: "warning", text: "Expenses higher than income this period" });
  if (typeof loadDebts === "function") {
    try {
      loadDebts().filter(d => !d.settled && d.due).forEach(d => {
        alerts.push({ type: "warning", text: "Debt due " + d.due + " · " + d.person });
      });
    } catch (_) {}
  }
  if (!allCount) alerts.push({ type: "ok", text: "Add your first transaction to unlock insights" });
  if (!alerts.length) alerts.push({ type: "ok", text: "No critical alerts — looking stable" });
  const alist = $("alertsList");
  if (alist) alist.innerHTML = alerts.slice(0, 6).map(a => `<div class="alert-item ${a.type}">${safe(a.text)}</div>`).join("");
  if ($("alertCount")) $("alertCount").textContent = String(alerts.length);

  // executive summary
  const es = $("execSummary");
  if (es) {
    if (!allCount) {
      es.hidden = true;
      es.textContent = "";
    } else if (!hasActivity && dashPeriod !== "all") {
      es.hidden = false;
      es.textContent = periodLabel(dashPeriod) + ": no activity yet · All-time balance " + money(overall.balance) + " · " + allCount + " total entries";
    } else {
      const tone = cur.balance >= 0 ? "Net +" : "Net −";
      es.hidden = false;
      es.textContent = `${periodLabel(dashPeriod)}: ${money(cur.income)} in · ${money(cur.expense)} out · ${tone}${money(Math.abs(cur.balance))}` +
        (cur.income > 0 ? ` · Saved ${saveRate.toFixed(0)}%` : "") +
        (limit > 0 ? ` · Budget ${budPct.toFixed(0)}%` : "");
    }
  }
}

// Period button clicks
document.querySelectorAll(".period-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setDashPeriod(btn.dataset.period || "all");
  });
});
applyPeriodButtons();

if ($("qaAdd")) $("qaAdd").addEventListener("click", () => openModal(null));
if ($("qaBackup")) $("qaBackup").addEventListener("click", () => openBackupModal());
if ($("qaLock")) $("qaLock").addEventListener("click", () => openLockModal());
if ($("qaGoals")) $("qaGoals").addEventListener("click", () => switchPage("goals"));
if ($("qaReports")) $("qaReports").addEventListener("click", () => switchPage("reports"));
document.querySelectorAll("[data-go]").forEach(btn => {
  btn.addEventListener("click", () => switchPage(btn.dataset.go));
});


function playLogoOpen() {
  const btn = $("brandLogoBtn");
  const splash = $("logoSplash");
  if (btn) {
    btn.classList.remove("logo-pop");
    void btn.offsetWidth;
    btn.classList.add("logo-pop");
  }
  if (splash) {
    splash.hidden = false;
    splash.classList.remove("closing");
    refreshIcons();
    setTimeout(() => {
      splash.classList.add("closing");
      setTimeout(() => {
        splash.hidden = true;
        splash.classList.remove("closing");
      }, 320);
    }, 700);
  }
  try { switchPage("overview"); } catch (_) {}
  // Only close mobile drawer after splash — keep desktop nav open
  try { if (typeof isMobileNav === "function" && isMobileNav()) closeSidebar(); } catch (_) {}
  try { closeProfileMenu(); } catch (_) {}
}
if ($("brandLogoBtn")) {
  $("brandLogoBtn").addEventListener("click", () => openWalletModal());
}


/* ===== Wallet ===== */
const DEFAULT_ACCOUNTS = ["Cash", "Bank", "Card", "JazzCash", "Easypaisa", "Wallet", "Other"];
function accountBalances() {
  const map = {};
  DEFAULT_ACCOUNTS.forEach(name => {
    map[name] = { income: 0, expense: 0 };
  });
  (transactions || []).forEach(t => {
    if (!t) return;
    let a = 0;
    try { a = amountInBase(t); } catch (_) { a = Number(t.amount) || 0; }
    if (!Number.isFinite(a)) a = 0;
    const from = (t.account || "Cash").trim() || "Cash";
    if (!map[from]) map[from] = { income: 0, expense: 0 };
    if (t.type === "transfer") {
      // money leaves "from" and enters "transferTo"
      map[from].expense += a;
      const to = (t.transferTo || "").trim();
      if (to) {
        if (!map[to]) map[to] = { income: 0, expense: 0 };
        map[to].income += a;
      }
    } else if (isIncomeType(t)) {
      map[from].income += a;
    } else {
      map[from].expense += a;
    }
  });
  return Object.entries(map).map(([name, v]) => ({
    name,
    balance: v.income - v.expense,
    income: v.income,
    expense: v.expense,
    active: (v.income + v.expense) > 0
  })).sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return b.balance - a.balance;
  });
}
function accountIcon(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("bank")) return "🏦";
  if (n.includes("card")) return "💳";
  if (n.includes("jazz") || n.includes("easy")) return "📱";
  if (n.includes("cash")) return "💵";
  if (n.includes("other")) return "📁";
  return "👛";
}
function renderWallet() {
  let total = 0;
  try {
    const t = (typeof totals === "function") ? totals() : null;
    if (t && Number.isFinite(t.balance)) total = t.balance;
    else {
      (transactions || []).forEach(tx => {
        try {
          if (tx.type === "transfer") return;
          const a = amountInBase(tx);
          if (isIncomeType(tx)) total += a;
          else total -= a;
        } catch (_) {}
      });
    }
  } catch (e) { console.error(e); }
  const el = document.getElementById("walletTotal");
  if (el) {
    el.textContent = money(total);
    el.style.color = total > 0 ? "var(--green,#5ac69a)" : (total < 0 ? "var(--red,#f17e82)" : "var(--accent2,#f0d18b)");
  }
  const sub = document.getElementById("walletSub");
  if (sub) sub.textContent = total >= 0 ? "Available remaining balance" : "Spending exceeds income";
  const listEl = document.getElementById("walletAccountsList");
  if (listEl) {
    const bals = accountBalances().filter(a => a.active || ["Cash","Bank","Card"].includes(a.name));
    listEl.innerHTML = bals.map(a => {
      const cls = a.balance > 0 ? "pos" : (a.balance < 0 ? "neg" : "");
      return `<div class="wallet-acc-row">
        <span class="wallet-acc-name">${accountIcon(a.name)} ${safe(a.name)}</span>
        <strong class="wallet-acc-bal ${cls}">${money(a.balance)}</strong>
      </div>`;
    }).join("") || `<p class="muted" style="font-size:12px;text-align:center">No account activity yet</p>`;
  }
}
function openWalletModal() {
  const b = document.getElementById("walletModalBackdrop");
  if (!b) {
    showToast("Wallet missing — reload app");
    return;
  }
  try { renderWallet(); } catch (e) { console.error(e); }
  b.classList.add("open");
  b.style.display = "flex";
  b.style.zIndex = "200";
  try { refreshIcons(); } catch (_) {}
}
function closeWalletModal() {
  const b = document.getElementById("walletModalBackdrop");
  if (!b) return;
  b.classList.remove("open");
  b.style.display = "none";
}



/* Delegated clicks for Goals / Debts (capture = more reliable) */
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("#addGoalBtn, #addGoalBtn2, #addDebtBtn, #addDebtBtn2, #closeGoalModal, #cancelGoalModal, #closeDebtModal, #cancelDebtModal");
  if (!t) return;
  const id = t.id;
  if (id === "addGoalBtn" || id === "addGoalBtn2") { e.preventDefault(); e.stopPropagation(); openGoalModal(); }
  else if (id === "addDebtBtn" || id === "addDebtBtn2") { e.preventDefault(); e.stopPropagation(); openDebtModal(); }
  else if (id === "closeGoalModal" || id === "cancelGoalModal") { e.preventDefault(); closeGoalModal(); }
  else if (id === "closeDebtModal" || id === "cancelDebtModal") { e.preventDefault(); closeDebtModal(); }
}, true);

// Expose for inline handlers
window.openDebtModal = openDebtModal;
window.openGoalModal = openGoalModal;
window.closeDebtModal = closeDebtModal;
window.closeGoalModal = closeGoalModal;


/* Auth password visibility */
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest(".auth-eye");
  if (!btn) return;
  e.preventDefault();
  const id = btn.getAttribute("data-eye");
  const input = id && document.getElementById(id);
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.innerHTML = show ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
  btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  if (window.lucide) lucide.createIcons();
}, true);

if ($("guestContinueBtn")) {
  $("guestContinueBtn").addEventListener("click", () => {
    setAuthError("");
    enterAsGuest();
  });
}
if ($("authCloseBtn")) {
  $("authCloseBtn").addEventListener("click", () => {
    setAuthError("");
    enterAsGuest();
  });
}

/* Escape closes modals (and mobile nav drawer only) */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  try {
    const auth = $("authScreen");
    if (auth && !auth.hidden && auth.style.display !== "none") {
      setAuthError("");
      enterAsGuest();
      return;
    }
    if ($("modalBackdrop") && $("modalBackdrop").classList.contains("open")) closeModal();
    if ($("budgetModalBackdrop") && $("budgetModalBackdrop").classList.contains("open")) closeBudgetModal();
    if ($("goalModalBackdrop") && $("goalModalBackdrop").classList.contains("open")) closeGoalModal();
    if ($("debtModalBackdrop") && $("debtModalBackdrop").classList.contains("open")) closeDebtModal();
    if ($("walletModalBackdrop") && $("walletModalBackdrop").classList.contains("open")) closeWalletModal();
    if ($("lockModalBackdrop") && $("lockModalBackdrop").classList.contains("open")) closeLockModal();
    if ($("backupModalBackdrop") && $("backupModalBackdrop").classList.contains("open")) closeBackupModal();
    if ($("accountModalBackdrop") && $("accountModalBackdrop").classList.contains("open")) closeAccountModal();
    if (typeof closeProfileMenu === "function") closeProfileMenu();
    // Mobile drawer only — desktop sidebar stays visible
    if (typeof isMobileNav === "function" && isMobileNav()) closeSidebar();
  } catch (_) {}
});

if ($("profileCreateAccountBtn")) {
  $("profileCreateAccountBtn").addEventListener("click", () => {
    closeProfileMenu();
    // leave guest session, open register
    currentUserId = null;
    setSessionUserId("");
    showAuthScreen("register");
  });
}

/* ===== Account settings (name, mobile, change password) ===== */
function setAccountError(msg) {
  const el = $("accountError");
  if (!el) return;
  if (!msg) {
    el.hidden = true;
    el.textContent = "";
  } else {
    el.hidden = false;
    el.textContent = msg;
  }
}
function openAccountModal() {
  if (isGuestUser()) {
    showToast("Create an account first");
    return;
  }
  const u = getCurrentUser();
  if (!u) {
    showToast("Please login first");
    return;
  }
  const b = $("accountModalBackdrop");
  if (!b) return;
  if ($("accName")) $("accName").value = u.name || "";
  if ($("accMobile")) $("accMobile").value = u.mobile || "";
  if ($("accEmail")) $("accEmail").value = u.email || "";
  if ($("accCurrentPass")) $("accCurrentPass").value = "";
  if ($("accNewPass")) $("accNewPass").value = "";
  if ($("accNewPass2")) $("accNewPass2").value = "";
  setAccountError("");
  // Google accounts without local password: hide current password requirement hint
  const passBlock = $("accountPassBlock");
  if (passBlock) {
    const noLocalPass = u.provider === "google" && !u.pass;
    const curLab = $("accCurrentPass") && $("accCurrentPass").closest("label");
    if (curLab) curLab.style.display = noLocalPass ? "none" : "";
  }
  b.classList.add("open");
  b.style.display = "flex";
  try { refreshIcons(); } catch (_) {}
  closeProfileMenu();
}
function closeAccountModal() {
  const b = $("accountModalBackdrop");
  if (!b) return;
  b.classList.remove("open");
  b.style.display = "none";
  setAccountError("");
}
function saveAccountForm(e) {
  if (e) e.preventDefault();
  try {
    const name = ($("accName") && $("accName").value || "").trim();
    const mobile = ($("accMobile") && $("accMobile").value || "").trim();
    const cur = ($("accCurrentPass") && $("accCurrentPass").value) || "";
    const n1 = ($("accNewPass") && $("accNewPass").value) || "";
    const n2 = ($("accNewPass2") && $("accNewPass2").value) || "";
    if (!name) {
      setAccountError("Name is required");
      return;
    }
    if (n1 || n2 || cur) {
      if (n1 !== n2) {
        setAccountError("New passwords do not match");
        return;
      }
      if (n1.length < 4) {
        setAccountError("New password min 4 characters");
        return;
      }
      changePassword(cur, n1);
    }
    updateCurrentUser({ name: name.slice(0, 40), mobile: mobile.slice(0, 20) });
    updateProfileUI();
    closeAccountModal();
    showToast(n1 ? "Password & profile updated" : "Profile updated");
  } catch (err) {
    setAccountError(err.message || "Could not save");
  }
}
if ($("profileAccountBtn")) {
  $("profileAccountBtn").addEventListener("click", () => {
    closeProfileMenu();
    openAccountModal();
  });
}
if ($("closeAccountModal")) $("closeAccountModal").addEventListener("click", closeAccountModal);
if ($("cancelAccountModal")) $("cancelAccountModal").addEventListener("click", closeAccountModal);
if ($("accountModalBackdrop")) {
  $("accountModalBackdrop").addEventListener("click", (e) => {
    if (e.target === $("accountModalBackdrop")) closeAccountModal();
  });
}
if ($("accountForm")) {
  $("accountForm").addEventListener("submit", saveAccountForm);
}

function setProfileStudioError(msg) {
  const el = $("profileStudioError");
  if (!el) return;
  if (!msg) { el.hidden = true; el.textContent = ""; return; }
  el.hidden = false;
  el.textContent = msg;
}

/* Country dial codes for profile mobile */
const COUNTRY_DIAL = [
  { c:"AF", n:"Afghanistan", d:"+93" },
  { c:"AL", n:"Albania", d:"+355" },
  { c:"DZ", n:"Algeria", d:"+213" },
  { c:"AD", n:"Andorra", d:"+376" },
  { c:"AO", n:"Angola", d:"+244" },
  { c:"AR", n:"Argentina", d:"+54" },
  { c:"AM", n:"Armenia", d:"+374" },
  { c:"AU", n:"Australia", d:"+61" },
  { c:"AT", n:"Austria", d:"+43" },
  { c:"AZ", n:"Azerbaijan", d:"+994" },
  { c:"BH", n:"Bahrain", d:"+973" },
  { c:"BD", n:"Bangladesh", d:"+880" },
  { c:"BY", n:"Belarus", d:"+375" },
  { c:"BE", n:"Belgium", d:"+32" },
  { c:"BZ", n:"Belize", d:"+501" },
  { c:"BJ", n:"Benin", d:"+229" },
  { c:"BT", n:"Bhutan", d:"+975" },
  { c:"BO", n:"Bolivia", d:"+591" },
  { c:"BA", n:"Bosnia", d:"+387" },
  { c:"BW", n:"Botswana", d:"+267" },
  { c:"BR", n:"Brazil", d:"+55" },
  { c:"BN", n:"Brunei", d:"+673" },
  { c:"BG", n:"Bulgaria", d:"+359" },
  { c:"BF", n:"Burkina Faso", d:"+226" },
  { c:"BI", n:"Burundi", d:"+257" },
  { c:"KH", n:"Cambodia", d:"+855" },
  { c:"CM", n:"Cameroon", d:"+237" },
  { c:"CA", n:"Canada", d:"+1" },
  { c:"CV", n:"Cape Verde", d:"+238" },
  { c:"CF", n:"Central African Rep.", d:"+236" },
  { c:"TD", n:"Chad", d:"+235" },
  { c:"CL", n:"Chile", d:"+56" },
  { c:"CN", n:"China", d:"+86" },
  { c:"CO", n:"Colombia", d:"+57" },
  { c:"KM", n:"Comoros", d:"+269" },
  { c:"CG", n:"Congo", d:"+242" },
  { c:"CD", n:"Congo (DRC)", d:"+243" },
  { c:"CR", n:"Costa Rica", d:"+506" },
  { c:"HR", n:"Croatia", d:"+385" },
  { c:"CU", n:"Cuba", d:"+53" },
  { c:"CY", n:"Cyprus", d:"+357" },
  { c:"CZ", n:"Czechia", d:"+420" },
  { c:"DK", n:"Denmark", d:"+45" },
  { c:"DJ", n:"Djibouti", d:"+253" },
  { c:"DO", n:"Dominican Rep.", d:"+1" },
  { c:"EC", n:"Ecuador", d:"+593" },
  { c:"EG", n:"Egypt", d:"+20" },
  { c:"SV", n:"El Salvador", d:"+503" },
  { c:"GQ", n:"Equatorial Guinea", d:"+240" },
  { c:"ER", n:"Eritrea", d:"+291" },
  { c:"EE", n:"Estonia", d:"+372" },
  { c:"SZ", n:"Eswatini", d:"+268" },
  { c:"ET", n:"Ethiopia", d:"+251" },
  { c:"FJ", n:"Fiji", d:"+679" },
  { c:"FI", n:"Finland", d:"+358" },
  { c:"FR", n:"France", d:"+33" },
  { c:"GA", n:"Gabon", d:"+241" },
  { c:"GM", n:"Gambia", d:"+220" },
  { c:"GE", n:"Georgia", d:"+995" },
  { c:"DE", n:"Germany", d:"+49" },
  { c:"GH", n:"Ghana", d:"+233" },
  { c:"GR", n:"Greece", d:"+30" },
  { c:"GT", n:"Guatemala", d:"+502" },
  { c:"GN", n:"Guinea", d:"+224" },
  { c:"GY", n:"Guyana", d:"+592" },
  { c:"HT", n:"Haiti", d:"+509" },
  { c:"HN", n:"Honduras", d:"+504" },
  { c:"HK", n:"Hong Kong", d:"+852" },
  { c:"HU", n:"Hungary", d:"+36" },
  { c:"IS", n:"Iceland", d:"+354" },
  { c:"IN", n:"India", d:"+91" },
  { c:"ID", n:"Indonesia", d:"+62" },
  { c:"IR", n:"Iran", d:"+98" },
  { c:"IQ", n:"Iraq", d:"+964" },
  { c:"IE", n:"Ireland", d:"+353" },
  { c:"IL", n:"Israel", d:"+972" },
  { c:"IT", n:"Italy", d:"+39" },
  { c:"CI", n:"Ivory Coast", d:"+225" },
  { c:"JM", n:"Jamaica", d:"+1" },
  { c:"JP", n:"Japan", d:"+81" },
  { c:"JO", n:"Jordan", d:"+962" },
  { c:"KZ", n:"Kazakhstan", d:"+7" },
  { c:"KE", n:"Kenya", d:"+254" },
  { c:"KW", n:"Kuwait", d:"+965" },
  { c:"KG", n:"Kyrgyzstan", d:"+996" },
  { c:"LA", n:"Laos", d:"+856" },
  { c:"LV", n:"Latvia", d:"+371" },
  { c:"LB", n:"Lebanon", d:"+961" },
  { c:"LS", n:"Lesotho", d:"+266" },
  { c:"LR", n:"Liberia", d:"+231" },
  { c:"LY", n:"Libya", d:"+218" },
  { c:"LI", n:"Liechtenstein", d:"+423" },
  { c:"LT", n:"Lithuania", d:"+370" },
  { c:"LU", n:"Luxembourg", d:"+352" },
  { c:"MO", n:"Macau", d:"+853" },
  { c:"MG", n:"Madagascar", d:"+261" },
  { c:"MW", n:"Malawi", d:"+265" },
  { c:"MY", n:"Malaysia", d:"+60" },
  { c:"MV", n:"Maldives", d:"+960" },
  { c:"ML", n:"Mali", d:"+223" },
  { c:"MT", n:"Malta", d:"+356" },
  { c:"MR", n:"Mauritania", d:"+222" },
  { c:"MU", n:"Mauritius", d:"+230" },
  { c:"MX", n:"Mexico", d:"+52" },
  { c:"MD", n:"Moldova", d:"+373" },
  { c:"MC", n:"Monaco", d:"+377" },
  { c:"MN", n:"Mongolia", d:"+976" },
  { c:"ME", n:"Montenegro", d:"+382" },
  { c:"MA", n:"Morocco", d:"+212" },
  { c:"MZ", n:"Mozambique", d:"+258" },
  { c:"MM", n:"Myanmar", d:"+95" },
  { c:"NA", n:"Namibia", d:"+264" },
  { c:"NP", n:"Nepal", d:"+977" },
  { c:"NL", n:"Netherlands", d:"+31" },
  { c:"NZ", n:"New Zealand", d:"+64" },
  { c:"NI", n:"Nicaragua", d:"+505" },
  { c:"NE", n:"Niger", d:"+227" },
  { c:"NG", n:"Nigeria", d:"+234" },
  { c:"KP", n:"North Korea", d:"+850" },
  { c:"MK", n:"North Macedonia", d:"+389" },
  { c:"NO", n:"Norway", d:"+47" },
  { c:"OM", n:"Oman", d:"+968" },
  { c:"PK", n:"Pakistan", d:"+92" },
  { c:"PS", n:"Palestine", d:"+970" },
  { c:"PA", n:"Panama", d:"+507" },
  { c:"PG", n:"Papua New Guinea", d:"+675" },
  { c:"PY", n:"Paraguay", d:"+595" },
  { c:"PE", n:"Peru", d:"+51" },
  { c:"PH", n:"Philippines", d:"+63" },
  { c:"PL", n:"Poland", d:"+48" },
  { c:"PT", n:"Portugal", d:"+351" },
  { c:"PR", n:"Puerto Rico", d:"+1" },
  { c:"QA", n:"Qatar", d:"+974" },
  { c:"RO", n:"Romania", d:"+40" },
  { c:"RU", n:"Russia", d:"+7" },
  { c:"RW", n:"Rwanda", d:"+250" },
  { c:"SA", n:"Saudi Arabia", d:"+966" },
  { c:"SN", n:"Senegal", d:"+221" },
  { c:"RS", n:"Serbia", d:"+381" },
  { c:"SC", n:"Seychelles", d:"+248" },
  { c:"SL", n:"Sierra Leone", d:"+232" },
  { c:"SG", n:"Singapore", d:"+65" },
  { c:"SK", n:"Slovakia", d:"+421" },
  { c:"SI", n:"Slovenia", d:"+386" },
  { c:"SO", n:"Somalia", d:"+252" },
  { c:"ZA", n:"South Africa", d:"+27" },
  { c:"KR", n:"South Korea", d:"+82" },
  { c:"SS", n:"South Sudan", d:"+211" },
  { c:"ES", n:"Spain", d:"+34" },
  { c:"LK", n:"Sri Lanka", d:"+94" },
  { c:"SD", n:"Sudan", d:"+249" },
  { c:"SR", n:"Suriname", d:"+597" },
  { c:"SE", n:"Sweden", d:"+46" },
  { c:"CH", n:"Switzerland", d:"+41" },
  { c:"SY", n:"Syria", d:"+963" },
  { c:"TW", n:"Taiwan", d:"+886" },
  { c:"TJ", n:"Tajikistan", d:"+992" },
  { c:"TZ", n:"Tanzania", d:"+255" },
  { c:"TH", n:"Thailand", d:"+66" },
  { c:"TL", n:"Timor-Leste", d:"+670" },
  { c:"TG", n:"Togo", d:"+228" },
  { c:"TN", n:"Tunisia", d:"+216" },
  { c:"TR", n:"Turkey", d:"+90" },
  { c:"TM", n:"Turkmenistan", d:"+993" },
  { c:"UG", n:"Uganda", d:"+256" },
  { c:"UA", n:"Ukraine", d:"+380" },
  { c:"AE", n:"United Arab Emirates", d:"+971" },
  { c:"GB", n:"United Kingdom", d:"+44" },
  { c:"US", n:"United States", d:"+1" },
  { c:"UY", n:"Uruguay", d:"+598" },
  { c:"UZ", n:"Uzbekistan", d:"+998" },
  { c:"VE", n:"Venezuela", d:"+58" },
  { c:"VN", n:"Vietnam", d:"+84" },
  { c:"YE", n:"Yemen", d:"+967" },
  { c:"ZM", n:"Zambia", d:"+260" },
  { c:"ZW", n:"Zimbabwe", d:"+263" }
];

function ensureCountrySelect() {
  let sel = document.getElementById("profCountry");
  if (!sel) return null;
  // COUNTRY_DIAL is declared later in the file; skip until available
  let list;
  try { list = COUNTRY_DIAL; } catch (_) { return sel; }
  if (!Array.isArray(list) || !list.length) return sel;
  // Undo previous animated-select wrap (broke long country list)
  try {
    const wrap = sel.closest && sel.closest(".select-anim-wrap");
    if (wrap && wrap.parentNode) {
      sel.style.cssText = "";
      sel.removeAttribute("aria-hidden");
      sel.removeAttribute("tabindex");
      sel.dataset.animSelect = "0";
      wrap.parentNode.insertBefore(sel, wrap);
      wrap.remove();
    }
  } catch (_) {}
  // Always rebuild if empty (anim enhance or cache may leave it blank)
  if (sel.options.length < 10) {
    const prev = sel.value || "SA";
    const sorted = [...list].sort((a, b) => a.n.localeCompare(b.n));
    const frag = document.createDocumentFragment();
    for (const x of sorted) {
      const o = document.createElement("option");
      o.value = x.c;
      o.setAttribute("data-dial", x.d);
      o.textContent = x.n + " (" + x.d + ")";
      frag.appendChild(o);
    }
    sel.innerHTML = "";
    sel.appendChild(frag);
    sel.dataset.filled = "1";
    if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
    else if ([...sel.options].some(o => o.value === "SA")) sel.value = "SA";
  }
  return sel;
}

function countryByDial(dial) {
  const d = String(dial || "");
  // Prefer common regions when dial is shared
  const prefer = { "+1": "US", "+7": "RU", "+44": "GB" };
  if (prefer[d]) {
    const p = COUNTRY_DIAL.find(x => x.c === prefer[d] && x.d === d);
    if (p) return p;
  }
  return COUNTRY_DIAL.find(x => x.d === d) || null;
}

function parseMobileToParts(raw) {
  let s = String(raw || "").trim().replace(/[\s\-()]/g, "");
  if (!s) return { code: "SA", national: "" };
  if (s.startsWith("00")) s = "+" + s.slice(2);
  // Longest dial match; only match when number starts with +dial or 00 was normalized
  const dials = [...new Set(COUNTRY_DIAL.map(x => x.d))].sort((a, b) => b.length - a.length);
  if (s.startsWith("+")) {
    for (const d of dials) {
      if (s.startsWith(d)) {
        let national = s.slice(d.length).replace(/\D/g, "");
        // drop trunk prefix 0
        if (national.startsWith("0")) national = national.slice(1);
        const row = countryByDial(d);
        return { code: row ? row.c : "SA", national };
      }
    }
  }
  // bare digits: keep as national, default SA
  return { code: "SA", national: s.replace(/\D/g, "").replace(/^0+/, "") };
}

function composeMobileFromUI() {
  const sel = document.getElementById("profCountry");
  const input = document.getElementById("profMobile");
  let national = (input && input.value || "").replace(/\D/g, "");
  if (national.startsWith("0")) national = national.slice(1);
  if (!national) return "";
  let dial = "+966";
  if (sel && sel.value) {
    const row = COUNTRY_DIAL.find(x => x.c === sel.value);
    if (row) dial = row.d;
    else {
      const opt = sel.options[sel.selectedIndex];
      if (opt) {
        const dd = opt.getAttribute("data-dial");
        if (dd) dial = dd;
      }
    }
  }
  return dial + national;
}

function fillMobileUI(rawMobile) {
  const sel = ensureCountrySelect();
  const input = document.getElementById("profMobile");
  const parts = parseMobileToParts(rawMobile);
  if (sel) {
    if (COUNTRY_DIAL.some(x => x.c === parts.code)) sel.value = parts.code;
    else sel.value = "SA";
    // notify any listeners
    try { sel.dispatchEvent(new Event("change", { bubbles: true })); } catch (_) {}
  }
  if (input) {
    // if still looks international, strip again
    let n = parts.national || "";
    if (n.startsWith("966") && n.length > 9) n = n.slice(3);
    input.value = n;
  }
}

function refreshProfileCountryUI() {
  try {
    const u = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const guest = (typeof isGuestUser === "function") && isGuestUser();
    fillMobileUI(guest ? "" : (u && u.mobile) || "");
    const sel = document.getElementById("profCountry");
    const input = document.getElementById("profMobile");
    if (sel) sel.disabled = !!guest;
    if (input) input.disabled = !!guest;
  } catch (err) {
    console.warn("refreshProfileCountryUI", err);
  }
}

function saveProfileStudio(e) {
  if (e) e.preventDefault();
  try {
    if (isGuestUser()) {
      setProfileStudioError("Guest mode — create an account to save profile");
      return;
    }
    const u = getCurrentUser();
    if (!u) {
      setProfileStudioError("Please login first");
      return;
    }
    const name = ($("profName") && $("profName").value || "").trim();
    const email = ($("profEmail") && $("profEmail").value || "").trim().toLowerCase();
    const mobile = (typeof composeMobileFromUI === "function")
      ? composeMobileFromUI()
      : (($("profMobile") && $("profMobile").value || "").trim());
    const cur = ($("profCurrentPass") && $("profCurrentPass").value) || "";
    const n1 = ($("profNewPass") && $("profNewPass").value) || "";
    const n2 = ($("profNewPass2") && $("profNewPass2").value) || "";

    if (!name) { setProfileStudioError("Name is required"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setProfileStudioError("Enter a valid email (e.g. name@gmail.com)");
      return;
    }
    // Unique email on this device
    const users = loadUsers();
    const clash = users.find(x => x && x.id !== currentUserId && String(x.email || "").toLowerCase() === email);
    if (clash) {
      setProfileStudioError("This email is already used on this device");
      return;
    }
    // Only touch password when user actually typed a new one
    if (n1 || n2) {
      if (n1 !== n2) { setProfileStudioError("New passwords do not match"); return; }
      if (n1.length < 4) { setProfileStudioError("New password min 4 characters"); return; }
      const needsCurrent = !(u.provider === "google" && !u.pass);
      if (needsCurrent && !cur) {
        setProfileStudioError("Enter current password to change it");
        return;
      }
      changePassword(cur, n1);
    } else if (cur && !n1 && !n2) {
      // current filled by mistake with no new password — ignore, just save profile
    }
    updateCurrentUser({
      name: name.slice(0, 40),
      email: email.slice(0, 80),
      mobile: String(mobile || "").slice(0, 24)
    });
    ["profCurrentPass","profNewPass","profNewPass2"].forEach(id => { const el = $(id); if (el) el.value = ""; });
    setProfileStudioError("");
    updateProfileUI();
    showToast(n1 ? "Password & profile saved" : "Profile saved");
  } catch (err) {
    setProfileStudioError(err.message || "Could not save");
  }
}
(function wireProfileStudio() {
  function bind() {
    const form = document.getElementById("profileStudioForm");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "1";
      form.addEventListener("submit", saveProfileStudio);
    }
    try { ensureCountrySelect(); } catch (_) {}
    try { refreshProfileCountryUI(); } catch (_) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 300);
  setTimeout(bind, 900);
})();



window.openLockModal = openLockModal;
window.closeLockModal = closeLockModal;

/* PIN length wiring */

/* PIN length toggle */
document.querySelectorAll(".pin-len-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    setPinLength(btn.dataset.pinLen);
    ["lockNewPin", "lockConfirmPin", "lockCurrentPin", "unlockPin"].forEach(id => {
      const el = $(id);
      if (el) { el.value = ""; syncPinDots(id); }
    });
    updatePinStrengthUI();
    showToast("PIN length: " + getPinLength() + " digits");
  });
});

/* Wallet buttons */
window.openWalletModal = openWalletModal;
window.closeWalletModal = closeWalletModal;
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest("#closeWalletModal");
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    closeWalletModal();
    return;
  }
  const back = document.getElementById("walletModalBackdrop");
  if (back && e.target === back) closeWalletModal();
}, true);

/* Photo pop on avatar click */
function openPhotoPop() {
  const pop = document.getElementById("photoPop");
  if (!pop) return;
  pop.hidden = false;
  pop.removeAttribute("hidden");
  try { refreshIcons(); } catch (_) {}
}
function closePhotoPop() {
  const pop = document.getElementById("photoPop");
  if (!pop) return;
  pop.hidden = true;
  pop.setAttribute("hidden", "");
}
document.addEventListener("click", (e) => {
  const av = e.target.closest && e.target.closest("#userAvatarLarge");
  const pop = document.getElementById("photoPop");
  if (av) {
    e.preventDefault();
    e.stopPropagation();
    if (pop && pop.hidden) openPhotoPop();
    else closePhotoPop();
    return;
  }
  if (pop && !pop.hidden && !(e.target.closest && e.target.closest("#photoPop"))) {
    closePhotoPop();
  }
}, true);
// after change/remove, close pop
(function () {
  const ch = document.getElementById("changePhotoBtn");
  const rm = document.getElementById("removePhotoBtn");
  if (ch) ch.addEventListener("click", () => setTimeout(closePhotoPop, 100));
  if (rm) rm.addEventListener("click", () => setTimeout(closePhotoPop, 100));
})();


/* FIXED_SETTINGS_CLOSED_ON_REFRESH */
function openSidebarSettings() {
  // Open full Settings page on main screen (animated cards)
  try { closeSidebarSettings(); } catch (_) {}
  if (typeof switchPage === "function") switchPage("settings");
  if (typeof isMobileNav === "function" && isMobileNav()) {
    try { closeSidebar(); } catch (_) {}
  }
  try { refreshIcons(); } catch (_) {}
  // Stagger card animation
  try {
    const grid = document.getElementById("settingsCardsGrid");
    if (grid) {
      grid.querySelectorAll(".settings-card-main").forEach((card, i) => {
        card.classList.remove("settings-card-in");
        void card.offsetWidth;
        card.style.animationDelay = (0.04 + i * 0.05) + "s";
        card.classList.add("settings-card-in");
      });
    }
  } catch (_) {}
}
function closeSidebarSettings() {
  const root = document.getElementById("sbSettings");
  const panel = document.getElementById("sbSettingsPanel");
  const btn = document.getElementById("sbSettingsToggle");
  if (!root || !panel) return;
  root.classList.remove("open");
  panel.hidden = true;
  panel.setAttribute("hidden", "");
  if (btn) btn.setAttribute("aria-expanded", "false");
  try { localStorage.setItem("hisabKitabSettingsOpenV1", "0"); } catch (_) {}
  try {
    panel.style.position = "";
    panel.style.top = "";
    panel.style.bottom = "";
    panel.style.left = "";
    panel.style.right = "";
    panel.style.width = "";
    panel.style.maxHeight = "";
    panel.style.zIndex = "";
  } catch (_) {}
}
window.openSidebarSettings = openSidebarSettings;
window.closeSidebarSettings = closeSidebarSettings;

(function initSidebarSettingsClosed() {
  const root = document.getElementById("sbSettings");
  const panel = document.getElementById("sbSettingsPanel");
  const btn = document.getElementById("sbSettingsToggle");
  if (!root || !panel) return;

  // Always start closed on refresh — theme/currency stay under Settings
  root.classList.remove("open");
  panel.hidden = true;
  panel.setAttribute("hidden", "");
  if (btn) btn.setAttribute("aria-expanded", "false");

  if (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.preventDefault();
      e.stopPropagation();
      openSidebarSettings();
    });
  }

  // Clicks inside panel must not close it
  panel.addEventListener("click", function (e) { e.stopPropagation(); });

  const themeSel = document.getElementById("themeSelect");
  if (themeSel) {
    try {
      const cur = (typeof getTheme === "function") ? getTheme() : "dark";
      if (THEMES.includes(cur)) themeSel.value = cur;
    } catch (_) {}
    themeSel.addEventListener("change", function () {
      if (typeof setTheme === "function" && THEMES.includes(themeSel.value)) setTheme(themeSel.value);
    });
  }

  const insight = document.getElementById("insightCard");
  if (insight) insight.classList.remove("collapsed");
})();


/* ===== Global keyboard shortcuts + clickable list ===== */
const PAGE_SHORTCUTS = {"1":"overview","2":"transactions","3":"reports","4":"budget","5":"goals","6":"debts","7":"bills","8":"tools"};
const NAV_ARROW_POS = {ArrowLeft:"left",ArrowRight:"right",ArrowUp:"top",ArrowDown:"bottom"};

function isTypingTarget(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return !!(el.closest && el.closest("input, textarea, select, [contenteditable='true']"));
}

function showShortcutPop(title, keys) {
  let el = document.getElementById("scPop");
  if (!el) {
    el = document.createElement("div");
    el.id = "scPop";
    el.className = "sc-pop";
    document.body.appendChild(el);
  }
  el.innerHTML = `<div>${title}</div>${keys ? `<small>${keys}</small>` : ""}`;
  el.classList.add("show");
  clearTimeout(showShortcutPop._t);
  showShortcutPop._t = setTimeout(() => el.classList.remove("show"), 1800);
}

function runShortcutAction(id) {
  const map = {
    overview: () => { switchPage("overview"); showShortcutPop("Overview", "Alt+1"); },
    transactions: () => { switchPage("transactions"); showShortcutPop("Transactions", "Alt+2"); },
    reports: () => { switchPage("reports"); showShortcutPop("Reports", "Alt+3"); },
    budget: () => { switchPage("budget"); showShortcutPop("Budget", "Alt+4"); },
    goals: () => { switchPage("goals"); showShortcutPop("Goals", "Alt+5"); },
    debts: () => { switchPage("debts"); showShortcutPop("Debts", "Alt+6"); },
    bills: () => { switchPage("bills"); showShortcutPop("Bills", "Alt+7"); },
    tools: () => { switchPage("tools"); showShortcutPop("Tools", "Alt+8"); },
    add: () => { openModal(null); showShortcutPop("Add transaction", "Alt+N"); },
    "nav-left": () => { setNavPos("left"); showShortcutPop("Nav: Left", "Alt+Shift+←"); },
    "nav-right": () => { setNavPos("right"); showShortcutPop("Nav: Right", "Alt+Shift+→"); },
    "nav-top": () => { setNavPos("top"); showShortcutPop("Nav: Top", "Alt+Shift+↑"); },
    "nav-bottom": () => { setNavPos("bottom"); showShortcutPop("Nav: Bottom", "Alt+Shift+↓"); },
    cmd: () => { openCommandPalette(); showShortcutPop("Command palette", "Ctrl+K"); },
    lock: () => {
      try {
        if (typeof isLockEnabled === "function" && !isLockEnabled()) {
          showShortcutPop("Set a PIN first", "Profile → App lock");
          try { openLockModal(); } catch (_) {}
          return;
        }
        try { setSessionUnlocked(false); } catch (_) {}
        try { showLockScreen(); } catch (_) {}
        showShortcutPop("Locked", "Ctrl+Shift+L");
      } catch (e) { console.error(e); }
    },
    help: () => { openShortcutsHelp(); showShortcutPop("Shortcuts help", "?"); },
    close: () => {
      try { closeModal(); } catch (_) {}
      try { closeShortcutsHelp(); } catch (_) {}
      try { closeSidebarSettings(); } catch (_) {}
      showShortcutPop("Closed", "Esc");
    }
  };
  const fn = map[id];
  if (fn) {
    try { fn(); } catch (e) { console.error(e); showShortcutPop("Error", id); }
  }
}

function openShortcutsHelp() {
  let b = document.getElementById("shortcutsHelpBackdrop");
  if (!b) {
    b = document.createElement("div");
    b.id = "shortcutsHelpBackdrop";
    b.className = "shortcuts-help-backdrop";
    b.innerHTML = `<div class="shortcuts-help-card" role="dialog" aria-label="Keyboard shortcuts">
      <div class="shortcuts-help-head">
        <h3>Keyboard shortcuts</h3>
        <button type="button" class="icon-btn shortcuts-help-x" id="shortcutsHelpX" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <div class="shortcuts-help-list">
        <button type="button" class="sb-shortcut-row" data-sc="overview"><span>Overview</span><kbd>Alt+1</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="transactions"><span>Transactions</span><kbd>Alt+2</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="reports"><span>Reports</span><kbd>Alt+3</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="budget"><span>Budget</span><kbd>Alt+4</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="goals"><span>Goals</span><kbd>Alt+5</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="debts"><span>Debts</span><kbd>Alt+6</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="bills"><span>Bills</span><kbd>Alt+7</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="tools"><span>Tools</span><kbd>Alt+8</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="add"><span>Add transaction</span><kbd>Alt+N</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="nav-left"><span>Nav Left</span><kbd>Alt+Shift+←</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="nav-right"><span>Nav Right</span><kbd>Alt+Shift+→</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="nav-top"><span>Nav Top</span><kbd>Alt+Shift+↑</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="nav-bottom"><span>Nav Bottom</span><kbd>Alt+Shift+↓</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="cmd"><span>Command palette</span><kbd>Ctrl+K</kbd></button>
        <button type="button" class="sb-shortcut-row" data-sc="lock"><span>Lock app</span><kbd>Ctrl+Shift+L</kbd></button>
      </div>
      <button type="button" class="shortcuts-help-close" id="shortcutsHelpClose">Got it</button>
    </div>`;
    document.body.appendChild(b);
    b.addEventListener("click", (e) => {
      if (e.target === b) closeShortcutsHelp();
      const row = e.target.closest && e.target.closest("[data-sc]");
      if (row) {
        e.preventDefault();
        runShortcutAction(row.getAttribute("data-sc"));
        closeShortcutsHelp();
      }
    });
    const closeBtn = document.getElementById("shortcutsHelpClose");
    if (closeBtn) closeBtn.addEventListener("click", closeShortcutsHelp);
    const xBtn = document.getElementById("shortcutsHelpX");
    if (xBtn) xBtn.addEventListener("click", closeShortcutsHelp);
  }
  // Force reflow then animate in
  b.classList.remove("open", "closing");
  void b.offsetWidth;
  b.classList.add("open");
  try { if (window.lucide) lucide.createIcons(); } catch (_) {}
}
function closeShortcutsHelp() {
  const b = document.getElementById("shortcutsHelpBackdrop");
  if (!b || !b.classList.contains("open")) return;
  b.classList.add("closing");
  b.classList.remove("open");
  setTimeout(() => {
    b.classList.remove("closing");
  }, 220);
}

document.addEventListener("keydown", (e) => {
  if (isTypingTarget(e.target)) return;
  try {
    const lock = document.getElementById("lockScreen");
    const auth = document.getElementById("authScreen");
    if (lock && !lock.hidden) return;
    if (auth && !auth.hidden && auth.style.display !== "none") return;
  } catch (_) {}
  const key = e.key;
  if (key === "?" || (key === "/" && e.shiftKey)) { e.preventDefault(); openShortcutsHelp(); return; }
  if (key === "Escape") closeShortcutsHelp();

  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "L" || key === "l")) {
    e.preventDefault(); e.stopPropagation();
    runShortcutAction("lock");
    return;
  }
  if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
    const pos = NAV_ARROW_POS[key];
    if (pos) {
      e.preventDefault();
      runShortcutAction("nav-" + pos);
      return;
    }
  }
  if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    const page = PAGE_SHORTCUTS[key];
    if (page) { e.preventDefault(); runShortcutAction(page); return; }
    if (key === "n" || key === "N") { e.preventDefault(); runShortcutAction("add"); }
  }
}, true);

(function wireShortcutsDropdown() {
  function bind() {
    const root = document.getElementById("sbShortcutsBox") || document.querySelector(".sb-shortcuts");
    const btn = document.getElementById("shortcutsToggle");
    const panel = document.getElementById("shortcutsPanel");
    if (!btn) return false;
    if (btn.dataset.bound === "1") return true;
    btn.dataset.bound = "1";
    // Keep inline panel closed — open animated popup instead
    if (panel) {
      panel.hidden = true;
      panel.setAttribute("hidden", "");
    }
    if (root) root.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openShortcutsHelp();
    });
    return true;
  }
  if (!bind()) {
    document.addEventListener("DOMContentLoaded", bind);
    setTimeout(bind, 500);
  }
})();

/* ===== Improvement pack: CSV import, recurring UI, backup reminder ===== */
(function improvementPack() {
  // Recurring checkbox toggles frequency select
  const recCb = document.getElementById("txRecurring");
  const recWrap = document.getElementById("txRecurringFreqWrap");
  if (recCb && recWrap) {
    recCb.addEventListener("change", () => {
      recWrap.hidden = !recCb.checked;
    });
  }

  // CSV Import
  function parseCsvLine(line) {
    const out = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur); cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out.map(s => s.trim());
  }

  function importCSVFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          showToast("CSV has no data rows");
          return;
        }
        const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
        const idx = (names) => {
          for (const n of names) {
            const i = header.indexOf(n);
            if (i >= 0) return i;
          }
          return -1;
        };
        const iDesc = idx(["description", "note", "title", "detail"]);
        const iType = idx(["type"]);
        const iCat = idx(["category"]);
        const iAcc = idx(["account"]);
        const iDate = idx(["date"]);
        const iAmt = idx(["amount"]);
        const iCur = idx(["currency"]);
        if (iAmt < 0 || iDate < 0) {
          showToast("CSV needs Amount and Date columns");
          return;
        }
        let added = 0;
        for (let r = 1; r < lines.length; r++) {
          const cols = parseCsvLine(lines[r]);
          if (!cols.length) continue;
          const amount = Number(String(cols[iAmt] || "").replace(/[^0-9.-]/g, ""));
          if (!Number.isFinite(amount) || amount <= 0) continue;
          let type = (iType >= 0 ? cols[iType] : "expense").toLowerCase();
          if (!["income", "expense", "remittance", "transfer"].includes(type)) type = "expense";
          const date = (iDate >= 0 ? cols[iDate] : "").slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
          const desc = (iDesc >= 0 ? cols[iDesc] : "") || (iCat >= 0 ? cols[iCat] : "Imported");
          const category = (iCat >= 0 ? cols[iCat] : "") || "Other";
          const account = (iAcc >= 0 ? cols[iAcc] : "") || "Cash";
          const currency = (iCur >= 0 ? cols[iCur] : "") || getBaseCurrency();
          transactions.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            description: String(desc).slice(0, 80),
            amount,
            type,
            category: String(category).slice(0, 40) || "Other",
            date,
            currency: CURRENCY_CODES.includes(currency) ? currency : getBaseCurrency(),
            account: String(account).slice(0, 30) || "Cash",
            tags: ["imported"],
            recurring: false,
            receipt: "",
            createdAt: Date.now()
          });
          added++;
        }
        if (added) {
          saveTransactions();
          try { refresh(); } catch (_) {}
          showToast(`Imported ${added} transactions`);
        } else {
          showToast("No valid rows found in CSV");
        }
      } catch (e) {
        console.error(e);
        showToast("Could not import CSV");
      }
    };
    reader.onerror = () => showToast("Could not read file");
    reader.readAsText(file);
  }

  const importBtn = document.getElementById("importCsvBtn");
  const importInput = document.getElementById("importCsvInput");
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", () => {
      const f = importInput.files && importInput.files[0];
      if (f) importCSVFile(f);
      importInput.value = "";
    });
  }

  // Auto backup reminder (every 7 days if data exists)
  function maybeBackupReminder() {
    try {
      if (!transactions || !transactions.length) return;
      const key = userScope("hisabKitabLastBackupNagV1");
      const last = Number(localStorage.getItem(key) || 0);
      const week = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - last < week) return;
      localStorage.setItem(key, String(Date.now()));
      setTimeout(() => {
        showToast("Reminder: Backup your data from Profile");
      }, 2500);
    } catch (_) {}
  }
  setTimeout(maybeBackupReminder, 4000);

  // Process recurring on load (already exists) + weekly/yearly support patch
  const _origProcess = typeof processRecurringTransactions === "function" ? processRecurringTransactions : null;
  if (_origProcess) {
    // extend: weekly templates
    const old = processRecurringTransactions;
    window.processRecurringTransactions = function() {
      old();
      try {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        let changed = false;
        transactions.filter(t => t.recurring && !t.recurringParent && t.recurringFreq === "weekly").forEach(t => {
          // create copy if last copy older than 7 days
          const copies = transactions.filter(x => x.recurringParent === t.id).sort((a, b) => b.date.localeCompare(a.date));
          const lastDate = copies[0] ? copies[0].date : t.date;
          const last = new Date(lastDate + "T00:00:00");
          const diffDays = Math.floor((now - last) / 86400000);
          if (diffDays < 7) return;
          const next = new Date(last);
          next.setDate(next.getDate() + 7);
          const nd = next.toISOString().slice(0, 10);
          if (nd > todayStr) return;
          if (transactions.some(x => x.recurringParent === t.id && x.date === nd)) return;
          transactions.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: nd,
            currency: txCurrency(t),
            account: t.account || "Cash",
            transferTo: t.transferTo || "",
            tags: Array.isArray(t.tags) ? t.tags.slice() : [],
            recurring: false,
            recurringParent: t.id,
            receipt: "",
            createdAt: Date.now()
          });
          changed = true;
        });
        if (changed) saveTransactions();
      } catch (e) { console.error(e); }
    };
  }
})();

/* ===== Bills module ===== */
const BILLS_KEY_BASE = "hisabKitabBillsV1";
function billsKey() { return userScope(BILLS_KEY_BASE); }
function loadBills() {
  try { return JSON.parse(localStorage.getItem(billsKey()) || "[]") || []; } catch { return []; }
}
function saveBills(list) { localStorage.setItem(billsKey(), JSON.stringify(list)); }

function openBillModal() {
  const b = $("billModalBackdrop");
  if (!b) return;
  const form = $("billForm");
  if (form) form.reset();
  const today = new Date();
  if ($("billDue")) $("billDue").value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  b.classList.add("open");
  b.style.display = "flex";
  try { refreshIcons(); } catch (_) {}
}
function closeBillModal() {
  const b = $("billModalBackdrop");
  if (!b) return;
  b.classList.remove("open");
  b.style.display = "none";
}

function renderBills() {
  const list = loadBills().slice().sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const box = $("billsList");
  const empty = $("billsEmpty");
  const today = new Date().toISOString().slice(0, 10);
  let dueSoon = 0, overdue = 0;
  list.forEach(b => {
    if (b.paid) return;
    if (b.due < today) overdue++;
    else if (b.due <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)) dueSoon++;
  });
  if ($("billsDueSoon")) $("billsDueSoon").textContent = String(dueSoon);
  if ($("billsOverdue")) $("billsOverdue").textContent = String(overdue);
  if (!box) return;
  box.innerHTML = list.map(b => {
    const status = b.paid ? "Paid" : (b.due < today ? "Overdue" : (b.due <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) ? "Due soon" : "Upcoming"));
    const cls = b.paid ? "paid" : (b.due < today ? "overdue" : (status === "Due soon" ? "soon" : ""));
    return `<article class="bill-card ${cls}" data-bill="${b.id}">
      <div class="bill-card-top">
        <div>
          <strong>${safe(b.name)}</strong>
          <span class="muted" style="display:block;font-size:11px">Due ${safe(b.due)} · ${safe(b.repeat || "once")}${b.note ? " · " + safe(b.note) : ""}</span>
        </div>
        <strong>${money(b.amount)}</strong>
      </div>
      <div class="bill-card-actions">
        <span class="bill-status ${cls}">${status}</span>
        <div>
          ${b.paid ? "" : `<button type="button" class="outline-btn bill-pay" data-bill-pay="${b.id}">Mark paid</button>`}
          <button type="button" class="icon-action" data-bill-del="${b.id}" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    </article>`;
  }).join("");
  if (empty) {
    empty.classList.toggle("show", list.length === 0);
    empty.style.display = list.length === 0 ? "flex" : "none";
  }
  try { refreshIcons(); } catch (_) {}
}

function renderToolsPage() {
  // Category budget inputs
  const box = $("catBudgetList");
  if (box) {
    const cats = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Education", "Rent", "Family", "Other"];
    const saved = (typeof loadCatBudgets === "function") ? loadCatBudgets() : {};
    box.innerHTML = cats.map(c => `
      <label class="cat-budget-item">
        <span>${safe(c)}</span>
        <input type="number" min="0" step="1" data-cat-budget="${safe(c)}" value="${saved[c] || ""}" placeholder="0">
      </label>`).join("");
  }
  // Pre-fill zakat with rough balance if empty
  try {
    const zw = $("zakatWealth");
    if (zw && !zw.value) {
      const t = totals();
      if (t.balance > 0) zw.placeholder = String(Math.round(t.balance));
    }
  } catch (_) {}
}

// Bill events
["addBillBtn", "addBillBtn2"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("click", openBillModal);
});
if ($("closeBillModal")) $("closeBillModal").addEventListener("click", closeBillModal);
if ($("cancelBillModal")) $("cancelBillModal").addEventListener("click", closeBillModal);
if ($("billModalBackdrop")) {
  $("billModalBackdrop").addEventListener("click", e => {
    if (e.target === $("billModalBackdrop")) closeBillModal();
  });
}
if ($("billForm")) {
  $("billForm").addEventListener("submit", e => {
    e.preventDefault();
    if (!currentUserId) { showToast("Please login first"); return; }
    const name = ($("billName") && $("billName").value || "").trim();
    const amount = Number($("billAmount") && $("billAmount").value);
    const due = $("billDue") && $("billDue").value;
    const repeat = ($("billRepeat") && $("billRepeat").value) || "monthly";
    const note = ($("billNote") && $("billNote").value || "").trim();
    if (!name || !due || !Number.isFinite(amount) || amount <= 0) {
      showToast("Fill name, amount and due date");
      return;
    }
    const list = loadBills();
    list.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, amount, due, repeat, note, paid: false, createdAt: Date.now()
    });
    saveBills(list);
    closeBillModal();
    renderBills();
    try { updateInsight(); } catch (_) {}
    showToast("Bill saved");
  });
}
document.addEventListener("click", e => {
  const pay = e.target.closest && e.target.closest("[data-bill-pay]");
  const del = e.target.closest && e.target.closest("[data-bill-del]");
  if (pay) {
    const id = pay.getAttribute("data-bill-pay");
    const bill = loadBills().find(b => b.id === id);
    const list = loadBills().map(b => b.id === id ? { ...b, paid: true, paidAt: Date.now() } : b);
    saveBills(list);
    if (bill && !bill.paid) {
      try {
        transactions.push({
          id: Date.now().toString(36)+Math.random().toString(36).slice(2,7),
          description: bill.name || "Bill payment", amount: Number(bill.amount)||0,
          type: "expense", category: "Bills", date: new Date().toISOString().slice(0,10),
          currency: getBaseCurrency(), account: "Cash", transferTo: "", tags: ["bill"],
          recurring: false, note: bill.note||"", createdAt: Date.now()
        });
        saveTransactions(); try{refresh();}catch(_){}
        showToast("Bill paid · expense added");
      } catch(_) { showToast("Marked as paid"); }
    } else showToast("Marked as paid");
    renderBills();
  }
  if (del) {
    if (!confirm("Delete this bill?")) return;
    saveBills(loadBills().filter(b => b.id !== del.getAttribute("data-bill-del")));
    renderBills();
    showToast("Bill deleted");
  }
});

// Escape closes bill modal
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    try { closeBillModal(); } catch (_) {}
  }
});

// Auto currency detect on first run (guest / new user)
(function autoCurrencyOnce() {
  try {
    const key = "hisabKitabAutoCurV1";
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const loc = (navigator.language || "").toLowerCase();
    let code = null;
    if (loc.includes("sa") || loc.includes("ar-sa")) code = "SAR";
    else if (loc.includes("ae")) code = "AED";
    else if (loc.includes("pk") || loc.includes("ur")) code = "PKR";
    else if (loc.includes("in") || loc.includes("hi")) code = "INR";
    else if (loc.includes("gb") || loc.includes("en-gb")) code = "GBP";
    if (code && typeof setBaseCurrency === "function") {
      // only if no base set yet
      const existing = localStorage.getItem(typeof baseCurrencyKey === "function" ? baseCurrencyKey() : "hisabKitabBaseCurrencyV1");
      if (!existing) {
        try { setBaseCurrency(code); } catch (_) {
          try { localStorage.setItem("hisabKitabBaseCurrencyV1", code); } catch (_) {}
        }
      }
    }
  } catch (_) {}
})();

/* ===== Micro-interactions: button ripple ===== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest(".primary-btn, .tx-btn-save");
  if (!btn) return;
  try {
    btn.classList.remove("ripple");
    void btn.offsetWidth;
    btn.classList.add("ripple");
    setTimeout(() => btn.classList.remove("ripple"), 560);
  } catch (_) {}
}, true);


/* Settings page action cards */
(function wireSettingsPageActions() {
  function bind() {
    const sc = document.getElementById("settingsShortcutsBtn");
    if (sc && !sc.dataset.bound) {
      sc.dataset.bound = "1";
      sc.addEventListener("click", () => {
        if (typeof openShortcutsHelp === "function") openShortcutsHelp();
      });
    }
    const acc = document.getElementById("settingsAccountBtn");
    if (acc && !acc.dataset.bound) {
      acc.dataset.bound = "1";
      acc.addEventListener("click", () => {
        if (typeof openAccountModal === "function") openAccountModal();
        else showToast("Login required");
      });
    }
    const lock = document.getElementById("settingsLockBtn");
    if (lock && !lock.dataset.bound) {
      lock.dataset.bound = "1";
      lock.addEventListener("click", () => {
        if (typeof openLockModal === "function") openLockModal();
        else if (window.openLockModal) window.openLockModal();
      });
    }
    const bak = document.getElementById("settingsBackupOpenBtn");
    if (bak && !bak.dataset.bound) {
      bak.dataset.bound = "1";
      bak.addEventListener("click", () => {
        if (typeof openBackupModal === "function") openBackupModal();
        else {
          const b = document.getElementById("backupModalBackdrop");
          if (b) { b.classList.add("open"); b.style.display = "flex"; }
        }
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 500);
})();


/* Profile hub page buttons */
(function wireProfileHub() {
  function bind() {
    const map = [
      ["hubBackupBtn", () => { if (typeof openBackupModal === "function") openBackupModal(); }],
      ["hubLockBtn", () => { if (typeof openLockModal === "function") openLockModal(); else if (typeof switchPage === "function") switchPage("settings"); }],
      ["hubBudgetBtn", () => { if (typeof switchPage === "function") switchPage("budget"); }],
      ["hubAccountBtn", () => { if (typeof openAccountModal === "function") openAccountModal(); else showToast("Login required"); }],
      ["hubSettingsBtn", () => { if (typeof switchPage === "function") switchPage("settings"); }],
      ["hubLogoutBtn", () => {
        if (confirm("Logout from Hisab Kitab?")) {
          if (typeof logoutUser === "function") logoutUser();
        }
      }],
    ];
    map.forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.bound) {
        el.dataset.bound = "1";
        el.addEventListener("click", fn);
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 400);
})();


/* ===== Animated custom dropdowns for all <select> ===== */
(function animatedSelects() {
  let openMenu = null;
  let openWrap = null;
  let enhancing = false;
  let scheduled = false;
  let ignoreCloseUntil = 0;

  function hideNative(select) {
    select.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;left:0;top:0;margin:0;padding:0;border:0;clip:rect(0,0,0,0);overflow:hidden";
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
  }

  function closeMenu(force) {
    // Outside-click uses ignoreCloseUntil so scroll/wheel inside menu don't close it.
    // Opening another dropdown always force-closes the previous one.
    if (!force && Date.now() < ignoreCloseUntil) return;
    if (openMenu) {
      openMenu.classList.remove("open", "drop-up");
      openMenu.style.visibility = "hidden";
      openMenu.style.pointerEvents = "none";
    }
    if (openWrap) {
      openWrap.classList.remove("open");
      const b = openWrap.querySelector(".select-anim-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    }
    // Safety: close any stray menus left open in the DOM
    document.querySelectorAll(".select-anim-menu.open").forEach((m) => {
      m.classList.remove("open", "drop-up");
      m.style.visibility = "hidden";
      m.style.pointerEvents = "none";
    });
    document.querySelectorAll(".select-anim-wrap.open").forEach((w) => {
      w.classList.remove("open");
      const b = w.querySelector(".select-anim-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    openMenu = null;
    openWrap = null;
  }

  function positionMenu(btn, menu) {
    const r = btn.getBoundingClientRect();
    const maxH = Math.min(280, window.innerHeight * 0.45);
    menu.style.maxHeight = maxH + "px";
    menu.style.minWidth = Math.max(r.width, 160) + "px";
    menu.style.width = Math.max(r.width, 160) + "px";
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    // Prefer opening downward; only flip up when there is no room below
    const dropUp = spaceBelow < 160 && spaceAbove > spaceBelow && spaceAbove > 120;
    menu.classList.toggle("drop-up", dropUp);
    if (dropUp) {
      menu.style.top = "auto";
      menu.style.bottom = Math.max(8, window.innerHeight - r.top + 6) + "px";
      menu.style.left = Math.max(8, r.left) + "px";
    } else {
      menu.style.bottom = "auto";
      menu.style.top = (r.bottom + 6) + "px";
      menu.style.left = Math.max(8, r.left) + "px";
    }
    requestAnimationFrame(() => {
      const mr = menu.getBoundingClientRect();
      if (mr.right > window.innerWidth - 8) {
        menu.style.left = Math.max(8, window.innerWidth - mr.width - 8) + "px";
      }
      if (mr.bottom > window.innerHeight - 4) {
        menu.style.top = Math.max(8, window.innerHeight - mr.height - 8) + "px";
        menu.style.bottom = "auto";
        menu.classList.remove("drop-up");
      }
    });
  }

  function enhance(select) {
    if (!select || select.tagName !== "SELECT") return;
    if (select.dataset.animSelect === "1") return;
    if (select.multiple || (select.size && Number(select.size) > 1)) return;
    if (!select.parentNode) return;
    // Skip hidden / custom / internal selects (category uses hk-select; descriptionSelect is internal)
    if (select.hidden || select.getAttribute("aria-hidden") === "true" || select.getAttribute("tabindex") === "-1") return;
    if (select.id === "category" || select.id === "descriptionSelect" || select.id === "editId" || select.id === "profCountry") return;
    if (select.closest && (select.closest(".hk-select") || select.closest("[hidden]"))) return;

    select.dataset.animSelect = "1";
    hideNative(select);

    const wrap = document.createElement("div");
    wrap.className = "select-anim-wrap";
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "select-anim-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    const label = document.createElement("span");
    label.className = "select-anim-label";
    const chev = document.createElement("i");
    chev.setAttribute("data-lucide", "chevron-down");
    chev.className = "select-anim-chevron";
    btn.appendChild(label);
    btn.appendChild(chev);
    wrap.appendChild(btn);

    const menu = document.createElement("div");
    menu.className = "select-anim-menu";
    menu.setAttribute("role", "listbox");
    // Allow scrollbar interaction without closing
    menu.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      ignoreCloseUntil = Date.now() + 400;
    });
    menu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    menu.addEventListener("wheel", (e) => {
      e.stopPropagation();
      ignoreCloseUntil = Date.now() + 400;
    }, { passive: true });
    menu.addEventListener("scroll", (e) => {
      e.stopPropagation();
      ignoreCloseUntil = Date.now() + 400;
    }, { passive: true });
    document.body.appendChild(menu);

    function syncLabel() {
      const opt = select.options[select.selectedIndex];
      label.textContent = opt ? String(opt.textContent || "").trim() : "Select";
    }

    function buildOptions() {
      menu.innerHTML = "";
      Array.from(select.options).forEach((opt, idx) => {
        if (opt.disabled) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "select-anim-option";
        b.setAttribute("role", "option");
        b.dataset.value = opt.value;
        b.textContent = String(opt.textContent || "").trim();
        if (opt.value === select.value) b.setAttribute("aria-selected", "true");
        b.style.animationDelay = (0.02 + idx * 0.022) + "s";
        b.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          ignoreCloseUntil = Date.now() + 300;
        });
        b.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          select.value = opt.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          syncLabel();
          closeMenu(true);
        });
        menu.appendChild(b);
      });
    }

    function open() {
      // Always force-close any other open dropdown first
      closeMenu(true);
      ignoreCloseUntil = 0;
      buildOptions();
      positionMenu(btn, menu);
      menu.style.visibility = "visible";
      menu.style.pointerEvents = "auto";
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      void menu.offsetWidth;
      menu.classList.add("open");
      openMenu = menu;
      openWrap = wrap;
      try { if (window.lucide) lucide.createIcons({ nodes: [chev] }); } catch (_) {}
    }

    btn.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      // Don't block closing other menus when switching dropdowns
      if (openWrap && openWrap !== wrap) ignoreCloseUntil = 0;
      else ignoreCloseUntil = Date.now() + 200;
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (openWrap === wrap && openMenu && openMenu.classList.contains("open")) closeMenu(true);
      else open();
    });

    select.addEventListener("change", syncLabel);
    syncLabel();
    try { if (window.lucide) lucide.createIcons({ nodes: [chev] }); } catch (_) {}
    wrap._selectAnim = { menu, btn, syncLabel, select };
  }

  function enhanceAll() {
    if (enhancing) return;
    enhancing = true;
    try {
      document.querySelectorAll("select").forEach((sel) => {
        try { enhance(sel); } catch (err) { console.warn("select enhance", err); }
      });
    } finally {
      enhancing = false;
    }
  }

  function scheduleEnhance() {
    if (scheduled || enhancing) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceAll();
    });
  }

  // Close only on outside pointerdown (not scroll/wheel inside menu)
  document.addEventListener("pointerdown", (e) => {
    if (Date.now() < ignoreCloseUntil) return;
    if (!openMenu) return;
    const t = e.target;
    if (openMenu.contains(t)) return;
    if (openWrap && openWrap.contains(t)) return;
    if (t && t.closest && (t.closest(".select-anim-menu") || t.closest(".select-anim-btn"))) return;
    closeMenu();
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu(true);
  });

  // Only close on window scroll, NOT when scrolling the menu itself
  window.addEventListener("scroll", (e) => {
    if (!openMenu) return;
    if (Date.now() < ignoreCloseUntil) return;
    const t = e.target;
    if (t === openMenu || (openMenu.contains && openMenu.contains(t))) return;
    // scroll on document/body/page
    if (t === document || t === document.documentElement || t === document.body) {
      closeMenu();
    }
  }, true);

  window.addEventListener("resize", () => { closeMenu(); });

  function boot() {
    try { enhanceAll(); } catch (_) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 500);

  try {
    const pageObs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          for (const n of m.addedNodes) {
            if (n.nodeType === 1 && (n.tagName === "SELECT" || (n.querySelector && n.querySelector("select")))) {
              scheduleEnhance();
              return;
            }
          }
        }
      }
    });
    pageObs.observe(document.body, { childList: true, subtree: true });
  } catch (_) {}

  window.enhanceAnimatedSelects = enhanceAll;
  window.closeAnimatedSelects = closeMenu;
})();

/* ===== Final boot safety: one quiet KPI paint (no multi-refresh jump) ===== */
(function finalBootRefresh() {
  let done = false;
  function run() {
    if (done) return;
    done = true;
    try {
      if (typeof currentUserId !== "undefined" && currentUserId) {
        if (typeof ensureCountrySelect === "function") ensureCountrySelect();
        if (typeof updateProfileUI === "function") updateProfileUI();
        // Paint without number count-up animation on boot
        if (typeof renderStats === "function") renderStats(false);
        if (typeof renderProDashboard === "function") renderProDashboard();
        if (typeof renderRecent === "function") renderRecent();
        if (typeof renderForecastCard === "function") renderForecastCard();
      }
    } catch (err) {
      console.warn("finalBootRefresh", err);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(run, 30));
  else setTimeout(run, 30);
})();

/* ===== 2026 features: privacy mode, compact money, forecast, profile status ===== */
const PRIVACY_KEY_BASE = "hisabKitabPrivacyV1";
const COMPACT_KEY_BASE = "hisabKitabCompactV1";
const FORECAST_KEY_BASE = "hisabKitabForecastV1";
const LAST_ACTIVE_KEY_BASE = "hisabKitabLastActiveV1";

function privacyKey() { return userScope(PRIVACY_KEY_BASE); }
function compactKey() { return userScope(COMPACT_KEY_BASE); }
function forecastKey() { return userScope(FORECAST_KEY_BASE); }
function lastActiveKey() { return userScope(LAST_ACTIVE_KEY_BASE); }

function getPrivacyMode() {
  try { return localStorage.getItem(privacyKey()) === "1"; } catch { return false; }
}
function setPrivacyMode(on) {
  try { localStorage.setItem(privacyKey(), on ? "1" : "0"); } catch (_) {}
  applyPrivacyMode(on);
}
function getCompactMoney() {
  try { return localStorage.getItem(compactKey()) === "1"; } catch { return false; }
}
function setCompactMoney(on) {
  try { localStorage.setItem(compactKey(), on ? "1" : "0"); } catch (_) {}
}
function getForecastEnabled() {
  try {
    const v = localStorage.getItem(forecastKey());
    if (v === null || v === undefined || v === "") return true;
    return v === "1";
  } catch { return true; }
}
function setForecastEnabled(on) {
  try { localStorage.setItem(forecastKey(), on ? "1" : "0"); } catch (_) {}
}
function touchLastActive() {
  try { localStorage.setItem(lastActiveKey(), String(Date.now())); } catch (_) {}
}
function getLastActiveLabel() {
  try {
    const t = Number(localStorage.getItem(lastActiveKey()) || 0);
    if (!t) return "Now";
    const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + " min ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  } catch { return "—"; }
}

function applyPrivacyMode(on) {
  const root = document.documentElement;
  if (on) root.setAttribute("data-privacy", "1");
  else root.removeAttribute("data-privacy");
  const btn = $("privacyToggleBtn");
  if (btn) {
    const icon = btn.querySelector("[data-lucide]") || btn.querySelector("i");
    if (icon) icon.setAttribute("data-lucide", on ? "eye-off" : "eye");
    btn.title = on ? "Show balances" : "Hide balances";
    try { if (window.lucide) lucide.createIcons({ nodes: [btn] }); } catch (_) {}
  }
}

// compact money helper used optionally by money()
const _moneyOriginal = typeof money === "function" ? money : null;
function moneyCompact(value, code) {
  const n = Number(value) || 0;
  if (!getCompactMoney() || Math.abs(n) < 1000) {
    return _moneyOriginal ? _moneyOriginal(n, code) : String(n);
  }
  const c = (typeof CURRENCY_CODES !== "undefined" && CURRENCY_CODES.includes(code)) ? code : (typeof getBaseCurrency === "function" ? getBaseCurrency() : "SAR");
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e6) s = (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  else s = (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return c + " " + s;
}

function computeMonthEndForecast() {
  try {
    const now = new Date();
    const key = monthKey(now);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const day = now.getDate();
    const mt = monthTotals(key);
    const overall = totals();
    const daysLeft = Math.max(0, daysInMonth - day);
    const burn = day > 0 ? (mt.expense / day) : 0;
    const incomePerDay = day > 0 ? (mt.income / day) : 0;
    const projectedExpense = mt.expense + burn * daysLeft;
    const projectedIncome = mt.income + incomePerDay * daysLeft;
    // project remaining month onto current all-time balance trajectory
    const projectedBalance = overall.balance + (projectedIncome - mt.income) - (projectedExpense - mt.expense);
    return {
      balance: projectedBalance,
      expense: projectedExpense,
      income: projectedIncome,
      daysLeft,
      burn
    };
  } catch {
    return { balance: 0, expense: 0, income: 0, daysLeft: 0, burn: 0 };
  }
}

function renderForecastCard() {
  const card = $("forecastCard");
  const val = $("forecastValue");
  const sub = $("forecastSub");
  if (!val) return;
  if (!getForecastEnabled()) {
    if (card) card.style.display = "none";
    return;
  }
  if (card) card.style.display = "";
  const f = computeMonthEndForecast();
  const fmt = getCompactMoney() ? moneyCompact : money;
  val.textContent = fmt(f.balance);
  if (sub) {
    sub.textContent = f.daysLeft
      ? ("~" + fmt(f.burn) + "/day · " + f.daysLeft + " days left")
      : "End of month";
  }
}

function fillProfileStatus() {
  try {
    try { if (typeof fillProfileViewMode === "function") fillProfileViewMode(); } catch (_) {}
    const u = getCurrentUser();
    const ms = $("profMemberSince");
    if (ms) {
      if (u && u.createdAt) {
        const d = new Date(u.createdAt);
        ms.textContent = d.toLocaleDateString("en", { month: "short", year: "numeric" });
      } else if (isGuestUser()) ms.textContent = "Guest";
      else ms.textContent = "—";
    }
    const tc = $("profTxCount");
    if (tc) tc.textContent = String((transactions || []).length);
    const ls = $("profLockStatus");
    if (ls) ls.textContent = (typeof isLockEnabled === "function" && isLockEnabled()) ? "On" : "Off";
    const la = $("profLastActive");
    if (la) la.textContent = getLastActiveLabel();
    const meta = $("profileHubMeta");
    if (meta) {
      meta.textContent = isGuestUser()
        ? "Guest workspace · data stays on this device"
        : "Private local account · data stays on this device";
    }
  } catch (_) {}
}

function syncProfilePrefsUI() {
  const p = $("profPrivacyMode");
  if (p) p.checked = getPrivacyMode();
  const c = $("profCompactMoney");
  if (c) c.checked = getCompactMoney();
  const f = $("profForecast");
  if (f) f.checked = getForecastEnabled();
}

function wireProfilePrefs() {
  const p = $("profPrivacyMode");
  if (p && !p.dataset.bound) {
    p.dataset.bound = "1";
    p.addEventListener("change", () => {
      setPrivacyMode(!!p.checked);
      showToast(p.checked ? "Privacy mode on" : "Privacy mode off");
    });
  }
  const c = $("profCompactMoney");
  if (c && !c.dataset.bound) {
    c.dataset.bound = "1";
    c.addEventListener("change", () => {
      setCompactMoney(!!c.checked);
      try { refresh(); } catch (_) {}
      showToast(c.checked ? "Compact numbers on" : "Full numbers");
    });
  }
  const f = $("profForecast");
  if (f && !f.dataset.bound) {
    f.dataset.bound = "1";
    f.addEventListener("change", () => {
      setForecastEnabled(!!f.checked);
      renderForecastCard();
      showToast(f.checked ? "Forecast on" : "Forecast off");
    });
  }
  const btn = $("privacyToggleBtn");
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const next = !getPrivacyMode();
      setPrivacyMode(next);
      const cb = $("profPrivacyMode");
      if (cb) cb.checked = next;
      showToast(next ? "Balances hidden" : "Balances visible");
    });
  }
}

// Hook into existing refresh / profile update
(function hook2026Features() {
  const _refresh = typeof refresh === "function" ? refresh : null;
  if (_refresh && !window.__hk2026Refresh) {
    window.__hk2026Refresh = true;
    window.refresh = function () {
      const r = _refresh.apply(this, arguments);
      try { renderForecastCard(); } catch (_) {}
      try { applyPrivacyMode(getPrivacyMode()); } catch (_) {}
      return r;
    };
  }
  const _upd = typeof updateProfileUI === "function" ? updateProfileUI : null;
  if (_upd && !window.__hk2026Prof) {
    window.__hk2026Prof = true;
    window.updateProfileUI = function () {
      const r = _upd.apply(this, arguments);
      try { syncProfilePrefsUI(); } catch (_) {}
      try { fillProfileStatus(); } catch (_) {}
      try { wireProfilePrefs(); } catch (_) {}
      return r;
    };
  }
  function boot() {
    try { touchLastActive(); } catch (_) {}
    try { applyPrivacyMode(getPrivacyMode()); } catch (_) {}
    try { wireProfilePrefs(); } catch (_) {}
    try { syncProfilePrefsUI(); } catch (_) {}
    try { fillProfileStatus(); } catch (_) {}
    try { renderForecastCard(); } catch (_) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 50));
  else setTimeout(boot, 50);
  setTimeout(boot, 600);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) try { touchLastActive(); fillProfileStatus(); } catch (_) {}
  });
})();

/* ===== Insights Lab — advanced 2026 modules ===== */
const ASSETS_KEY_BASE = "hisabKitabAssetsV1";
const SUBS_KEY_BASE = "hisabKitabSubsV1";
const RULES_KEY_BASE = "hisabKitabRulesV1";
const CHALLENGE_KEY_BASE = "hisabKitabChallengeV1";

function assetsKey() { return userScope(ASSETS_KEY_BASE); }
function subsKey() { return userScope(SUBS_KEY_BASE); }
function rulesKey() { return userScope(RULES_KEY_BASE); }
function challengeKey() { return userScope(CHALLENGE_KEY_BASE); }

function loadAssets() {
  try { const d = JSON.parse(localStorage.getItem(assetsKey()) || "[]"); return Array.isArray(d) ? d : []; }
  catch { return []; }
}
function saveAssets(list) { try { localStorage.setItem(assetsKey(), JSON.stringify(list || [])); } catch (_) {} }
function loadSubs() {
  try { const d = JSON.parse(localStorage.getItem(subsKey()) || "[]"); return Array.isArray(d) ? d : []; }
  catch { return []; }
}
function saveSubs(list) { try { localStorage.setItem(subsKey(), JSON.stringify(list || [])); } catch (_) {} }
function loadRules() {
  try { const d = JSON.parse(localStorage.getItem(rulesKey()) || "[]"); return Array.isArray(d) ? d : []; }
  catch { return []; }
}
function saveRules(list) { try { localStorage.setItem(rulesKey(), JSON.stringify(list || [])); } catch (_) {} }
function loadChallenge() {
  try { return JSON.parse(localStorage.getItem(challengeKey()) || "null"); } catch { return null; }
}
function saveChallenge(obj) {
  try {
    if (!obj) localStorage.removeItem(challengeKey());
    else localStorage.setItem(challengeKey(), JSON.stringify(obj));
  } catch (_) {}
}

function matchSmartRule(text) {
  const t = String(text || "").toLowerCase();
  if (!t) return null;
  const rules = loadRules();
  for (const r of rules) {
    if (r && r.keyword && t.includes(String(r.keyword).toLowerCase())) return r.category;
  }
  return null;
}

function monthlySubCost(sub) {
  const a = Number(sub.amount) || 0;
  if (sub.cycle === "yearly") return a / 12;
  if (sub.cycle === "weekly") return a * 4.33;
  return a;
}

function renderNetWorth() {
  const assets = loadAssets();
  const assetSum = assets.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  let debtSum = 0;
  try {
    (typeof loadDebts === "function" ? loadDebts() : []).forEach(d => {
      if (d && d.type === "borrow") debtSum += Number(d.amount) || 0;
    });
  } catch (_) {}
  const net = assetSum - debtSum;
  if ($("netWorthValue")) $("netWorthValue").textContent = money(net);
  if ($("netWorthAssets")) $("netWorthAssets").textContent = money(assetSum);
  if ($("netWorthDebts")) $("netWorthDebts").textContent = money(debtSum);
  const list = $("assetsList");
  if (list) {
    list.innerHTML = assets.length
      ? assets.map(a => `<div class="adv-list-row"><span>${safe(a.name)}</span><strong>${money(a.amount)}</strong>
          <button type="button" class="icon-action" data-del-asset="${safe(a.id)}" title="Delete"><i data-lucide="trash-2"></i></button></div>`).join("")
      : `<div class="empty-mini">Add gold, car, savings account…</div>`;
  }
}

function renderSubs() {
  const subs = loadSubs();
  const total = subs.reduce((s, x) => s + monthlySubCost(x), 0);
  if ($("subsTotal")) $("subsTotal").textContent = money(total) + "/mo";
  const list = $("subsList");
  if (list) {
    list.innerHTML = subs.length
      ? subs.map(s => `<div class="adv-list-row"><span>${safe(s.name)} · ${safe(s.cycle)}</span><strong>${money(s.amount)}</strong>
          <button type="button" class="icon-action" data-del-sub="${safe(s.id)}" title="Delete"><i data-lucide="trash-2"></i></button></div>`).join("")
      : `<div class="empty-mini">Track Netflix, Spotify, gym…</div>`;
  }
}

function renderRules() {
  const rules = loadRules();
  const list = $("rulesList");
  if (!list) return;
  list.innerHTML = rules.length
    ? rules.map(r => `<div class="adv-list-row"><span>"${safe(r.keyword)}" → ${safe(r.category)}</span>
        <button type="button" class="icon-action" data-del-rule="${safe(r.id)}" title="Delete"><i data-lucide="trash-2"></i></button></div>`).join("")
    : `<div class="empty-mini">e.g. uber → Transport</div>`;
}

function renderCalendar() {
  const box = $("cfCalendar");
  if (!box) return;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const firstDow = new Date(y, m, 1).getDay();
  const map = {};
  (transactions || []).forEach(t => {
    if (!t || !t.date || !t.date.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`)) return;
    const day = Number(String(t.date).slice(8, 10));
    if (!map[day]) map[day] = { inc: 0, exp: 0 };
    const a = amountInBase(t);
    if (isIncomeType(t)) map[day].inc += a;
    else if (t.type === "expense") map[day].exp += a;
  });
  let html = `<div class="cf-weekdays">${["S","M","T","W","T","F","S"].map(d => `<span>${d}</span>`).join("")}</div><div class="cf-days">`;
  for (let i = 0; i < firstDow; i++) html += `<span class="cf-day empty"></span>`;
  for (let d = 1; d <= days; d++) {
    const cell = map[d];
    let cls = "cf-day";
    if (cell) {
      if (cell.inc > cell.exp) cls += " has-inc";
      else if (cell.exp > 0) cls += " has-exp";
      else if (cell.inc > 0) cls += " has-inc";
    }
    if (d === now.getDate()) cls += " today";
    html += `<span class="${cls}" title="${cell ? money(cell.inc) + " in / " + money(cell.exp) + " out" : ""}">${d}</span>`;
  }
  html += `</div>`;
  box.innerHTML = html;
}

function renderChallenge() {
  const ch = loadChallenge();
  const fill = $("challengeFill");
  const text = $("challengeText");
  const btn = $("challengeCheckInBtn");
  if (!ch) {
    if (fill) fill.style.width = "0%";
    if (text) text.textContent = "No active challenge";
    if (btn) btn.hidden = true;
    return;
  }
  const pct = Math.min(100, ((ch.done || 0) / (ch.target || 1)) * 100);
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${ch.label}: ${ch.done || 0} / ${ch.target} days`;
  if (btn) btn.hidden = false;
}

function renderAnomalies() {
  const list = $("anomalyList");
  if (!list) return;
  const byCat = {};
  const now = new Date();
  const thisKey = monthKey(now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = monthKey(prev);
  (transactions || []).forEach(t => {
    if (!t || t.type !== "expense" || !t.date) return;
    const k = t.date.slice(0, 7);
    if (k !== thisKey && k !== prevKey) return;
    const cat = t.category || "Other";
    if (!byCat[cat]) byCat[cat] = { cur: 0, prev: 0 };
    const a = amountInBase(t);
    if (k === thisKey) byCat[cat].cur += a;
    else byCat[cat].prev += a;
  });
  const alerts = [];
  Object.entries(byCat).forEach(([cat, v]) => {
    if (v.prev > 0 && v.cur > v.prev * 1.4 && v.cur - v.prev > 50) {
      const pct = Math.round(((v.cur - v.prev) / v.prev) * 100);
      alerts.push({ cat, pct, cur: v.cur });
    } else if (v.prev === 0 && v.cur > 200) {
      alerts.push({ cat, pct: 100, cur: v.cur });
    }
  });
  alerts.sort((a, b) => b.cur - a.cur);
  list.innerHTML = alerts.length
    ? alerts.slice(0, 6).map(a => `<div class="adv-list-row"><span>${safe(a.cat)} · +${a.pct}% vs last month</span><strong>${money(a.cur)}</strong></div>`).join("")
    : `<div class="empty-mini">No unusual spikes detected this month.</div>`;
}

function renderInsightsPage() {
  try { renderNetWorth(); } catch (_) {}
  try { renderSubs(); } catch (_) {}
  try { renderRules(); } catch (_) {}
  try { renderCalendar(); } catch (_) {}
  try { renderChallenge(); } catch (_) {}
  try { renderAnomalies(); } catch (_) {}
  try { refreshIcons(); } catch (_) {}
}

function yearInReview() {
  const y = new Date().getFullYear();
  const list = (transactions || []).filter(t => t && t.date && t.date.startsWith(String(y)));
  const income = list.filter(t => isIncomeType(t)).reduce((s, t) => s + amountInBase(t), 0);
  const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + amountInBase(t), 0);
  const cats = {};
  list.filter(t => t.type === "expense").forEach(t => {
    cats[t.category || "Other"] = (cats[t.category || "Other"] || 0) + amountInBase(t);
  });
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const lines = [
    `Year ${y} in review`,
    `Transactions: ${list.length}`,
    `Income: ${money(income)}`,
    `Expenses: ${money(expense)}`,
    `Net: ${money(income - expense)}`,
    top.length ? "Top categories:" : "No expenses yet",
    ...top.map(([c, v], i) => `${i + 1}. ${c} — ${money(v)}`)
  ];
  alert(lines.join("\n"));
}

function printReport() {
  const t = totals();
  const subs = loadSubs();
  const subMo = subs.reduce((s, x) => s + monthlySubCost(x), 0);
  const assets = loadAssets();
  const assetSum = assets.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const html = `<!DOCTYPE html><html><head><title>Hisab Kitab Report</title>
    <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{margin:0 0 8px}table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.muted{color:#666}</style>
    </head><body>
    <h1>Hisab Kitab — Report</h1>
    <p class="muted">${new Date().toLocaleString()}</p>
    <p><strong>Balance:</strong> ${money(t.balance)} · <strong>Income:</strong> ${money(t.income)} · <strong>Expenses:</strong> ${money(t.expense)}</p>
    <p><strong>Assets:</strong> ${money(assetSum)} · <strong>Subscriptions / mo:</strong> ${money(subMo)}</p>
    <h3>Recent transactions</h3>
    <table><thead><tr><th>Date</th><th>Detail</th><th>Category</th><th>Amount</th></tr></thead><tbody>
    ${(transactions || []).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,40).map(x =>
      `<tr><td>${safe(x.date)}</td><td>${safe(x.description)}</td><td>${safe(x.category)}</td><td>${moneyTx(x)}</td></tr>`
    ).join("")}
    </tbody></table>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`;
  const w = window.open("", "_blank");
  if (!w) { showToast("Allow pop-ups to print"); return; }
  w.document.write(html);
  w.document.close();
}

(function wireInsightsLab() {
  function bind() {
    if ($("addAssetBtn") && !$("addAssetBtn").dataset.bound) {
      $("addAssetBtn").dataset.bound = "1";
      $("addAssetBtn").addEventListener("click", () => {
        const name = ($("assetName") && $("assetName").value || "").trim();
        const amount = Number($("assetAmount") && $("assetAmount").value);
        if (!name || !Number.isFinite(amount) || amount < 0) { showToast("Asset name & value required"); return; }
        const list = loadAssets();
        list.push({ id: Date.now().toString(36), name, amount });
        saveAssets(list);
        if ($("assetName")) $("assetName").value = "";
        if ($("assetAmount")) $("assetAmount").value = "";
        renderNetWorth();
        showToast("Asset added");
      });
    }
    if ($("addSubBtn") && !$("addSubBtn").dataset.bound) {
      $("addSubBtn").dataset.bound = "1";
      $("addSubBtn").addEventListener("click", () => {
        const name = ($("subName") && $("subName").value || "").trim();
        const amount = Number($("subAmount") && $("subAmount").value);
        const cycle = ($("subCycle") && $("subCycle").value) || "monthly";
        if (!name || !Number.isFinite(amount) || amount <= 0) { showToast("Subscription name & amount required"); return; }
        const list = loadSubs();
        list.push({ id: Date.now().toString(36), name, amount, cycle });
        saveSubs(list);
        if ($("subName")) $("subName").value = "";
        if ($("subAmount")) $("subAmount").value = "";
        renderSubs();
        showToast("Subscription added");
      });
    }
    if ($("addRuleBtn") && !$("addRuleBtn").dataset.bound) {
      $("addRuleBtn").dataset.bound = "1";
      $("addRuleBtn").addEventListener("click", () => {
        const keyword = ($("ruleKeyword") && $("ruleKeyword").value || "").trim();
        const category = ($("ruleCategory") && $("ruleCategory").value || "").trim();
        if (!keyword || !category) { showToast("Keyword & category required"); return; }
        const list = loadRules();
        list.push({ id: Date.now().toString(36), keyword, category });
        saveRules(list);
        if ($("ruleKeyword")) $("ruleKeyword").value = "";
        if ($("ruleCategory")) $("ruleCategory").value = "";
        renderRules();
        showToast("Rule saved");
      });
    }
    if ($("startChallengeBtn") && !$("startChallengeBtn").dataset.bound) {
      $("startChallengeBtn").dataset.bound = "1";
      $("startChallengeBtn").addEventListener("click", () => {
        const type = ($("challengeType") && $("challengeType").value) || "nospend";
        const target = Math.max(1, Math.min(90, Number($("challengeTarget") && $("challengeTarget").value) || 30));
        const labels = { nospend: "No-spend", save: "Daily save", coffee: "Skip delivery" };
        saveChallenge({ type, target, done: 0, label: labels[type] || type, last: "" });
        renderChallenge();
        showToast("Challenge started");
      });
    }
    if ($("challengeCheckInBtn") && !$("challengeCheckInBtn").dataset.bound) {
      $("challengeCheckInBtn").dataset.bound = "1";
      $("challengeCheckInBtn").addEventListener("click", () => {
        const ch = loadChallenge();
        if (!ch) return;
        const today = new Date().toISOString().slice(0, 10);
        if (ch.last === today) { showToast("Already checked in today"); return; }
        ch.done = (ch.done || 0) + 1;
        ch.last = today;
        saveChallenge(ch);
        renderChallenge();
        showToast(ch.done >= ch.target ? "Challenge complete!" : "Checked in");
      });
    }
    if ($("runWhatIfBtn") && !$("runWhatIfBtn").dataset.bound) {
      $("runWhatIfBtn").dataset.bound = "1";
      $("runWhatIfBtn").addEventListener("click", () => {
        const delta = Number($("whatIfAmount") && $("whatIfAmount").value);
        const label = ($("whatIfLabel") && $("whatIfLabel").value || "Change").trim();
        if (!Number.isFinite(delta)) { showToast("Enter a number"); return; }
        const mt = monthTotals(monthKey());
        const projected = mt.income - mt.expense - delta;
        const el = $("whatIfResult");
        if (el) {
          el.innerHTML = `<strong>${safe(label)}</strong> of <strong>${money(delta)}</strong>/mo → month net becomes <strong>${money(projected)}</strong> (was ${money(mt.income - mt.expense)}).`;
        }
      });
    }
    if ($("yearReviewBtn") && !$("yearReviewBtn").dataset.bound) {
      $("yearReviewBtn").dataset.bound = "1";
      $("yearReviewBtn").addEventListener("click", yearInReview);
    }
    if ($("printReportBtn") && !$("printReportBtn").dataset.bound) {
      $("printReportBtn").dataset.bound = "1";
      $("printReportBtn").addEventListener("click", printReport);
    }
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("[data-del-asset]");
      const s = e.target.closest && e.target.closest("[data-del-sub]");
      const r = e.target.closest && e.target.closest("[data-del-rule]");
      if (a) {
        saveAssets(loadAssets().filter(x => x.id !== a.getAttribute("data-del-asset")));
        renderNetWorth();
      }
      if (s) {
        saveSubs(loadSubs().filter(x => x.id !== s.getAttribute("data-del-sub")));
        renderSubs();
      }
      if (r) {
        saveRules(loadRules().filter(x => x.id !== r.getAttribute("data-del-rule")));
        renderRules();
      }
    });
    // Voice note
    if ($("voiceNoteBtn") && !$("voiceNoteBtn").dataset.bound) {
      $("voiceNoteBtn").dataset.bound = "1";
      $("voiceNoteBtn").addEventListener("click", () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { showToast("Voice not supported in this browser"); return; }
        try {
          const rec = new SR();
          rec.lang = "en-US";
          rec.onresult = (ev) => {
            const text = ev.results[0][0].transcript;
            if ($("txNote")) $("txNote").value = text;
            showToast("Voice captured");
          };
          rec.onerror = () => showToast("Voice failed");
          rec.start();
          showToast("Listening…");
        } catch (_) { showToast("Voice failed"); }
      });
    }
    // Receipt file → data URL
    if ($("txReceipt") && !$("txReceipt").dataset.bound) {
      $("txReceipt").dataset.bound = "1";
      $("txReceipt").addEventListener("change", () => {
        const f = $("txReceipt").files && $("txReceipt").files[0];
        if (!f) return;
        if (f.size > 900000) { showToast("Image too large (max ~900KB)"); return; }
        const reader = new FileReader();
        reader.onload = () => { $("txReceipt").dataset.dataUrl = reader.result; showToast("Receipt attached"); };
        reader.readAsDataURL(f);
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 400);
})();

/* ===== Profile view / edit mode ===== */
function setProfileEditMode(on) {
  const view = $("profileViewMode");
  const form = $("profileStudioForm");
  const editBtn = $("profileEditBtn");
  if (view) view.hidden = !!on;
  if (form) form.hidden = !on;
  if (editBtn) editBtn.hidden = !!on;
  if (on) {
    try {
      if (typeof updateProfileUI === "function") updateProfileUI();
      if (typeof syncProfilePrefsUI === "function") syncProfilePrefsUI();
      if (typeof ensureCountrySelect === "function") ensureCountrySelect();
      if (typeof refreshProfileCountryUI === "function") refreshProfileCountryUI();
    } catch (_) {}
    ["profCurrentPass", "profNewPass", "profNewPass2"].forEach(id => {
      const el = $(id); if (el) el.value = "";
    });
    const err = $("profileStudioError");
    if (err) { err.hidden = true; err.textContent = ""; }
  } else {
    try { fillProfileViewMode(); } catch (_) {}
  }
  try { refreshIcons(); } catch (_) {}
}

function fillProfileViewMode() {
  try {
    const u = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const guest = typeof isGuestUser === "function" && isGuestUser();
    let name = "—", email = "—", mobile = "—", plan = "Local";
    if (guest) {
      name = "Guest"; email = "Local guest workspace"; mobile = "—"; plan = "Guest";
    } else if (u) {
      name = u.name || "User";
      email = u.email || "—";
      mobile = (u.mobile && String(u.mobile).trim()) || "—";
      plan = u.provider === "google" ? "Google · Local" : "Premium · Local";
    }
    if ($("viewProfName")) $("viewProfName").textContent = name;
    if ($("viewProfEmail")) $("viewProfEmail").textContent = email;
    if ($("viewProfMobile")) $("viewProfMobile").textContent = mobile;
    if ($("viewProfPlan")) $("viewProfPlan").textContent = plan;
    if ($("viewProfLock")) {
      $("viewProfLock").textContent = (typeof isLockEnabled === "function" && isLockEnabled()) ? "On" : "Off";
    }
    const onOff = (v) => (v ? "On" : "Off");
    if ($("viewPrivacy")) $("viewPrivacy").textContent = onOff(typeof getPrivacyMode === "function" && getPrivacyMode());
    if ($("viewCompact")) $("viewCompact").textContent = onOff(typeof getCompactMoney === "function" && getCompactMoney());
    if ($("viewForecast")) $("viewForecast").textContent = onOff(typeof getForecastEnabled === "function" ? getForecastEnabled() : true);
  } catch (err) {
    console.warn("fillProfileViewMode", err);
  }
}

(function wireProfileViewEdit() {
  function bind() {
    const editBtn = $("profileEditBtn");
    if (editBtn && !editBtn.dataset.bound) {
      editBtn.dataset.bound = "1";
      editBtn.addEventListener("click", () => {
        if (typeof isGuestUser === "function" && isGuestUser()) {
          showToast("Guest mode — create an account to edit profile");
          return;
        }
        setProfileEditMode(true);
      });
    }
    ["profileCancelEditBtn2"].forEach(id => {
      const el = $(id);
      if (el && !el.dataset.bound) {
        el.dataset.bound = "1";
        el.addEventListener("click", () => setProfileEditMode(false));
      }
    });
    // After successful save, return to view mode
    const form = $("profileStudioForm");
    if (form && !form.dataset.viewHook) {
      form.dataset.viewHook = "1";
      form.addEventListener("submit", () => {
        // saveProfileStudio handles save; delay switch to view
        setTimeout(() => {
          const err = $("profileStudioError");
          if (err && !err.hidden && err.textContent) return; // stay in edit if error
          setProfileEditMode(false);
          fillProfileViewMode();
          if (typeof fillProfileStatus === "function") fillProfileStatus();
        }, 80);
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
  setTimeout(bind, 300);
  setTimeout(() => { try { fillProfileViewMode(); setProfileEditMode(false); } catch (_) {} }, 500);
})();


/* ===== MEGA PRO PACK ===== */
(function megaProPack() {
  const DENSITY_KEY = "hisabKitabDensityV1";
  const DENSITIES = ['ultra-spacious', 'spacious', 'relaxed', 'large', 'cozy', 'comfortable', 'balanced', 'snug', 'compact', 'dense', 'tight', 'extra-compact', 'compressed', 'ultra', 'extreme'];
  const LABELS = {'ultra-spacious': 'Ultra spacious', 'spacious': 'Spacious', 'relaxed': 'Relaxed', 'large': 'Large', 'cozy': 'Cozy', 'comfortable': 'Comfortable', 'balanced': 'Balanced', 'snug': 'Snug', 'compact': 'Compact', 'dense': 'Dense', 'tight': 'Tight', 'extra-compact': 'Extra compact', 'compressed': 'Compressed', 'ultra': 'Ultra dense', 'extreme': 'Extreme'};
  const BACKUP_STAMP = "hisabKitabLastBackupV1";
  const WALLETS_KEY = "hisabKitabWalletsV1";
  const DEFAULT_WALLETS = ["Cash", "Bank", "Card", "JazzCash", "EasyPaisa", "SadaPay", "NayaPay"];

  function getDensity() {
    try { const v = localStorage.getItem(DENSITY_KEY); return DENSITIES.includes(v) ? v : "comfortable"; }
    catch { return "comfortable"; }
  }
  function applyDensity(mode) {
    if (!DENSITIES.includes(mode)) mode = "comfortable";
    document.documentElement.setAttribute("data-density", mode);
    try { localStorage.setItem(DENSITY_KEY, mode); } catch (_) {}
    const sel = document.getElementById("densitySelect");
    if (sel && sel.value !== mode) sel.value = mode;
    document.querySelectorAll(".density-chip,#densityChips,.settings-density-row").forEach(el => el.remove());
  }
  window.applyDensity = applyDensity;
  window.getDensity = getDensity;

  function loadWallets() {
    try {
      const raw = localStorage.getItem(typeof userScope === "function" ? userScope(WALLETS_KEY) : WALLETS_KEY);
      const list = raw ? JSON.parse(raw) : null;
      if (Array.isArray(list) && list.length) return list;
    } catch (_) {}
    return DEFAULT_WALLETS.slice();
  }
  function saveWallets(list) {
    try { localStorage.setItem(typeof userScope === "function" ? userScope(WALLETS_KEY) : WALLETS_KEY, JSON.stringify(list)); } catch (_) {}
  }
  window.loadWallets = loadWallets;
  window.saveWallets = saveWallets;

  function monthSummaryText() {
    const key = typeof monthKey === "function" ? monthKey() : new Date().toISOString().slice(0,7);
    const mt = typeof monthTotals === "function" ? monthTotals(key) : { income:0, expense:0 };
    const net = (mt.income||0) - (mt.expense||0);
    const count = (transactions||[]).filter(t => t && t.date && t.date.startsWith(key)).length;
    return ["Hisab Kitab — Month summary", "Period: "+key,
      "Income: "+money(mt.income), "Expenses: "+money(mt.expense),
      "Net: "+money(net), "Transactions: "+count].join("\n");
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast("Summary copied")).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta);
    ta.select(); try { document.execCommand("copy"); showToast("Summary copied"); } catch(_){ showToast("Copy failed"); }
    ta.remove();
  }
  function shareMonthSummary() {
    const text = monthSummaryText();
    if (navigator.share) navigator.share({ title: "Hisab Kitab", text }).catch(() => copyText(text));
    else copyText(text);
  }
  window.shareMonthSummary = shareMonthSummary;

  function printMonthlyReport() {
    const key = typeof monthKey === "function" ? monthKey() : new Date().toISOString().slice(0,7);
    const list = (transactions||[]).filter(t => t && t.date && t.date.startsWith(key))
      .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const mt = typeof monthTotals === "function" ? monthTotals(key) : totals();
    const rows = list.slice(0,80).map(t =>
      `<tr><td>${safe(t.date)}</td><td>${safe(t.description)}</td><td>${safe(t.category)}</td><td>${moneyTx(t)}</td></tr>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><title>Hisab Kitab ${key}</title>
      <style>body{font-family:system-ui,sans-serif;padding:28px;color:#111}h1{margin:0 0 6px}
      table{border-collapse:collapse;width:100%;margin-top:14px}td,th{border-bottom:1px solid #ddd;padding:7px;text-align:left;font-size:12px}
      .muted{color:#666}</style></head><body>
      <h1>Hisab Kitab — ${key}</h1>
      <p class="muted">${new Date().toLocaleString()}</p>
      <p><strong>Income:</strong> ${money(mt.income)} · <strong>Expenses:</strong> ${money(mt.expense)} ·
      <strong>Net:</strong> ${money((mt.income||0)-(mt.expense||0))}</p>
      <table><thead><tr><th>Date</th><th>Detail</th><th>Category</th><th>Amount</th></tr></thead>
      <tbody>${rows||"<tr><td colspan=4>No transactions</td></tr>"}</tbody></table>
      <script>window.onload=()=>window.print()<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { showToast("Allow pop-ups to print"); return; }
    w.document.write(html); w.document.close();
  }
  window.printMonthlyReport = printMonthlyReport;

  function markBackupDone() {
    try { localStorage.setItem(typeof userScope==="function"?userScope(BACKUP_STAMP):BACKUP_STAMP, String(Date.now())); } catch(_){}
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest("#exportBackupBtn,#settingsBackupBtn,#profileBackupBtn")) {
      setTimeout(markBackupDone, 300);
    }
  });

  const TEMPLATES = [
    { label: "Salary", type: "income", category: "Salary", description: "Salary" },
    { label: "Rent", type: "expense", category: "Rent", description: "Rent" },
    { label: "Grocery", type: "expense", category: "Food", description: "Grocery" },
    { label: "Fuel", type: "expense", category: "Transport", description: "Fuel / Petrol" },
    { label: "Bills", type: "expense", category: "Bills", description: "Utility bill" },
    { label: "Freelance", type: "income", category: "Freelance", description: "Freelance income" },
  ];

  function applyTemplate(tpl) {
    try {
      if (typeof openModal === "function") openModal(null);
      setTimeout(() => {
        const typeEl = document.getElementById("type");
        if (typeEl) { typeEl.value = tpl.type; typeEl.dispatchEvent(new Event("change", { bubbles: true })); }
        const cat = document.getElementById("category");
        if (cat) cat.value = tpl.category;
        const desc = document.getElementById("description") || document.getElementById("txDesc");
        if (desc) desc.value = tpl.description;
        showToast("Template: " + tpl.label);
      }, 80);
    } catch (e) { console.warn(e); }
  }

  function injectUI() {
    // Quick templates on transactions page
    const txPage = document.getElementById("transactionsPage");
    if (txPage && !document.getElementById("quickTemplatesBar")) {
      const intro = txPage.querySelector(".section-intro");
      const bar = document.createElement("div");
      bar.id = "quickTemplatesBar";
      bar.className = "quick-templates";
      bar.innerHTML = TEMPLATES.map((t,i) =>
        `<button type="button" class="tpl-chip" data-tpl="${i}">${t.label}</button>`
      ).join("");
      if (intro && intro.parentNode) intro.parentNode.insertBefore(bar, intro.nextSibling);
      else txPage.insertBefore(bar, txPage.firstChild);
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-tpl]");
        if (!btn) return;
        applyTemplate(TEMPLATES[Number(btn.dataset.tpl)]);
      });
    }
    // Reports share / pdf buttons
    const reports = document.getElementById("reportsPage");
    if (reports && !document.getElementById("shareSummaryBtn")) {
      const intro = reports.querySelector(".section-intro");
      if (intro) {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:8px";
        wrap.innerHTML = `<button type="button" class="outline-btn" id="shareSummaryBtn"><i data-lucide="share-2"></i> Share month</button>
          <button type="button" class="outline-btn" id="printMonthBtn"><i data-lucide="printer"></i> Print / PDF</button>`;
        intro.appendChild(wrap);
        document.getElementById("shareSummaryBtn").addEventListener("click", shareMonthSummary);
        document.getElementById("printMonthBtn").addEventListener("click", printMonthlyReport);
      }
    }
    // Wallet: ensure JazzCash etc appear — patch account select if present
    const acc = document.getElementById("account") || document.getElementById("txAccount");
    if (acc && acc.tagName === "SELECT") {
      const have = new Set([...acc.options].map(o => o.value));
      loadWallets().forEach(w => {
        if (have.has(w)) return;
        const o = document.createElement("option"); o.value = w; o.textContent = w; acc.appendChild(o);
      });
    }
  }

  function wireDensity() {
    const sel = document.getElementById("densitySelect");
    if (!sel) return;
    if (!sel.dataset.bound) {
      sel.dataset.bound = "1";
      sel.addEventListener("change", () => {
        applyDensity(sel.value);
        showToast((LABELS[sel.value] || sel.value) + " density");
      });
    }
    const cur = getDensity();
    if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
    applyDensity(cur);
  }
  function wireFab() {
    const fab = document.getElementById("fabAddBtn");
    if (!fab || fab.dataset.bound) return;
    fab.dataset.bound = "1";
    fab.addEventListener("click", () => {
      try { if (typeof openModal === "function") openModal(); else document.getElementById("addTopBtn")?.click(); }
      catch(e){ console.warn(e); }
    });
  }
  function ensureThemes() {
    const sel = document.getElementById("themeSelect");
    if (!sel || typeof THEMES === "undefined") return;
    const have = new Set([...sel.options].map(o => o.value));
    THEMES.forEach(t => {
      if (have.has(t)) return;
      const o = document.createElement("option"); o.value = t; o.textContent = (THEME_NAMES&&THEME_NAMES[t])||t; sel.appendChild(o);
    });
  }

  let _megaBootDone = false;
  function boot() {
    if (_megaBootDone) return;
    _megaBootDone = true;
    ensureThemes(); wireDensity(); wireFab(); injectUI();
    try { if (typeof refreshIcons === "function") refreshIcons(); } catch(_){}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  // single delayed pass only if DOM was incomplete on first run
  setTimeout(() => {
    if (!_megaBootDone) boot();
    else {
      // safe no-op re-wire for late elements (does not re-animate or re-icon)
      try { wireDensity(); wireFab(); injectUI(); } catch(_){}
    }
  }, 600);
})();


/* ===== Motion pack XL — 8 modes + rich effects ===== */
(function motionPackXL() {
  const MOTION_KEY = "hisabKitabMotionV1";
  const MODES = ["off","subtle","premium","bold","cinematic","playful","neon","minimal"];
  const LABELS = {
    off:"Off", subtle:"Subtle", premium:"Premium", bold:"Bold",
    cinematic:"Cinematic", playful:"Playful", neon:"Neon", minimal:"Minimal"
  };

  function getMotion() {
    try {
      const v = localStorage.getItem(MOTION_KEY);
      return MODES.includes(v) ? v : "premium";
    } catch { return "premium"; }
  }

  function applyMotion(mode) {
    if (!MODES.includes(mode)) mode = "premium";
    document.documentElement.setAttribute("data-motion", mode);
    try { localStorage.setItem(MOTION_KEY, mode); } catch (_) {}
    const sel = document.getElementById("motionSelect");
    if (sel && sel.value !== mode) sel.value = mode;
  }
  window.applyMotion = applyMotion;
  window.getMotion = getMotion;

  let _enterDone = false;
  let _rippleBound = false;
  let _wireDone = false;

  function pulseCards(force) {
    // Enter animations disabled on load to prevent refresh jump.
    // Only allow when user explicitly changes motion mode.
    if (!force) return;
    const mode = getMotion();
    if (mode === "off") return;
    document.querySelectorAll(".stat-card,.panel,.kpi-mini,.bill-card,.prem-stat").forEach((el, i) => {
      el.classList.remove("motion-in");
      void el.offsetWidth;
      const step = mode === "bold" || mode === "playful" ? 50 : 36;
      el.style.setProperty("--stagger", (i % 10) * step + "ms");
      el.classList.add("motion-in", "motion-play");
      el.addEventListener("animationend", () => {
        el.classList.remove("motion-in", "motion-play");
      }, { once: true });
    });
  }
  window.pulseCards = pulseCards;

  function attachRipple(root) {
    if (_rippleBound) return;
    _rippleBound = true;
    root.addEventListener("click", (e) => {
      if (getMotion() === "off" || getMotion() === "minimal") return;
      const btn = e.target.closest && e.target.closest(".primary-btn,.fab-add,.outline-btn,.nav-link");
      if (!btn) return;
      const r = document.createElement("span");
      r.className = "hk-ripple";
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + "px";
      r.style.left = (e.clientX - rect.left - size / 2) + "px";
      r.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.classList.add("hk-ripple-host");
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, true);
  }

  const _show = window.showToast;
  if (typeof showToast === "function" && !window.__hkToastMotionWrapped) {
    window.__hkToastMotionWrapped = true;
    window.showToast = function(msg, opts) {
      const res = _show.apply(this, arguments);
      if (getMotion() !== "off") {
        document.documentElement.classList.add("hk-success-flash");
        setTimeout(() => document.documentElement.classList.remove("hk-success-flash"), 500);
      }
      return res;
    };
  }

  function wire() {
    if (_wireDone) return;
    _wireDone = true;
    const sel = document.getElementById("motionSelect");
    if (sel && !sel.dataset.bound) {
      sel.dataset.bound = "1";
      sel.addEventListener("change", () => {
        applyMotion(sel.value);
        // Mode change: allow one replay
        document.querySelectorAll("[data-motion-played]").forEach(el => { delete el.dataset.motionPlayed; });
        _enterDone = false;
        if (typeof showToast === "function") showToast((LABELS[sel.value] || sel.value) + " motion");
        setTimeout(() => pulseCards(true), 40);
      });
    }
    applyMotion(getMotion());
    attachRipple(document);
    // NO enter animation on load/refresh — was causing cards to jump 3–4 times
    // pulseCards only runs when user changes motion mode (force=true)
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
