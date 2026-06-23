const serverApiUrl = (
  process.env.INTERNAL_API_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_API_URL : undefined) ??
  "http://localhost:4000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${serverApiUrl}/api${path}`, { cache: "no-store" });
  if (!response.ok) {
    let message = `API request failed with ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message) ? body.message.join(", ") : body.message ?? message;
    } catch {
      // Keep the status-based message for non-JSON responses.
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export function proxiedCoverUrl(coverUrl?: string | null) {
  if (!coverUrl) return "/covers/placeholder.svg";
  try {
    return `/covers/${new URL(coverUrl).pathname.split("/").pop()}`;
  } catch {
    return coverUrl;
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "Recently updated";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}
