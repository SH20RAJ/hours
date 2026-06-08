# Contributing to Hours Tracker

Welcome! We are thrilled that you're interested in contributing to Hours. Whether you are fixing a bug, adding a new feature, optimizing PWA configurations, or polishing the styling, your help is highly appreciated.

Hours is a **100% open source** project licensed under the permissive **MIT License**.

---

## 🚀 Quick Start (Local Setup)

Hours is built with Next.js, React, TypeScript, and Tailwind CSS (v4 PostCSS). We recommend using **Bun** or **npm** for package management.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and [Bun](https://bun.sh/) (optional, but recommended) installed.

### 2. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/sh20raj/hours.git
cd hours

# Install dependencies
bun install   # or: npm install
```

### 3. Run Development Server
```bash
bun dev       # or: npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## 🛠️ Verification & Development Commands

Always make sure the code builds cleanly and existing tests pass before submitting a Pull Request.

### Run Type Checker
```bash
bun run typecheck
```

### Run Tests
Hours uses **Vitest** for unit testing:
```bash
bun run test
```

### Generate Assets & Icons
All social and PWA assets are generated from the SVG vector template inside `scripts/generate-assets.mjs` using `sharp`:
```bash
bun run assets
```

### Build for Production
```bash
bun run build
```

---

## 📂 Project Architecture

Here is a quick overview of where files are located:

* **`src/app/`**: Next.js App Router folders and routes:
  * `src/app/layout.tsx`: Main layout wrapper, SEO metadata, PWA configuration.
  * `src/app/page.tsx`: Index route leading to the main dashboard.
  * `src/app/about/page.tsx`: About page / landing page explaining the app and how to contribute.
  * `src/app/manifest.ts`: Standard PWA web manifest.
  * `src/app/globals.css`: Global styles, themes, and design tokens (Tailwind CSS v4).
* **`src/components/`**: Reusable component views:
  * `src/components/hours-app.tsx`: Core shell component containing today, skills, calendar, and settings tab states.
* **`src/lib/`**: Business logic, data models, IndexedDB client integration:
  * `src/lib/hours.ts`: Main models for Skills, Sessions, and Pomodoro calculations.
  * `src/lib/hours-db.ts`: IndexedDB client persistence setup.
* **`public/`**: Caching assets:
  * `public/sw.js`: Offline routing caching logic, background notification listeners, and deep link navigation activations.
* **`scripts/`**: Asset compilers:
  * `scripts/generate-assets.mjs`: Vector-to-raster asset builder script.

---

## 🎨 Styling Guidelines

We use **Vanilla CSS** combined with **Tailwind CSS v4** PostCSS layers to maintain a highly custom, performant, and premium visual system.
- Avoid inline ad-hoc classes for complex states; define clear CSS utility classes inside `globals.css`.
- Ensure components are responsive, mobile-first, and respect system preferences.
- Maintain the warm color scheme (`--background`, `--surface`, `--accent`, `--line`, and charcoal variables).

---

## 💡 How to Open a Pull Request

1. **Fork the repo** and create your branch from `main`.
2. Implement your changes.
3. Make sure to run `bun run typecheck` and `bun run test` to verify.
4. Open a Pull Request with a clear description of the fixes/features introduced.

Thank you for helping us build the best skill-tracking companion!
