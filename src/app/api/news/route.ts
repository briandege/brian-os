/**
 * /api/news — Public JSON news API for strontium.os.
 * GET  /api/news             → list published articles (newest first)
 * GET  /api/news?category=X  → filter by category
 * GET  /api/news?q=term       → search title + body
 * GET  /api/news?limit=N      → limit results (max 100, default 20)
 * GET  /api/news?id=X         → single article
 */
import { type NextRequest, NextResponse } from "next/server";
import { articleCache } from "@/lib/articleCache";

export const dynamic = "force-static";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const q        = searchParams.get("q")?.toLowerCase();
  const limit    = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
  const id       = searchParams.get("id");

  let results = [...articleCache].sort((a, b) => b.publishedAt - a.publishedAt);

  if (id) {
    const article = results.find((a) => a.id === id);
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
    return NextResponse.json({ article }, { headers: CORS });
  }

  if (category) results = results.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  if (q)        results = results.filter((a) =>
    a.title.toLowerCase().includes(q) ||
    a.body.toLowerCase().includes(q) ||
    a.tags.some((t) => t.toLowerCase().includes(q))
  );

  const articles = results.slice(0, limit).map((a) => ({
    id:          a.id,
    title:       a.title,
    summary:     a.summary ?? a.body.slice(0, 280).replace(/[#*`]/g, "") + "…",
    category:    a.category,
    tags:        a.tags,
    author:      a.author ?? "Brian Ndege",
    publishedAt: new Date(a.publishedAt).toISOString(),
    url:         `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://strontium.os"}/newsroom/${a.slug ?? a.id}`,
  }));

  return NextResponse.json({
    total:    results.length,
    returned: articles.length,
    articles,
  }, { headers: CORS });
}
