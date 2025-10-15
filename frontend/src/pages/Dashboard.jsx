import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Search as SearchIcon,
  ChevronDown,
  ShieldAlert,
  Bug,
  Paperclip as PaperclipIcon,
  Star,
} from "lucide-react";
import { listMyReports, createReport, deleteReport } from "../services/reports";

/* ---------- helpers ---------- */
const safeBasename = (path) => {
  try {
    const u = new URL(path, window.location.origin);
    const base = u.pathname.split("/").pop();
    return decodeURIComponent(base || "файл");
  } catch {
    const parts = String(path || "").split("/");
    return decodeURIComponent(parts.pop() || "файл");
  }
};

const getPocName = (r) =>
  r?.poc_name ??
  r?.pocFilename ??
  r?.poc_file_name ??
  (typeof r?.poc_file === "string" ? safeBasename(r.poc_file) : null);

const getId = (r) =>
  r?.id ?? r?.pk ?? r?.uuid ?? r?._id ?? r?.report_id ?? r?.reportId;

const defaultNew = {
  title: "",
  target: "",
  cwe: "",
  cvss_score: "",
  description: "",
  impact: "",
  poc_file: null,
};

const severityPalette = {
  low: { badge: "text-cyber-blue", chip: "border-cyber-blue bg-cyber-blue/10" },
  medium: {
    badge: "text-cyber-orange",
    chip: "border-cyber-orange bg-cyber-orange/10",
  },
  high: {
    badge: "text-cyber-green",
    chip: "border-cyber-green bg-cyber-green/10",
  },
  critical: {
    badge: "text-destructive",
    chip: "border-destructive bg-destructive/10",
  },
};

function cvssToBucket(score) {
  const s = Number(score || 0);
  if (s >= 9) return "critical";
  if (s >= 7) return "high";
  if (s >= 4) return "medium";
  if (s > 0) return "low";
  return "low";
}

