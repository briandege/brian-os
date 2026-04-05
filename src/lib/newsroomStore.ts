import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Article {
  id: string;
  title: string;
  body: string;
  summary: string;
  author: string;
  category: string;
  tags: string[];
  status: "draft" | "published";
  createdAt: number;
  publishedAt?: number;
  slug?: string;
  distributed?: boolean; // pushed to public API/RSS
}

interface NewsroomState {
  articles: Article[];
  draftId: string | null;
  // actions
  createDraft: () => string;
  updateArticle: (id: string, changes: Partial<Omit<Article, "id">>) => void;
  publishArticle: (id: string) => void;
  deleteArticle: (id: string) => void;
  setDraftId: (id: string | null) => void;
}

export const useNewsroomStore = create<NewsroomState>()(
  persist(
    (set, get) => ({
      articles: [],
      draftId: null,

      createDraft() {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const article: Article = {
          id,
          title: "",
          body: "",
          summary: "",
          author: "Brian Ndege",
          category: "Technology",
          tags: [],
          status: "draft",
          createdAt: Date.now(),
          slug: id,
        };
        set((s) => ({ articles: [article, ...s.articles], draftId: id }));
        return id;
      },

      updateArticle(id, changes) {
        set((s) => ({
          articles: s.articles.map((a) => (a.id === id ? { ...a, ...changes } : a)),
        }));
      },

      publishArticle(id) {
        set((s) => ({
          articles: s.articles.map((a) =>
            a.id === id ? { ...a, status: "published" as const, publishedAt: Date.now() } : a
          ),
        }));
      },

      deleteArticle(id) {
        set((s) => ({
          articles: s.articles.filter((a) => a.id !== id),
          draftId: s.draftId === id ? null : s.draftId,
        }));
      },

      setDraftId(draftId) {
        set({ draftId });
      },
    }),
    { name: "strontium-newsroom" }
  )
);
