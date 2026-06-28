export class AdminApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function adminApi<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`/api/admin${path}`, { ...options, credentials: "include", headers: options.body instanceof FormData ? options.headers : { "Content-Type": "application/json", ...options.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message ?? `Request failed (${response.status})`;
    throw new AdminApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

export type AdminUser = { id:string; email:string; displayName:string; role:"SUPER_ADMIN"|"ADMIN"|"EDITOR"|"ADS_MANAGER"; isActive?:boolean; lastLoginAt?:string|null; createdAt?:string };
export type Taxonomy = { id:string; name:string; slug:string; icon?:string|null; _count?:{novels:number} };
export type AdminNovel = { id:string; title:string; slug:string; authorName?:string|null; description:string; status:string; isPublished:boolean; deletedAt?:string|null; coverAssetId?:string|null; coverAsset?:{publicUrl?:string|null}; categories:Array<{category:Taxonomy}>; tags:Array<{tag:Taxonomy}>; chapters?:AdminChapter[]; _count?:{chapters:number} };
export type AdminChapter = { id:string; number:number; slug:string; title:string; content:string; excerpt:string; publishedAt?:string|null };
export type AdPlacement = { id:string; name:string; key:string; scope:string; scopeValue?:string|null; location:string; codeType:string; code:string; device:string; wordInterval?:number|null; maxInsertions?:number|null; priority:number; isEnabled:boolean; startsAt?:string|null; endsAt?:string|null };
export type ContentPage = { id:string; slug:string; title:string; contentHtml:string; updatedAt:string };
export type Ranking = { id:string; listKey:string; position:number; label?:string|null; novelId:string; novel:{id:string;title:string;slug:string} };
export type SiteSettings = { siteName:string; siteUrl:string; seoTitle:string; seoDescription:string; logoAssetId?:string|null; faviconAssetId?:string|null; socialImageAssetId?:string|null; logoUrl?:string|null; faviconUrl?:string|null; socialImageUrl?:string|null };