function Badge({ score }) {
  const sev = cvssToBucket(score);
  const p = severityPalette[sev];
  const label =
    sev === "critical"
      ? "Critical"
      : sev === "high"
      ? "High"
      : sev === "medium"
      ? "Medium"
      : "Low";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${p.chip}`}
    >
      <ShieldAlert className={`h-3.5 w-3.5 ${p.badge}`} />
      <span className={p.badge}>
        {label}
        {typeof score !== "undefined" && score !== ""
          ? ` • ${Number(score).toFixed(1)}`
          : ""}
      </span>
    </span>
  );
}

const formatStatus = (s) =>
  typeof s === "string" ? s.replaceAll("_", " ") : s ?? "";

/* ---------- component ---------- */

export default function Dashboard() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();
  const initials = (
    user?.username?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  const [reports, setReports] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState("");

  const [draft, setDraft] = useState(defaultNew);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [expandedId, setExpandedId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  async function fetchReports() {
    try {
      setErrorList("");
      setLoadingList(true);
      const data = await listMyReports();
      setReports(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setErrorList("Не вдалося завантажити звіти.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter(
        (r) =>
          !q ||
          r.title?.toLowerCase().includes(q) ||
          (r.target ?? "").toLowerCase().includes(q) ||
          (r.cwe ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [reports, search, filter]);

  const onChange = (e) =>
    setDraft((d) => ({ ...d, [e.target.name]: e.target.value }));
  const onFile = (e) =>
    setDraft((d) => ({ ...d, poc_file: e.target.files?.[0] ?? null }));

  const onCreate = async (e) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.description.trim()) return;
    try {
      setCreating(true);
      await createReport({
        ...draft,
        cvss_score:
          draft.cvss_score === "" ? undefined : Number(draft.cvss_score),
      });
      setDraft(defaultNew);
      setShowForm(false);
      fetchReports();
    } catch {
      alert("Помилка створення звіту. Перевірте дані.");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    if (id === undefined || id === null) return;
    const ok = window.confirm("Видалити цей звіт?");
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => getId(r) !== id));
      setExpandedId((cur) => (cur === id ? null : cur));
    } catch (e) {
      alert(`Не вдалося видалити звіт. ${e?.message ?? ""}`);
    } finally {
      setDeletingId(null);
    }
  };
  const STATUS_STYLES = {
    new: { chip: "border-cyber-orange bg-cyber-orange/10 text-cyber-orange" },
    in_review: { chip: "border-cyber-blue bg-cyber-blue/10 text-cyber-blue" },
    resolved: { chip: "border-cyber-green bg-cyber-green/10 text-cyber-green" },
    rejected: { chip: "border-destructive bg-destructive/10 text-destructive" },
  };
  const STATUS_LABEL = {
    new: "New",
    in_review: "In Review",
    resolved: "Resolved",
    rejected: "Rejected",
  };

  function StatusPill({ status }) {
    const s = (status || "").toLowerCase();
    const st = STATUS_STYLES[s] || STATUS_STYLES.new;
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${st.chip}`}
      >
        {STATUS_LABEL[s] || s}
      </span>
    );
  }

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-cyber-green" />
            <h1 className="text-lg font-bold tracking-tight">Мій Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:flex">
              <div className="group relative rounded-full p-[2px] bg-[linear-gradient(135deg,hsl(var(--cyber-green))_0%,hsl(var(--cyber-blue))_100%)]">
                <button
                  type="button"
                  onClick={() => setShowForm((s) => !s)}
                  className="rounded-full bg-card px-4 py-2 text-sm outline-none transition hover:bg-cyber-surface/40"
                >
                  {showForm ? "Сховати форму" : "Створити звіт"}
                </button>
              </div>
            </div>

            {/* профільний кружечок */}
            <Link
              to="/profile"
              className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card outline-none transition hover:ring-2 ring-cyber-green/70 hover:shadow-[0_0_30px_hsl(var(--cyber-green)/.35)]"
              aria-label="Профіль"
              title="Перейти в профіль"
            >
              <span className="text-sm font-semibold">{initials}</span>
              <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 blur-xl transition group-hover:opacity-100 bg-[radial-gradient(40px_24px_at_70%_30%,hsl(var(--cyber-green)/.25),transparent_60%)]"></span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Search / Filters */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg">
            <SearchIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою, ціллю або CWE"
              className="w-full rounded-xl border border-border bg-cyber-bg-darker px-9 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Усі" },
              { key: "new", label: "New" },
              { key: "in_review", label: "In Review" },
              { key: "resolved", label: "Resolved" },
              { key: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  filter === f.key
                    ? "border-cyber-green bg-cyber-green/10 text-cyber-green"
                    : "border-border bg-card hover:bg-cyber-surface/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div
            className="group relative mb-5 mx-auto max-w-lg rounded-2xl 
               p-[2px] bg-[linear-gradient(135deg,hsl(var(--cyber-green))_0%,hsl(var(--cyber-blue))_100%)] 
               transition-all duration-300 hover:shadow-[0_0_36px_hsl(var(--cyber-green)/.25)]"
          >
            <form
              onSubmit={onCreate}
              className="rounded-[calc(1.25rem-2px)] border border-border bg-card/70 backdrop-blur p-3 md:p-4 text-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Новий звіт</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-full border border-border px-3 py-1 text-sm hover:bg-cyber-surface/40"
                  >
                    Закрити
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Plus className="h-4 w-4" />{" "}
                      {creating ? "Додаємо…" : "Додати"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm">Заголовок *</label>
                  <input
                    name="title"
                    value={draft.title}
                    onChange={onChange}
                    required
                    className="w-full rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
                    placeholder="Напр., SQLi в /login"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">
                    Ціль (URL/сервіс)
                  </label>
                  <input
                    name="target"
                    value={draft.target}
                    onChange={onChange}
                    className="w-full rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
                    placeholder="https://example.com/login"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">CWE</label>
                  <input
                    name="cwe"
                    value={draft.cwe}
                    onChange={onChange}
                    className="w-full rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
                    placeholder="CWE-89"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">CVSS</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="cvss_score"
                    value={draft.cvss_score}
                    onChange={onChange}
                    className="w-full rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
                    placeholder="0.0 – 10.0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm">Опис *</label>
                  <textarea
                    name="description"
                    value={draft.description}
                    onChange={onChange}
                    required
                    rows={4}
                    className="w-full resize-y rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
                    placeholder="Кроки відтворення, payload, очікувана/фактична поведінка…"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm">Вплив (impact)</label>
                  <textarea
                    name="impact"
                    value={draft.impact}
                    onChange={onChange}
                    rows={3}
                    className="w-full resize-y rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70"
                    placeholder="Що може зробити атакуючий?"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm">
                    PoC файл (опційно)
                  </label>
                  <input
                    type="file"
                    name="poc_file"
                    accept="image/*,video/*,.zip,.rar,.7z,.txt,.pdf"
                    onChange={onFile}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm"
                  />
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Reports list */}
        {loadingList ? (
          <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
            Завантаження…
          </div>
        ) : errorList ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center text-sm">
            {errorList}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border p-12 text-center">
            <Bug className="mb-3 h-8 w-8 text-cyber-green" />
            <h3 className="text-xl font-semibold">Поки немає звітів</h3>
            <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
              Створіть свій перший звіт — опишіть уразливість, додайте деталі.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-full bg-primary px-5 py-2 text-primary-foreground hover:opacity-90"
            >
              Додати звіт
            </button>
          </div>
        ) : (
          <div className="columns-1 gap-6 md:columns-2 xl:columns-3 [column-fill:_balance]">
            {filtered.map((r) => {
              const id = getId(r);
              const hasDetails = Boolean(
                (r.description && r.description.trim()) ||
                  (r.impact && r.impact.trim()) ||
                  r.poc_file
              );

              return (
                <div key={id} className="mb-6 break-inside-avoid">
                  <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:ring-2 ring-cyber-green/60 hover:shadow-[0_0_46px_hsl(var(--cyber-green)/.25)]">
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full animate-glow ${
                              r.status === "resolved"
                                ? "bg-cyber-green text-cyber-green"
                                : r.status === "in_review"
                                ? "bg-cyber-blue text-cyber-blue"
                                : r.status === "rejected"
                                ? "bg-destructive text-destructive"
                                : "bg-cyber-orange text-cyber-orange"
                            }`}
                          />
                          <h4 className="truncate text-lg font-semibold">
                            {r.title}
                          </h4>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge score={r.cvss_score} />
                          <StatusPill status={r.status} />
                          {typeof r.rating !== "undefined" && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs
                 border-yellow-400/70 bg-yellow-400/10 text-yellow-400 border"
                            >
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              Rating: {r.rating}
                            </span>
                          )}
                          {r.cwe && (
                            <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                              CWE: {r.cwe}
                            </span>
                          )}
                          {r.target && (
                            <span className="truncate rounded-full border border-border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                              {r.target}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {r.can_delete && (
                          <button
                            type="button"
                            onClick={() => onDelete(id)}
                            disabled={deletingId === id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-destructive transition hover:bg-destructive/10 disabled:opacity-60 disabled:pointer-events-none"
                            title="Видалити"
                          >
                            {deletingId === id ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  opacity=".25"
                                />
                                <path
                                  d="M22 12a10 10 0 0 1-10 10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                />
                              </svg>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Деталі */}
                    {hasDetails && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpand(id)}
                          className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground hover:bg-cyber-surface/40"
                        >
                          <span>Деталі</span>
                          <ChevronDown
                            className={`h-4 w-4 transition ${
                              expandedId === id ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expandedId === id && (
                          <div className="space-y-3 border-t border-border p-4 text-sm">
                            {r.description && r.description.trim() && (
                              <div>
                                <p className="mb-1 text-muted-foreground">
                                  Опис
                                </p>
                                <p className="whitespace-pre-wrap">
                                  {r.description}
                                </p>
                              </div>
                            )}
                            {r.impact && r.impact.trim() && (
                              <div>
                                <p className="mb-1 text-muted-foreground">
                                  Вплив
                                </p>
                                <p className="whitespace-pre-wrap">
                                  {r.impact}
                                </p>
                              </div>
                            )}
                            {(r.poc_file ||
                              r.poc_name ||
                              r.pocFilename ||
                              r.poc_file_name) && (
                              <div className="flex items-center gap-2">
                                <PaperclipIcon className="h-4 w-4 text-cyber-green" />
                                <span>
                                  PoC файл:{" "}
                                  <span className="font-medium text-foreground">
                                    {getPocName(r)}
                                  </span>
                                </span>
                              </div>
                            )}
                            <p className="text-muted-foreground">
                              Створено:{" "}
                              {new Date(r.created_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* floating create button for small screens */}
      <button
        type="button"
        onClick={() => setShowForm((s) => !s)}
        className="fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 md:hidden"
        aria-label="Створити звіт"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
