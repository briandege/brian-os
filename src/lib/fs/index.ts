/**
 * fs/index.ts
 *
 * Factory that returns the appropriate IFileSystemAdapter for the current
 * runtime:
 *   - Electron renderer  →  LocalFSAdapter  (real file system via IPC)
 *   - Browser / SSR      →  VirtualFSAdapter (in-memory, safe fallback)
 *
 * Usage:
 *   import { getFS } from "@/lib/fs";
 *   const fs = getFS();
 *   const entries = await fs.readDir("~");
 */

export type { IFileSystemAdapter, FileEntry, ReadResult, WriteResult } from "./IFileSystemAdapter";
export { LocalFSAdapter }   from "./LocalFSAdapter";
export { VirtualFSAdapter } from "./VirtualFSAdapter";

import type { IFileSystemAdapter } from "./IFileSystemAdapter";
import { LocalFSAdapter }   from "./LocalFSAdapter";
import { VirtualFSAdapter } from "./VirtualFSAdapter";

let _instance: IFileSystemAdapter | null = null;

/** Returns a singleton adapter appropriate for the current runtime. */
export function getFS(): IFileSystemAdapter {
  if (_instance) return _instance;
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;
  _instance = isElectron ? new LocalFSAdapter() : new VirtualFSAdapter();
  return _instance;
}

/** Force a specific adapter (useful for testing). */
export function setFS(adapter: IFileSystemAdapter): void {
  _instance = adapter;
}
