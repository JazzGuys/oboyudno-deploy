import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft, ArrowRight, Check, Upload, Video,
  User, FileText, DollarSign, Settings2,
} from "lucide-react";
import { api } from "../../api/api";

const steps = [
  { id: 1, label: "Участники", icon: User, desc: "Стороны сделки" },
  { id: 2, label: "Условия", icon: FileText, desc: "Задача и сроки" },
  { id: 3, label: "Финансы", icon: DollarSign, desc: "Оплата и аванс" },
  { id: 4, label: "Видео ТЗ", icon: Video, desc: "Видеофиксация" },
];

const USER_DIRECTORY_KEY = "dealvid_user_directory";

function rememberUserName(userId: any, userName: string) {
  const id = userId ? String(userId) : "";
  const name = userName?.trim();
  if (!id || !name) return;
  try {
    const raw = localStorage.getItem(USER_DIRECTORY_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const next = data && typeof data === "object" ? data : {};
    next[id] = name;
    localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(next));
  } catch {
  }
}

function getDisplayName(source: any): string {
  const normalized = unwrapProfile(source);
  if (!normalized || typeof normalized !== "object") return "";
  const fullName = `${normalized?.firstName || normalized?.FirstName || ""} ${normalized?.lastName || normalized?.LastName || ""}`.trim();
  return fullName || normalized?.username || normalized?.Username || normalized?.email || normalized?.Email || "";
}

function unwrapProfile(source: any): any {
  if (!source) return source;
  if (Array.isArray(source)) return source[0] ?? null;
  if (typeof source !== "object") return source;
  if (source.profile && typeof source.profile === "object") return source.profile;
  if (source.data && typeof source.data === "object") return source.data;
  if (source.result && typeof source.result === "object") return source.result;
  if (source.value && typeof source.value === "object") return source.value;
  return source;
}

function getProfileId(source: any): string | null {
  if (source === null || source === undefined) return null;
  if (typeof source === "string" || typeof source === "number") {
    const value = String(source).trim();
    return value ? value : null;
  }

  const normalized = unwrapProfile(source);
  const direct =
    normalized?.id ||
    normalized?.Id ||
    normalized?.userId ||
    normalized?.UserId ||
    normalized?.profileId ||
    normalized?.ProfileId;
  if (direct) return String(direct);

  if (normalized && typeof normalized === "object") {
    const keys = Object.keys(normalized);
    for (const key of keys) {
      const compactKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (compactKey === "id" || compactKey === "userid" || compactKey === "profileid") {
        const value = normalized[key];
        if (typeof value === "string" || typeof value === "number") {
          return String(value);
        }
      }
    }

    if (normalized.user && typeof normalized.user === "object") {
      const nestedUserId = getProfileId(normalized.user);
      if (nestedUserId) return nestedUserId;
    }
  }

  return null;
}

async function resolveUserIdByUsername(rawUsername: string): Promise<string | null> {
  const username = rawUsername.trim().replace(/^@/, "");
  if (!username) return null;

  const encoded = encodeURIComponent(username);
  const endpoints = [`/profile/${encoded}`];

  for (const endpoint of endpoints) {
    try {
      const response: any = await api.get(endpoint);
      const resolved = getProfileId(response);
      if (resolved) return resolved;
    } catch {
      // Try the next candidate endpoint.
    }
  }

  return null;
}

function getUserIdFromToken(): string | null {
  const token = localStorage.getItem("dealvid_token");
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    const payload = JSON.parse(json);
    return payload?.sub || payload?.nameid || payload?.nameIdentifier || null;
  } catch {
    return null;
  }
}

