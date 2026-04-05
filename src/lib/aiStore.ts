import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type AIProvider = "claude" | "ollama";

interface AIState {
  apiKey: string;
  provider: AIProvider;
  ollamaModel: string;
  ollamaUrl: string;
  messages: AIMessage[];
  isStreaming: boolean;
  // actions
  setApiKey: (key: string) => void;
  setProvider: (p: AIProvider) => void;
  setOllamaModel: (m: string) => void;
  setOllamaUrl: (u: string) => void;
  addMessage: (msg: AIMessage) => void;
  updateLastMessage: (text: string) => void;
  clearHistory: () => void;
  setStreaming: (v: boolean) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      apiKey: "",
      provider: "claude",
      ollamaModel: "llama3:latest",
      ollamaUrl: "http://localhost:11434",
      messages: [],
      isStreaming: false,

      setApiKey(apiKey) { set({ apiKey }); },
      setProvider(provider) { set({ provider }); },
      setOllamaModel(ollamaModel) { set({ ollamaModel }); },
      setOllamaUrl(ollamaUrl) { set({ ollamaUrl }); },

      addMessage(msg) {
        set((s) => ({ messages: [...s.messages, msg] }));
      },

      updateLastMessage(text) {
        set((s) => {
          const msgs = [...s.messages];
          if (msgs.length === 0) return s;
          const last = msgs[msgs.length - 1];
          msgs[msgs.length - 1] = { ...last, content: last.content + text };
          return { messages: msgs };
        });
      },

      clearHistory() { set({ messages: [] }); },
      setStreaming(isStreaming) { set({ isStreaming }); },
    }),
    {
      name: "strontium-ai",
      partialize: (state) => ({
        apiKey: state.apiKey,
        provider: state.provider,
        ollamaModel: state.ollamaModel,
        ollamaUrl: state.ollamaUrl,
      }),
    }
  )
);
