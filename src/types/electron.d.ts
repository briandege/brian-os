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
    };
  }
}

export {};
