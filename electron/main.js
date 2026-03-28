const { app, BrowserWindow, shell, Menu, session, ipcMain } = require("electron");
const path = require("path");

const isDev    = process.env.NODE_ENV !== "production";
const DEV_PORT = process.env.ELECTRON_PORT || "3002";
const DEV_URL  = `http://localhost:${DEV_PORT}`;
const isMac    = process.platform === "darwin";
const isWin    = process.platform === "win32";

function getIconPath() {
  const base = path.join(__dirname, "../public");
  if (isMac) return path.join(base, "icon.icns");
  if (isWin) return path.join(base, "icon.ico");
  return path.join(base, "icon.png");
}

// ── PTY ──────────────────────────────────────────────────────────────────────
let ptyProcess = null;

function setupPty(win) {
  let nodePty;
  try { nodePty = require("node-pty"); } catch (e) {
    console.warn("node-pty not available:", e.message);
    return;
  }

  ipcMain.handle("pty:create", (_, { cols, rows }) => {
    if (ptyProcess) { try { ptyProcess.kill(); } catch {} ptyProcess = null; }
    const shell = process.env.SHELL || (isWin ? "cmd.exe" : "bash");
    ptyProcess = nodePty.spawn(shell, [], {
      name: "xterm-256color",
      cols: cols || 80,
      rows: rows || 24,
      cwd: process.env.HOME || process.cwd(),
      env: { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" },
    });
    ptyProcess.onData((data) => win.webContents.send("pty:data", data));
    ptyProcess.onExit(({ exitCode }) => {
      win.webContents.send("pty:exit", exitCode);
      ptyProcess = null;
    });
    return true;
  });

  ipcMain.on("pty:write",  (_, data)         => ptyProcess?.write(data));
  ipcMain.on("pty:resize", (_, { cols, rows }) => { try { ptyProcess?.resize(cols, rows); } catch {} });
  ipcMain.on("pty:destroy", ()               => { try { ptyProcess?.kill(); } catch {} ptyProcess = null; });
}

// ── System info ───────────────────────────────────────────────────────────────
let sysInfoTimer = null;

function setupSysInfo(win) {
  let si;
  try { si = require("systeminformation"); } catch (e) {
    console.warn("systeminformation not available:", e.message);
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
      const diskMain = disks.find(d => d.mount === "/") ?? disks[0];
      const net0     = nets[0] ?? {};
      win.webContents.send("sysinfo:update", {
        cpu:   Math.round(load.currentLoad),
        ram:   Math.round((mem.used / mem.total) * 100),
        disk:  diskMain ? Math.round(diskMain.use) : 0,
        netRx: net0.rx_sec ?? 0,
        netTx: net0.tx_sec ?? 0,
      });
    } catch {}
  };

  ipcMain.handle("sysinfo:get", async () => {
    try {
      const [load, mem, disks] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize()]);
      const diskMain = disks.find(d => d.mount === "/") ?? disks[0];
      return {
        cpu:  Math.round(load.currentLoad),
        ram:  Math.round((mem.used / mem.total) * 100),
        disk: diskMain ? Math.round(diskMain.use) : 0,
      };
    } catch { return { cpu: 0, ram: 0, disk: 0 }; }
  });

  collect();
  sysInfoTimer = setInterval(collect, 2000);
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const platformOpts = isMac
    ? { titleBarStyle: "hiddenInset", vibrancy: "under-window" }
    : { frame: true, autoHideMenuBar: true };

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#070708",
    show: false,
    ...platformOpts,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: getIconPath(),
  });

  Menu.setApplicationMenu(null);
  setupPty(win);
  setupSysInfo(win);

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, "../out/index.html"));
  }

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith(DEV_URL)) return;
    if (!isDev && url.startsWith("file://")) return;
    event.preventDefault();
  });

  win.on("closed", () => {
    if (sysInfoTimer) { clearInterval(sysInfoTimer); sysInfoTimer = null; }
    try { ptyProcess?.kill(); } catch {}
    ptyProcess = null;
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    try {
      if (!details.responseHeaders) { callback({}); return; }
      const headers = { ...details.responseHeaders };
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "x-frame-options") delete headers[key];
      }
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "content-security-policy") {
          headers[key] = headers[key].map(v => v.replace(/frame-ancestors[^;]*(;|$)/gi, ""));
        }
      }
      callback({ responseHeaders: headers });
    } catch { callback({}); }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
