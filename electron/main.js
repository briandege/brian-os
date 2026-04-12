const {
  app, BrowserWindow, shell, Menu, session,
  ipcMain, protocol, net,
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
  setupSysInfo(win);

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
