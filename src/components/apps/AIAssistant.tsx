"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bot, Trash2, Send, Key, ExternalLink, Cpu, HardDrive,
  Clock, BellOff, AppWindow, Mic, MicOff, ChevronDown, Server, Cloud,
} from "lucide-react";
import { useAIStore, type AIMessage, type AIProvider } from "@/lib/aiStore";
import { useHealthStore, formatUptime } from "@/lib/healthStore";
import { useWindowStore } from "@/lib/windowStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { buildSystemContext, parseAndExecuteActions } from "@/lib/aiContext";

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const isAction = lang === "action";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;

      if (isAction) {
        nodes.push(
          <div
            key={`action-${nodes.length}`}
            className="my-2 px-3 py-2 rounded-lg text-[11px] font-mono flex items-center gap-2"
            style={{ background: "rgba(200,169,126,0.08)", border: "1px solid rgba(200,169,126,0.15)", color: "#C8A97E" }}
          >
            <Bot size={12} />
            <span>System action executed</span>
          </div>
        );
      } else {
        nodes.push(
          <pre
            key={`code-${nodes.length}`}
            className="my-2 p-3 rounded-lg text-[11.5px] font-mono overflow-x-auto"
            style={{ background: "rgba(0,0,0,0.4)", color: "#C8C6C0", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {codeLines.join("\n")}
          </pre>
        );
      }
      continue;
    }

    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-relaxed">
        {formatInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) {
      parts.push(<strong key={`b-${match.index}`} style={{ fontWeight: 600 }}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(
        <code key={`c-${match.index}`} className="px-1 py-0.5 rounded text-[11px] font-mono"
          style={{ background: "rgba(255,255,255,0.06)", color: "#C8A97E" }}>
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// ── Status Panel ─────────────────────────────────────────────────────────────
function StatusPanel() {
  const windows = useWindowStore((s) => s.windows);
  const uptimeSeconds = useHealthStore((s) => s.uptimeSeconds);
  const errorCount = useHealthStore((s) => s.errorCount);
  const doNotDisturb = useSettingsStore((s) => s.doNotDisturb);
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const provider = useAIStore((s) => s.provider);
  const ollamaModel = useAIStore((s) => s.ollamaModel);

  const [sysInfo, setSysInfo] = useState<{ cpu: number; ram: number } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await window.electronAPI?.getSysInfo();
        if (data) setSysInfo({ cpu: data.cpu, ram: data.ram });
      } catch { /* noop */ }
    };
    fetchInfo();
    const id = setInterval(fetchInfo, 3000);
    return () => clearInterval(id);
  }, []);

  const openApps = windows.filter((w) => !w.isMinimized);
  const statStyle = { color: "rgba(255,255,255,0.35)", fontSize: "10px" };
  const valStyle = { color: "rgba(200,169,126,0.7)", fontSize: "10px", fontFamily: "var(--font-mono)" };

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto"
      style={{ borderRight: "1px solid rgba(255,255,255,0.05)", width: 200, flexShrink: 0 }}>
      <div className="text-[9px] font-mono font-bold tracking-[0.18em] uppercase mb-1"
        style={{ color: "rgba(255,255,255,0.18)" }}>System Status</div>

      {/* Provider */}
      <div className="flex items-center gap-2">
        {provider === "ollama"
          ? <Server size={10} style={{ color: "rgba(200,169,126,0.4)", flexShrink: 0 }} />
          : <Cloud size={10} style={{ color: "rgba(200,169,126,0.4)", flexShrink: 0 }} />
        }
        <div>
          <div style={statStyle}>Provider</div>
          <div style={valStyle}>{provider === "ollama" ? ollamaModel.split(":")[0] : "claude-sonnet-4-6"}</div>
        </div>
      </div>

      {/* Open Apps */}
      <div className="flex items-start gap-2">
        <AppWindow size={10} style={{ color: "rgba(200,169,126,0.4)", marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={statStyle}>Open Apps</div>
          <div style={valStyle}>{openApps.length === 0 ? "None" : openApps.map((w) => w.title).join(", ")}</div>
        </div>
      </div>

      {/* CPU */}
      <div className="flex items-center gap-2">
        <Cpu size={10} style={{ color: "rgba(200,169,126,0.4)", flexShrink: 0 }} />
        <div>
          <div style={statStyle}>CPU</div>
          <div style={valStyle}>{sysInfo ? `${sysInfo.cpu}%` : "--"}</div>
        </div>
      </div>

      {/* RAM */}
      <div className="flex items-center gap-2">
        <HardDrive size={10} style={{ color: "rgba(200,169,126,0.4)", flexShrink: 0 }} />
        <div>
          <div style={statStyle}>RAM</div>
          <div style={valStyle}>{sysInfo ? `${sysInfo.ram}%` : "--"}</div>
        </div>
      </div>

      {/* Uptime */}
      <div className="flex items-center gap-2">
        <Clock size={10} style={{ color: "rgba(200,169,126,0.4)", flexShrink: 0 }} />
        <div>
          <div style={statStyle}>Uptime</div>
          <div style={valStyle}>{formatUptime(uptimeSeconds)}</div>
        </div>
      </div>

      {/* DND */}
      <div className="flex items-center gap-2">
        <BellOff size={10} style={{ color: doNotDisturb ? "#FEBC2E" : "rgba(200,169,126,0.4)", flexShrink: 0 }} />
        <div>
          <div style={statStyle}>DND</div>
          <div style={valStyle}>{doNotDisturb ? "ON" : "OFF"}</div>
        </div>
      </div>

      <div className="mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={statStyle}>{unread} unread notification{unread !== 1 ? "s" : ""}</div>
        {errorCount > 0 && <div className="text-[10px] mt-1" style={{ color: "#FF5F57" }}>{errorCount} error{errorCount !== 1 ? "s" : ""}</div>}
      </div>
    </div>
  );
}

// ── Ollama model picker ───────────────────────────────────────────────────────
const OLLAMA_MODELS = [
  "llama3:latest",
  "llama2:latest",
  "gemma3:1b",
  "gemma2:latest",
  "qwen3-coder:30b",
  "qwq:latest",
  "Omoeba/gpt-oss-coder:20b",
  "gpt-oss:120b",
];

function ModelPicker() {
  const ollamaModel = useAIStore((s) => s.ollamaModel);
  const setOllamaModel = useAIStore((s) => s.setOllamaModel);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-colors"
        style={{ background: "rgba(200,169,126,0.08)", border: "1px solid rgba(200,169,126,0.15)", color: "rgba(200,169,126,0.7)" }}
      >
        {ollamaModel.split(":")[0]}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1"
          style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.08)", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
        >
          {OLLAMA_MODELS.map((m) => (
            <button
              key={m}
              onClick={() => { setOllamaModel(m); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors hover:bg-white/5"
              style={{ color: m === ollamaModel ? "#C8A97E" : "rgba(255,255,255,0.5)" }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Setup screen ─────────────────────────────────────────────────────────────
function SetupScreen() {
  const [key, setKey] = useState("");
  const { setApiKey, setProvider, provider } = useAIStore();

  const useOllama = () => {
    setProvider("ollama");
    setApiKey("ollama");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-3">
        {/* Local AI option */}
        <div
          className="p-5 rounded-2xl text-center cursor-pointer transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(200,169,126,0.08)", border: "1px solid rgba(200,169,126,0.15)" }}>
            <Server size={20} style={{ color: "#C8A97E" }} />
          </div>
          <h2 className="text-[14px] font-semibold mb-1" style={{ color: "#F0EDE6" }}>Use Local AI</h2>
          <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Run ARIA with Ollama — fully offline, no API key needed. 8 models available on your home cloud.
          </p>
          <button
            onClick={useOllama}
            className="w-full py-2 rounded-lg text-[12px] font-semibold transition-colors"
            style={{ background: "rgba(200,169,126,0.15)", border: "1px solid rgba(200,169,126,0.3)", color: "#C8A97E", cursor: "pointer" }}
          >
            Connect to Ollama
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Claude option */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(200,169,126,0.08)", border: "1px solid rgba(200,169,126,0.15)" }}>
            <Cloud size={20} style={{ color: "#C8A97E" }} />
          </div>
          <h2 className="text-[14px] font-semibold mb-1 text-center" style={{ color: "#F0EDE6" }}>Use Claude</h2>
          <p className="text-[11px] mb-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            Connect ARIA to Anthropic&apos;s Claude for the most capable responses.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Key size={13} style={{ color: "rgba(200,169,126,0.5)", flexShrink: 0 }} />
              <input
                type="password"
                placeholder="sk-ant-..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="os-input flex-1 text-[12px] px-3 py-2 rounded-lg font-mono"
                onKeyDown={(e) => { if (e.key === "Enter" && key.trim()) { setProvider("claude"); setApiKey(key.trim()); } }}
              />
            </div>
            <button
              onClick={() => { if (key.trim()) { setProvider("claude"); setApiKey(key.trim()); } }}
              disabled={!key.trim()}
              className="w-full py-2 rounded-lg text-[12px] font-semibold transition-colors"
              style={{
                background: key.trim() ? "rgba(200,169,126,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${key.trim() ? "rgba(200,169,126,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: key.trim() ? "#C8A97E" : "rgba(255,255,255,0.2)",
                cursor: key.trim() ? "pointer" : "not-allowed",
              }}
            >
              Save API Key
            </button>
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-[10px] font-mono"
              style={{ color: "rgba(200,169,126,0.5)" }}>
              Get key at console.anthropic.com <ExternalLink size={9} />
            </a>
          </div>
        </div>

        {provider === "ollama" && (
          <p className="text-center text-[10px]" style={{ color: "rgba(200,169,126,0.5)" }}>
            ✓ Connected to Ollama — click Connect above to launch ARIA
          </p>
        )}
      </div>
    </div>
  );
}

// ── Voice input hook ──────────────────────────────────────────────────────────
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRec = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, onResult]);

  return { listening, toggle, supported: typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) };
}

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTED = [
  "What apps are currently open?",
  "Open the quantum lab",
  "Show me the latest news",
  "Switch to light mode",
  "Who is Brian Ndege?",
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const {
    apiKey, provider, ollamaModel, ollamaUrl,
    messages, isStreaming,
    addMessage, updateLastMessage, clearHistory, setStreaming,
  } = useAIStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: AIMessage = { id: `msg-${Date.now()}`, role: "user", content: text.trim(), timestamp: Date.now() };
    addMessage(userMsg);
    setInput("");

    const assistantMsg: AIMessage = { id: `msg-${Date.now() + 1}`, role: "assistant", content: "", timestamp: Date.now() };
    addMessage(assistantMsg);
    setStreaming(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const allMsgs = [...useAIStore.getState().messages];
      const apiMessages = allMsgs
        .filter((m) => m.content.length > 0)
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      let fullResponse = "";

      if (provider === "ollama") {
        // ── Ollama streaming ─────────────────────────────────────────────────
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: ollamaModel,
            stream: true,
            messages: [
              { role: "system", content: buildSystemContext() },
              ...apiMessages,
            ],
          }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error(`Ollama error ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              const chunk = event?.message?.content;
              if (chunk) {
                fullResponse += chunk;
                updateLastMessage(chunk);
              }
            } catch { /* skip */ }
          }
        }
      } else {
        // ── Claude streaming ─────────────────────────────────────────────────
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            stream: true,
            system: buildSystemContext(),
            messages: apiMessages,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API error ${response.status}: ${err}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const event = JSON.parse(data);
              if (event.type === "content_block_delta" && event.delta?.text) {
                fullResponse += event.delta.text;
                updateLastMessage(event.delta.text);
              }
            } catch { /* skip */ }
          }
        }
      }

      parseAndExecuteActions(fullResponse);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Unknown error";
      updateLastMessage(`\n\n**Error:** ${message}`);
      useHealthStore.getState().recordError(message, "stream");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [apiKey, provider, ollamaModel, ollamaUrl, isStreaming, addMessage, updateLastMessage, setStreaming]);

  const { listening, toggle: toggleVoice, supported: voiceSupported } = useVoiceInput((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  });

  const isReady = provider === "ollama" ? apiKey === "ollama" : !!apiKey;

  if (!isReady) {
    return (
      <div className="flex flex-col h-full" style={{ background: "#0A0A0C" }}>
        <Header provider={provider} ollamaModel={ollamaModel} onClear={clearHistory} />
        <SetupScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0C" }}>
      <Header provider={provider} ollamaModel={ollamaModel} onClear={clearHistory} />
      <div className="flex flex-1 min-h-0">
        <StatusPanel />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(200,169,126,0.06)", border: "1px solid rgba(200,169,126,0.1)" }}>
                  <Bot size={28} style={{ color: "rgba(200,169,126,0.4)" }} />
                </div>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Ask ARIA anything or try a suggestion
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                      style={{ background: "rgba(200,169,126,0.06)", border: "1px solid rgba(200,169,126,0.12)", color: "rgba(200,169,126,0.6)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id && msg.role === "assistant"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  title={listening ? "Stop listening" : "Voice input"}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
                  style={{
                    background: listening ? "rgba(255,95,87,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${listening ? "rgba(255,95,87,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: listening ? "#FF5F57" : "rgba(255,255,255,0.2)",
                  }}
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={listening ? "Listening..." : "Message ARIA..."}
                disabled={isStreaming}
                className="os-input flex-1 text-[12.5px] px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.025)" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
                style={{
                  background: input.trim() && !isStreaming ? "rgba(200,169,126,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${input.trim() && !isStreaming ? "rgba(200,169,126,0.25)" : "rgba(255,255,255,0.06)"}`,
                  color: input.trim() && !isStreaming ? "#C8A97E" : "rgba(255,255,255,0.15)",
                  cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ provider, ollamaModel, onClear }: { provider: AIProvider; ollamaModel: string; onClear: () => void }) {
  const { setApiKey, setProvider } = useAIStore();

  const switchProvider = () => {
    setApiKey("");
    setProvider("claude");
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-2">
        <span style={{ color: "#C8A97E", fontSize: 14 }}>&#x2B21;</span>
        <span className="text-[12px] font-bold tracking-[0.1em]" style={{ color: "#C8A97E" }}>ARIA</span>

        {provider === "ollama" ? (
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1"
              style={{ background: "rgba(200,169,126,0.08)", color: "rgba(200,169,126,0.45)", border: "1px solid rgba(200,169,126,0.1)" }}>
              <Server size={8} /> local
            </span>
            <ModelPicker />
          </div>
        ) : (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1"
            style={{ background: "rgba(200,169,126,0.08)", color: "rgba(200,169,126,0.45)", border: "1px solid rgba(200,169,126,0.1)" }}>
            <Cloud size={8} /> claude-sonnet-4-6
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={switchProvider}
          title="Switch provider"
          className="px-2 py-1 rounded-md text-[9px] font-mono transition-colors"
          style={{ color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          switch
        </button>
        <button onClick={onClear} title="Clear history"
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isStreaming }: { msg: AIMessage; isStreaming: boolean }) {
  const isUser = msg.role === "user";
  const time = new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-[12.5px]"
        style={isUser
          ? { background: "rgba(200,169,126,0.12)", border: "1px solid rgba(200,169,126,0.18)", color: "#F0EDE6" }
          : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", color: "#C8C6C0" }
        }
      >
        <div className="space-y-1">
          {msg.content ? renderMarkdown(msg.content) : null}
          {isStreaming && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}
              style={{ color: "#C8A97E" }}>&#x25CB;</motion.span>
          )}
        </div>
        <div className="mt-1.5 text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{time}</div>
      </div>
    </motion.div>
  );
}
