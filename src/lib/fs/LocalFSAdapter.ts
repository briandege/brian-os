/**
 * LocalFSAdapter.ts
 *
 * Implements IFileSystemAdapter by routing all operations through
 * window.electronAPI (Electron contextBridge IPC).
 *
 * Only usable in Electron renderer processes where window.electronAPI
 * is available. Falls back gracefully to empty results otherwise.
 */

import type { IFileSystemAdapter, FileEntry, ReadResult, WriteResult } from "./IFileSystemAdapter";

export class LocalFSAdapter implements IFileSystemAdapter {
  readonly isReal = true;

  private get api() {
    return typeof window !== "undefined" ? window.electronAPI : undefined;
  }

  async readDir(dirPath: string): Promise<FileEntry[]> {
    if (!this.api) return [];
    try {
      const result = await this.api.invoke("fs:readDir", dirPath) as
        Array<{ name: string; path: string; isDirectory: boolean; size: number; modified: string }> | { error: string };
      if ("error" in result) return [];
      return result.map((e) => ({
        name:        e.name,
        path:        e.path,
        isDirectory: e.isDirectory,
        size:        e.size ?? 0,
        modified:    e.modified ?? "",
      }));
    } catch { return []; }
  }

  async readFile(filePath: string): Promise<ReadResult> {
    if (!this.api) return { ok: false, error: "Electron API not available" };
    try {
      const result = await this.api.invoke("fs:readFile", filePath) as { ok: boolean; data?: string; error?: string };
      return result ?? { ok: false, error: "No response" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async writeFile(filePath: string, data: string): Promise<WriteResult> {
    if (!this.api) return { ok: false, error: "Electron API not available" };
    try {
      const result = await this.api.invoke("fs:writeFile", filePath, data) as WriteResult;
      return result ?? { ok: false };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async delete(filePath: string): Promise<WriteResult> {
    if (!this.api) return { ok: false, error: "Electron API not available" };
    try {
      const result = await this.api.invoke("fs:delete", filePath) as WriteResult;
      return result ?? { ok: false };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async move(src: string, dest: string): Promise<WriteResult> {
    if (!this.api) return { ok: false, error: "Electron API not available" };
    try {
      const result = await this.api.invoke("fs:move", src, dest) as WriteResult;
      return result ?? { ok: false };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async openExternal(filePath: string): Promise<void> {
    if (!this.api) return;
    await this.api.invoke("fs:openFile", filePath);
  }
}