export function NewDeal() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    counterpartUsername: "",
    role: "customer",
    description: "",
    deliverables: "",
    deadline: "",
    amount: "",
    prepayment: "",
    paymentTerms: "",
    videoMethod: "upload",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Введите название сделки.");
      return;
    }

    if (!form.counterpartUsername.trim()) {
      setError("Введите username контрагента.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const me: any = unwrapProfile(await api.get("/profile/me"));
      let myId = getProfileId(me) || getUserIdFromToken();
      if (!myId) {
        const myUsername = me?.username || me?.Username || me?.email || me?.Email || "";
        myId = myUsername ? await resolveUserIdByUsername(String(myUsername)) : null;
      }
      if (!myId) throw new Error("Не удалось получить данные текущего пользователя.");
      const myName = getDisplayName(me);
      if (myName) rememberUserName(myId, myName);

      let counterpartId: string | null = null;
      let counterpartName = "";
      try {
        const userRes: any = unwrapProfile(
          await api.get(`/profile/${encodeURIComponent(form.counterpartUsername.trim())}`)
        );
        counterpartId = getProfileId(userRes);
        counterpartName = getDisplayName(userRes);
        if (!counterpartId) {
          counterpartId = await resolveUserIdByUsername(form.counterpartUsername.trim());
        }
      } catch (err) {
        counterpartId = await resolveUserIdByUsername(form.counterpartUsername.trim());
        if (!counterpartId) {
          throw new Error("Контрагент не найден. Проверьте username профиля.");
        }
      }

      if (!counterpartId) {
        throw new Error("Не удалось получить ID контрагента.");
      }

      if (String(counterpartId) === String(myId)) {
        throw new Error("Нельзя создать сделку с самим собой.");
      }

      if (counterpartName) {
        rememberUserName(counterpartId, counterpartName);
      } else if (form.counterpartUsername.trim()) {
        rememberUserName(counterpartId, form.counterpartUsername.trim());
      }

      const customerId = form.role === "customer" ? myId : counterpartId;
      const executorId = form.role === "executor" ? myId : counterpartId;

      await api.post("/transaction/send-invite", {
        customerId,
        executorId,
        title: form.title,
        description: `${form.description}\n\nСумма: ${form.amount}\nПредоплата: ${form.prepayment}\nОплата: ${form.paymentTerms}`,
        expiresAt: form.deadline ? new Date(form.deadline).toISOString() : null,
        videoLink: null,
      });

      if (videoFile) {
        localStorage.setItem(
            "dealvid_notice",
            "Сделка создана. Видео нужно загрузить позже из карточки сделки, когда сделка станет активной."
        );
      }

      navigate(`/dashboard`);
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при создании сделки");
    } finally {
      setSubmitting(false);
    }
  };

  const prepayPercent = form.amount && form.prepayment
      ? Math.round((Number(form.prepayment) / Number(form.amount)) * 100)
      : 0;

  return (
      <div className="min-h-screen bg-[#F7F8FA] flex">
        <aside className="hidden lg:flex w-[260px] bg-white border-r border-[#E8E9F0] flex-col min-h-screen sticky top-0 shrink-0">
          <div className="px-5 h-[68px] border-b border-[#E8E9F0] flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#5048E5] flex items-center justify-center">
                <svg width="720" height="720" viewBox="0 0 720 720" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="720" height="720" transform="matrix(-1 0 0 1 720 0)" fill="#5048E5"/>
                  <path d="M480 353.723C480 334.393 464.33 318.723 445 318.723H275C255.67 318.723 240 334.393 240 353.723C240 373.053 255.67 388.723 275 388.723H445C464.33 388.723 480 373.053 480 353.723Z" fill="#D9D9D9"/>
                  <path d="M340.797 516.706C368.134 544.042 412.455 544.042 439.792 516.706L560 396.497C532.663 369.161 488.342 369.161 461.005 396.497L340.797 516.706Z" fill="#D9D9D9"/>
                  <path d="M153.797 310.706C181.134 338.042 225.455 338.042 252.792 310.706L373 190.497C345.663 163.161 301.342 163.161 274.005 190.497L153.797 310.706Z" fill="#D9D9D9"/>
                  <path d="M466.334 381.836C493.671 354.499 493.671 310.177 466.334 282.841L370.875 187.381C357.207 173.713 335.046 173.713 321.378 187.381C307.709 201.05 307.709 223.21 321.378 236.879L466.334 381.836Z" fill="#D9D9D9"/>
                  <path d="M397.083 523.087C410.752 509.419 410.752 487.258 397.083 473.589L252.126 328.633C224.79 355.969 224.79 400.291 252.126 427.628L347.586 523.087C361.254 536.755 383.415 536.755 397.083 523.087Z" fill="#D9D9D9"/>
                </svg>
              </div>
              <span className="text-[#0D0D14] text-sm" style={{ fontWeight: 600 }}>Обоюдно</span>
            </Link>
          </div>

          <div className="p-5 flex-1">
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-[#8B8FA8] hover:text-[#0D0D14] transition-colors mb-7"
            >
              <ArrowLeft size={13} />
              Мои сделки
            </Link>

            <p className="text-[10px] text-[#C4C6D3] mb-3" style={{ fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Прогресс
            </p>

            <div className="h-1.5 bg-[#F1F2F6] rounded-full mb-6 overflow-hidden">
              <div
                  className="h-full bg-[#5048E5] rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            <div className="space-y-1">
              {steps.map((s) => {
                const Icon = s.icon;
                const done = s.id < step;
                const active = s.id === step;
                const upcoming = s.id > step;
                return (
                    <div
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            active ? "bg-[#5048E5]/8" : done ? "opacity-60" : upcoming ? "opacity-40" : ""
                        }`}
                    >
                      <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              done
                                  ? "bg-[#5048E5]"
                                  : active
                                      ? "border-2 border-[#5048E5] bg-white"
                                      : "border-2 border-[#E8E9F0] bg-white"
                          }`}
                      >
                        {done ? (
                            <Check size={12} className="text-white" />
                        ) : (
                            <Icon size={11} className={active ? "text-[#5048E5]" : "text-[#C4C6D3]"} />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm ${active ? "text-[#5048E5]" : "text-[#6B7280]"}`} style={{ fontWeight: active ? 500 : 400 }}>
                          {s.label}
                        </p>
                        <p className="text-[11px] text-[#C4C6D3]">{s.desc}</p>
                      </div>
                      {done && (
                          <div className="ml-auto">
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md" style={{ fontWeight: 600 }}>
                        Готово
                      </span>
                          </div>
                      )}
                    </div>
                );
              })}
            </div>
          </div>

          <div className="p-4">
            <div className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 size={13} className="text-[#8B8FA8]" />
                <p className="text-xs text-[#0D0D14]" style={{ fontWeight: 500 }}>Нужна помощь?</p>
              </div>
              <p className="text-[11px] text-[#8B8FA8] leading-relaxed">
                Если возникнут вопросы, наша поддержка всегда онлайн.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden bg-white border-b border-[#E8E9F0] px-4 h-[60px] flex items-center justify-between sticky top-0 z-20">
            <Link to="/dashboard" className="flex items-center gap-2 text-[#8B8FA8]">
              <ArrowLeft size={18} />
              <span className="text-[#0D0D14] text-sm font-semibold">Новая сделка</span>
            </Link>
            <div className="text-[11px] text-[#8B8FA8] font-medium bg-[#F7F8FA] px-2 py-1 rounded-lg border border-[#E8E9F0]">
              Шаг {step}/4
            </div>
          </div>

          <div className="bg-white border-b border-[#E8E9F0] px-4 md:px-8 h-[68px] flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs text-[#8B8FA8] mb-0.5">
                Шаг {step} из {steps.length} — <span className="hidden md:inline">{steps[step - 1].label}</span><span className="md:hidden">{steps[step - 1].desc}</span>
              </p>
              <h1 className="text-base md:text-lg text-[#0D0D14]" style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
                Новая сделка
              </h1>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs text-[#8B8FA8]">
              {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1 md:gap-1.5">
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] ${
                        s.id < step ? "bg-[#5048E5] text-white" :
                            s.id === step ? "border-2 border-[#5048E5] text-[#5048E5]" :
                                "border-2 border-[#E8E9F0] text-[#C4C6D3]"
                    }`} style={{ fontWeight: 600 }}>
                      {s.id < step ? <Check size={10} /> : s.id}
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`w-4 md:w-8 h-px ${s.id < step ? "bg-[#5048E5]" : "bg-[#E8E9F0]"}`} />
                    )}
                  </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 md:p-8 max-w-2xl w-full mx-auto">
            {step === 1 && (
                <div>
                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6 mb-4">
                    <h2 className="text-sm text-[#0D0D14] mb-4" style={{ fontWeight: 600 }}>Общее</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Название сделки</label>
                        <input
                            type="text" name="title" value={form.title} onChange={handleChange}
                            placeholder="Например: разработка сайта"
                            className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Ваша роль</label>
                        <select
                            name="role" value={form.role} onChange={handleChange}
                            className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all"
                        >
                          <option value="customer">Заказчик</option>
                          <option value="executor">Исполнитель</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
                    <h2 className="text-sm text-[#0D0D14] mb-4" style={{ fontWeight: 600 }}>Контрагент</h2>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Username профиля</label>
                      <input
                          type="text" name="counterpartUsername" value={form.counterpartUsername} onChange={handleChange}
                          placeholder="например: ivanov_88"
                          className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all"
                      />
                    </div>
                    <p className="text-xs text-[#8B8FA8] mt-3 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#5048E5]/10 inline-flex items-center justify-center text-[#5048E5] text-[9px]">i</span>
                      Приглашение отправится пользователю, чей профиль найден по этому username.
                    </p>
                  </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
                    <h2 className="text-sm text-[#0D0D14] mb-4" style={{ fontWeight: 600 }}>Описание задачи</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Что нужно сделать</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            rows={4} placeholder="Подробно опишите задачу, требования и пожелания..."
                            className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Результат работы</label>
                        <textarea
                            name="deliverables" value={form.deliverables} onChange={handleChange}
                            rows={3} placeholder="Что конкретно передаётся заказчику..."
                            className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
                    <h2 className="text-sm text-[#0D0D14] mb-4" style={{ fontWeight: 600 }}>Сроки</h2>
                    <div>
                      <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Дедлайн</label>
                      <input
                          type="date" name="deadline" value={form.deadline} onChange={handleChange}
                          className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
                    <h2 className="text-sm text-[#0D0D14] mb-4" style={{ fontWeight: 600 }}>Суммы</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Общая сумма (₽)</label>
                        <input
                            type="number" name="amount" value={form.amount} onChange={handleChange}
                            placeholder="50 000"
                            className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#6B7280] mb-1.5" style={{ fontWeight: 500 }}>Предоплата (₽)</label>
                        <input
                            type="number" name="prepayment" value={form.prepayment} onChange={handleChange}
                            placeholder="25 000"
                            className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all"
                        />
                      </div>
                    </div>

                    {form.amount && form.prepayment && (
                        <div className="bg-[#F7F8FA] rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6B7280]">Предоплата</span>
                            <span className="text-[#5048E5]" style={{ fontWeight: 600 }}>{Number(form.prepayment).toLocaleString("ru-RU")} ₽</span>
                          </div>
                          <div className="h-1.5 bg-[#E8E9F0] rounded-full overflow-hidden">
                            <div className="h-full bg-[#5048E5] rounded-full transition-all" style={{ width: `${Math.min(prepayPercent, 100)}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8B8FA8]">{prepayPercent}% от общей суммы</span>
                            <span className="text-[#6B7280]">
                        Остаток: {(Number(form.amount) - Number(form.prepayment)).toLocaleString("ru-RU")} ₽
                      </span>
                          </div>
                        </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
                    <h2 className="text-sm text-[#0D0D14] mb-4" style={{ fontWeight: 600 }}>Условия оплаты</h2>
                    <textarea
                        name="paymentTerms" value={form.paymentTerms} onChange={handleChange}
                        rows={3} placeholder="Предоплата при старте, остаток после приёма работы..."
                        className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-4 py-3 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:bg-white focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 transition-all resize-none"
                    />
                  </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
                    <h2 className="text-sm text-[#0D0D14] mb-1" style={{ fontWeight: 600 }}>Видеофиксация условий</h2>
                    <p className="text-xs text-[#8B8FA8] mb-5 leading-relaxed">
                      Запишите видео, в котором обе стороны устно подтверждают договорённости. Это главное доказательство сделки.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { key: "upload", icon: Upload, label: "Загрузить файл", desc: "MP4, MOV · до 500 МБ" },
                        { key: "record", icon: Video, label: "Записать сейчас", desc: "Прямо в браузере" },
                      ].map((opt) => (
                          <button
                              key={opt.key}
                              onClick={() => setForm({ ...form, videoMethod: opt.key })}
                              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                                  form.videoMethod === opt.key
                                      ? "border-[#5048E5] bg-[#5048E5]/4"
                                      : "border-[#E8E9F0] hover:border-[#5048E5]/30"
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.videoMethod === opt.key ? "bg-[#5048E5]" : "bg-[#F7F8FA]"}`}>
                              <opt.icon size={14} className={form.videoMethod === opt.key ? "text-white" : "text-[#8B8FA8]"} />
                            </div>
                            <div>
                              <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>{opt.label}</p>
                              <p className="text-[11px] text-[#8B8FA8]">{opt.desc}</p>
                            </div>
                          </button>
                      ))}
                    </div>

                    {form.videoMethod === "upload" ? (
                        <div>
                          <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/x-msvideo"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                          />
                          <div
                              onClick={() => fileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                                  videoFile
                                      ? "border-emerald-300 bg-emerald-50"
                                      : "border-[#E8E9F0] hover:border-[#5048E5]/30 hover:bg-[#5048E5]/2"
                              }`}
                          >
                            {videoFile ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <Check size={18} className="text-emerald-600" />
                                  </div>
                                  <p className="text-sm text-emerald-700" style={{ fontWeight: 500 }}>{videoFile.name}</p>
                                  <p className="text-xs text-emerald-500">Файл готов к загрузке</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-10 h-10 bg-[#F7F8FA] rounded-full flex items-center justify-center">
                                    <Upload size={18} className="text-[#C4C6D3]" />
                                  </div>
                                  <p className="text-sm text-[#6B7280]">Нажмите, чтобы выбрать файл</p>
                                  <p className="text-xs text-[#C4C6D3]">MP4, MOV, AVI · до 500 МБ</p>
                                </div>
                            )}
                          </div>
                        </div>
                    ) : (
                        <div className="bg-[#0D0D14] rounded-2xl overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-[#5048E5]/25 to-[#7C3AED]/10" />
                          <div className="absolute bottom-3 left-3 right-3 h-0.5 bg-white/5 rounded-full">
                            <div className={`h-full bg-[#5048E5] rounded-full transition-all duration-1000 ${videoFile ? "w-full" : "w-0"}`} />
                          </div>
                          <div className="relative h-full flex flex-col items-center justify-center gap-3">
                            <button
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white/15 hover:bg-white/25 border border-white/20`}
                            >
                              <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white ml-1" />
                            </button>
                            <p className="text-white/60 text-xs">Нажмите для записи</p>
                          </div>
                        </div>
                    )}
                  </div>

                  {!videoFile && (
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
                        <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-amber-700 text-xs" style={{ fontWeight: 600 }}>!</span>
                        </div>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Видео можно добавить позже из карточки сделки, когда она станет активной и если вы исполнитель.
                        </p>
                      </div>
                  )}

                  {error && (
                      <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                        {error}
                      </div>
                  )}
                </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8E9F0]">
              {step > 1 ? (
                  <button
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D0D14] transition-colors px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-[#E8E9F0]"
                  >
                    <ArrowLeft size={14} />
                    Назад
                  </button>
              ) : <div />}

              {step < 4 ? (
                  <button
                      onClick={() => setStep(step + 1)}
                      className="flex items-center gap-2 bg-[#5048E5] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#4338CA] transition-all shadow-[0_2px_8px_rgba(80,72,229,0.3)]"
                      style={{ fontWeight: 500 }}
                  >
                    Далее
                    <ArrowRight size={14} />
                  </button>
              ) : (
                  <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 bg-[#5048E5] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#4338CA] transition-all shadow-[0_2px_8px_rgba(80,72,229,0.3)] disabled:opacity-60"
                      style={{ fontWeight: 500 }}
                  >
                    {submitting ? "Сохраняем..." : "Заключить сделку"}
                    {!submitting && <Check size={14} />}
                  </button>
              )}
            </div>
          </div>
        </main>
      </div>
  );
}
