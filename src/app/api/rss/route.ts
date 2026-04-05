/**
 * /api/rss — Public RSS 2.0 feed for strontium.os Newsroom.
 * All published articles are available to any RSS reader worldwide.
 */
import { type NextRequest, NextResponse } from "next/server";
import { articleCache } from "@/lib/articleCache";

export const dynamic = "force-static";

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL  ?? "https://strontium.os";
const SITE_TITLE = "strontium.os Newsroom — Brian Ndege";
const SITE_DESC  = "Breaking news and analysis from the strontium.os newsroom.";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRSS(items: typeof articleCache): string {
  const itemsXml = items
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 50)
    .map((a) => {
      const pubDate = new Date(a.publishedAt).toUTCString();
      const slug    = a.slug ?? a.id;
      const link    = `${SITE_URL}/newsroom/${slug}`;
      const desc    = escapeXml(a.summary ?? a.body.slice(0, 280).replace(/[#*`]/g, "") + "…");
      const cats    = a.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n        ");
      return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${a.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.category)}</category>
      ${cats}
      <description>${desc}</description>
      <author>${escapeXml(a.author ?? "Brian Ndege")}</author>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;
}

export async function GET(_req: NextRequest) {
  const xml = buildRSS(articleCache);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
