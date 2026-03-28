const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV !== "production";
const DEV_PORT = process.env.ELECTRON_PORT || "3002";
const DEV_URL = `http://localhost:${DEV_PORT}`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hiddenInset",   // macOS: keeps traffic lights, hides title bar
    vibrancy: "under-window",       // macOS frosted glass effect
    backgroundColor: "#070708",
    show: false,                    // show once ready to avoid white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../public/icon.png"),
  });

  // Remove default menu bar
  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL(DEV_URL);
    // win.webContents.openDevTools();  // uncomment to debug
  } else {
    win.loadFile(path.join(__dirname, "../out/index.html"));
  }

  // Show window once page is ready (avoids blank flash)
  win.once("ready-to-show", () => win.show());

  // Open external links in real browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
