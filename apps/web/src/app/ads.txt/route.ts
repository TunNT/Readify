import { apiFetchText } from "../../lib/api";

export async function GET() {
  const content = await apiFetchText("/settings/ads.txt");
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "Cloudflare-CDN-Cache-Control": "public, max-age=300, stale-while-revalidate=600"
    }
  });
}
