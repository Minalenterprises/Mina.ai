import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  url: string;
}

// Strip HTML to plain text, extract title + meta + first chunk of body text.
function extractContent(html: string, url: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? url;

  // meta description
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  );
  const desc = descMatch?.[1]?.trim();

  // og:image
  const ogImgMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  const ogImage = ogImgMatch?.[1]?.trim();

  // og:site_name
  const ogSiteMatch = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
  );
  const siteName = ogSiteMatch?.[1]?.trim();

  // email addresses
  const emails = Array.from(
    new Set(
      (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? []).filter(
        (e) => !e.endsWith(".png") && !e.endsWith(".jpg")
      )
    )
  ).slice(0, 3);

  // phone numbers (very loose)
  const phones = Array.from(
    new Set(
      (html.match(/\+?\d[\d\s\-().]{8,}\d/g) ?? [])
        .filter((p) => p.replace(/\D/g, "").length >= 10)
        .map((p) => p.trim())
    )
  ).slice(0, 3);

  // social handles
  const socials = Array.from(
    new Set(
      [
        ...(html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/g) ?? []),
        ...(html.match(/facebook\.com\/([a-zA-Z0-9_.]+)/g) ?? []),
        ...(html.match(/twitter\.com\/([a-zA-Z0-9_.]+)/g) ?? []),
        ...(html.match(/x\.com\/([a-zA-Z0-9_.]+)/g) ?? []),
        ...(html.match(/linkedin\.com\/company\/([a-zA-Z0-9_.-]+)/g) ?? []),
        ...(html.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/g) ?? []),
      ]
    )
  ).slice(0, 5);

  // strip scripts/styles, then tags
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  // Find an "about us" / "story" snippet
  const aboutIdx = text.toLowerCase().search(
    /(about us|our story|who we are|our mission|founded in)/i
  );
  const snippet =
    aboutIdx >= 0
      ? text.slice(aboutIdx, aboutIdx + 600).trim()
      : text.slice(0, 800).trim();

  return {
    title,
    description: desc,
    siteName,
    ogImage,
    emails,
    phones,
    socials,
    snippet,
    url,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    let url = body.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status}` },
        { status: 502 }
      );
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) {
      return NextResponse.json(
        { error: `Unsupported content-type: ${ct}` },
        { status: 415 }
      );
    }

    const html = await res.text();
    const extracted = extractContent(html, url);

    return NextResponse.json(extracted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "internal";
    if (msg.includes("abort")) {
      return NextResponse.json(
        { error: "Fetch timed out (12s)" },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
