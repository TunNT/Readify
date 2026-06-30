"use client";

import { Pencil, Plus, Power, PowerOff, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  adminApi,
  type AdPlacement,
  type AdminNovel,
  type AdminUser,
} from "./admin-api";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  SectionHeader,
} from "./admin-shell";
import styles from "./admin.module.css";

const pageTypes = [
  ["HOME", "Homepage"],
  ["NOVEL_LIST", "Novel catalog"],
  ["CATEGORY", "Category pages"],
  ["NOVEL_DETAIL", "Novel detail pages"],
  ["CHAPTER_READER", "Chapter reader"],
  ["SEARCH", "Search results"],
  ["CONTENT_PAGE", "Content pages"],
] as const;
const locationLabels: Record<string, string> = {
  HEAD: "Head script",
  OPEN_BODY: "Opening body script",
  CLOSE_BODY: "Closing body script",
  TOP: "Top of page",
  BOTTOM: "Bottom of page",
  BELOW_CHAPTER_TITLE: "Below chapter title",
  INLINE: "Between chapter paragraphs",
};
const scopeLabels: Record<string, string> = {
  GLOBAL: "Entire website",
  PAGE_TYPE: "A type of page",
  SPECIFIC_PAGE: "A specific page or novel",
};

export function AdsPanel({ user }: { user: AdminUser }) {
  const [data, setData] = useState<AdPlacement[] | null>(null);
  const [novels, setNovels] = useState<AdminNovel[]>([]);
  const [editing, setEditing] = useState<AdPlacement | null | undefined>(
    undefined,
  );
  const [error, setError] = useState("");
  const canWrite = user.role === "SUPER_ADMIN";
  const load = useCallback(
    () =>
      adminApi<{ data: AdPlacement[] }>("/ads")
        .then((body) => setData(body.data))
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    void load();
    adminApi<{ data: AdminNovel[] }>("/novels?limit=100")
      .then((body) => setNovels(body.data))
      .catch(() => setNovels([]));
  }, [load]);
  const save = async (body: Record<string, unknown>) => {
    try {
      await adminApi(`/ads${editing?.id ? `/${editing.id}` : ""}`, {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setEditing(undefined);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const toggle = async (ad: AdPlacement) => {
    try {
      await adminApi(`/ads/${ad.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: !ad.isEnabled }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const remove = async (ad: AdPlacement) => {
    if (!confirm(`Delete ad placement ${ad.name}?`)) return;
    try {
      await adminApi(`/ads/${ad.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (!data && !error) return <LoadingState />;
  return (
    <>
      <SectionHeader
        title="Ad placements"
        description="Choose where an ad appears without entering route codes or technical keys."
        action={
          canWrite ? (
            <button
              className={styles.primaryButton}
              onClick={() => setEditing(null)}
            >
              <Plus size={16} /> Add placement
            </button>
          ) : undefined
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {data?.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Placement</th>
                <th>Shows on</th>
                <th>Position</th>
                <th>Device</th>
                <th>Priority</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <div className={styles.tableTitle}>
                      <strong>{ad.name}</strong>
                      <span>{ad.codeType}</span>
                    </div>
                  </td>
                  <td>{describeScope(ad)}</td>
                  <td>
                    {locationLabels[ad.location] ?? ad.location}
                    {ad.wordInterval ? ` · every ${ad.wordInterval} words` : ""}
                  </td>
                  <td>{ad.device}</td>
                  <td>{ad.priority > 0 ? ad.priority : "Legacy"}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${ad.isEnabled ? styles.badgeOn : styles.badgeOff}`}
                    >
                      {ad.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    {canWrite ? (
                      <div className={styles.actions}>
                        <button
                          className={styles.iconButton}
                          title={ad.isEnabled ? "Disable" : "Enable"}
                          aria-label={ad.isEnabled ? "Disable ad" : "Enable ad"}
                          onClick={() => toggle(ad)}
                        >
                          {ad.isEnabled ? (
                            <PowerOff size={16} />
                          ) : (
                            <Power size={16} />
                          )}
                        </button>
                        <button
                          className={styles.iconButton}
                          title="Edit"
                          onClick={() => setEditing(ad)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={styles.iconButton}
                          title="Delete"
                          onClick={() => remove(ad)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No ad placements configured. Ads remain absent from the public site." />
      )}
      {editing !== undefined ? (
        <AdEditor
          ad={editing}
          novels={novels}
          onClose={() => setEditing(undefined)}
          onSave={save}
        />
      ) : null}
    </>
  );
}

function describeScope(ad: AdPlacement) {
  if (ad.scope === "GLOBAL") return "Entire website";
  if (ad.scope === "PAGE_TYPE")
    return (
      pageTypes.find(([value]) => value === ad.scopeValue)?.[1] ?? ad.scopeValue
    );
  return ad.scopeValue?.endsWith("/*")
    ? `All chapters · ${ad.scopeValue.split("/")[2]}`
    : (ad.scopeValue ?? "Specific page");
}

function AdEditor({
  ad,
  novels,
  onClose,
  onSave,
}: {
  ad: AdPlacement | null;
  novels: AdminNovel[];
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => Promise<void>;
}) {
  const initialSpecific = useMemo(
    () => specificState(ad, novels),
    [ad, novels],
  );
  const [name, setName] = useState(ad?.name ?? "");
  const [scope, setScope] = useState(ad?.scope ?? "GLOBAL");
  const [pageType, setPageType] = useState(
    ad?.scope === "PAGE_TYPE" ? (ad.scopeValue ?? "HOME") : "HOME",
  );
  const [specificType, setSpecificType] = useState(initialSpecific.type);
  const [novelSlug, setNovelSlug] = useState(initialSpecific.slug);
  const [customPath, setCustomPath] = useState(initialSpecific.path);
  const [location, setLocation] = useState(ad?.location ?? "TOP");
  const scopeValue =
    scope === "GLOBAL"
      ? undefined
      : scope === "PAGE_TYPE"
        ? pageType
        : specificType === "CUSTOM_PATH"
          ? customPath
          : specificType === "NOVEL_CHAPTERS"
            ? `/novels/${novelSlug}/*`
            : `/novels/${novelSlug}`;
  const summary =
    scope === "GLOBAL"
      ? "This ad will appear across every public page."
      : scope === "PAGE_TYPE"
        ? `This ad will appear on all ${pageTypes.find(([value]) => value === pageType)?.[1].toLowerCase()}.`
        : specificType === "CUSTOM_PATH"
          ? `This ad will appear on ${customPath || "the selected custom path"}.`
          : specificType === "NOVEL_CHAPTERS"
            ? `This ad will appear in every chapter of ${novels.find((item) => item.slug === novelSlug)?.title ?? "the selected story"}.`
            : `This ad will appear only on the detail page for ${novels.find((item) => item.slug === novelSlug)?.title ?? "the selected story"}.`;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = (key: string) =>
      form.get(key) ? Number(form.get(key)) : null;
    void onSave({
      name,
      scope,
      scopeValue,
      location,
      codeType: form.get("codeType"),
      code: form.get("code"),
      device: form.get("device"),
      wordInterval: location === "INLINE" ? number("wordInterval") : null,
      maxInsertions: location === "INLINE" ? 1 : null,
      priority: Number(form.get("priority") || 1),
      startsAt: form.get("startsAt")
        ? new Date(String(form.get("startsAt"))).toISOString()
        : null,
      endsAt: form.get("endsAt")
        ? new Date(String(form.get("endsAt"))).toISOString()
        : null,
    });
  };
  return (
    <div className={styles.modalBackdrop}>
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalHeader}>
          <h2>{ad ? "Edit ad placement" : "Add ad placement"}</h2>
          <button
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className={`${styles.modalBody} ${styles.formGrid}`}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="ad-name">Placement name</label>
              <input
                id="ad-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Homepage top banner"
                required
              />
              <span className={styles.helperText}>
                Use a name your team will recognize. The technical key is
                generated automatically.
              </span>
            </div>
            <div className={styles.field}>
              <label htmlFor="ad-scope">Show this ad on</label>
              <select
                id="ad-scope"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
              >
                <option value="GLOBAL">Entire website</option>
                <option value="PAGE_TYPE">A type of page</option>
                <option value="SPECIFIC_PAGE">A specific page or novel</option>
              </select>
            </div>
            {scope === "PAGE_TYPE" ? (
              <div className={styles.field}>
                <label htmlFor="ad-page-type">Page type</label>
                <select
                  id="ad-page-type"
                  value={pageType}
                  onChange={(event) => setPageType(event.target.value)}
                >
                  {pageTypes.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {scope === "SPECIFIC_PAGE" ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="ad-specific-type">Target</label>
                  <select
                    id="ad-specific-type"
                    value={specificType}
                    onChange={(event) => setSpecificType(event.target.value)}
                  >
                    <option value="NOVEL_DETAIL">One story detail page</option>
                    <option value="NOVEL_CHAPTERS">
                      All chapters of one story
                    </option>
                    <option value="CUSTOM_PATH">
                      Advanced: custom URL path
                    </option>
                  </select>
                </div>
                {specificType !== "CUSTOM_PATH" ? (
                  <div className={styles.field}>
                    <label htmlFor="ad-novel">Story</label>
                    <select
                      id="ad-novel"
                      value={novelSlug}
                      onChange={(event) => setNovelSlug(event.target.value)}
                      required
                    >
                      <option value="">Select a story</option>
                      {novels.map((novel) => (
                        <option value={novel.slug} key={novel.id}>
                          {novel.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={styles.field}>
                    <label htmlFor="ad-custom-path">Custom URL path</label>
                    <input
                      id="ad-custom-path"
                      value={customPath}
                      onChange={(event) => setCustomPath(event.target.value)}
                      pattern="/.*"
                      placeholder="/novels/example/*"
                      required
                    />
                    <span className={styles.helperText}>
                      Use only when the page is not available in the selectors.
                    </span>
                  </div>
                )}
              </>
            ) : null}
            <div className={`${styles.scopeSummary} ${styles.fieldFull}`}>
              <strong>Placement preview</strong>
              <span>
                {summary} Position: {locationLabels[location]?.toLowerCase()}.
              </span>
            </div>
            <div className={styles.field}>
              <label htmlFor="ad-location">Position</label>
              <select
                id="ad-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                {Object.entries(locationLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Code type</label>
              <select name="codeType" defaultValue={ad?.codeType ?? "HTML"}>
                <option value="HTML">HTML or ad-unit snippet</option>
                <option value="INLINE_JS">Inline JavaScript</option>
                <option value="EXTERNAL_SCRIPT">External HTTPS script</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Device</label>
              <select name="device" defaultValue={ad?.device ?? "ALL"}>
                <option value="ALL">Desktop and mobile</option>
                <option value="DESKTOP">Desktop only</option>
                <option value="MOBILE">Mobile only</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Priority</label>
              <input
                name="priority"
                type="number"
                min="1"
                max="1000"
                defaultValue={ad?.priority && ad.priority > 0 ? ad.priority : 1}
              />
              <span className={styles.helperText}>
                1 is the highest priority. Inline ads appear once per
                chapter/page, then the next priority is used at the next word
                interval.
              </span>
            </div>
            {location === "INLINE" ? (
              <div className={styles.field}>
                <label>Words between ads</label>
                <input
                  name="wordInterval"
                  type="number"
                  min="10"
                  defaultValue={ad?.wordInterval ?? 50}
                  required
                />
                <span className={styles.helperText}>
                  Example: 50 means priority 1 appears after 50 words, priority
                  2 after the next 50 words. Each ad appears once on the current
                  page.
                </span>
              </div>
            ) : null}
            <div className={styles.field}>
              <label>Starts at</label>
              <input
                name="startsAt"
                type="datetime-local"
                defaultValue={ad?.startsAt?.slice(0, 16)}
              />
            </div>
            <div className={styles.field}>
              <label>Ends at</label>
              <input
                name="endsAt"
                type="datetime-local"
                defaultValue={ad?.endsAt?.slice(0, 16)}
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>HTML, JavaScript, or external script URL</label>
              <textarea
                className={styles.codeArea}
                name="code"
                defaultValue={ad?.code}
                required
              />
              <span className={styles.helperText}>For an unknown third-party player, wrap the complete snippet in <code>&lt;div data-ad-runtime=&quot;iframe&quot;&gt;...&lt;/div&gt;</code> to isolate its DOM, CSS, and globals.</span>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button className={styles.primaryButton}>Save placement</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function specificState(ad: AdPlacement | null, _novels: AdminNovel[]) {
  if (ad?.scope !== "SPECIFIC_PAGE")
    return { type: "NOVEL_DETAIL", slug: "", path: "" };
  const value = ad.scopeValue ?? "";
  const match = value.match(/^\/novels\/([^/]+)(\/\*)?$/);
  if (!match) return { type: "CUSTOM_PATH", slug: "", path: value };
  return {
    type: match[2] ? "NOVEL_CHAPTERS" : "NOVEL_DETAIL",
    slug: match[1],
    path: "",
  };
}
