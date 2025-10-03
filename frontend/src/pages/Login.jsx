import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!form.username.trim() || !form.password) {
      setServerError("Будь ласка, заповніть усі поля.");
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await api.post("api/v1/token/", {
        username: form.username,
        password: form.password,
      });

      const { access, refresh } = data || {};
      if (!access || !refresh) {
        throw new Error("Токени не повернуті сервером");
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      localStorage.setItem("user", JSON.stringify({ username: form.username }));

      navigate("/app");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setServerError("❌ Невірний логін або пароль.");
      } else {
        setServerError(
          "❌ Сервер недоступний або сталася помилка. Спробуйте ще раз."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border border-border bg-cyber-bg-darker text-foreground px-3 py-2 outline-none transition " +
    "focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70 appearance-none";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px]">
        <div
          className="group relative rounded-3xl p-[2px]
                     bg-[linear-gradient(135deg,hsl(var(--cyber-green))_0%,hsl(var(--cyber-blue))_100%)]
                     transition-all duration-300
                     hover:shadow-[0_0_80px_hsl(var(--cyber-green)/.30)]
                     focus-within:shadow-[0_0_90px_hsl(var(--cyber-blue)/.30)]"
        >
          <form
            onSubmit={onSubmit}
            autoComplete="off"
            className="rounded-[calc(1.5rem-2px)] border border-border bg-card/70 backdrop-blur p-6 md:p-8 shadow-xl
                       outline-none ring-0 group-focus-within:ring-2 ring-primary/60"
          >
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Вхід до акаунта
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Увійдіть, використовуючи нікнейм та пароль
              </p>
            </div>

            {serverError && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
                {serverError}
              </div>
            )}

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm">Нікнейм</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    autoComplete="off"
                    className={`${inputBase} pl-9`}
                    placeholder="Ваш нікнейм"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm">Пароль</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="current-password"
                    className={`${inputBase} pl-9 pr-9`}
                    placeholder="Ваш пароль"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2.5 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Сховати пароль" : "Показати пароль"}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                disabled={submitting}
                className="w-full rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition
                           hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed
                           ring-0 focus-visible:ring-2 ring-primary"
              >
                {submitting ? "Входимо..." : "Увійти"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Немає акаунта?{" "}
                <Link
                  to="/register"
                  className="rounded-full px-3 py-1 transition
                             hover:bg-primary hover:text-primary-foreground hover:border-primary"
                >
                  Зареєструватися
                </Link>
              </p>
            </div>
          </form>

          <span
            className="pointer-events-none absolute -inset-8 rounded-[inherit] opacity-0 blur-2xl
                       transition duration-300
                       group-hover:opacity-100 group-focus-within:opacity-100
                       bg-[radial-gradient(220px_130px_at_20%_15%,hsl(var(--cyber-green)/.25),transparent_60%),radial-gradient(220px_130px_at_80%_85%,hsl(var(--cyber-blue)/.25),transparent_60%)]"
          />
        </div>
      </div>
    </div>
  );
}
