/**
 * VirtualFSAdapter.ts
 *
 * Pure in-memory file system — no IPC, works in SSR and browser.
 * Used as the fallback when Electron is not available, and in tests.
 *
 * The virtual tree is initialized with a minimal home directory structure.
 */

import type { IFileSystemAdapter, FileEntry, ReadResult, WriteResult } from "./IFileSystemAdapter";

interface VNode {
  name:     string;
  isDir:    boolean;
  content:  string;          // empty for directories
  modified: Date;
  children: Map<string, VNode>;
}

function makeDir(name: string): VNode {
  return { name, isDir: true, content: "", modified: new Date(), children: new Map() };
}

function makeFile(name: string, content = ""): VNode {
  return { name, isDir: false, content, modified: new Date(), children: new Map() };
}

function buildDefaultTree(): VNode {
  const root = makeDir("/");

  const home = makeDir("~");
  home.children.set("Documents", makeDir("Documents"));
  home.children.set("Downloads", makeDir("Downloads"));
  home.children.set("Desktop",   makeDir("Desktop"));
  home.children.set("Projects",  makeDir("Projects"));
  home.children.set("README.md", makeFile("README.md", "# strontium.os\nWelcome to your virtual home.\n"));

  root.children.set("~", home);
  root.children.set("home", home);
  return root;
}

export class VirtualFSAdapter implements IFileSystemAdapter {
  readonly isReal = false;
  private root:  VNode;

  constructor() {
    this.root = buildDefaultTree();
  }

  private resolve(p: string): VNode | null {
    const parts = p.replace(/^\//, "").split("/").filter(Boolean);
    let node: VNode = this.root;
    for (const part of parts) {
      const child = node.children.get(part);
      if (!child) return null;
      node = child;
    }
    return node;
  }

  private ensureDir(p: string): VNode {
    const parts = p.replace(/^\//, "").split("/").filter(Boolean);
    let node: VNode = this.root;
    for (const part of parts) {
      if (!node.children.has(part)) {
        node.children.set(part, makeDir(part));
      }
      node = node.children.get(part)!;
    }
    return node;
  }

  private parentAndName(p: string): { parent: VNode | null; name: string } {
    const parts = p.replace(/^\//, "").split("/").filter(Boolean);
    const name  = parts.pop() ?? "";
    const parent = parts.length === 0 ? this.root : this.resolve("/" + parts.join("/"));
    return { parent, name };
  }

  async readDir(dirPath: string): Promise<FileEntry[]> {
    const node = this.resolve(dirPath);
    if (!node || !node.isDir) return [];
    return Array.from(node.children.values()).map((c) => ({
      name:        c.name,
      path:        `${dirPath}/${c.name}`.replace("//", "/"),
      isDirectory: c.isDir,
      size:        c.isDir ? 0 : c.content.length,
      modified:    c.modified.toISOString(),
    })).sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name));
  }

  async readFile(filePath: string): Promise<ReadResult> {
    const node = this.resolve(filePath);
    if (!node)        return { ok: false, error: "File not found" };
    if (node.isDir)   return { ok: false, error: "Is a directory" };
    return { ok: true, data: node.content };
  }

  async writeFile(filePath: string, data: string): Promise<WriteResult> {
    const { parent, name } = this.parentAndName(filePath);
    if (!parent) return { ok: false, error: "Parent directory not found" };
    const existing = parent.children.get(name);
    if (existing && existing.isDir) return { ok: false, error: "Path is a directory" };
    parent.children.set(name, makeFile(name, data));
    return { ok: true };
  }

  async delete(filePath: string): Promise<WriteResult> {
    const { parent, name } = this.parentAndName(filePath);
    if (!parent || !parent.children.has(name)) return { ok: false, error: "Not found" };
    parent.children.delete(name);
    return { ok: true };
  }

  async move(src: string, dest: string): Promise<WriteResult> {
    const { parent: srcParent, name: srcName } = this.parentAndName(src);
    if (!srcParent || !srcParent.children.has(srcName)) return { ok: false, error: "Source not found" };
    const node = srcParent.children.get(srcName)!;

    const { parent: destParent, name: destName } = this.parentAndName(dest);
    if (!destParent) return { ok: false, error: "Destination parent not found" };

    srcParent.children.delete(srcName);
    node.name = destName;
    destParent.children.set(destName, node);
    return { ok: true };
  }

  async openExternal(): Promise<void> {
    // No-op in virtual mode
  }
}
