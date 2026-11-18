# 💰 Hisab Kitab Premium

A modern, offline-first, privacy-focused personal finance and ledgerProgressive Web App (PWA) designed to track income, expenses, budgets, savings goals, debts, and bills—all stored securely on your local device with zero cloud dependency.

---

## ✨ Key Features

### 📊 Dashboard & Analytics
- **Executive Overview:** Track Total Balance, Income, Expenses, Savings Rate, Burn Rate, and Month-End Balance Forecasts across custom periods (`Day`, `Week`, `Month`, `Year`, `All`).
- **Interactive Charts:** Visual cash-flow comparisons (6-month bar & line trends) and category expense breakdowns (doughnut charts powered by Chart.js).
- **Financial Health Score & Streaks:** Automated scoring based on spending habits, budget adherence, and daily logging streaks.
- **Smart Insights & Anomaly Watch:** Automatic detection of unusual spending spikes compared to previous months, plus a **What-If Simulator** to project monthly balance changes.

### 💳 Comprehensive Transaction Management
- **Multi-Type Entries:** Record **Income**, **Expenses**, **Remittances**, and **Account Transfers** (e.g., Cash, Bank, Card, JazzCash, EasyPaisa, SadaPay, NayaPay).
- **Multi-Currency Support:** Log transactions in **SAR**, **AED**, **PKR**, **INR**, and **GBP** with automatic conversion to your selected base currency.
- **Smart Rules & Automation:** Auto-categorize transactions using custom keyword rules, schedule recurring entries (Weekly, Monthly, Yearly), attach receipt images, use voice notes, or log quickly via one-click templates.
- **Privacy & Compact Modes:** Blur sensitive balances on screen with a single click (`Eye` toggle) or format large figures cleanly (e.g., `1.2k`).

### 🎯 Planning, Debts & Tools
- **Monthly & Category Budgets:** Set an overall monthly spending cap with daily safe-to-spend calculations, alongside individual category limits.
- **Savings Goals & Challenges:** Track progress toward targets (e.g., emergency fund, travel) and participate in 30-day no-spend or savings streaks.
- **Debts & Loans Ledger:** Keep track of money lent (`To receive`) and borrowed (`To pay`) with due dates and one-click settlement.
- **Bills & Reminders:** Monitor upcoming and overdue recurring bills; marking a bill as paid automatically logs it as an expense.
- **Net Worth & Subscriptions:** Track assets vs. liabilities and calculate total monthly recurring subscription costs.
- **Zakat Calculator:** Built-in `2.5%` Zakat estimator based on eligible wealth.

### 🔒 Security, Privacy & Data Portability
- **100% Local & Offline-Ready:** Built as an installable PWA (`manifest.webmanifest` + Service Worker) using `localStorage`—your financial data never leaves your device unless you export it.
- **Vault PIN Lock:** Protect your workspace with a customizable **4-digit or 6-digit PIN**, auto-lock inactivity timers, tab-switch locking, and failed-attempt cooldowns.
- **Multi-Account & Guest Mode:** Supports multiple isolated local user profiles on one device, optional Google Sign-In linking, and instant Guest access.
- **Backup, Restore & Export:** Export/import full workspace backups as `.json` (with one-click Gmail compose integration), import/export `.csv` spreadsheets, and generate printable/PDF monthly reports.

### 🎨 Customization & Accessibility
- **50+ Built-in Themes:** Includes Dark, Light, OLED Black, Ramadan Gold, Aurora, Midnight, Emerald, Sunset, and dozens more.
- **Adaptive Layout:** Switch navigation bar placement (**Left**, **Right**, **Top**, **Bottom**), adjust UI **Density** (15 spacing presets), and customize **Motion & Effects** (8 animation modes).
- **Multi-Language & RTL Support:** Available in **English**, **العربية (Arabic)**, **اردو (Urdu)**, **हिन्दी (Hindi)**, **Türkçe (Turkish)**, **Français (French)**, and **Bahasa Indonesia** with full RTL layout mirroring.
- **Keyboard Shortcuts & Command Palette:** Press `Ctrl + K` (or `Cmd + K`) to open the quick Command Palette, `Alt + N` to add a transaction, `Alt + 1–8` to switch pages, or `?` to view all shortcuts.

---

## 🛠️ Tech Stack

- **Core:** HTML5, CSS3 (Custom Properties, CSS Grid/Flexbox, Responsive Media Queries), Vanilla JavaScript (ES6+)
- **PWA & Offline Caching:** Web App Manifest (`manifest.webmanifest`) & Service Worker (`sw.js`) with Network-First code caching
- **Libraries:** [Chart.js](https://chartjs.org) (data visualizations) & [Lucide Icons](https://lucide.dev)
- **Storage:** Browser `localStorage` & `sessionStorage` with user-scoped data isolation

---

## 🚀 Getting Started

Because **Hisab Kitab Premium** is built with pure client-side web technologies, no build step or backend server is required:

1. **Clone or Download** the repository files (`index.html`, `style.css`, `script.js`, `sw.js`, `manifest.webmanifest`).
2. **Run Locally:**
   - Open `index.html` directly in any modern browser, **or**
   - Serve via a local static server (recommended for Service Worker & PWA installation):
     ```bash
     npx serve .
     # or using Python
     python -m http.server 8080
     ```
3. **Install as an App:** Open in Chrome/Edge/Safari and select **"Install App"** or **"Add to Home Screen"** for a standalone desktop/mobile experience.

---

## 📁 Project Structure

```text
├── index.html             # Main application markup, pages, and modals
├── style.css              # Core styling, 50+ themes, density & motion systems, RTL rules
├── script.js              # App logic, state management, charts, PIN vault, i18n, and calculators
├── sw.js                  # Service Worker for offline support and cache management
├── manifest.webmanifest   # PWA configuration and app icons
└── README.md              # Project documentation
```

---

## 🔐 Privacy Notice

All transactions, budgets, PIN hashes, and profile settings are stored locally in your browser's `localStorage`. Clearing your browser site data will erase your local records—use **Settings → Backup / Restore** regularly to save a `.json` copy of your ledger.
