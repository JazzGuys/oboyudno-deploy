import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, ArrowLeft, Shield, Video, CheckCircle } from "lucide-react";
import { api } from "../../api/api";

const benefits = [
  { icon: Shield, text: "Видеозащита каждой сделки" },
  { icon: Video, text: "Запись прямо в браузере" },
  { icon: CheckCircle, text: "Без лишней бюрократии" },
];

export function Auth() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">(
      searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    setError("");
  }, [tab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const login = async (username: string, password: string) => {
    const response: any = await api.post("/auth/login", {
      username,
      password
    });

    const token = typeof response === "string" ? response : response?.token || response?.Token;
    if (!token) {
      throw new Error("Сервер не вернул токен авторизации.");
    }

    localStorage.setItem("dealvid_token", token);

    localStorage.setItem("dealvid_auth", "true");
    localStorage.setItem("dealvid_user", JSON.stringify({
      name: `${form.firstName} ${form.lastName}`.trim() || username,
      email: form.email || ""
    }));

    navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password) { setError("Введите пароль."); return; }
    if (tab === "login" && !form.username) { setError("Введите username."); return; }
    if (tab === "register" && (!form.firstName || !form.lastName || !form.username || !form.email)) {
      setError("Заполните все поля регистрации.");
      return;
    }
    if (tab === "register" && !agreed) {
      setError("Необходимо согласиться с условиями и политикой.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "register") {
        await api.post("/auth/register", {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          username: form.username.trim(),
          email: form.email,
          password: form.password
        });

        await login(form.username.trim(), form.password);
      } else {
        await login(form.username.trim(), form.password);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-[#0D0D14] flex-col justify-between p-10 relative overflow-hidden shrink-0 h-screen">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#5048E5]/20 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-violet-600/10 blur-[60px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')]" />

          <div className="relative">
            <div className="mb-12 space-y-3">
              <h1
                  className="text-white text-[32px] mt-4 leading-tight"
                  style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                Фиксируйте договорённости
              </h1>

              <h2
                  className="text-white text-[30px] leading-tight"
                  style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                Защищайте свои интересы
              </h2>
              <p className="text-white/66 text-sm leading-relaxed mt-2">
                Видеозапись - доказательство, которое работает при любом споре
              </p>
            </div>
          </div>

          <div className="relative mb-10 space-y-7">
            {benefits.map((b) => (
                <div key={b.text} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-[#5048E5]/30 flex items-center justify-center shrink-0">
                    <b.icon size={14} className="text-[#8B5CF6]" />
                  </div>
                  <p className="text-sm text-white/70">{b.text}</p>
                </div>
            ))}
          </div>
        </div>

        <div className="min-h-screen lg:h-screen flex-1 flex flex-col justify-center p-8 bg-[#F7F8FA] relative">
          <Link to="/" className="absolute top-8 right-8 flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#5048E5] flex items-center justify-center shadow-[0_2px_8px_rgba(80,72,229,0.35)]">
              <img src="/src/app/components/ui/logo.svg" alt="Логотип" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl text-[#0D0D14] tracking-[-0.02em]" style={{ fontWeight: 600 }}>Обоюдно</span>
          </Link>

          <div className="w-full max-w-[400px] mx-auto">
            <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-[#8B8FA8] hover:text-[#0D0D14] transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              На главную
            </Link>

            <div className="mb-6">
              <h1
                  className="text-2xl text-[#0D0D14] mb-1"
                  style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {tab === "login" ? "Добро пожаловать" : "Создать аккаунт"}
              </h1>
              <p className="text-sm text-[#8B8FA8]">
                {tab === "login"
                    ? "Войдите, чтобы управлять сделками"
                    : "Регистрация займёт меньше минуты"}
              </p>
            </div>

            <div className="flex bg-[#F1F2F6] rounded-xl p-1 mb-5">
              {(["login", "register"] as const).map((t) => (
                  <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 text-sm rounded-lg transition-all ${
                          tab === t
                              ? "bg-white text-[#0D0D14] shadow-[0_1px_4px_rgba(13,13,20,0.08)]"
                              : "text-[#8B8FA8] hover:text-[#0D0D14]"
                      }`}
                      style={{ fontWeight: tab === t ? 500 : 400 }}
                  >
                    {t === "login" ? "Войти" : "Регистрация"}
                  </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === "register" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Имя</label>
                      <input
                          type="text"
                          name="firstName"
                          placeholder="Иван"
                          value={form.firstName}
                          onChange={handleChange}
                          className="w-full bg-white border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-3 focus:ring-[#5048E5]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Фамилия</label>
                      <input
                          type="text"
                          name="lastName"
                          placeholder="Иванов"
                          value={form.lastName}
                          onChange={handleChange}
                          className="w-full bg-white border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-3 focus:ring-[#5048E5]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Username</label>
                      <input
                          type="text"
                          name="username"
                          placeholder="ivanov_88"
                          value={form.username}
                          onChange={handleChange}
                          className="w-full bg-white border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-3 focus:ring-[#5048E5]/10 transition-all"
                      />
                    </div>
                  </div>
              )}

              {tab === "register" ? (
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Почта</label>
                  <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-3 focus:ring-[#5048E5]/10 transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Username</label>
                  <input
                      type="text"
                      name="username"
                      placeholder="Введите username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-3 focus:ring-[#5048E5]/10 transition-all"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>Пароль</label>
                </div>
                <div className="relative">
                  <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      placeholder={tab === "register" ? "Минимум 8 символов" : "Введите пароль"}
                      value={form.password}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E8E9F0] rounded-xl px-4 py-3 pr-11 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-3 focus:ring-[#5048E5]/10 transition-all"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C4C6D3] hover:text-[#6B7280] transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {tab === "register" && (
                  <div className="flex items-start gap-2.5">
                    <input
                        type="checkbox"
                        id="agreed"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#E8E9F0] text-[#5048E5] focus:ring-[#5048E5]/10 cursor-pointer accent-[#5048E5]"
                    />
                    <label htmlFor="agreed" className="text-[11px] text-[#8B8FA8] leading-snug cursor-pointer select-none">
                      Я согласен с{" "}
                      <Link to="/conditions" className="text-[#5048E5] hover:text-[#4338CA] transition-colors" style={{ fontWeight: 500 }}>Условиями использования</Link>
                      {" "}и даю{" "}
                      <Link to="/policy" className="text-[#5048E5] hover:text-[#4338CA] transition-colors" style={{ fontWeight: 500 }}>Согласие на обработку персональных данных</Link>.
                    </label>
                  </div>
              )}

              {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-600 text-xs">!</span>
                    </div>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
              )}

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5048E5] text-white py-3 rounded-xl text-sm hover:bg-[#4338CA] transition-all shadow-[0_2px_12px_rgba(80,72,229,0.3)] hover:shadow-[0_4px_16px_rgba(80,72,229,0.35)] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  style={{ fontWeight: 500 }}
              >
                {loading
                    ? "Подождите..."
                    : tab === "login"
                        ? "Войти в аккаунт"
                        : "Создать аккаунт"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#E8E9F0] text-center">
              <p className="text-xs text-[#8B8FA8]">
                {tab === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}
                {" "}
                <button
                    onClick={() => setTab(tab === "login" ? "register" : "login")}
                    className="text-[#5048E5] hover:text-[#4338CA] transition-colors"
                    style={{ fontWeight: 500 }}
                >
                  {tab === "login" ? "Зарегистрироваться" : "Войти"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
