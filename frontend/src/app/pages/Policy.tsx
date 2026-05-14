import { Link } from "react-router";
import { ArrowLeft, EyeOff, Database, History, Shield } from "lucide-react";

export function Policy() {
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
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl text-[#0D0D14] mb-4" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Политика конфиденциальности
            </h1>
            <p className="text-lg text-center text-[#5048E5]" style={{ fontWeight: 500 }}>
              «Ваше лицо и ваши слова — только ваше дело»
            </p>
          </div>

          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <EyeOff size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>1. Принцип негласности</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Мы уважаем приватность. Ваши видео шифруются на стороне клиента или сразу при попадании на сервер. Мы не имеем права и технической возможности просматривать ваши сделки без вашего прямого разрешения.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Database size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>2. Какие данные мы собираем</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-[#0D0D14] mb-1" style={{ fontWeight: 600 }}>Персональны данные</h3>
                  <p className="text-[#6B7280] text-sm">Фамилия и имя, логин, электронную почту для доступа к аккаунту.</p>
                </div>
                <div>
                  <h3 className="text-sm text-[#0D0D14] mb-1" style={{ fontWeight: 600 }}>Видео-данные:</h3>
                  <p className="text-[#6B7280] text-sm">Сама запись сделки. Она хранится в зашифрованном облачном хранилище.</p>
                </div>
                <div>
                  <h3 className="text-sm text-[#0D0D14] mb-1" style={{ fontWeight: 600 }}>Метаданные блокчейна:</h3>
                  <p className="text-[#6B7280] text-sm">В публичный доступ (блокчейн) уходит только ID транзакции и хеш-код. Там нет вашего имени, лица или суммы сделки — только набор цифр и букв, подтверждающий подлинность.</p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <History size={20} className="text-emerald-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>3. Хранение и удаление</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Видео хранится до тех пор, пока сделка не будет помечена как «Завершенная» или пока вы не удалите аккаунт (если иное не предусмотрено активным спором). Мы не продаем ваши данные рекламодателям — наша модель заработка основана на подписке/сервисе, а не на данных.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-violet-600" />
                </div>
                <h2 className="text-xl text-[#0D0D14]" style={{ fontWeight: 600 }}>4. Безопасность</h2>
              </div>
              <p className="text-[#6B7280] leading-relaxed">
                Мы используем протоколы промышленного стандарта (AES-256) для защиты ваших записей. Хеш в блокчейне гарантирует, что даже если базу данных взломают, изменить содержание вашего «договора» будет невозможно.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-[#E8E9F0] text-center">
            <p className="text-sm text-[#8B8FA8]">Последнее обновление: 13 мая 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
