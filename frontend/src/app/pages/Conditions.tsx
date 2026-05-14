import { Link } from "react-router";
import { ArrowLeft, FileText, ShieldCheck, Zap, Scale, AlertCircle } from "lucide-react";

export function Conditions() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#8B8FA8] hover:text-[#0D0D14] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          На главную
        </Link>

        <div className="bg-white rounded-3xl border border-[#E8E9F0] p-8 md:p-12 shadow-sm">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl text-[#0D0D14] mb-4" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Условия использования
            </h1>
          </div>

          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Zap size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>1. Определение сервиса</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                «Обоюдно» - это платформа для фиксации устных договоренностей. Мы предоставляем технологию записи, шифрования и хеширования видео, которая подтверждает: кто, когда и о чем договорился.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-violet-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>2. Как фиксируется сделка</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Когда вы нажимаете кнопку «Записать», вы создаете цифровой след. Мы вычисляем уникальный отпечаток вашего видео и записывам его у себя. Это делает сделку неизменяемой: никто не сможет подменить видео или отрицать факт его записи.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Scale size={20} className="text-emerald-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>3. Статус видео-контракта</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Вы понимаете и соглашаетесь, что видеозапись в «Обоюдно» является доказательством ваших намерений. Сервис не является юридической фирмой, но предоставляет инструменты, которые могут быть использованы в качестве доказательств в спорах или суде (согласно Федеральному закону от 06.04.2011 № 63‑ФЗ «Об электронной подписи»).
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-amber-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>4. Обязательства сторон</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[#6B7280] leading-relaxed flex gap-2">
                  • Вы обязуетесь не использовать сервис для фиксации незаконных сделок.
                </p>
                <p className="text-[#6B7280] leading-relaxed flex gap-2">
                  • Вы несете ответственность за содержание сказанного на видео.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-rose-400" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>5. Отказ от ответственности</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                «Обоюдно» — это свидетель, а не исполнитель. Мы не гарантируем, что ваш заказчик заплатит, а фрилансер сдаст работу, но мы гарантируем, что факт их обещания будет надежно зафиксирован.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-[#E8E9F0] text-center">
            <p className="text-sm text-[#8B8FA8]">Последнее обновление: 30 апреля 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
