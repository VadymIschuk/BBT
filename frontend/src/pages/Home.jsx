import React from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ArrowRight,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

/* === Process (How it works) === */
const ProcessSection = () => {
  const steps = [
    {
      key: "new",
      title: "New",
      desc: "Звіт подано до системи",
      icon: AlertTriangle,
      color: "cyber-orange",
    },
    {
      key: "review",
      title: "In Review",
      desc: "Звіт проходить перевірку",
      icon: Search,
      color: "cyber-blue",
    },
    {
      key: "resolved",
      title: "Resolved",
      desc: "Звіт оброблено та закрито",
      icon: CheckCircle,
      color: "cyber-green",
    },
  ];

  // Явні класи, щоб JIT не випилював
  const borderColor = {
    "cyber-orange": "border-cyber-orange",
    "cyber-blue": "border-cyber-blue",
    "cyber-green": "border-cyber-green",
  };
  const textColor = {
    "cyber-orange": "text-cyber-orange",
    "cyber-blue": "text-cyber-blue",
    "cyber-green": "text-cyber-green",
  };
  const ringColor = {
    "cyber-orange": "ring-cyber-orange",
    "cyber-blue": "ring-cyber-blue",
    "cyber-green": "ring-cyber-green",
  };
  // Світіння (box-shadow) для кожного кольору
  const glowShadow = {
    "cyber-orange":
      "group-hover:shadow-[0_0_40px_hsl(var(--cyber-orange)/.45)] focus-visible:shadow-[0_0_46px_hsl(var(--cyber-orange)/.55)]",
    "cyber-blue":
      "group-hover:shadow-[0_0_40px_hsl(var(--cyber-blue)/.45)] focus-visible:shadow-[0_0_46px_hsl(var(--cyber-blue)/.55)]",
    "cyber-green":
      "group-hover:shadow-[0_0_40px_hsl(var(--cyber-green)/.45)] focus-visible:shadow-[0_0_46px_hsl(var(--cyber-green)/.55)]",
  };

  return (
    // зробив секцію нижчою: було py-16 md:py-20 → стало py-10 md:py-14
    <section id="how" className="py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-cyber-green md:text-5xl">
          Як проходить обробка звіту
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Простий та прозорий процес від подачі до вирішення
        </p>

        {/* трохи компактніше: gap-10 → gap-8 */}
        <div className="mt-8 grid items-start gap-8 md:grid-cols-3">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="relative group">
                {/* Коло з підсвічуванням (hover + клавіша Tab → focus-visible) */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={s.title}
                  className={[
                    "mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2",
                    "bg-cyber-bg-dark", // темний залив всередині
                    "transition-all duration-200 ease-out",
                    "ring-0 group-hover:ring-4 focus-visible:ring-4 group-hover:scale-105",
                    "shadow-none", // базово без тіні
                    borderColor[s.color],
                    ringColor[s.color],
                    glowShadow[s.color], // світіння
                    "outline-none", // прибрати синю обводку браузера
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-10 w-10 transition-opacity duration-200",
                      textColor[s.color],
                      "group-hover:opacity-90",
                    ].join(" ")}
                  />
                </div>

                <h3 className="mt-4 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>

                {/* Стрілка між картками (md+) */}
                {idx < steps.length - 1 && (
                  <div className="pointer-events-none absolute inset-y-0 right-[-48px] hidden md:flex md:items-center">
                    <ArrowRight className="h-6 w-6 text-cyber-green" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  // крапка-індикатор у картці Hero
  const bgDotClass = {
    new: "bg-cyber-orange",
    in_review: "bg-cyber-blue",
    resolved: "bg-cyber-green",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 px-4 py-3 md:grid-cols-3">
          <div className="col-span-1 flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyber-green" />
            <span className="text-lg font-bold tracking-tight">BugTracker</span>
          </div>
          <div className="hidden justify-center md:flex">
            <ul className="flex items-center gap-6 text-sm text-muted-foreground">
              <li>
                <a
                  href="#how"
                  className="transition-colors hover:text-foreground"
                >
                  Як це працює
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-foreground"
                >
                  Переваги
                </a>
              </li>
              <li>
                <a
                  href="#cta"
                  className="transition-colors hover:text-foreground"
                >
                  Почати
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-1 flex justify-end gap-2">
            <Link
              to="/login"
              className="rounded-full px-4 inline-flex items-center h-10
             border border-border bg-transparent outline-none
             transition-all duration-200
             hover:bg-primary hover:text-primary-foreground hover:border-primary
             focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:border-primary"
            >
              Вхід
            </Link>

            <Link
              to="/register"
              className="rounded-full bg-primary px-4 inline-flex items-center h-10 text-primary-foreground hover:opacity-90 transition"
            >
              Реєстрація
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative border-b border-border py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Bug Bounty Tracker{" "}
              <span className="text-cyber-green">for Hunters</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Професійна платформа для відстеження ваших звітів про уразливості.
              Подавайте звіти, слідкуйте за їх статусом та отримуйте винагороди
              за знайдені баги.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-primary px-5 py-2 inline-flex items-center text-primary-foreground hover:opacity-90 transition"
              >
                Розпочати роботу
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Button
                variant="outline"
                className="rounded-full border-border px-5 py-2"
              >
                Дізнатися більше
              </Button>
            </div>
          </div>

          {/* Права картка */}
          <div className="relative">
            <div className="mx-auto w-full max-w-md animate-[cyber-glow_2s_ease-in-out_infinite] rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className={`h-2 w-2 rounded-full ${bgDotClass["new"]}`} />
                <span className="text-sm text-muted-foreground">
                  Bug Report #001
                </span>
              </div>
              <div className="mt-3 rounded-xl border border-border bg-background/60 p-4">
                <p className="font-semibold">SQL Injection у формі логіну</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  /login → boolean-based payload в полі password
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <ProcessSection />

      {/* Features */}
      <section id="features" className="border-y border-border py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            Переваги платформи
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card
              tabIndex={0}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card outline-none
             transition-all duration-200
             hover:bg-cyber-surface/40 focus-visible:bg-cyber-surface/40
             hover:border-cyber-green focus-visible:border-cyber-green
             hover:border-[2px] focus-visible:border-[2px]
             hover:scale-[1.02] focus-visible:scale-[1.02] hover:-translate-y-0.5
             ring-0 hover:ring-2 focus-visible:ring-2 ring-cyber-green/70
             hover:shadow-[0_0_52px_hsl(var(--cyber-green)/.35)]
             focus-visible:shadow-[0_0_56px_hsl(var(--cyber-green)/.50)]
             aria-selected:ring-2 aria-selected:border-cyber-green aria-selected:bg-cyber-surface/50"
            >
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-cyber-surface">
                  <Shield className="h-5 w-5 text-cyber-green" />
                </div>
                <CardTitle>Безпека даних</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Повна конфіденційність ваших звітів про уразливості
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              tabIndex={0}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card outline-none
             transition-all duration-200
             hover:bg-cyber-surface/40 focus-visible:bg-cyber-surface/40
             hover:border-cyber-green focus-visible:border-cyber-green
             hover:border-[2px] focus-visible:border-[2px]
             hover:scale-[1.02] focus-visible:scale-[1.02] hover:-translate-y-0.5
             ring-0 hover:ring-2 focus-visible:ring-2 ring-cyber-green/70
             hover:shadow-[0_0_52px_hsl(var(--cyber-green)/.35)]
             focus-visible:shadow-[0_0_56px_hsl(var(--cyber-green)/.50)]
             aria-selected:ring-2 aria-selected:border-cyber-green aria-selected:bg-cyber-surface/50"
            >
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-cyber-surface">
                  <Clock className="h-5 w-5 text-cyber-blue" />
                </div>
                <CardTitle>Швидка обробка</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Миттєве оновлення статусу та прозорий процес перевірки
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              tabIndex={0}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card outline-none
             transition-all duration-200
             hover:bg-cyber-surface/40 focus-visible:bg-cyber-surface/40
             hover:border-cyber-green focus-visible:border-cyber-green
             hover:border-[2px] focus-visible:border-[2px]
             hover:scale-[1.02] focus-visible:scale-[1.02] hover:-translate-y-0.5
             ring-0 hover:ring-2 focus-visible:ring-2 ring-cyber-green/70
             hover:shadow-[0_0_52px_hsl(var(--cyber-green)/.35)]
             focus-visible:shadow-[0_0_56px_hsl(var(--cyber-green)/.50)]
             aria-selected:ring-2 aria-selected:border-cyber-green aria-selected:bg-cyber-surface/50"
            >
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-cyber-surface">
                  <CheckCircle className="h-5 w-5 text-cyber-green" />
                </div>
                <CardTitle>Професійний підхід</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Створено спеціально для досвідчених bug bounty hunter&apos;ів
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-3xl border border-border p-10 text-center md:p-14">
            <h2 className="text-3xl font-bold md:text-4xl">
              Готові розпочати?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Приєднуйтесь до спільноти професійних bug bounty hunter&apos;ів
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-primary px-6 py-2 inline-flex items-center text-primary-foreground hover:opacity-90 transition"
              >
                Створити акаунт
              </Link>

              <Link
                to="/login"
                className="rounded-full px-6 py-2 inline-flex items-center
             border border-border bg-transparent outline-none
             transition-all duration-200
             hover:bg-primary hover:text-primary-foreground hover:border-primary
             focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:border-primary"
              >
                Увійти в систему
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyber-green" />
              <span className="font-semibold">BugTracker</span>
            </div>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Професійна платформа для bug bounty hunter&apos;ів
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Платформа</h4>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <a
                  href="#about"
                  className="transition-colors hover:text-foreground"
                >
                  Про нас
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="transition-colors hover:text-foreground"
                >
                  Контакти
                </a>
              </li>
              <li>
                <a
                  href="#help"
                  className="transition-colors hover:text-foreground"
                >
                  Допомога
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl px-4 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} BugTracker. Всі права захищені.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
