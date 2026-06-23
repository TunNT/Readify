export class ReaderApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readerApi<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api/auth${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message ?? `Request failed (${response.status})`;
    throw new ReaderApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
