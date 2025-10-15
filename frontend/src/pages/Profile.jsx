// src/pages/Profile.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ENDPOINTS } from "../constants";
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  Pencil,
  Save,
  X,
  Crosshair,
  ArrowLeft,
  Star,
} from "lucide-react";

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function getLevelInfo(ratingRaw) {
  const rating = Math.max(0, Math.min(100, Number(ratingRaw) || 0));
  const maxed = rating >= 100;
  const level = maxed ? 5 : Math.floor(rating / 20) + 1;
  const lower = (level - 1) * 20;
  const upper = maxed ? 100 : level * 20;
  const within = rating - lower;
  const progress = clamp01(within / (upper - lower || 20));
  const toNext = maxed ? 0 : upper - rating;
  return { rating, level, lower, upper, within, progress, toNext, maxed };
}

function RatingProgress({
  rating,
  durationMs = 2000,
  easing = "cubic-bezier(0.16, 1, 0.3, 1)",
}) {
  const { level, progress, toNext, maxed, rating: r } = getLevelInfo(rating);

  const [anim, setAnim] = useState(0);

  useEffect(() => {
    setAnim(0);
    let raf = requestAnimationFrame(() => {
      setAnim(progress);
    });
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const widthPct = `${Math.round(anim * 100)}%`;

  return (
    <div className="mt-4" aria-live="polite">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-yellow-400">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          Рейтинг: <b className="text-foreground">{r.toFixed(0)}</b>
        </span>
        <span className="text-muted-foreground">
          {maxed ? (
            <span className="text-yellow-400">MAX • Level 5</span>
          ) : (
            <>
              Level {level} • до підвищення:{" "}
              <b className="text-foreground">{toNext}</b>
            </>
          )}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full border border-yellow-400/60 bg-yellow-400/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(anim * 100)}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: widthPct,
            transition: `width ${durationMs}ms ${easing}`,
            willChange: "width",
            background:
              "linear-gradient(90deg, rgba(250,204,21,0.9) 0%, rgba(234,179,8,0.95) 60%, rgba(234,179,8,1) 100%)",
            boxShadow: "0 0 16px rgba(234, 179, 8, 0.45)",
          }}
        />
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  // ---------- user from localStorage ----------
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(ENDPOINTS.me);
        if (!mounted) return;
        setUser((prev) => ({ ...prev, ...data }));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            ...data,
          })
        );
      } catch (e) {
        console.error("Не вдалося отримати /auth/me/", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const role = (user?.role || "hunter").toLowerCase();

  const initials = useMemo(() => {
    const s = user?.username || user?.email || "U";
    return s.slice(0, 1).toUpperCase();
  }, [user]);

  // ---------- edit mode ----------
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    username: user?.username || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  }));
  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    });
  }, [user]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const saveLocal = () => {
    const next = { ...user, ...form, role };
    setUser(next);
    localStorage.setItem("user", JSON.stringify(next));
    setEditing(false);
  };

  const onLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const toDashboard = () => navigate(role === "analyst" ? "/analyst" : "/app");

  const roleClasses =
    role === "hunter"
      ? "border-cyber-green/60 text-cyber-green hover:shadow-[0_0_26px_hsl(var(--cyber-green)/.55)]"
      : "border-cyber-blue/60 text-cyber-blue hover:shadow-[0_0_26px_hsl(var(--cyber-blue)/.55)]";

  const rating = Number(user?.rating ?? 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <ArrowLeft
              onClick={toDashboard}
              className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground"
              title="До Dashboard"
            />
            <h1 className="text-xl font-bold tracking-tight">Профіль</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-destructive bg-destructive/10 px-4 py-1.5 text-sm text-destructive hover:bg-destructive/20 hover:shadow-[0_0_20px_hsl(var(--destructive)/.4)] transition"
              title="Вийти з акаунта"
            >
              <LogOut className="h-4 w-4" />
              Вийти
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          {/* Identity card */}
          <section className="group relative rounded-3xl p-[2px] bg-[linear-gradient(135deg,hsl(var(--cyber-green))_0%,hsl(var(--cyber-blue))_100%)]">
            <div className="rounded-[calc(1.5rem-2px)] border border-border bg-card/70 p-6">
              <div className="flex items-center gap-4">
                <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background text-xl font-bold">
                  {initials}
                  <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 blur-xl transition group-hover:opacity-100 bg-[radial-gradient(48px_32px_at_70%_30%,hsl(var(--cyber-green)/.25),transparent_60%)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">
                    {user?.username ?? "Користувач"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user?.email ?? "—"}
                  </p>
                </div>
              </div>

              {/* meta */}
              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-cyber-green" />
                  <span className="text-muted-foreground">Роль:</span>
                  <span
                    className={`group/role inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition hover:-translate-y-[1px] ${roleClasses}`}
                  >
                    <Crosshair className="h-3.5 w-3.5 transition group-hover/role:scale-110" />
                    <span className="capitalize">{role}</span>
                  </span>
                </div>

                {/* Рейтинг + прогрес до наступного рівня (анімація) */}
                <div className="mt-2">
                  <RatingProgress rating={rating} />
                </div>
              </div>

              {/* actions */}
              <div className="mt-6 flex flex-wrap gap-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-cyber-surface/40"
                  >
                    <Pencil className="h-4 w-4" /> Редагувати
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveLocal}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:opacity-90"
                    >
                      <Save className="h-4 w-4" /> Зберегти
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-cyber-surface/40"
                    >
                      <X className="h-4 w-4" /> Скасувати
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Details form */}
          <section className="space-y-6">
            <div className="rounded-3xl border border-border bg-card/70 p-6">
              <h2 className="mb-4 text-base font-semibold">Деталі профілю</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Нікнейм
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      name="username"
                      value={form.username}
                      disabled
                      className="w-full rounded-xl border border-border bg-cyber-bg-darker px-9 py-2 outline-none transition opacity-70"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full rounded-xl border border-border bg-cyber-bg-darker px-9 py-2 outline-none transition opacity-70"
                      placeholder="name@domain.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Ім’я
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={onChange}
                    disabled={!editing}
                    className="w-full rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition disabled:opacity-70 focus:border-primary focus:ring-2 ring-primary"
                    placeholder="(необов’язково)"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Прізвище
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={onChange}
                    disabled={!editing}
                    className="w-full rounded-xl border border-border bg-cyber-bg-darker px-3 py-2 outline-none transition disabled:opacity-70 focus:border-primary focus:ring-2 ring-primary"
                    placeholder="(необов’язково)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Телефон
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      name="phone_number"
                      value={form.phone_number}
                      onChange={onChange}
                      disabled={!editing}
                      className="w-full rounded-xl border border-border bg-cyber-bg-darker px-9 py-2 outline-none transition disabled:opacity-70 focus:border-primary focus:ring-2 ring-primary"
                      placeholder="+380XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
