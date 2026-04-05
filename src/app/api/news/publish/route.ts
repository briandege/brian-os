/**
 * POST /api/news/publish — Called by the Newsroom app when publishing an article.
 * Adds the article to the in-memory cache powering /api/rss and /api/news.
 *
 * Body: { id, title, body, category, tags, publishedAt, author?, summary?, slug? }
 */
import { type NextRequest, NextResponse } from "next/server";
import { articleCache } from "@/lib/articleCache";

export const dynamic = "force-static";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as {
      id: string;
      title: string;
      body: string;
      category: string;
      tags?: string[];
      publishedAt: number;
      author?: string;
      summary?: string;
      slug?: string;
    };

    if (!data.id || !data.title) {
      return NextResponse.json({ error: "id and title required" }, { status: 400 });
    }

    // Upsert — remove old version if re-publishing
    const idx = articleCache.findIndex((a) => a.id === data.id);
    const entry = {
      id:          data.id,
      title:       data.title,
      body:        data.body ?? "",
      category:    data.category ?? "General",
      tags:        data.tags ?? [],
      publishedAt: data.publishedAt ?? Date.now(),
      author:      data.author ?? "Brian Ndege",
      summary:     data.summary,
      slug:        data.slug ?? data.id,
    };

    if (idx >= 0) {
      articleCache[idx] = entry;
    } else {
      articleCache.unshift(entry);
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
