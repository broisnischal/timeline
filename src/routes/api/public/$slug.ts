import { createFileRoute } from "@tanstack/react-router";

import { getPublicTasksBySlug } from "@/lib/timeline/repo.server";

type FeedFormat = "json" | "raw" | "rss";

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function pickAnchorDate(row: { dueAt: Date | null; startsAt: Date | null; createdAt: Date }) {
  return row.dueAt ?? row.startsAt ?? row.createdAt;
}

function toRawFeed(data: NonNullable<Awaited<ReturnType<typeof getPublicTasksBySlug>>>) {
  const lines = data.tasks.map((t) => {
    const when = pickAnchorDate(t).toISOString();
    const space = t.spaceName;
    const status = t.status;
    return `${when}\t${space}\t${status}\t${t.title}`;
  });
  return lines.join("\n");
}

function toRssFeed(
  slug: string,
  data: NonNullable<Awaited<ReturnType<typeof getPublicTasksBySlug>>>,
  origin: string,
) {
  const linkBase = `${origin}/p/${slug}`;
  const link = data.selectedSpace?.publicSlug
    ? `${linkBase}?space=${encodeURIComponent(data.selectedSpace.publicSlug)}`
    : linkBase;
  const title = data.selectedSpace
    ? `${data.owner.name} - ${data.selectedSpace.name}`
    : `${data.owner.name} - Public timeline`;
  const description = data.selectedSpace
    ? `Public timeline feed for ${data.selectedSpace.name}`
    : "Public timeline feed";

  const items = data.tasks
    .slice(0, 200)
    .map((t) => {
      const when = pickAnchorDate(t).toUTCString();
      const notes = t.notes?.trim() ? `\n${t.notes.trim()}` : "";
      const body = `${t.spaceName} - ${t.status}${notes}`;
      return `<item><title>${escapeXml(t.title)}</title><description>${escapeXml(body)}</description><pubDate>${when}</pubDate><guid>${escapeXml(`${link}#${t.id}`)}</guid></item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(title)}</title><link>${escapeXml(link)}</link><description>${escapeXml(description)}</description>${items}</channel></rss>`;
}

export const Route = createFileRoute("/api/public/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const formatRaw = (url.searchParams.get("format") ?? "json").toLowerCase();
        const format: FeedFormat =
          formatRaw === "rss" ? "rss" : formatRaw === "raw" ? "raw" : "json";
        const space = url.searchParams.get("space")?.trim() || undefined;

        const data = await getPublicTasksBySlug(params.slug, { space });
        if (!data) {
          return new Response(JSON.stringify({ error: "not_found" }), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-store, max-age=0",
            },
          });
        }
        if (format === "raw") {
          return new Response(toRawFeed(data), {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-store, max-age=0",
            },
          });
        }
        if (format === "rss") {
          const xml = toRssFeed(params.slug, data, url.origin);
          return new Response(xml, {
            headers: {
              "Content-Type": "application/rss+xml; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-store, max-age=0",
            },
          });
        }
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, max-age=0",
          },
        });
      },
    },
  },
});
