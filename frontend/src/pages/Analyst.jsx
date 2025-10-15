// src/pages/Analyst.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search as SearchIcon,
  ShieldAlert,
  Bug,
  Paperclip as PaperclipIcon,
  ChevronDown,
  RefreshCw,
  Save,
  X,
  Star,
} from "lucide-react";

import api from "../api";
import { ENDPOINTS, ACCESS_TOKEN } from "../constants";

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
const STATUS_ORDER = ["new", "in_review", "resolved", "rejected"];
const STATUS_LABEL = {
  new: "New",
  in_review: "In Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

/* ---------- auth headers for axios calls ---------- */
function authHeaders() {
  const access = localStorage.getItem(ACCESS_TOKEN);
  return access ? { Authorization: `Bearer ${access}` } : {};
}

/* ---------- star rating ---------- */
function StarRating({ value = 0, onChange, size = 18 }) {
  const v = Number.isFinite(value) ? value : 0;
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
          title={`${n} / 5`}
        >
          <Star
            className={`h-[${size}px] w-[${size}px] ${
              n <= v
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ---------- page ---------- */
export default function Analyst() {
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
    "A"
  ).toUpperCase();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("new");

  const clamp5 = (n) => {
    const v = Number(n) || 0;
    if (v < 0) return 0;
    if (v > 5) return 5;
    return Math.round(v);
  };

  async function fetchReports(status) {
    setLoading(true);
    setErr("");
    try {
      const params = {};
      if (status && status !== "all") params.status = status;

      const { data } = await api.get(ENDPOINTS.reports.list, {
        params,
        headers: authHeaders(),
      });

      const items = Array.isArray(data) ? data : data.results ?? [];
      const normalized = items.map((r) => ({
        ...r,
        rating: clamp5(r?.rating ?? 0),
        __dirty: false,
        __saving: false,
      }));
      setReports(normalized);
    } catch (e) {
      setErr("Не вдалося завантажити звіти.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports(filter);
  }, [filter]);

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

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  const markDirty = (id, patch) =>
    setReports((arr) =>
      arr.map((r) => (getId(r) === id ? { ...r, ...patch, __dirty: true } : r))
    );

  const onChangeStatus = (id, status) => markDirty(id, { status });
  const onChangeStars = (id, stars) => markDirty(id, { rating: clamp5(stars) });

  async function saveOne(id) {
    setReports((arr) =>
      arr.map((r) => (getId(r) === id ? { ...r, __saving: true } : r))
    );
    try {
      const cur = reports.find((r) => getId(r) === id);
      const payload = { status: cur.status, rating: clamp5(cur.rating) };

      const { data } = await api.patch(ENDPOINTS.reports.detail(id), payload, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      setReports((arr) =>
        arr.map((r) =>
          getId(r) === id
            ? {
                ...r,
                ...data,
                rating: clamp5(data?.rating ?? cur.rating),
                __dirty: false,
                __saving: false,
              }
            : r
        )
      );
    } catch (e) {
      setReports((arr) =>
        arr.map((r) => (getId(r) === id ? { ...r, __saving: false } : r))
      );
      alert("Не вдалося зберегти зміни: " + (e?.message || "Помилка"));
    }
  }

  async function reloadOne(id) {
    setReports((arr) =>
      arr.map((r) => (getId(r) === id ? { ...r, __saving: true } : r))
    );
    try {
      const { data } = await api.get(ENDPOINTS.reports.detail(id), {
        headers: authHeaders(),
      });

      setReports((arr) =>
        arr.map((r) =>
          getId(r) === id
            ? {
                ...r,
                ...data,
                rating: clamp5(data?.rating ?? 0),
                __dirty: false,
                __saving: false,
              }
            : r
        )
      );
    } catch (e) {
      setReports((arr) =>
        arr.map((r) => (getId(r) === id ? { ...r, __saving: false } : r))
      );
      alert("Не вдалося оновити звіт: " + (e?.message || "Помилка"));
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-cyber-blue" />
            <h1 className="text-lg font-bold tracking-tight">Analyst Dashboard</h1>
          </div>

          {/* профільний кружечок */}
          <Link
            to="/profile"
            className="group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card outline-none transition hover:ring-2 ring-cyber-blue/70 hover:shadow-[0_0_30px_hsl(var(--cyber-blue)/.35)]"
            aria-label="Профіль"
            title="Перейти в профіль"
          >
            <span className="text-sm font-semibold">{initials}</span>
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 blur-xl transition group-hover:opacity-100 bg-[radial-gradient(40px_24px_at_70%_30%,hsl(var(--cyber-blue)/.25),transparent_60%)]"></span>
          </Link>
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
                    ? "border-cyber-blue bg-cyber-blue/10 text-cyber-blue"
                    : "border-border bg-card hover:bg-cyber-surface/40"
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => fetchReports(filter)}
              className="ml-1 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-cyber-surface/40"
              title="Оновити"
            >
              <RefreshCw className="h-4 w-4" />
              Оновити
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
            Завантаження…
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center text-sm">
            {err}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border p-12 text-center">
            <Bug className="mb-3 h-8 w-8 text-cyber-blue" />
            <h3 className="text-xl font-semibold">Немає звітів для відображення</h3>
            <p className="mt-1 max-w-[58ch] text-sm text-muted-foreground">
              Спробуйте змінити фільтри або пошук.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-6 md:columns-2 xl:columns-3 [column-fill:_balance]">
            {filtered.map((r) => {
              const id = getId(r);
              const hasDetails =
                (r.description && r.description.trim()) ||
                (r.impact && r.impact.trim()) ||
                r.poc_file;

              return (
                <div key={id} className="mb-6 break-inside-avoid">
                  <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:ring-2 ring-cyber-blue/60 hover:shadow-[0_0_46px_hsl(var(--cyber-blue)/.25)]">
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              r.status === "resolved"
                                ? "bg-cyber-green"
                                : r.status === "in_review"
                                ? "bg-cyber-blue"
                                : r.status === "rejected"
                                ? "bg-destructive"
                                : "bg-cyber-orange"
                            }`}
                          />
                          <h4 className="truncate text-lg font-semibold">
                            {r.title}
                          </h4>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge score={r.cvss_score} />
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
                          {typeof r.rating !== "undefined" && (
                            <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                              Rating: {r.rating}
                            </span>
                          )}
                          {r.status && (
                            <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground capitalize">
                              Status: {formatStatus(r.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls: статус + зірки + збереження */}
                    <div className="border-t border-border p-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          Статус:
                        </span>
                        <select
                          value={r.status}
                          onChange={(e) => onChangeStatus(id, e.target.value)}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>

                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          Оцінка:
                        </span>
                        <StarRating
                          value={r.rating || 0}
                          onChange={(n) => onChangeStars(id, n)}
                        />

                        <div className="ml-auto flex items-center gap-2">
                          {r.__dirty ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveOne(id)}
                                disabled={r.__saving}
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-60"
                              >
                                <Save className="h-4 w-4" />
                                Зберегти
                              </button>
                              <button
                                type="button"
                                onClick={() => reloadOne(id)}
                                disabled={r.__saving}
                                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-cyber-surface/40 disabled:opacity-60"
                              >
                                <X className="h-4 w-4" />
                                Скасувати
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Без змін
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
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
                            {r.description?.trim() && (
                              <div>
                                <p className="mb-1 text-muted-foreground">
                                  Опис
                                </p>
                                <p className="whitespace-pre-wrap">
                                  {r.description}
                                </p>
                              </div>
                            )}
                            {r.impact?.trim() && (
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
                                <PaperclipIcon className="h-4 w-4 text-cyber-blue" />
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
                              {r.created_at
                                ? new Date(r.created_at).toLocaleString()
                                : "—"}
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
    </div>
  );
}
