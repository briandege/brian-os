export type AppId =
  | "terminal"
  | "about"
  | "projects"
  | "axira"
  | "systemmonitor"
  | "contact"
  | "skills"
  | "resume"
  | "notebook"
  | "simulation";

export interface AppDefinition {
  id: AppId;
  label: string;
  icon: string; // lucide icon name
  defaultSize: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  minSize?: { width: number; height: number };
}

export interface WindowState {
  instanceId: string;
  appId: AppId;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}
