const {
  app, BrowserWindow, shell, Menu, session,
  ipcMain, protocol, net, powerMonitor, systemPreferences,
} = require("electron");
const path = require("path");
const fs   = require("fs");

const isDev    = process.env.NODE_ENV !== "production";
const DEV_PORT = process.env.ELECTRON_PORT || "3002";
const DEV_URL  = `http://localhost:${DEV_PORT}`;

const isMac   = process.platform === "darwin";
const isWin   = process.platform === "win32";
const isLinux = process.platform === "linux";

// ── Custom app:// protocol ────────────────────────────────────────────────────
// Allows the static Next.js export to load assets correctly on all platforms.
// Without this, file:// URLs fail to resolve absolute /_next/static/ paths.

protocol.registerSchemesAsPrivileged([{
  scheme: "app",
  privileges: {
    secure: true,
    standard: true,
    supportFetchAPI: true,
    allowServiceWorkers: true,
    corsEnabled: true,
  },
}]);

function registerAppProtocol() {
  const outDir = path.join(__dirname, "..", "out");

  protocol.handle("app", (request) => {
    const { pathname } = new URL(request.url);

    // Decode URI and strip leading slash
    let rel;
    try { rel = decodeURIComponent(pathname).replace(/^\//, ""); }
    catch { rel = pathname.replace(/^\//, ""); }

    let filePath = path.join(outDir, rel);

    // Resolve directories and extensionless paths to index.html
    if (!path.extname(filePath)) {
      const candidates = [
        filePath + "/index.html",
        filePath + ".html",
        path.join(outDir, "index.html"),
      ];
      filePath = candidates.find(fs.existsSync) ?? path.join(outDir, "index.html");
    }

    // Final fallback
    if (!fs.existsSync(filePath)) {
      filePath = path.join(outDir, "index.html");
    }

    return net.fetch("file://" + filePath.replace(/\\/g, "/"));
  });
}

// ── Icon path ─────────────────────────────────────────────────────────────────

function getIconPath() {
  const base = path.join(__dirname, "..", "public");
  if (isMac) return path.join(base, "icon.icns");
  if (isWin) return path.join(base, "icon.ico");
  return path.join(base, "icon.png");
}

// ── PTY ───────────────────────────────────────────────────────────────────────

let ptyProcess = null;

function setupPty(win) {
  let nodePty;
  try {
    // node-pty is unpacked from asar to support native bindings
    nodePty = require("node-pty");
  } catch (e) {
    console.warn("node-pty unavailable:", e.message);
    return;
  }

  ipcMain.handle("pty:create", (_, cols, rows) => {
    if (ptyProcess) { try { ptyProcess.kill(); } catch {} ptyProcess = null; }

    const shell = process.env.SHELL
      ?? (isWin ? "powershell.exe" : isMac ? "/bin/zsh" : "/bin/bash");

    try {
      ptyProcess = nodePty.spawn(shell, [], {
        name:  "xterm-256color",
        cols:  cols  ?? 80,
        rows:  rows  ?? 24,
        cwd:   process.env.HOME ?? process.cwd(),
        env:   {
          ...process.env,
          TERM:      "xterm-256color",
          COLORTERM: "truecolor",
          LANG:      process.env.LANG ?? "en_US.UTF-8",
        },
      });

      ptyProcess.onData((data) => {
        if (!win.isDestroyed()) win.webContents.send("pty:data", data);
      });
      ptyProcess.onExit(({ exitCode }) => {
        if (!win.isDestroyed()) win.webContents.send("pty:exit", exitCode);
        ptyProcess = null;
      });

      return { ok: true };
    } catch (e) {
      console.error("PTY spawn failed:", e.message);
      return { ok: false, error: e.message };
    }
  });

  ipcMain.on("pty:write",   (_, data)             => ptyProcess?.write(data));
  ipcMain.on("pty:resize",  (_, { cols, rows })    => { try { ptyProcess?.resize(cols, rows); } catch {} });
  ipcMain.on("pty:destroy", ()                     => { try { ptyProcess?.kill(); } catch {} ptyProcess = null; });
}

// ── PTY Manager (multi-session, Module 3) ────────────────────────────────────

const MAX_PTY_SESSIONS = 6;
const PTY_BUFFER_LINES = 5_000;

function setupPtyManager(win) {
  let nodePty;
  try { nodePty = require("node-pty"); }
  catch (e) { console.warn("node-pty (manager) unavailable:", e.message); return; }

  const sessions = new Map(); // id → { id, pty, buffer[], cols, rows, attached, lastUsed, createdAt }
  const MGSHELL = process.env.SHELL ?? (isWin ? "powershell.exe" : "/bin/zsh");

  function evictIfNeeded() {
    const detached = Array.from(sessions.values())
      .filter(s => !s.attached)
      .sort((a, b) => a.lastUsed - b.lastUsed);
    while (sessions.size >= MAX_PTY_SESSIONS && detached.length > 0) {
      const victim = detached.shift();
      try { victim.pty.kill(); } catch {}
      sessions.delete(victim.id);
    }
  }

  ipcMain.handle("pty:mgr:create", (_, cols = 80, rows = 24) => {
    evictIfNeeded();
    const id = `pty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      const pty = nodePty.spawn(MGSHELL, [], {
        name: "xterm-256color", cols, rows,
        cwd: process.env.HOME ?? process.cwd(),
        env: { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" },
      });
      const session = { id, pty, buffer: [], cols, rows, attached: true, createdAt: Date.now(), lastUsed: Date.now() };
      pty.onData((data) => {
        const lines = data.split("\n");
        session.buffer.push(...lines);
        if (session.buffer.length > PTY_BUFFER_LINES)
          session.buffer.splice(0, session.buffer.length - PTY_BUFFER_LINES);
        if (!win.isDestroyed()) win.webContents.send("pty:mgr:data", { id, data });
      });
      pty.onExit(({ exitCode }) => {
        if (!win.isDestroyed()) win.webContents.send("pty:mgr:exit", { id, code: exitCode });
        sessions.delete(id);
      });
      sessions.set(id, session);
      return { ok: true, id };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle("pty:mgr:attach", (_, id) => {
    const s = sessions.get(id);
    if (!s) return null;
    s.attached = true;
    s.lastUsed = Date.now();
    return { buffer: s.buffer.join(""), cols: s.cols, rows: s.rows };
  });

  ipcMain.on("pty:mgr:detach",  (_, id)              => { const s = sessions.get(id); if (s) s.attached = false; });
  ipcMain.on("pty:mgr:write",   (_, { id, data })     => { const s = sessions.get(id); if (s) { s.lastUsed = Date.now(); s.pty.write(data); } });
  ipcMain.on("pty:mgr:resize",  (_, { id, cols, rows }) => { const s = sessions.get(id); if (s) { try { s.pty.resize(cols, rows); s.cols = cols; s.rows = rows; } catch {} } });
  ipcMain.handle("pty:mgr:destroy", (_, id) => { const s = sessions.get(id); if (s) { try { s.pty.kill(); } catch {} sessions.delete(id); } return { ok: true }; });
  ipcMain.handle("pty:mgr:list", () => Array.from(sessions.values()).map(({ id, cols, rows, attached, createdAt }) => ({ id, cols, rows, attached, createdAt })));
}

// ── System info ───────────────────────────────────────────────────────────────

let sysInfoTimer = null;

function setupSysInfo(win) {
  let si;
  try { si = require("systeminformation"); } catch (e) {
    console.warn("systeminformation unavailable:", e.message);
    return;
  }

  const collect = async () => {
    try {
      const [load, mem, disks, nets] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
      ]);
      const disk = disks.find(d => d.mount === "/") ?? disks[0];
      const net0 = nets[0] ?? {};
      if (!win.isDestroyed()) {
        win.webContents.send("sysinfo:update", {
          cpu:   Math.round(load.currentLoad),
          ram:   Math.round((mem.used / mem.total) * 100),
          disk:  disk ? Math.round(disk.use) : 0,
          netRx: net0.rx_sec ?? 0,
          netTx: net0.tx_sec ?? 0,
        });
      }
    } catch {}
  };

  ipcMain.handle("sysinfo:get", async () => {
    try {
      const [load, mem, disks] = await Promise.all([
        si.currentLoad(), si.mem(), si.fsSize(),
      ]);
      const disk = disks.find(d => d.mount === "/") ?? disks[0];
      return {
        cpu:  Math.round(load.currentLoad),
        ram:  Math.round((mem.used / mem.total) * 100),
        disk: disk ? Math.round(disk.use) : 0,
      };
    } catch { return { cpu: 0, ram: 0, disk: 0 }; }
  });

  collect();
  sysInfoTimer = setInterval(collect, 2000);
}

// ── Hardware info ────────────────────────────────────────────────────────────

ipcMain.handle("hardware:battery", async () => {
  try {
    const si = require("systeminformation");
    const b = await si.battery();
    return { hasBattery: b.hasBattery, percent: b.percent, isCharging: b.isCharging };
  } catch { return null; }
});

ipcMain.handle("hardware:cpuInfo", async () => {
  try {
    const si = require("systeminformation");
    const [cpu, temp] = await Promise.all([si.cpu(), si.cpuTemperature()]);
    return { brand: cpu.brand, cores: cpu.physicalCores, threads: cpu.cores, speed: cpu.speed, tempMain: temp.main ?? null };
  } catch { return null; }
});

// ── Login item (auto-start at login) ─────────────────────────────────────────

ipcMain.handle("app:getLoginItem", () => {
  try { return app.getLoginItemSettings().openAtLogin; }
  catch { return false; }
});

ipcMain.handle("app:setLoginItem", (_, enable) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false,
      ...(isMac ? { name: "strontium.os" } : {}),
    });
    return true;
  } catch { return false; }
});

// ── App info ──────────────────────────────────────────────────────────────────

ipcMain.handle("app:version",  () => app.getVersion());
ipcMain.handle("app:platform", () => process.platform);
ipcMain.handle("app:arch",     () => process.arch);

// ── File system ──────────────────────────────────────────────────────────────

ipcMain.handle("fs:readDir", async (_, dirPath) => {
  const os = require("os");
  const resolved = dirPath === "~" ? os.homedir() : dirPath;
  try {
    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: path.join(resolved, e.name),
      ...(() => {
        try {
          const s = fs.statSync(path.join(resolved, e.name));
          return { size: s.size, modified: s.mtime.toISOString() };
        } catch {
          return { size: 0, modified: "" };
        }
      })(),
    })).sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name));
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle("fs:openFile", async (_, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle("fs:readFile", async (_, filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return { ok: true, data };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("fs:writeFile", async (_, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, "utf8");
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("fs:delete", async (_, filePath) => {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) fs.rmdirSync(filePath);
    else fs.unlinkSync(filePath);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("fs:move", async (_, src, dest) => {
  try {
    fs.renameSync(src, dest);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Clipboard ───────────────────────────────────────────────────────────────

ipcMain.handle("clipboard:read", () => {
  const { clipboard } = require("electron");
  return clipboard.readText();
});

ipcMain.handle("clipboard:write", (_, text) => {
  const { clipboard } = require("electron");
  clipboard.writeText(text);
});

// ── Dialog ──────────────────────────────────────────────────────────────────

ipcMain.handle("dialog:openFile", async (_, extensions) => {
  const { dialog } = require("electron");
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Media", extensions: extensions || ["*"] }],
  });
  return result.filePaths;
});

// ── Audio volume ────────────────────────────────────────────────────────────

ipcMain.handle("audio:getVolume", () => {
  const { execSync } = require("child_process");
  try {
    if (process.platform === "darwin") {
      const vol = execSync('osascript -e "output volume of (get volume settings)"').toString().trim();
      return parseInt(vol);
    }
  } catch { return 50; }
  return 50;
});

ipcMain.handle("audio:setVolume", (_, level) => {
  const { execSync } = require("child_process");
  try {
    if (process.platform === "darwin") {
      // Sanitize to integer 0-100 before interpolating into shell command
      const safeLevel = Math.max(0, Math.min(100, parseInt(level, 10)));
      if (isNaN(safeLevel)) return;
      execSync(`osascript -e "set volume output volume ${safeLevel}"`);
    }
  } catch { /* ignore */ }
});

// ── Jupyter integration (Module 5) ────────────────────────────────────────────
// JupyterManager is TypeScript; we require the compiled output in production.
// In dev we use ts-node/esm or rely on the TypeScript build. For JS compatibility
// we duplicate the essential logic inline here.

let _jupyterProc  = null;
let _jupyterState = { status: "idle", url: null, token: null, port: 8888 };
const JUPYTER_PORT = 8888;

function notifyJupyterState(win) {
  if (win && !win.isDestroyed()) win.webContents.send("jupyter:state", _jupyterState);
}

function setJupyterState(patch, win) {
  _jupyterState = { ..._jupyterState, ...patch };
  notifyJupyterState(win);
}

function findJupyter() {
  const { execSync } = require("child_process");
  const candidates = [
    "jupyter-lab", "jupyter",
    require("path").join(process.env.HOME ?? "", ".local/bin/jupyter-lab"),
    "/opt/homebrew/bin/jupyter-lab",
    "/usr/local/bin/jupyter-lab",
    require("path").join(process.env.HOME ?? "", "anaconda3/bin/jupyter-lab"),
    require("path").join(process.env.HOME ?? "", "miniconda3/bin/jupyter-lab"),
  ];
  for (const c of candidates) {
    try { execSync(`which ${c} 2>/dev/null || test -f ${c}`, { timeout: 500 }); return c; }
    catch {}
  }
  return null;
}

function setupJupyter(win) {
  const { spawn } = require("child_process");
  const READY_TIMEOUT = 30_000;

  ipcMain.handle("jupyter:start", () => {
    if (_jupyterState.status === "starting" || _jupyterState.status === "ready") {
      return _jupyterState;
    }
    const exe = findJupyter();
    if (!exe) {
      setJupyterState({ status: "error", error: "jupyter-lab not found — run: pip install jupyterlab" }, win);
      return _jupyterState;
    }

    setJupyterState({ status: "starting", url: null, token: null, error: undefined }, win);

    const proc = spawn(exe, ["lab", `--port=${JUPYTER_PORT}`, "--no-browser", "--ip=127.0.0.1", "--NotebookApp.token="], {
      env: { ...process.env, JUPYTER_ALLOW_INSECURE_WRITES: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    _jupyterProc = proc;
    let readyFired = false;

    const readyTimer = setTimeout(() => {
      if (_jupyterState.status === "starting") {
        setJupyterState({ status: "error", error: "Timed out waiting for Jupyter" }, win);
      }
    }, READY_TIMEOUT);

    const parse = (buf) => {
      const text = buf.toString();
      const m = text.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/[^\s]+/);
      if (m && !readyFired) {
        readyFired = true;
        clearTimeout(readyTimer);
        const url   = m[0].replace("127.0.0.1", "localhost");
        let token = null;
        try { token = new URL(url).searchParams.get("token"); } catch {}
        setJupyterState({ status: "ready", url, token }, win);
      }
    };

    proc.stdout?.on("data", parse);
    proc.stderr?.on("data", parse);
    proc.on("exit", (code) => {
      clearTimeout(readyTimer);
      setJupyterState({ status: "stopped", url: null, token: null, error: `Exited ${code}` }, win);
      _jupyterProc = null;
    });
    proc.on("error", (e) => {
      clearTimeout(readyTimer);
      setJupyterState({ status: "error", url: null, token: null, error: e.message }, win);
      _jupyterProc = null;
    });

    return _jupyterState;
  });

  ipcMain.handle("jupyter:stop", () => {
    if (_jupyterProc) { try { _jupyterProc.kill("SIGTERM"); } catch {} _jupyterProc = null; }
    setJupyterState({ status: "stopped", url: null, token: null }, win);
    return { ok: true };
  });

  ipcMain.handle("jupyter:state", () => _jupyterState);
}

// ── Biometric authentication (Touch ID) ──────────────────────────────────────

ipcMain.handle("auth:biometric", async () => {
  try {
    if (isMac) {
      const canPrompt = systemPreferences.canPromptTouchID?.();
      if (!canPrompt) return { ok: false, error: "Touch ID not available" };
      await systemPreferences.promptTouchID("Unlock strontium.os");
      return { ok: true };
    }
    return { ok: false, error: "Biometrics not supported on this platform" };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("auth:canBiometric", () => {
  try {
    if (isMac) return { available: !!systemPreferences.canPromptTouchID?.() };
    return { available: false };
  } catch { return { available: false }; }
});

// ── Power actions (Module 1) ──────────────────────────────────────────────────

ipcMain.handle("power:action", async (_, action) => {
  const { execSync } = require("child_process");
  try {
    switch (action) {
      case "shutdown":
        setTimeout(() => {
          if (isMac) { try { execSync("osascript -e 'tell app \"System Events\" to shut down'"); } catch {} }
          app.quit();
        }, 400);
        break;
      case "restart":
        app.relaunch({ args: process.argv.slice(1) });
        app.exit(0);
        break;
      case "sleep":
        if (isMac) { try { execSync("pmset sleepnow"); } catch {} }
        else if (isLinux) { try { execSync("systemctl suspend"); } catch {} }
        break;
      case "logout":
        app.quit();
        break;
      default:
        return { ok: false, error: `Unknown action: ${action}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── Settings bridge handlers (Module 2) ───────────────────────────────────────

ipcMain.handle("settings:setBrightness", (_, level) => {
  const { execSync } = require("child_process");
  const safe = Math.max(0, Math.min(100, parseInt(level, 10)));
  if (isNaN(safe)) return { ok: false, error: "Invalid brightness level" };
  try {
    if (isMac) {
      // Requires Accessibility permission; gracefully degrades
      const normalized = (safe / 100).toFixed(2);
      execSync(`osascript -e "tell application \\"System Events\\" to set brightness of front display to ${normalized}"`, { timeout: 1000 });
    } else if (isLinux) {
      execSync(`brightnessctl set ${safe}% 2>/dev/null || xrandr --output HDMI-1 --brightness ${(safe / 100).toFixed(2)} 2>/dev/null || true`);
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle("settings:getBrightness", () => ({ ok: true, value: 80 }));

ipcMain.handle("settings:setNetworkProxy", async (_, config) => {
  try {
    if (config && config.host) {
      const port = parseInt(config.port, 10) || 8080;
      await session.defaultSession.setProxy({ proxyRules: `${config.host}:${port}` });
    } else {
      await session.defaultSession.setProxy({ proxyRules: "direct://" });
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width:  1440,
    height: 900,
    minWidth:  800,
    minHeight: 600,
    backgroundColor: "#050507",
    show: false,

    // Platform window chrome
    ...(isMac  ? { titleBarStyle: "hiddenInset", vibrancy: "under-window", visualEffectState: "active" } : {}),
    ...(isWin  ? { frame: true, autoHideMenuBar: true } : {}),
    ...(isLinux? { frame: true, autoHideMenuBar: true } : {}),

    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      webSecurity:      true,
      sandbox:          false, // needed for preload to require() modules
      preload: path.join(__dirname, "preload.js"),
    },
    icon: getIconPath(),
  });

  Menu.setApplicationMenu(null);
  setupPty(win);
  setupPtyManager(win);
  setupSysInfo(win);
  setupJupyter(win);

  // Screenshot capture (needs access to `win`)
  ipcMain.handle("screenshot:capture", async () => {
    const image = await win.webContents.capturePage();
    const { dialog } = require("electron");
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `screenshot-${Date.now()}.png`,
      filters: [{ name: "PNG", extensions: ["png"] }],
    });
    if (filePath) {
      fs.writeFileSync(filePath, image.toPNG());
      return filePath;
    }
    return null;
  });

  // Load app
  if (isDev) {
    win.loadURL(DEV_URL);
    // win.webContents.openDevTools(); // uncomment for debugging
  } else {
    win.loadURL("app://./index.html");
  }

  win.once("ready-to-show", () => {
    win.show();
    if (!isDev) win.maximize();
  });

  // Lock screen on system wake from sleep/suspend
  powerMonitor.on("resume", () => {
    if (!win.isDestroyed()) win.webContents.send("system:lock");
  });
  powerMonitor.on("unlock-screen", () => {
    if (!win.isDestroyed()) win.webContents.send("system:lock");
  });

  // Open external links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (e, url) => {
    const allowed = isDev
      ? url.startsWith(DEV_URL)
      : url.startsWith("app://");
    if (!allowed) e.preventDefault();
  });

  win.on("closed", () => {
    if (sysInfoTimer) { clearInterval(sysInfoTimer); sysInfoTimer = null; }
    try { ptyProcess?.kill(); } catch {}
    ptyProcess = null;
  });

  // Strip X-Frame-Options so iframes (Clearnet/Tor browsers) work
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    try {
      if (!details.responseHeaders) { callback({}); return; }
      const headers = { ...details.responseHeaders };
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "x-frame-options") delete headers[key];
        if (key.toLowerCase() === "content-security-policy") {
          headers[key] = headers[key].map(v =>
            v.replace(/frame-ancestors[^;]*(;|$)/gi, "")
          );
        }
      }
      callback({ responseHeaders: headers });
    } catch { callback({}); }
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (!isDev) registerAppProtocol();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}
