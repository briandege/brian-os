import { useWindowStore } from "@/lib/windowStore";
import { useSettingsStore, applyAccent } from "@/lib/settingsStore";
import { useNotificationStore, notify } from "@/lib/notificationStore";
import { useHealthStore, formatUptime } from "@/lib/healthStore";
import type { AppId } from "@/types";

export function buildSystemContext(): string {
  const windows = useWindowStore.getState().windows;
  const settings = useSettingsStore.getState();
  const notifications = useNotificationStore.getState().notifications;
  const health = useHealthStore.getState();

  const openApps = windows
    .filter((w) => !w.isMinimized)
    .map((w) => w.title)
    .join(", ") || "none";

  const uptime = formatUptime(health.uptimeSeconds);
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return `You are ARIA, the AI assistant for strontium.os — a premium portfolio operating system built by Brian Ndege.

## About Brian Ndege
- Full-stack engineer and AI systems builder
- Creator of strontium.os and AxiraNews (AI-powered global news intelligence)
- Works with TypeScript, React, Next.js, Python, Electron, and distributed systems
- Based in Kenya

## Current System State
- Open apps: ${openApps}
- Uptime: ${uptime}
- Error count: ${health.errorCount}
- Accent color: ${settings.accent}
- Wallpaper: ${settings.wallpaper}
- Color scheme: ${settings.colorScheme}
- Do Not Disturb: ${settings.doNotDisturb ? "ON" : "OFF"}
- Unread notifications: ${unreadNotifs}

## Available OS Actions
You can execute actions by including an action block in your response:
\`\`\`action
{"type": "open_app", "appId": "terminal"}
\`\`\`

Supported actions:
- open_app: Open an app. appId options: terminal, about, projects, axira, systemmonitor, contact, skills, resume, notebook, simulation, tor, clearnet, settings, quantum, ai, newsroom, calculator, notes, files, calendar, mediaplayer, clipboard
- close_app: Close an app. Provide appId.
- notify: Send notification. Provide title, body, notifType (info/success/warning/error).
- change_accent: Change accent color. Provide accent (tan/blue/purple/green/red).
- change_wallpaper: Change wallpaper. Provide wallpaper (grid/dots/noise/none).
- toggle_dnd: Toggle Do Not Disturb mode.
- set_theme: Set theme. Provide scheme (dark/light).

Be concise, helpful, and knowledgeable about the OS. When the user asks to perform an action, include the action block and a brief confirmation. You can chain multiple actions.`;
}

export function parseAndExecuteActions(text: string): void {
  const actionRegex = /```action\s*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const action = JSON.parse(match[1].trim());
      executeAction(action);
    } catch {
      // Silently skip malformed action blocks
    }
  }
}

function executeAction(action: { type: string; [key: string]: unknown }): void {
  const windowState = useWindowStore.getState();
  const settingsState = useSettingsStore.getState();

  switch (action.type) {
    case "open_app": {
      const appId = action.appId as AppId;
      if (appId) windowState.open(appId);
      break;
    }
    case "close_app": {
      const appId = action.appId as string;
      const win = windowState.windows.find((w) => w.appId === appId);
      if (win) windowState.close(win.instanceId);
      break;
    }
    case "notify": {
      const title = (action.title as string) || "Notification";
      const body = action.body as string | undefined;
      const notifType = (action.notifType as "info" | "success" | "warning" | "error") || "info";
      notify(title, body, notifType);
      break;
    }
    case "change_accent": {
      const accent = action.accent as "tan" | "blue" | "purple" | "green" | "red";
      if (accent) {
        settingsState.setAccent(accent);
        applyAccent(accent);
      }
      break;
    }
    case "change_wallpaper": {
      const wallpaper = action.wallpaper as "grid" | "dots" | "noise" | "none";
      if (wallpaper) settingsState.setWallpaper(wallpaper);
      break;
    }
    case "toggle_dnd": {
      settingsState.setDoNotDisturb(!settingsState.doNotDisturb);
      break;
    }
    case "set_theme": {
      const scheme = action.scheme as "dark" | "light";
      if (scheme) {
        settingsState.setColorScheme(scheme);
        // applyColorScheme is imported dynamically to avoid circular deps
        import("@/lib/settingsStore").then((mod) => mod.applyColorScheme(scheme));
      }
      break;
    }
  }
}
