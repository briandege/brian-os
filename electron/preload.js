const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ── PTY ────────────────────────────────────────────────────────
  ptyCreate: (cols, rows) => ipcRenderer.invoke("pty:create", { cols, rows }),
  ptyWrite:  (data)       => ipcRenderer.send("pty:write", data),
  ptyResize: (cols, rows) => ipcRenderer.send("pty:resize", { cols, rows }),
  ptyDestroy: ()          => ipcRenderer.send("pty:destroy"),

  onPtyData: (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on("pty:data", handler);
    return () => ipcRenderer.removeListener("pty:data", handler);
  },
  onPtyExit: (cb) => {
    const handler = (_, code) => cb(code);
    ipcRenderer.once("pty:exit", handler);
    return () => ipcRenderer.removeListener("pty:exit", handler);
  },

  // ── System info ─────────────────────────────────────────────────
  getSysInfo: () => ipcRenderer.invoke("sysinfo:get"),
  onSysInfo:  (cb) => {
    const handler = (_, data) => cb(data);
    ipcRenderer.on("sysinfo:update", handler);
    return () => ipcRenderer.removeListener("sysinfo:update", handler);
  },
});
