const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV !== "production";
const DEV_PORT = process.env.ELECTRON_PORT || "3002";
const DEV_URL = `http://localhost:${DEV_PORT}`;
const isMac   = process.platform === "darwin";
const isWin   = process.platform === "win32";

// ── Icon path (platform-specific extension) ──────────────────────────────────
function getIconPath() {
  const base = path.join(__dirname, "../public");
  if (isMac)  return path.join(base, "icon.icns");
  if (isWin)  return path.join(base, "icon.ico");
  return path.join(base, "icon.png");  // Linux
}

function createWindow() {
  // Platform-specific window options
  const platformOpts = isMac
    ? { titleBarStyle: "hiddenInset", vibrancy: "under-window" }
    : { frame: true, autoHideMenuBar: true };

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#070708",
    show: false,           // avoid white flash on startup
    ...platformOpts,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: getIconPath(),
  });

  // Remove native menu bar on all platforms (we have our own UI)
  Menu.setApplicationMenu(null);

  if (isDev) {
    win.loadURL(DEV_URL);
    // Uncomment to open DevTools during development:
    // win.webContents.openDevTools();
  } else {
    // Static export — load index.html from the out/ directory
    win.loadFile(path.join(__dirname, "../out/index.html"));
  }

  win.once("ready-to-show", () => win.show());

  // Open all external http/https links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Prevent navigation away from the app
  win.webContents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith(DEV_URL)) return;
    event.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows closed (except macOS — stays in dock)
app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
