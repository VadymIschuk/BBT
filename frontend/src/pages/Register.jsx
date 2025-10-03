import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import api from "../api";
import { ENDPOINTS } from "../constants";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Введіть нікнейм.";
    if (!form.email.trim()) e.email = "Введіть email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(form.email))
      e.email = "Невалідна адреса email.";
    if (!form.password) e.password = "Введіть пароль.";
    else if (form.password.length < 6) e.password = "Мінімум 6 символів.";
    if (!form.confirm) e.confirm = "Повторіть пароль.";
    else if (form.password !== form.confirm)
      e.confirm = "Паролі не співпадають.";
    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    try {
      setSubmitting(true);

      //Реєстрація
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
      };

      await api.post(
        ENDPOINTS.auth?.register ?? "/api/v1/auth/register/",
        payload
      );

      //Автоматичний логін
      const { data: tokens } = await api.post(
        ENDPOINTS.login ?? "/api/v1/token/",
        {
          username: form.username,
          password: form.password,
        }
      );

      const { access, refresh } = tokens || {};
      if (!access || !refresh) throw new Error("Токени не повернуті сервером");

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("user", JSON.stringify({ username: form.username }));

      navigate("/app");
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors = {};
        for (const [k, v] of Object.entries(data)) {
          if (Array.isArray(v)) fieldErrors[k] = v.join(" ");
          else if (typeof v === "string") fieldErrors[k] = v;
        }
        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
        } else {
          setServerError("❌ Помилка реєстрації. Перевірте дані.");
        }
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
    "w-full rounded-xl border border-border bg-background px-3 py-2 outline-none transition " +
    "focus:border-primary focus:ring-2 ring-primary placeholder:text-muted-foreground/70";
  const invalid =
    "border-destructive focus:border-destructive ring-destructive";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[720px]">
        {/* GLOW WRAPPER */}
        <div
          className="group relative rounded-3xl p-[2px]
                     bg-[linear-gradient(135deg,hsl(var(--cyber-green))_0%,hsl(var(--cyber-blue))_100%)]
                     transition-all duration-300
                     hover:shadow-[0_0_80px_hsl(var(--cyber-green)/.30)]
                     focus-within:shadow-[0_0_90px_hsl(var(--cyber-blue)/.30)]"
        >
          {/* ФОРМА */}
          <form
            onSubmit={onSubmit}
            className="rounded-[calc(1.5rem-2px)] border border-border bg-card/70 backdrop-blur p-6 md:p-8 shadow-xl
                       outline-none ring-0 group-focus-within:ring-2 ring-primary/60"
          >
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Створіть акаунт
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Обов’язкові: нікнейм, email та пароль (з підтвердженням)
              </p>
            </div>

            {serverError && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
                {serverError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Нікнейм (required) */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm">Нікнейм *</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    autoComplete="username"
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    className={`${inputBase} pl-9 ${
                      errors.username ? invalid : ""
                    }`}
                    placeholder="Ваш нікнейм"
                    required
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email (required) */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm">Email *</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    autoComplete="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className={`${inputBase} pl-9 ${
                      errors.email ? invalid : ""
                    }`}
                    placeholder="name@domain.com"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Ім'я (optional) */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm">Ім’я</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  className={inputBase}
                  placeholder="(необов’язково)"
                  autoComplete="given-name"
                />
              </div>

              {/* Прізвище (optional) */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm">Прізвище</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  className={inputBase}
                  placeholder="(необов’язково)"
                  autoComplete="family-name"
                />
              </div>

              {/* Телефон (optional) */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm">Телефон</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={onChange}
                    className={`${inputBase} pl-9`}
                    placeholder="+380XXXXXXXXX"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Пароль (required) */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm">Пароль *</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className={`${inputBase} pl-9 pr-9 ${
                      errors.password ? invalid : ""
                    }`}
                    placeholder="Мінімум 6 символів"
                    autoComplete="new-password"
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
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Підтвердження пароля (required) */}
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm">
                  Підтвердження пароля *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPwd2 ? "text" : "password"}
                    name="confirm"
                    value={form.confirm}
                    onChange={onChange}
                    className={`${inputBase} pl-9 pr-9 ${
                      errors.confirm ? invalid : ""
                    }`}
                    placeholder="Повторіть пароль"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd2((v) => !v)}
                    className="absolute right-2.5 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={showPwd2 ? "Сховати пароль" : "Показати пароль"}
                  >
                    {showPwd2 ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.confirm}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 space-y-3">
              <button
                disabled={submitting}
                className="w-full rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition
                           hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed
                           ring-0 focus-visible:ring-2 ring-primary"
              >
                {submitting ? "Створюємо..." : "Зареєструватися"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Вже маєте акаунт?{" "}
                <Link
                  to="/login"
                  className="rounded-full px-3 py-1 transition
                             hover:bg-primary hover:text-primary-foreground hover:border-primary"
                >
                  Увійти
                </Link>
              </p>
            </div>
          </form>

          {/* Aura */}
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
