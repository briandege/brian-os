const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ── PTY ────────────────────────────────────────────────────────────
  ptyCreate:  (cols, rows) => ipcRenderer.invoke("pty:create", cols, rows),
  ptyWrite:   (data)       => ipcRenderer.send("pty:write", data),
  ptyResize:  (cols, rows) => ipcRenderer.send("pty:resize", { cols, rows }),
  ptyDestroy: ()           => ipcRenderer.send("pty:destroy"),

  onPtyData: (cb) => {
    const h = (_, data) => cb(data);
    ipcRenderer.on("pty:data", h);
    return () => ipcRenderer.removeListener("pty:data", h);
  },
  onPtyExit: (cb) => {
    const h = (_, code) => cb(code);
    ipcRenderer.once("pty:exit", h);
    return () => ipcRenderer.removeListener("pty:exit", h);
  },

  // ── System info ────────────────────────────────────────────────────
  getSysInfo: ()     => ipcRenderer.invoke("sysinfo:get"),
  onSysInfo:  (cb)   => {
    const h = (_, data) => cb(data);
    ipcRenderer.on("sysinfo:update", h);
    return () => ipcRenderer.removeListener("sysinfo:update", h);
  },

  // ── App / OS ───────────────────────────────────────────────────────
  getLoginItem: ()       => ipcRenderer.invoke("app:getLoginItem"),
  setLoginItem: (enable) => ipcRenderer.invoke("app:setLoginItem", enable),
  getVersion:   ()       => ipcRenderer.invoke("app:version"),
  getPlatform:  ()       => ipcRenderer.invoke("app:platform"),
  getArch:      ()       => ipcRenderer.invoke("app:arch"),

  // ── Hardware ──────────────────────────────────────────────────────
  getBattery:   ()       => ipcRenderer.invoke("hardware:battery"),
  getCpuInfo:   ()       => ipcRenderer.invoke("hardware:cpuInfo"),

  // ── File system ──────────────────────────────────────────────────
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // ── Clipboard ────────────────────────────────────────────────────
  clipboardRead:  ()       => ipcRenderer.invoke("clipboard:read"),
  clipboardWrite: (text)   => ipcRenderer.invoke("clipboard:write", text),

  // ── Dialog ───────────────────────────────────────────────────────
  openFileDialog: (exts)   => ipcRenderer.invoke("dialog:openFile", exts),

  // ── Audio ────────────────────────────────────────────────────────
  getVolume:  ()      => ipcRenderer.invoke("audio:getVolume"),
  setVolume:  (level) => ipcRenderer.invoke("audio:setVolume", level),

  // ── Screenshot ───────────────────────────────────────────────────
  captureScreenshot: () => ipcRenderer.invoke("screenshot:capture"),
});
