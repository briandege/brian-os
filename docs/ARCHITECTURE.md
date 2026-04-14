# strontium.os — Architecture & Engineering Documentation

> Last updated: 2026-04-12  
> Authors: Brian Ndege, Claude Sonnet 4.6

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Module Architecture (5-Module System)](#3-module-architecture-5-module-system)
4. [Security Architecture](#4-security-architecture)
5. [File System API](#5-file-system-api)
6. [Terminal System](#6-terminal-system)
7. [Jupyter Integration](#7-jupyter-integration)
8. [UI Design System](#8-ui-design-system)
9. [IPC Channel Reference](#9-ipc-channel-reference)
10. [Cryptography Reference](#10-cryptography-reference)

---

## 1. Overview

strontium.os is a fully custom desktop operating environment built on Electron + Next.js 15. It simulates a real OS experience with windowed applications, a dock, taskbar, system overlays, terminal persistence, and classified document handling.

**Core design principles:**
- Every feature that touches security must work without plaintext secrets
- Glass-morphism UI hierarchy (4 levels: glass → glass-heavy → glass-dock → glass-panel)
- Spring physics for all motion (Framer Motion)
- Single password controls all access — default is `admin`

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 41 (Chromium renderer) |
| Framework | Next.js 15 (App Router, static export) |
| UI | React 19 + Framer Motion + Tailwind CSS |
| State | Zustand (with localStorage persistence) |
| Terminal | xterm.js + node-pty (real PTY) |
| Crypto | Web Crypto API (PBKDF2-SHA256, SubtleCrypto) |
| Icons | Lucide React |

---

## 3. Module Architecture (5-Module System)

### Module 1 — System Overlays & Start Screen

**Files:**
- `src/lib/overlayStore.ts` — Zustand state machine
- `src/components/overlays/StartScreen.tsx` — overlay renderer
- `electron/main.js` → `power:action` IPC handler

**State machine:**
```
idle ──────────────────── openStartScreen() ──► start-screen
start-screen ─────────── dismiss() ──────────► idle
start-screen / idle ──── lock() ────────────► locking ──► locked
locked ───────────────── unlock() ───────────► idle
idle / start-screen ──── executePowerAction("sleep") ─► sleeping
idle / start-screen ──── executePowerAction("restart") ► restarting
idle / start-screen ──── executePowerAction("shutdown") ► shutting-down
```

**Boot behavior:** Initial state is `"locked"`. Every boot requires authentication.

**Sleep lock:** `powerMonitor.on("resume")` in main.js sends `system:lock` IPC → renderer calls `lock()`.

**Biometric auth:** `systemPreferences.promptTouchID()` on macOS. Gracefully degrades to password on unsupported hardware.

---

### Module 2 — Settings Bridge

**Files:**
- `src/lib/systemSettingsBridge.ts` — async IPC bridge
- `src/hooks/useSystemSetting.ts` — React hook for apply status

**Pattern:**
```ts
// In a Zustand action:
await bridgeSetting("brightness", "settings:setBrightness", 80);

// In a component:
const { status, error } = useSystemSetting("brightness");
// status: "idle" | "pending" | "applied" | "error"
```

**IPC handlers:** `settings:setBrightness`, `settings:getBrightness`, `settings:setNetworkProxy`

---

### Module 3 — Multi-Tab Terminal Persistence

**Files:**
- `electron/ptyManager.ts` — PTY session manager (TypeScript reference)
- `electron/main.js` → `setupPtyManager()` — live JS implementation
- `src/lib/terminalStore.ts` — Zustand tab state
- `src/components/apps/RealTerminal.tsx` — xterm.js + PTY bridge
- `src/components/apps/Terminal.tsx` — tab bar UI

**Session lifecycle:**
```
newTab() ──► ptyMgrCreate() ──► session "connecting"
PTY data arrives ──────────────► session "ready"
tab hidden ────────────────────► ptyMgrDetach() (PTY keeps running)
tab shown ─────────────────────► ptyMgrAttach() (buffer replayed)
tab ✕ closed ──────────────────► ptyMgrDestroy()
```

**Ring buffer:** 5,000 lines per session. Replayed on reattach.  
**LRU eviction:** Max 6 sessions. Oldest detached session killed when at capacity.

---

### Module 4 — Unified File System API

**Files:** `src/lib/fs/`

```
IFileSystemAdapter (interface)
├── LocalFSAdapter    → Electron IPC (fs:readDir, fs:readFile, etc.)
└── VirtualFSAdapter  → in-memory tree (browser / SSR / tests)
```

**Factory:**
```ts
import { getFS } from "@/lib/fs";
const fs = getFS(); // auto-selects by runtime
const entries = await fs.readDir("~");
```

**IPC handlers in main.js:** `fs:readDir`, `fs:readFile`, `fs:writeFile`, `fs:delete`, `fs:move`, `fs:openFile`

---

### Module 5 — Jupyter Integration

**Files:**
- `electron/jupyter/JupyterManager.ts` — process manager
- `electron/main.js` → `setupJupyter()` — live JS implementation
- `src/hooks/useJupyter.ts` — React hook
- `src/components/apps/NotebookApp.tsx` — UI integration

**Discovery order:** `jupyter-lab` in PATH → `~/.local/bin/` → `/opt/homebrew/bin/` → anaconda/miniconda

**Status states:** `idle → starting → ready → stopped | error`

**Auto-restart:** Up to 3 restarts on crash, 1.5s delay between attempts.

**Launch from UI:** "Launch Jupyter" button in NotebookApp triggers `jupyter:start` IPC. Server URL + token parsed from stdout/stderr.

---

## 4. Security Architecture

### Authentication Flow

```
Boot / Wake / Lock
    │
    ▼
LockScreen
    ├── Touch ID available? ──► promptTouchID() ──► success ──► unlock()
    └── Password field ──► PBKDF2-verify() ──► match ──► unlock()
```

### Password Storage

Passwords are **never stored in plaintext**. The stored value is:

```
<16-byte-hex-salt>:<32-byte-hex-PBKDF2-derived-key>
```

**Algorithm:** PBKDF2-SHA256  
**Iterations:** 310,000 (NIST SP 800-132, 2023 recommendation)  
**Salt:** 16 bytes, cryptographically random per hash  
**Output:** 256-bit derived key

**Default password:** `admin` (stored as its SHA-256 hash for migration; upgrades to PBKDF2 on first change)

### Classification System

| Level | Encryption Label | Key Exchange |
|-------|-----------------|--------------|
| Confidential | AES-256-GCM · X25519+ML-KEM-768 | Hybrid classical+PQC |
| Secret | AES-256-GCM · ML-KEM-768 · FIPS 203 | NIST PQC standard |
| Top Secret | ML-KEM-1024 · SLH-DSA · FIPS 203/205 | Full PQC suite |

### Post-Quantum Cryptography Roadmap

**Current (passwords):** PBKDF2-SHA256 — quantum-resistant at 256-bit output  
(Grover's algorithm halves search space; 256-bit output gives 128-bit post-quantum security)

**Future comms layer (planned):**
- Key exchange: Hybrid X25519 + ML-KEM-768 (NIST FIPS 203, formerly CRYSTALS-Kyber)
- Signatures: SLH-DSA-SHAKE-256 (NIST FIPS 205, formerly SPHINCS+)
- Library: `@noble/post-quantum` (WASM-free, browser-compatible)
- Pattern used by: Signal, iMessage, Google Chrome TLS

---

## 5. File System API

```typescript
interface IFileSystemAdapter {
  readDir(path: string):               Promise<FileEntry[]>;
  readFile(path: string):              Promise<ReadResult>;
  writeFile(path: string, data: string): Promise<WriteResult>;
  delete(path: string):                Promise<WriteResult>;
  move(src: string, dest: string):     Promise<WriteResult>;
  openExternal(path: string):          Promise<void>;
  readonly isReal: boolean;
}
```

`~` resolves to the user's home directory via `os.homedir()` in the main process.

---

## 6. Terminal System

The terminal has two layers:

1. **Mock terminal** (`Terminal.tsx`) — fallback, runs in browser, handles built-in commands
2. **Real terminal** (`RealTerminal.tsx`) — xterm.js + node-pty, Electron only

**Multi-tab:** Up to 6 concurrent PTY sessions. Tabs rendered with `visibility: hidden` (not unmounted) so PTY sessions stay alive during tab switching. Session buffer is replayed via `ptyMgrAttach()` on focus.

**Simulation gate:** `SimulationApp.tsx` checks `window.electronAPI` — shows a lock screen if accessed outside Electron.

---

## 7. Jupyter Integration

```
User clicks "Launch Jupyter"
    │
    ▼ IPC: jupyter:start
    │
main.js: findJupyter() → spawn jupyter-lab --no-browser --port=8888
    │
    ├── Parse URL from stdout/stderr (regex: http://localhost:\d+/...)
    │
    ▼ IPC push: jupyter:state { status: "ready", url, token }
    │
NotebookApp: iframe src = url, shows in-app
```

---

## 8. UI Design System

### Color Tokens (CSS Variables)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-void` | `#08080F` | Base background |
| `--color-tan` | `#D4AA82` | Primary accent (gold) |
| `--color-tan-bright` | `#EDCF9E` | Highlighted accent |
| `--color-bone` | `#F4F1EA` | Primary text |
| `--color-muted` | `#6E6E84` | Secondary text |
| `--color-border` | `rgba(255,255,255,0.08)` | Default border |

### Glass Material Hierarchy

| Class | Blur | Saturation | Background | Usage |
|-------|------|-----------|-----------|-------|
| `.glass` | 44px | 230% | rgba(20,22,36,0.74) | Panels, menus |
| `.glass-heavy` | 56px | 240% | rgba(22,24,36,0.82) | Window chrome |
| `.glass-light` | 48px | 260% | rgba(32,34,52,0.60) | Tooltips |
| `.glass-dock` | 60px | 280% | rgba(36,38,58,0.62) | Dock bar |
| `.glass-panel` | 32px | 200% | rgba(14,15,24,0.85) | Sidebar panels |

All glass materials include `contrast(1.02)` and left/right inset edge highlights.

### Window Shadow System

**Focused (5 layers):**
```css
box-shadow:
  0 40px 80px rgba(0,0,0,0.60),   /* far */
  0 16px 40px rgba(0,0,0,0.42),   /* mid */
  0 6px 16px rgba(0,0,0,0.32),    /* near */
  0 2px 4px rgba(0,0,0,0.28),     /* contact */
  0 0 120px rgba(212,170,130,0.06); /* ambient glow halo */
```

### Animation Conventions

| Type | Spring | Duration |
|------|--------|---------|
| Window appear/move | stiffness 280, damping 26 | — |
| Dock magnification | stiffness 340, damping 24 | — |
| Tab animations | stiffness 400, damping 30 | — |
| Overlay transitions | ease | 0.22s |
| Ambient breathing | easeInOut | 22s |

---

## 9. IPC Channel Reference

### Renderer → Main (invoke)

| Channel | Args | Returns | Description |
|---------|------|---------|-------------|
| `pty:mgr:create` | cols, rows | `{ ok, id }` | Create PTY session |
| `pty:mgr:attach` | id | `{ buffer, cols, rows }` | Attach + get buffer |
| `pty:mgr:destroy` | id | `{ ok }` | Destroy PTY session |
| `pty:mgr:list` | — | `Session[]` | List all sessions |
| `power:action` | action | `{ ok }` | shutdown/restart/sleep/logout |
| `auth:biometric` | — | `{ ok, error? }` | Touch ID prompt |
| `auth:canBiometric` | — | `{ available }` | Check Touch ID support |
| `settings:setBrightness` | level | `{ ok }` | Set display brightness |
| `settings:setNetworkProxy` | config | `{ ok }` | Set proxy |
| `jupyter:start` | — | `JupyterState` | Launch Jupyter server |
| `jupyter:stop` | — | `{ ok }` | Stop Jupyter server |
| `jupyter:state` | — | `JupyterState` | Get current state |
| `fs:readDir` | path | `FileEntry[]` | List directory |
| `fs:readFile` | path | `{ ok, data }` | Read file as UTF-8 |
| `fs:writeFile` | path, data | `{ ok }` | Write file |
| `fs:delete` | path | `{ ok }` | Delete file/dir |
| `fs:move` | src, dest | `{ ok }` | Move/rename |

### Main → Renderer (send)

| Channel | Payload | Description |
|---------|---------|-------------|
| `pty:mgr:data` | `{ id, data }` | PTY stdout chunk |
| `pty:mgr:exit` | `{ id, code }` | PTY process exited |
| `sysinfo:update` | `{ cpu, ram, disk, netRx, netTx }` | Live metrics |
| `system:lock` | — | Lock screen (wake from sleep) |
| `jupyter:state` | `JupyterState` | Jupyter status change |

---

## 10. Cryptography Reference

### Password Hash Format

```
PBKDF2-SHA256
  iterations: 310,000
  salt:        16 bytes random (new per hash)
  output:      256-bit derived key
  stored as:  "<32-char-hex-salt>:<64-char-hex-key>"
```

### Verify Flow

```typescript
import { hashPassword, verifyPassword } from "@/lib/crypto";

// Store a new password
const hash = await hashPassword("admin");  // "a3f2...:<hex-key>"

// Verify
const ok = await verifyPassword("admin", hash);  // true
```

### Default Hash

The default password `admin` is bootstrapped as a SHA-256 hash:
```
8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
```
This auto-upgrades to PBKDF2 format on first password change via Settings → Security.

### Post-Quantum Note

SHA-256 and PBKDF2-SHA256 are **quantum-resistant for hashing** (Grover's algorithm reduces 256-bit to 128-bit security, which remains secure). ML-KEM and SLH-DSA (listed in classification banners) are the NIST-standardized (FIPS 203/205, 2024) algorithms for **key exchange and signatures** in the planned communications layer.
