/**
 * IFileSystemAdapter.ts
 *
 * Unified file system interface used by all file-related apps.
 * Two implementations:
 *   - LocalFSAdapter  : talks to the real OS via Electron IPC (fs:readDir, fs:readFile, …)
 *   - VirtualFSAdapter: pure in-memory tree (no IPC, works in browser / SSR / test)
 *
 * Consumers depend only on this interface — they never import the concrete adapters directly.
 */

export interface FileEntry {
  name:        string;
  path:        string;
  isDirectory: boolean;
  size:        number;           // bytes (0 for directories)
  modified:    string;           // ISO-8601 string
  mimeType?:   string;
}

export interface ReadResult {
  ok:      boolean;
  data?:   string;              // UTF-8 text content
  error?:  string;
}

export interface WriteResult {
  ok:     boolean;
  error?: string;
}

export interface IFileSystemAdapter {
  /** List the contents of a directory. `~` resolves to the home directory. */
  readDir(path: string): Promise<FileEntry[]>;

  /** Read a file as UTF-8 text. */
  readFile(path: string): Promise<ReadResult>;

  /** Write UTF-8 text to a file. Creates the file if it doesn't exist. */
  writeFile(path: string, data: string): Promise<WriteResult>;

  /** Delete a file or empty directory. */
  delete(path: string): Promise<WriteResult>;

  /** Move or rename a file/directory. */
  move(src: string, dest: string): Promise<WriteResult>;

  /** Open a file with the OS default handler. */
  openExternal(path: string): Promise<void>;

  /** Whether this adapter can access the real file system. */
  readonly isReal: boolean;
}
