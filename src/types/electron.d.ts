// Global electronAPI bridge injected by electron/preload.js
declare global {
  interface Window {
    electronAPI?: {
      // PTY (real terminal)
      ptyCreate:  (cols: number, rows: number) => Promise<{ ok: boolean; error?: string }>;
      ptyWrite:   (data: string) => void;
      ptyResize:  (cols: number, rows: number) => void;
      ptyDestroy: () => void;
      onPtyData:  (cb: (data: string) => void) => () => void;
      onPtyExit:  (cb: (code: number) => void) => () => void;
      // System info
      getSysInfo: () => Promise<{ cpu: number; ram: number; disk: number }>;
      onSysInfo:  (cb: (d: { cpu: number; ram: number; disk: number; netRx: number; netTx: number }) => void) => () => void;
      // App / OS
      getLoginItem: () => Promise<boolean>;
      setLoginItem: (enable: boolean) => Promise<boolean>;
      getVersion:   () => Promise<string>;
      getPlatform:  () => Promise<string>;
      getArch:      () => Promise<string>;
      // Hardware
      getBattery:   () => Promise<{ hasBattery: boolean; percent: number; isCharging: boolean } | null>;
      getCpuInfo:   () => Promise<{ brand: string; cores: number; threads: number; speed: number; tempMain: number | null } | null>;
      // Generic invoke
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      // File system
      // clipboard
      clipboardRead:  () => Promise<string>;
      clipboardWrite: (text: string) => Promise<void>;
      // Dialog
      openFileDialog: (extensions: string[]) => Promise<string[]>;
      // Audio
      getVolume:  () => Promise<number>;
      setVolume:  (level: number) => Promise<void>;
      // Screenshot
      captureScreenshot: () => Promise<string | null>;
      // Power (Module 1)
      powerAction: (action: "shutdown" | "restart" | "sleep" | "logout") => Promise<{ ok: boolean; error?: string }>;
      // Biometric auth
      biometricAuth: () => Promise<{ ok: boolean; error?: string }>;
      canBiometric:  () => Promise<{ available: boolean }>;
      onSystemLock:  (cb: () => void) => () => void;
      // Settings bridge (Module 2)
      setBrightness:   (level: number)  => Promise<{ ok: boolean; error?: string }>;
      getBrightness:   ()               => Promise<{ ok: boolean; value: number }>;
      setNetworkProxy: (config: { host: string; port: number } | null) => Promise<{ ok: boolean; error?: string }>;
      // PTY Manager / multi-tab (Module 3)
      ptyMgrCreate:  (cols: number, rows: number) => Promise<{ ok: boolean; id?: string; error?: string }>;
      ptyMgrAttach:  (id: string) => Promise<{ buffer: string; cols: number; rows: number } | null>;
      ptyMgrDetach:  (id: string) => void;
      ptyMgrWrite:   (id: string, data: string) => void;
      ptyMgrResize:  (id: string, cols: number, rows: number) => void;
      ptyMgrDestroy: (id: string) => Promise<{ ok: boolean }>;
      ptyMgrList:    () => Promise<Array<{ id: string; cols: number; rows: number; attached: boolean; createdAt: number }>>;
      onPtyMgrData:  (cb: (payload: { id: string; data: string }) => void) => () => void;
      onPtyMgrExit:  (cb: (payload: { id: string; code: number }) => void) => () => void;
      // Jupyter (Module 5)
      jupyterStart:    () => Promise<JupyterState>;
      jupyterStop:     () => Promise<{ ok: boolean }>;
      jupyterState:    () => Promise<JupyterState>;
      onJupyterState:  (cb: (state: JupyterState) => void) => () => void;
    };
  }
}

export interface JupyterState {
  status:  "idle" | "starting" | "ready" | "stopped" | "error";
  url:     string | null;
  token:   string | null;
  port:    number;
  error?:  string;
}

export {};
