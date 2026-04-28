import { Link } from "react-router";
import {
  ArrowRight,
  Shield,
  Video,
  FileText,
  Lock,
  Clock,
  Users,
  CheckCircle,
  Zap,
} from "lucide-react";

const steps = [
  {
    num: "01",
    tag: "Начало",
    title: "Обговорите условия",
    desc: "Заказчик и исполнитель обсуждают задачу: объём работ, дедлайн, стоимость и условия предоплаты.",
    color: "from-violet-500/10 to-indigo-500/10",
    icon: "💭",
  },
  {
    num: "02",
    tag: "Фиксация",
    title: "Запишите видео",
    desc: "Прямо в браузере запишите короткое видео, в котором обе стороны устно подтверждают договорённости.",
    color: "from-blue-500/10 to-cyan-500/10",
    icon: "📸",
  },
  {
    num: "03",
    tag: "Гарантия",
    title: "Сделка под защитой",
    desc: "«Обоюдно» сохраняет запись, формирует документ и уведомляет обе стороны. Факт договорённости зафиксирован.",
    color: "from-emerald-500/10 to-teal-500/10",
    icon: "🔐",
  },
];

const features = [
  { icon: Shield, title: "Юридическая защита", desc: "Видеозапись — весомое доказательство. Храним в зашифрованном виде с временной меткой", color: "bg-violet-50 text-violet-600" },
  { icon: Video, title: "Запись в браузере", desc: "Никаких дополнительных программ и установок. Грузи хоть кружок из Telegram", color: "bg-blue-50 text-blue-600" },
  { icon: FileText, title: "Авто-документ", desc: "Автоматически формируем PDF с условиями из видео", color: "bg-cyan-50 text-cyan-600" },
  { icon: Lock, title: "Безопасное хранение", desc: "Записи хранятся на защищённых серверах. Доступ только для сторон сделки", color: "bg-emerald-50 text-emerald-600" },
  { icon: Clock, title: "5 минут на сделку", desc: "Не нужно ждать юриста или нотариуса. Договор за несколько минут", color: "bg-amber-50 text-amber-600" },
  { icon: Users, title: "Для любых сторон", desc: "Фрилансер и клиент, подрядчик и заказчик, арендатор и арендодатель", color: "bg-rose-50 text-rose-600" },
];

const pricing = [
  {
    name: "Старт",
    price: "0 ₽",
    period: "навсегда",
    desc: "Для первых шагов",
    features: ["3 сделки в месяц", "Видеозапись до 5 мин", "Хранение 30 дней", "PDF-документ"],
    cta: "Начать бесплатно",
    highlight: false,
  },
  {
    name: "Про",
    price: "1 ₽",
    period: "в месяц",
    desc: "Для активных фрилансеров",
    features: ["Безлимит сделок", "Видеозапись до 30 мин", "Хранение 2 года", "PDF + электронная подпись", "Уведомления контрагенту", "Приоритетная поддержка"],
    cta: "Попробовать 7 дней",
    highlight: true,
  },
  {
    name: "Бизнес",
    price: "2 ₽",
    period: "в месяц",
    desc: "Для команд и агентств",
    features: ["Всё из Про", "До 10 пользователей", "Безлимитное хранение", "API-интеграция"],
    cta: "Обсудить условия",
    highlight: false,
  },
];

