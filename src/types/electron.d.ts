// Global electronAPI bridge injected by electron/preload.js
declare global {
  interface Window {
    electronAPI?: {
      // PTY (real terminal)
      ptyCreate:  (cols: number, rows: number) => Promise<boolean>;
      ptyWrite:   (data: string) => void;
      ptyResize:  (cols: number, rows: number) => void;
      ptyDestroy: () => void;
      onPtyData:  (cb: (data: string) => void) => () => void;
      onPtyExit:  (cb: (code: number) => void) => () => void;
      // System info
      getSysInfo: () => Promise<{ cpu: number; ram: number; disk: number }>;
      onSysInfo:  (cb: (d: { cpu: number; ram: number; disk: number; netRx: number; netTx: number }) => void) => () => void;
    };
  }
}

export {};
