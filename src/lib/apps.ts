import type { AppDefinition } from "@/types";

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: "terminal",
    label: "Terminal",
    icon: "Terminal",
    defaultSize: { width: 700, height: 460 },
    minSize: { width: 400, height: 300 },
  },
  {
    id: "about",
    label: "about.brian",
    icon: "User",
    defaultSize: { width: 620, height: 500 },
    minSize: { width: 400, height: 350 },
  },
  {
    id: "axira",
    label: "AxiraNews",
    icon: "Newspaper",
    defaultSize: { width: 760, height: 560 },
    minSize: { width: 480, height: 400 },
  },
  {
    id: "projects",
    label: "Projects",
    icon: "FolderOpen",
    defaultSize: { width: 720, height: 520 },
    minSize: { width: 460, height: 360 },
  },
  {
    id: "systemmonitor",
    label: "System Monitor",
    icon: "Activity",
    defaultSize: { width: 580, height: 420 },
    minSize: { width: 400, height: 300 },
  },
  {
    id: "skills",
    label: "Skills.db",
    icon: "Database",
    defaultSize: { width: 640, height: 480 },
    minSize: { width: 420, height: 320 },
  },
  {
    id: "contact",
    label: "Contact",
    icon: "Mail",
    defaultSize: { width: 540, height: 460 },
    minSize: { width: 380, height: 360 },
  },
  {
    id: "resume",
    label: "Resume.pdf",
    icon: "FileText",
    defaultSize: { width: 660, height: 540 },
    minSize: { width: 420, height: 400 },
  },
  {
    id: "notebook",
    label: "Notebook",
    icon: "BookOpen",
    defaultSize: { width: 1100, height: 680 },
    minSize: { width: 640, height: 480 },
  },
  {
    id: "simulation",
    label: "Simulation",
    icon: "Zap",
    defaultSize: { width: 1000, height: 680 },
    minSize: { width: 640, height: 440 },
  },
];

export function getApp(id: string): AppDefinition | undefined {
  return APP_REGISTRY.find((a) => a.id === id);
}