export function Home() {
  return (
      <main className="overflow-x-hidden">
        <section className="relative min-h-[90vh] flex items-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#5048E5]/6 blur-[80px]" />
            <div className="absolute top-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-400/5 blur-[60px]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-[#E8E9F0] to-transparent" />
          </div>

          <div className="max-w-6xl mx-auto px-6 py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5048E5]/8 border border-[#5048E5]/15 mb-6">
                  <Zap size={12} className="text-[#5048E5]" />
                  <span className="text-xs text-[#5048E5]" style={{ fontWeight: 500 }}>Новый способ заключать сделки</span>
                </div>

                <h1
                    className="text-[50px] text-[#0D0D14] mb-5"
                    style={{ fontWeight: 700, lineHeight: "1.1", letterSpacing: "-0.03em" }}
                >
                  Договор за &nbsp;5 минут{" "}
                  <span className="text-[#5048E5] text-[40px] md:text-[40px] block"> С видеодоказательством </span>
                </h1>

                <p className="text-[#6B7280] text-lg mb-8 leading-relaxed max-w-lg">
                  «Обоюдно» помогает заказчикам и исполнителям фиксировать договорённости на видео.
                  Никаких споров — всё записано, зашифровано и хранится под защитой.
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-10">
                  <Link
                      to="/auth?tab=register"
                      className="inline-flex items-center gap-2 bg-[#5048E5] text-white px-6 py-3 rounded-xl hover:bg-[#4338CA] transition-all shadow-[0_4px_16px_rgba(80,72,229,0.35)] hover:shadow-[0_6px_20px_rgba(80,72,229,0.4)] hover:-translate-y-0.5"
                  >
                    Начать бесплатно
                    <ArrowRight size={15} />
                  </Link>
                  <a
                      href="#how"
                      className="inline-flex items-center gap-2 bg-white text-[#0D0D14] px-6 py-3 rounded-xl border border-[#E8E9F0] hover:border-[#5048E5]/30 transition-all shadow-sm"
                  >
                    Как работает
                  </a>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="relative w-full">
                  <div className="bg-white rounded-2xl border border-[#E8E9F0] shadow-[0_8px_40px_rgba(13,13,20,0.08)] p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-[#8B8FA8] mb-0.5">Текущая сделка</p>
                        <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>Разработка лендинга</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700" style={{ fontWeight: 500 }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Активна
                    </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#F7F8FA] rounded-xl p-3">
                        <p className="text-xs text-[#8B8FA8] mb-1">Сумма</p>
                        <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>35 000 ₽</p>
                      </div>
                      <div className="bg-[#F7F8FA] rounded-xl p-3">
                        <p className="text-xs text-[#8B8FA8] mb-1">Предоплата</p>
                        <p className="text-sm text-[#5048E5]" style={{ fontWeight: 600 }}>17 500 ₽</p>
                      </div>
                    </div>

                    <div className="bg-[#0D0D14] rounded-xl p-4 mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#5048E5]/20 to-transparent" />
                      <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <Video size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-0.5">Видеозапись</p>
                          <p className="text-sm text-white" style={{ fontWeight: 500 }}>привет.mp4 · 0:32</p>
                        </div>
                        <div className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#5048E5]/10 flex items-center justify-center shrink-0">
                        <Shield size={10} className="text-[#5048E5]" />
                      </div>
                      <p className="text-xs text-[#8B8FA8]">Сделка видеозащищена · 01 апр 2026</p>
                    </div>
                  </div>

                  <div className="absolute -bottom-5 -right-20 bg-white rounded-2xl border border-[#E8E9F0] shadow-[0_4px_20px_rgba(13,13,20,0.08)] px-4 py-3 flex items-center gap-3 z-20">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-[#0D0D14]" style={{ fontWeight: 600 }}>Сделка завершена</p>
                      <p className="text-xs text-[#8B8FA8]">Оплата получена</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-[36px] text-[#0D0D14] mb-3" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                Три шага до безопасной сделки
              </h2>
              <p className="text-[#6B7280] max-w-lg mx-auto">
                Простой процесс, который защищает обе стороны и экономит время
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {steps.map((step, i) => (
                  <div
                      key={step.num}
                      className="relative bg-white rounded-2xl border border-[#E8E9F0] p-7 hover:border-[#5048E5]/20 hover:shadow-[0_4px_24px_rgba(80,72,229,0.08)] transition-all"
                  >
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 hover:opacity-100 transition-opacity`} />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-[42px] leading-none">{step.icon}</span>
                        <span
                            className="text-[11px] px-2 py-0.5 rounded-md bg-[#F7F8FA] text-[#8B8FA8] border border-[#E8E9F0]"
                            style={{ fontWeight: 600, letterSpacing: "0.05em" }}
                        >
                {step.tag}
              </span>
                      </div>
                      <div className="text-[40px] text-[#E8E9F0] mb-2" style={{ fontWeight: 800, lineHeight: 1 }}>{step.num}</div>
                      <h3 className="text-[#0D0D14] mb-2" style={{ fontWeight: 600 }}>{step.title}</h3>
                      <p className="text-sm text-[#6B7280] leading-relaxed">{step.desc}</p>
                    </div>

                    {i < 2 && (
                        <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 translate-x-1/2 w-8 h-8 bg-white border border-[#E8E9F0] rounded-full items-center justify-center z-10 shadow-sm">
                          <ArrowRight size={14} className="text-[#8B8FA8]" />
                        </div>
                    )}
                  </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <h1 className="text-[36px] text-[#0D0D14]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Всё для защиты сделки
                </h1>
              </div>
              <p className="text-[#6B7280] max-w-xs">
                Продуманный набор инструментов для надёжных договорённостей
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {features.map((f) => (
                  <div
                      key={f.title}
                      className="p-6 rounded-2xl border border-[#E8E9F0] hover:border-transparent hover:shadow-[0_4px_24px_rgba(13,13,20,0.08)] transition-all group"
                  >
                    <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                      <f.icon size={18} />
                    </div>
                    <h3 className="text-[#0D0D14] mb-2" style={{ fontWeight: 600 }}>{f.title}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5048E5]/8 border border-[#5048E5]/15 mb-4">
                <span className="text-xs text-[#5048E5]" style={{ fontWeight: 500 }}>Тарифы</span>
              </div>
              <h2 className="text-[36px] text-[#0D0D14]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                Прозрачные цены
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {pricing.map((plan) => (
                  <div
                      key={plan.name}
                      className={`relative rounded-2xl p-7 ${
                          plan.highlight
                              ? "bg-[#5048E5] border-transparent shadow-[0_8px_32px_rgba(80,72,229,0.35)]"
                              : "bg-white border border-[#E8E9F0]"
                      }`}
                  >
                    {plan.highlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#0D0D14] text-xs px-3 py-1 rounded-full" style={{ fontWeight: 600 }}>
                          Популярный
                        </div>
                    )}
                    <div className="mb-6">
                      <p className={`text-xs mb-1 ${plan.highlight ? "text-indigo-200" : "text-[#8B8FA8]"}`} style={{ fontWeight: 500 }}>
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className={`text-3xl ${plan.highlight ? "text-white" : "text-[#0D0D14]"}`} style={{ fontWeight: 700 }}>{plan.price}</span>
                        <span className={`text-xs ${plan.highlight ? "text-indigo-200" : "text-[#8B8FA8]"}`}>/{plan.period}</span>
                      </div>
                      <p className={`text-xs ${plan.highlight ? "text-indigo-200" : "text-[#8B8FA8]"}`}>{plan.desc}</p>
                    </div>
                    <ul className="space-y-2.5 mb-7">
                      {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-white/20" : "bg-[#5048E5]/10"}`}>
                              <CheckCircle size={10} className={plan.highlight ? "text-white" : "text-[#5048E5]"} />
                            </div>
                            <span className={`text-xs ${plan.highlight ? "text-indigo-100" : "text-[#6B7280]"}`}>{f}</span>
                          </li>
                      ))}
                    </ul>
                    <Link
                        to="/auth?tab=register"
                        className={`block text-center py-2.5 rounded-xl text-sm transition-all ${
                            plan.highlight
                                ? "bg-white text-[#5048E5] hover:bg-indigo-50"
                                : "bg-[#5048E5] text-white hover:bg-[#4338CA] shadow-[0_2px_8px_rgba(80,72,229,0.25)]"
                        }`}
                        style={{ fontWeight: 500 }}
                    >
                      {plan.cta}
                    </Link>
                  </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 px-6 max-w-6xl mx-auto mb-16">
          <div className="relative overflow-hidden bg-[#0D0D14] rounded-3xl px-10 py-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5048E5]/40 via-transparent to-[#7C3AED]/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-[#5048E5]/60 to-transparent" />
            <div className="relative">
              <h2
                  className="text-white text-[36px] mb-3"
                  style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                Начните работать безопасно
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Присоединитесь к тысячам фрилансеров и заказчиков,<br />которые уже защитили свои сделки
              </p>
              <Link
                  to="/auth?tab=register"
                  className="inline-flex items-center gap-2 bg-white text-[#0D0D14] px-8 py-3 rounded-xl hover:bg-[#F7F8FA] transition-all"
                  style={{ fontWeight: 600 }}
              >
                Зарегистрироваться бесплатно
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#E8E9F0] bg-white py-10">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>«Обоюдно»</span>
              </div>
              <p className="text-xs text-[#8B8FA8]">© 2026 «Обоюдно». Все права защищены.</p>
              <div className="flex gap-6">
                {["Политика", "Условия", "Поддержка", "API"].map((l) => (
                    <span key={l} className="text-xs text-[#8B8FA8]">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>
  );
}
