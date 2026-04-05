import {
  Terminal, User, Newspaper, FolderOpen,
  Activity, Database, Mail, FileText, BookOpen, Zap,
  Globe, Settings, Atom, Shield, Bot, PenSquare,
  Calculator, FileEdit, CalendarDays, Music2, Clipboard,
} from "lucide-react";
import type { AppId } from "@/types";

export interface AppMeta {
  icon: React.ReactNode;
  iconLg: React.ReactNode;
  color: string;
  bg: string;
  desc: string;
  tags: string[];
}

export const APP_META: Record<AppId, AppMeta> = {
  terminal:      { icon: <Terminal size={16} strokeWidth={1.5}/>,   iconLg: <Terminal size={22} strokeWidth={1.5}/>,   color:"#28C840", bg:"linear-gradient(145deg,#0E1F12,#153320)", desc:"Real PTY shell — zsh with xterm.js",            tags:["shell","pty","zsh"] },
  about:         { icon: <User size={16} strokeWidth={1.5}/>,       iconLg: <User size={22} strokeWidth={1.5}/>,       color:"#C8A97E", bg:"linear-gradient(145deg,#1E1710,#2A1E12)", desc:"Brian Ndege · engineer & AI systems builder",  tags:["profile","bio","portfolio"] },
  axira:         { icon: <Newspaper size={16} strokeWidth={1.5}/>,  iconLg: <Newspaper size={22} strokeWidth={1.5}/>,  color:"#5AC8FA", bg:"linear-gradient(145deg,#0A1520,#0E2030)", desc:"AI-powered global news intelligence",           tags:["news","ai","live"] },
  projects:      { icon: <FolderOpen size={16} strokeWidth={1.5}/>, iconLg: <FolderOpen size={22} strokeWidth={1.5}/>, color:"#FEBC2E", bg:"linear-gradient(145deg,#1E1800,#2A2206)", desc:"Engineering portfolio — code & systems",        tags:["code","github","portfolio"] },
  systemmonitor: { icon: <Activity size={16} strokeWidth={1.5}/>,   iconLg: <Activity size={22} strokeWidth={1.5}/>,   color:"#FF5F57", bg:"linear-gradient(145deg,#1F0C0C,#2A1010)", desc:"Real-time CPU · RAM · disk · network",          tags:["cpu","ram","metrics"] },
  skills:        { icon: <Database size={16} strokeWidth={1.5}/>,   iconLg: <Database size={22} strokeWidth={1.5}/>,   color:"#B48EAD", bg:"linear-gradient(145deg,#18101E,#22162A)", desc:"Proficiency database — languages & tools",     tags:["skills","languages"] },
  contact:       { icon: <Mail size={16} strokeWidth={1.5}/>,       iconLg: <Mail size={22} strokeWidth={1.5}/>,       color:"#C8A97E", bg:"linear-gradient(145deg,#1A1510,#24190E)", desc:"Email · GitHub · LinkedIn · contact form",     tags:["email","social"] },
  resume:        { icon: <FileText size={16} strokeWidth={1.5}/>,   iconLg: <FileText size={22} strokeWidth={1.5}/>,   color:"#F0EDE6", bg:"linear-gradient(145deg,#181818,#222222)", desc:"Experience timeline and full tech stack",       tags:["resume","cv","career"] },
  notebook:      { icon: <BookOpen size={16} strokeWidth={1.5}/>,   iconLg: <BookOpen size={22} strokeWidth={1.5}/>,   color:"#F97316", bg:"linear-gradient(145deg,#1A1008,#261606)", desc:"JupyterLab — Python & data science",            tags:["jupyter","python"] },
  simulation:    { icon: <Zap size={16} strokeWidth={1.5}/>,        iconLg: <Zap size={22} strokeWidth={1.5}/>,        color:"#A78BFA", bg:"linear-gradient(145deg,#14102A,#1E1640)", desc:"5-mode engine — particles, Monte Carlo",        tags:["physics","simulation"] },
  tor:           { icon: <Shield size={16} strokeWidth={1.5}/>,     iconLg: <Shield size={22} strokeWidth={1.5}/>,     color:"#7D4E8A", bg:"linear-gradient(145deg,#120A18,#1A0F22)", desc:"Anonymous browsing via Tor relay circuit",     tags:["tor","privacy","relay"] },
  clearnet:      { icon: <Globe size={16} strokeWidth={1.5}/>,      iconLg: <Globe size={22} strokeWidth={1.5}/>,      color:"#FEBC2E", bg:"linear-gradient(145deg,#1A1400,#261E00)", desc:"Direct web access — IP visible",               tags:["browser","web"] },
  settings:      { icon: <Settings size={16} strokeWidth={1.5}/>,   iconLg: <Settings size={22} strokeWidth={1.5}/>,   color:"#9A9A8A", bg:"linear-gradient(145deg,#141414,#1E1E1E)", desc:"Appearance, terminal, startup, keyboard",      tags:["settings","theme","config"] },
  quantum:       { icon: <Atom size={16} strokeWidth={1.5}/>,       iconLg: <Atom size={22} strokeWidth={1.5}/>,       color:"#5AC8FA", bg:"linear-gradient(145deg,#061520,#0A2030)", desc:"Quantum circuit simulator — 6 gates, 5 presets",tags:["quantum","qubits","circuit"] },
  ai:            { icon: <Bot size={16} strokeWidth={1.5}/>,        iconLg: <Bot size={22} strokeWidth={1.5}/>,        color:"#C8A97E", bg:"linear-gradient(145deg,#1A1508,#261E0A)", desc:"ARIA — AI assistant for strontium.os",          tags:["ai","assistant","chat"] },
  newsroom:      { icon: <PenSquare size={16} strokeWidth={1.5}/>,  iconLg: <PenSquare size={22} strokeWidth={1.5}/>,  color:"#FF5F57", bg:"linear-gradient(145deg,#1F0C0C,#2A1010)", desc:"Newsroom — publish articles and stories",       tags:["news","editor","publish"] },
  calculator:    { icon: <Calculator size={16} strokeWidth={1.5}/>, iconLg: <Calculator size={22} strokeWidth={1.5}/>, color:"#C8A97E", bg:"linear-gradient(145deg,#1A1508,#261E0A)", desc:"Standard calculator with keyboard support",     tags:["math","calculator"] },
  notes:         { icon: <FileEdit size={16} strokeWidth={1.5}/>,   iconLg: <FileEdit size={22} strokeWidth={1.5}/>,   color:"#F97316", bg:"linear-gradient(145deg,#1A1008,#261606)", desc:"Markdown notes with live preview",               tags:["notes","markdown","editor"] },
  files:         { icon: <FolderOpen size={16} strokeWidth={1.5}/>, iconLg: <FolderOpen size={22} strokeWidth={1.5}/>, color:"#FEBC2E", bg:"linear-gradient(145deg,#1E1800,#2A2206)", desc:"File manager with breadcrumb navigation",       tags:["files","filesystem","explorer"] },
  calendar:      { icon: <CalendarDays size={16} strokeWidth={1.5}/>,iconLg: <CalendarDays size={22} strokeWidth={1.5}/>,color:"#5AC8FA", bg:"linear-gradient(145deg,#0A1520,#0E2030)", desc:"Monthly calendar with events",                  tags:["calendar","events","schedule"] },
  mediaplayer:   { icon: <Music2 size={16} strokeWidth={1.5}/>,     iconLg: <Music2 size={22} strokeWidth={1.5}/>,     color:"#B48EAD", bg:"linear-gradient(145deg,#18101E,#22162A)", desc:"Audio & video player with visualizer",          tags:["music","audio","video","media"] },
  clipboard:     { icon: <Clipboard size={16} strokeWidth={1.5}/>,  iconLg: <Clipboard size={22} strokeWidth={1.5}/>,  color:"#9A9A8A", bg:"linear-gradient(145deg,#141414,#1E1E1E)", desc:"Clipboard history manager with search & pin",   tags:["clipboard","copy","paste"] },
};

export function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "200,169,126";
}
