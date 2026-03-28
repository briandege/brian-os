# strontium.os — Installation & Operation Manual

> A browser-based portfolio OS built on Next.js 15 + Electron.
> Runs as a **web app** (any browser) or a **native desktop app** (macOS / Windows / Linux).

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Quick Start — Web Browser](#2-quick-start--web-browser)
3. [Quick Start — Desktop App (Live Dev)](#3-quick-start--desktop-app-live-dev)
4. [Building a Distributable](#4-building-a-distributable)
   - [macOS](#41-macos)
   - [Windows](#42-windows)
   - [Linux](#43-linux)
   - [All platforms at once](#44-all-platforms-at-once)
5. [Installing the Built App](#5-installing-the-built-app)
   - [macOS](#51-macos)
   - [Windows](#52-windows)
   - [Linux](#53-linux)
6. [Running on a Phone / Tablet](#6-running-on-a-phone--tablet)
7. [Optional: JupyterLab Integration](#7-optional-jupyterlab-integration)
8. [Keyboard Shortcuts & Commands](#8-keyboard-shortcuts--commands)
9. [Troubleshooting](#9-troubleshooting)
10. [Project Structure](#10-project-structure)

---

## 1. Requirements

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 18.x or later | `node -v` |
| npm | 9.x or later | `npm -v` |
| Git | any | `git --version` |

**Optional (for builds only)**

| Tool | Used for |
|------|---------|
| Xcode Command Line Tools | macOS native builds |
| Wine / Docker | Building Windows installer on macOS/Linux |

Install Node.js from https://nodejs.org (choose the LTS version).

---

## 2. Quick Start — Web Browser

Works on **any OS** with zero native dependencies.

```bash
# 1. Clone the repository
git clone https://github.com/briandege/strontium-os.git
cd strontium-os

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:3000** in any modern browser.
If port 3000 is taken it will use 3001, 3002, etc. — check the terminal output.

> **Supported browsers:** Chrome 90+, Firefox 90+, Safari 15+, Edge 90+

---

## 3. Quick Start — Desktop App (Live Dev)

Runs the app in a native Electron window — no browser needed.

```bash
# Install dependencies (if not done already)
npm install

# Launch Next.js + Electron together on port 3002
npm run electron:dev
```

A native window will appear after ~5 seconds once Next.js finishes compiling.
Hot-reload is active — changes to source files update the window instantly.

### Windows note
On Windows, use **PowerShell** or **Git Bash** (not CMD) for the best experience.

### Linux note
If Electron refuses to start with a sandbox error, run:
```bash
npm run electron:dev -- --no-sandbox
```
Or permanently fix it:
```bash
echo 'kernel.unprivileged_userns_clone=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 4. Building a Distributable

These commands produce **installers / packages** you can hand to anyone.
They do **not** require Node.js to be installed on the target machine.

> **Before building**, you need icon files in the `public/` directory:
> - `public/icon.icns` — macOS (512×512, icns format)
> - `public/icon.ico`  — Windows (256×256, ico format)
> - `public/icon.png`  — Linux (512×512, png)
>
> To generate them from a single PNG: https://www.electron.build/icons

### 4.1 macOS

Build a `.dmg` installer for Apple Silicon and Intel:

```bash
npm run dist:mac
```

Output → `dist/strontium.os-*.dmg`

> Must be run **on a Mac**. Cross-compiling macOS from Windows/Linux is not supported by Apple.

---

### 4.2 Windows

Build an NSIS installer (`.exe`) and a portable `.exe`:

```bash
npm run dist:win
```

Output → `dist/strontium.os Setup *.exe` and `dist/strontium.os *.exe` (portable)

**Building on macOS/Linux:**
Install Wine and run:
```bash
brew install --cask wine-stable   # macOS with Homebrew
npm run dist:win
```

**Building on Windows:**
Run the command in PowerShell. No extra tools needed.

---

### 4.3 Linux

Build an AppImage (universal), `.deb` (Debian/Ubuntu), and `.rpm` (Fedora/RHEL):

```bash
npm run dist:linux
```

Output → `dist/strontium.os-*.AppImage`, `dist/strontium-os_*.deb`, `dist/strontium-os-*.rpm`

> Must be run **on Linux** for native `.deb`/`.rpm`. AppImage can be built cross-platform.

---

### 4.4 All platforms at once

```bash
npm run dist:all
```

Builds macOS + Windows + Linux in one pass.
Requires macOS with Wine for Windows targets, or a CI pipeline (GitHub Actions recommended).

---

## 5. Installing the Built App

### 5.1 macOS

1. Open `dist/strontium.os-*.dmg`
2. Drag **strontium.os** into `/Applications`
3. On first launch, right-click → **Open** (bypasses Gatekeeper for unsigned builds)

---

### 5.2 Windows

**Installer (recommended):**
1. Run `dist/strontium.os Setup *.exe`
2. Follow the installer — choose install location, creates Start Menu + Desktop shortcuts
3. Launch from Start Menu or Desktop

**Portable (no install):**
1. Copy `dist/strontium.os *.exe` anywhere
2. Double-click to run — no installation required, leaves nothing in registry

---

### 5.3 Linux

**AppImage (universal — recommended):**
```bash
chmod +x strontium.os-*.AppImage
./strontium.os-*.AppImage
```

**Debian / Ubuntu / Mint (.deb):**
```bash
sudo dpkg -i strontium-os_*.deb
# Launch from applications menu or:
strontium-os
```

**Fedora / RHEL / openSUSE (.rpm):**
```bash
sudo rpm -i strontium-os-*.rpm
# or with dnf:
sudo dnf install strontium-os-*.rpm
```

**Desktop entry (AppImage):**
To add to your app launcher:
```bash
# Install AppImageLauncher for automatic integration
# https://github.com/TheAssassin/AppImageLauncher
```

---

## 6. Running on a Phone / Tablet

strontium.os is a **Progressive Web App (PWA)**. No App Store needed.

### iPhone / iPad

1. Start the dev server on your Mac: `npm run dev`
2. Find your Mac's local IP: `ipconfig getifaddr en0` (e.g. `192.168.1.50`)
3. On iPhone, open Safari → `http://192.168.1.50:3000`
4. Tap the **Share** button → **Add to Home Screen**
5. It installs as a standalone app with full-screen mode and the correct status bar

### Android

1. Start the dev server: `npm run dev`
2. Open Chrome → `http://<your-ip>:3000`
3. Tap the three-dot menu → **Add to Home screen** or **Install app**

### Notes
- The app is fully responsive and handles safe-area insets (notch, home bar)
- Swipe gestures work natively — windows are touch-draggable
- For persistent access, deploy to Vercel (see below) and install from there

---

## 7. Optional: JupyterLab Integration

The **Notebook** app in strontium.os can embed a live JupyterLab session.

### Install JupyterLab

```bash
pip install jupyterlab
# or with conda:
conda install -c conda-forge jupyterlab
```

### Configure for embedding

```bash
# Run once to generate config
jupyter lab --generate-config

# Apply the strontium.os config
cp notebooks/jupyter_lab_config.py ~/.jupyter/jupyter_lab_config.py
```

Or manually add to `~/.jupyter/jupyter_lab_config.py`:

```python
c.ServerApp.ip = '0.0.0.0'
c.ServerApp.port = 8888
c.ServerApp.token = 'brianOS'
c.ServerApp.tornado_settings = {
    'headers': {
        'Content-Security-Policy': "frame-ancestors 'self' http://localhost:3000 http://localhost:3002",
        'X-Frame-Options': '',
    }
}
c.ServerApp.allow_origin = '*'
```

### Start JupyterLab

```bash
jupyter lab --no-browser
```

Then open the **Notebook** app in strontium.os — it will detect JupyterLab automatically.

---

## 8. Keyboard Shortcuts & Commands

### Desktop

| Action | Shortcut |
|--------|----------|
| Right-click desktop | Context menu |
| Double-click title bar | Maximize / restore window |
| Drag title bar | Move window |
| Drag window edge/corner | Resize window |

### Terminal (open via dock or `terminal` command)

| Command | Description |
|---------|-------------|
| `help` | List all commands |
| `whoami` | About Brian |
| `neofetch` | System info snapshot |
| `open <app>` | Open any app by ID |
| `axira` | Launch AxiraNews |
| `simulation` | Launch simulation engine |
| `tor` | Launch Tor Browser |
| `notebook` | Open JupyterLab |
| `ls` | List directory |
| `cat <file>` | Read a file (`resume.md`, `about.txt`, `contact.txt`) |
| `ps` | Show running processes |
| `history` | Command history |
| `clear` / `Ctrl+L` | Clear terminal |
| `Ctrl+C` | Cancel current input |
| `↑` / `↓` | Navigate command history |
| `sudo` | Nice try. |

### App IDs (for `open` command)

`terminal` · `about` · `axira` · `projects` · `skills` · `contact` · `resume` · `notebook` · `simulation` · `tor` · `systemmonitor`

---

## 9. Troubleshooting

### "Port 3002 is already in use"
```bash
# Kill whatever is using it
npx kill-port 3002
npm run electron:dev
```

### Electron window opens blank / white
The Next.js server isn't ready yet. `wait-on` handles this automatically — just wait a few more seconds. If it persists:
```bash
# Start them separately
npm run dev          # terminal 1
npm run electron     # terminal 2 (after dev is ready)
```

### "Could not find icon" build error
Create placeholder icons:
```bash
# macOS/Linux
cp public/icon.png public/icon.icns
cp public/icon.png public/icon.ico
```
For proper icons, use https://www.electron.build/icons or `electron-icon-maker`.

### Windows: "App is not signed" warning
This is expected for local/dev builds. Click **More info → Run anyway**.
For production, sign with a code-signing certificate from DigiCert or Sectigo.

### macOS: "strontium.os cannot be opened" (Gatekeeper)
```bash
xattr -cr /Applications/strontium.os.app
# Then try opening again
```

### Linux: Electron won't start (SUID sandbox)
```bash
./strontium.os-*.AppImage --no-sandbox
```

### Hot reload not working in Electron
The Electron window reads from `localhost:3002`. Make sure Next.js is still running in the background:
```bash
curl http://localhost:3002   # should return HTML
```

### `npm run dist` fails — "Cannot read properties of undefined"
Make sure `next build` completes first and the `out/` directory exists:
```bash
npm run build   # creates out/
ls out/         # should show index.html
npm run dist
```

---

## 10. Project Structure

```
strontium-os/
├── electron/
│   └── main.js              # Electron entry point (cross-platform)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx       # PWA metadata, fonts, viewport
│   │   ├── page.tsx         # Boot → Welcome → Desktop flow
│   │   └── globals.css      # Design tokens, glass surfaces, scanlines
│   │
│   ├── components/
│   │   ├── boot/
│   │   │   └── BootSequence.tsx       # Linux-style boot log
│   │   ├── desktop/
│   │   │   └── Desktop.tsx            # Wallpaper, windows, context menu
│   │   ├── dock/
│   │   │   └── Dock.tsx               # macOS-style dock with magnification
│   │   ├── taskbar/
│   │   │   └── Taskbar.tsx            # Top menu bar, active title, clock
│   │   ├── window/
│   │   │   └── Window.tsx             # Draggable, resizable window chrome
│   │   └── apps/
│   │       ├── Terminal.tsx           # Full terminal with commands
│   │       ├── SimulationApp.tsx      # 5-mode canvas simulation engine
│   │       ├── TorApp.tsx             # Tor circuit visualizer
│   │       ├── NotebookApp.tsx        # JupyterLab embed
│   │       ├── AxiraApp.tsx           # AxiraNews feed
│   │       ├── AboutApp.tsx
│   │       ├── ProjectsApp.tsx
│   │       ├── SkillsApp.tsx
│   │       ├── ContactApp.tsx
│   │       ├── ResumeApp.tsx
│   │       └── SystemMonitor.tsx
│   │
│   ├── lib/
│   │   ├── windowStore.ts    # Zustand window state (open/close/drag/resize)
│   │   └── apps.ts           # App registry and definitions
│   │
│   └── types/
│       └── index.ts          # AppId, WindowState, AppDefinition
│
├── notebooks/
│   ├── finance/monte_carlo.ipynb    # GBM portfolio simulation
│   ├── ml/recommendation_sim.ipynb  # User vector drift
│   ├── osint/threat_sim.ipynb       # CVE + kill-chain simulation
│   └── backend/load_test.ipynb      # Async API load tester
│
├── public/
│   ├── icon.png             # App icon (Linux)
│   ├── icon.icns            # App icon (macOS) — add before building
│   └── icon.ico             # App icon (Windows) — add before building
│
├── next.config.ts           # Static export config for Electron
├── package.json             # Scripts + electron-builder config
└── INSTALL.md               # This file
```

---

## Deploying as a Web App (optional)

To make strontium.os publicly accessible (no download required):

### Vercel (recommended — free)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your app will be live at `https://strontium-os.vercel.app` within 2 minutes.

### Netlify
```bash
npm run build
# Upload the out/ directory to app.netlify.com
```

### Self-hosted (nginx)
```bash
npm run build
# Copy out/ to your server's web root
scp -r out/ user@yourserver:/var/www/strontium-os
```

---

*Built by Brian Ndege · strontium.os · 2026*
