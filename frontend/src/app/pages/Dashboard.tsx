import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Plus, FileText, Clock, CheckCircle, LogOut,
  User, Video, ChevronRight, LayoutDashboard,
  TrendingUp, Search,
} from "lucide-react";
import { api } from "../../api/api";

const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: "Активна", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  completed: { label: "Завершена", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  pending_receive: { label: "Ожидает вашего ответа", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  pending_sent: { label: "Ожидает контрагента", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
};

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

function unwrapObject(source: any): any {
  if (!source || typeof source !== "object") return source;
  if (source.data && typeof source.data === "object") return source.data;
  if (source.result && typeof source.result === "object") return source.result;
  if (source.value && typeof source.value === "object") return source.value;
  return source;
}

function toArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.$values)) return value.$values;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  if (typeof value === "object") {
    const values = Object.values(value);
    if (values.length && values.every((item) => item && typeof item === "object")) {
      return values;
    }
  }
  return [];
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

function looksLikeTransaction(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  const hasCustomer = value.customerId || value.CustomerId || value.customer_id || value.customer;
  const hasExecutor = value.executorId || value.ExecutorId || value.executor_id || value.executor;
  const hasTitle = typeof (value.title || value.Title) === "string";
  return Boolean((hasCustomer && hasExecutor) || hasTitle);
}

function extractCollections(profileData: any): {
  transactions: any[];
  pendingTransactions: any[];
  sentTransactions: any[];
} {
  const directTransactions = toArray(
    profileData.transactions ||
      profileData.Transactions ||
      profileData.activeTransactions ||
      profileData.ActiveTransactions
  );
  const directPending = toArray(
    profileData.pendingTransactions ||
      profileData.PendingTransactions ||
      profileData.pendingInvites ||
      profileData.PendingInvites
  );
  const directSent = toArray(
    profileData.sentTransactions ||
      profileData.SentTransactions ||
      profileData.sentInvites ||
      profileData.SentInvites
  );

  if (directTransactions.length || directPending.length || directSent.length) {
    return {
      transactions: directTransactions,
      pendingTransactions: directPending,
      sentTransactions: directSent,
    };
  }

  const fallbackTransactions: any[] = [];
  const fallbackPending: any[] = [];
  const fallbackSent: any[] = [];
  for (const [key, rawValue] of Object.entries(profileData || {})) {
    const list = toArray(rawValue).filter(looksLikeTransaction);
    if (!list.length) continue;
    const lower = key.toLowerCase();
    if (lower.includes("pending")) {
      fallbackPending.push(...list);
    } else if (lower.includes("sent")) {
      fallbackSent.push(...list);
    } else if (lower.includes("transaction") || lower.includes("deal") || lower.includes("invite")) {
      fallbackTransactions.push(...list);
    }
  }

  return {
    transactions: fallbackTransactions,
    pendingTransactions: fallbackPending,
    sentTransactions: fallbackSent,
  };
}

function normalizeStatus(status?: string): "active" | "completed" {
  const value = String(status ?? "").toLowerCase();
  if (value === "4" || value === "finished" || value === "completed") return "completed";
  return "active";
}

function normalizeUser(raw: any): { name: string; email: string } {
  const name =
    (typeof raw?.name === "string" && raw.name.trim()) ||
    (typeof raw?.Name === "string" && raw.Name.trim()) ||
    (typeof raw?.firstName === "string" && raw.firstName.trim()) ||
    (typeof raw?.FirstName === "string" && raw.FirstName.trim()) ||
    (typeof raw?.username === "string" && raw.username.trim()) ||
    (typeof raw?.Username === "string" && raw.Username.trim()) ||
    (typeof raw?.email === "string" && raw.email.trim()) ||
    (typeof raw?.Email === "string" && raw.Email.trim()) ||
    "Пользователь";

  const email =
    (typeof raw?.email === "string" && raw.email.trim()) ||
    (typeof raw?.Email === "string" && raw.Email.trim()) ||
    (typeof raw?.username === "string" && raw.username.trim()) ||
    (typeof raw?.Username === "string" && raw.Username.trim()) ||
    "";

  return { name, email };
}

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Пользователь", email: "" });
  const [deals, setDeals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = async () => {
    try {
      const profileData: any = unwrapObject(await api.get("/profile/me"));
      setUser(normalizeUser({
        name: `${profileData.firstName || profileData.FirstName || ""} ${profileData.lastName || profileData.LastName || ""}`.trim() || profileData.username || profileData.Username,
        email: profileData.email || profileData.Email || profileData.username || profileData.Username
      }));

      const myId = profileData?.id || profileData?.Id || getUserIdFromToken();
      if (!myId) throw new Error("Не удалось получить ID текущего пользователя.");
      const myDisplayName = normalizeUser({
        name: `${profileData.firstName || profileData.FirstName || ""} ${profileData.lastName || profileData.LastName || ""}`.trim() || profileData.username || profileData.Username,
        email: profileData.email || profileData.Email || profileData.username || profileData.Username
      }).name;
      if (myDisplayName) rememberUserName(myId, myDisplayName);

      let allDeals: any[] = [];

      const mapDeal = (d: any, uiStatus: string) => {
        const customerId =
          d.customerId ||
          d.CustomerId ||
          d.customer_id ||
          d.customer?.id ||
          d.Customer?.Id;
        const executorId =
          d.executorId ||
          d.ExecutorId ||
          d.executor_id ||
          d.executor?.id ||
          d.Executor?.Id;
        const description = d.description || d.Description || "";
        const createdAt = d.createdAt || d.CreatedAt;
        const expiresAt = d.expiresAt || d.ExpiresAt;
        const status = d.status || d.Status;
        const videoLink = d.videoLink || d.VideoLink;
        const createdAtTs = createdAt ? new Date(createdAt).getTime() : Number.NaN;

        const isCustomer = String(customerId) === String(myId);
        const counterpartId = isCustomer ? executorId : customerId;
        const amountMatch = description?.match(/Сумма:\s*(\d+)/);
        const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;
        const prepayMatch = description?.match(/Предоплата:\s*(\d+)/);
        const prepayment = prepayMatch ? parseInt(prepayMatch[1], 10) : 0;

        return {
          id: d.id || d.Id || d.transactionId || d.TransactionId || `${d.title || d.Title || "deal"}-${createdAt || Date.now()}`,
          title: d.title || d.Title || "Без названия",
          role: isCustomer ? "Заказчик" : "Исполнитель",
          counterpart: counterpartId ? counterpartId.toString().substring(0, 8) : "—",
          counterpartInitial: "K",
          counterpartColor: "#5048E5",
          amount,
          prepayment,
          status: uiStatus,
          date: createdAt ? new Date(createdAt).toLocaleDateString() : "—",
          createdAtTs: Number.isFinite(createdAtTs) ? createdAtTs : null,
          deadline: expiresAt ? new Date(expiresAt).toLocaleDateString() : "—",
          hasVideo: !!videoLink,
          progress: uiStatus === "completed" ? 100 : (uiStatus === "active" ? 50 : 0),
          rawStatus: status,
        };
      };

      const { transactions, pendingTransactions, sentTransactions } = extractCollections(profileData);

      if (transactions.length) {
        allDeals = allDeals.concat(transactions.map((d: any) => mapDeal(d, normalizeStatus(d.status || d.Status))));
      }
      if (pendingTransactions.length) {
        allDeals = allDeals.concat(pendingTransactions.map((d: any) => mapDeal(d, "pending_receive")));
      }
      if (sentTransactions.length) {
        allDeals = allDeals.concat(sentTransactions.map((d: any) => mapDeal(d, "pending_sent")));
      }

      const uniqueById = new Map<string, any>();
      for (const deal of allDeals) {
        uniqueById.set(String(deal.id), deal);
      }

      setDeals(Array.from(uniqueById.values()));
    } catch (err) {
      const stored = localStorage.getItem("dealvid_user");
      if (!stored) return;

      try {
        setUser(normalizeUser(JSON.parse(stored)));
      } catch {
        setUser(normalizeUser(null));
      }
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("dealvid_token")) {
      navigate("/auth");
      return;
    }

    const savedNotice = localStorage.getItem("dealvid_notice");
    if (savedNotice) {
      setNotice(savedNotice);
      localStorage.removeItem("dealvid_notice");
    }

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("dealvid_auth");
    localStorage.removeItem("dealvid_token");
    localStorage.removeItem("dealvid_user");
    navigate("/");
  };

  const handleAccept = async (id: string) => {
    try {
      await api.post(`/transaction/accept-invite/${id}`);
      fetchData();
    } catch (err) {
      alert("Ошибка при принятии сделки");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.post(`/transaction/decline-invite/${id}`);
      fetchData();
    } catch (err) {
      alert("Ошибка при отклонении сделки");
    }
  };

  const filtered = deals.filter((d) => {
    const matchTab = activeTab === "all" || (activeTab === "active" ? d.status !== "completed" : d.status === "completed");
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.counterpart.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalAmount = deals.reduce((s, d) => s + d.amount, 0);
  const activeCount = deals.filter(d => d.status === "active" || d.status === "pending_receive" || d.status === "pending_sent").length;
  const completedCount = deals.filter(d => d.status === "completed").length;
  const monthAgoTs = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const newDealsLast30Days = deals.filter((d) => typeof d.createdAtTs === "number" && d.createdAtTs >= monthAgoTs).length;
  const totalDealsTrend = `${newDealsLast30Days > 0 ? `+${newDealsLast30Days}` : "0"} за 30 дней`;
  const userInitial = (user.name?.trim()?.[0] || "П").toUpperCase();

  return (
      <div className="min-h-screen bg-[#F7F8FA] flex">
        <aside className="hidden md:flex w-[220px] bg-white border-r border-[#E8E9F0] flex-col min-h-screen sticky top-0 shrink-0">
          <div className="px-5 h-[68px] border-b border-[#E8E9F0] flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#5048E5] flex items-center justify-center shadow-[0_2px_8px_rgba(80,72,229,0.3)]">
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

          <nav className="flex-1 p-3 space-y-0.5">
            <p className="text-[10px] text-[#C4C6D3] px-3 pt-3 pb-2" style={{ fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Навигация
            </p>
            {[
              { icon: LayoutDashboard, label: "Мои сделки", to: "/dashboard", active: true },
              { icon: Plus, label: "Новая сделка", to: "/deal/new", active: false },
              { icon: User, label: "Профиль", to: "/profile/me", active: false },
            ].map((item) => (
                <Link
                    key={item.label}
                    to={item.to}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        item.active
                            ? "bg-[#5048E5]/8 text-[#5048E5]"
                            : "text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#0D0D14]"
                    }`}
                    style={{ fontWeight: item.active ? 500 : 400 }}
                >
                  <item.icon size={15} />
                  {item.label}
                  {item.label === "Мои сделки" && (
                      <span className="ml-auto text-[10px] bg-[#5048E5]/10 text-[#5048E5] px-1.5 py-0.5 rounded-md" style={{ fontWeight: 600 }}>
                  {deals.length}
                </span>
                  )}
                </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-[#E8E9F0]">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #5048E5, #7C3AED)", fontWeight: 600 }}
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#0D0D14] truncate" style={{ fontWeight: 500 }}>{user.name}</p>
                <p className="text-[11px] text-[#8B8FA8] truncate">{user.email || "—"}</p>
              </div>
              <button
                  onClick={handleLogout}
                  className="text-[#C4C6D3] hover:text-[#6B7280] transition-colors"
                  title="Выйти"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="md:hidden bg-white border-b border-[#E8E9F0] px-4 h-[60px] flex items-center justify-between sticky top-0 z-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#5048E5] flex items-center justify-center shadow-[0_2px_8px_rgba(80,72,229,0.3)]">
                <svg width="720" height="720" viewBox="0 0 720 720" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="720" height="720" transform="matrix(-1 0 0 1 720 0)" fill="#5048E5"/>
                  <path d="M480 353.723C480 334.393 464.33 318.723 445 318.723H275C255.67 318.723 240 334.393 240 353.723C240 373.053 255.67 388.723 275 388.723H445C464.33 388.723 480 373.053 480 353.723Z" fill="#D9D9D9"/>
                  <path d="M340.797 516.706C368.134 544.042 412.455 544.042 439.792 516.706L560 396.497C532.663 369.161 488.342 369.161 461.005 396.497L340.797 516.706Z" fill="#D9D9D9"/>
                  <path d="M153.797 310.706C181.134 338.042 225.455 338.042 252.792 310.706L373 190.497C345.663 163.161 301.342 163.161 274.005 190.497L153.797 310.706Z" fill="#D9D9D9"/>
                  <path d="M466.334 381.836C493.671 354.499 493.671 310.177 466.334 282.841L370.875 187.381C357.207 173.713 335.046 173.713 321.378 187.381C307.709 201.05 307.709 223.21 321.378 236.879L466.334 381.836Z" fill="#D9D9D9"/>
                  <path d="M397.083 523.087C410.752 509.419 410.752 487.258 397.083 473.589L252.126 328.633C224.79 355.969 224.79 400.291 252.126 427.628L347.586 523.087C361.254 536.755 383.415 536.755 397.083 523.087Z" fill="#D9D9D9"/>
                </svg>
              </div>
              <span className="text-[#0D0D14] text-sm font-semibold">Обоюдно</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/deal/new" className="w-8 h-8 bg-[#5048E5] text-white rounded-lg flex items-center justify-center">
                <Plus size={16} />
              </Link>
              <Link to="/profile/me" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5048E5] to-[#7C3AED] flex items-center justify-center text-[10px] text-white font-bold">
                {userInitial}
              </Link>
            </div>
          </div>

          <div className="bg-white border-b border-[#E8E9F0] px-4 md:px-8 h-[68px] flex items-center justify-between sticky top-0 md:static z-10">
            <div>
              <h1 className="text-[#0D0D14] text-lg" style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
                Мои сделки
              </h1>
              <p className="text-xs text-[#8B8FA8]">Управляйте всеми договорённостями</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                  to="/deal/new"
                  className="inline-flex items-center gap-1.5 bg-[#5048E5] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#4338CA] transition-all shadow-[0_2px_8px_rgba(80,72,229,0.3)]"
                  style={{ fontWeight: 500 }}
              >
                <Plus size={14} />
                Новая сделка
              </Link>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {notice && (
                <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                  <p className="text-sm text-amber-800">{notice}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Всего сделок", value: deals.length.toString(), icon: FileText, trend: totalDealsTrend, color: "text-[#0D0D14]", iconBg: "bg-[#F7F8FA]", iconColor: "text-[#6B7280]" },
                { label: "Активных", value: activeCount.toString(), icon: Clock, trend: "в работе", color: "text-blue-600", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
                { label: "Завершённых", value: completedCount.toString(), icon: CheckCircle, trend: "успешно", color: "text-emerald-600", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                { label: "Общая сумма", value: `${(totalAmount / 1000).toFixed(0)}K ₽`, icon: TrendingUp, trend: "за всё время", color: "text-[#5048E5]", iconBg: "bg-[#5048E5]/8", iconColor: "text-[#5048E5]" },
              ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-[#E8E9F0] p-5 hover:shadow-[0_4px_16px_rgba(13,13,20,0.06)] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-[#8B8FA8]">{stat.label}</p>
                      <div className={`w-7 h-7 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                        <stat.icon size={13} className={stat.iconColor} />
                      </div>
                    </div>
                    <p className={`text-2xl mb-1 ${stat.color}`} style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</p>
                    <p className="text-[11px] text-[#8B8FA8]">{stat.trend}</p>
                  </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex bg-[#F1F2F6] rounded-xl p-1 gap-0.5">
                {([
                  { key: "all", label: "Все" },
                  { key: "active", label: "Активные" },
                  { key: "completed", label: "Завершённые" },
                ] as const).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                            activeTab === t.key
                                ? "bg-white text-[#0D0D14] shadow-[0_1px_4px_rgba(13,13,20,0.08)]"
                                : "text-[#8B8FA8] hover:text-[#0D0D14]"
                        }`}
                        style={{ fontWeight: activeTab === t.key ? 500 : 400 }}
                    >
                      {t.label}
                    </button>
                ))}
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C4C6D3]" />
                  <input
                      type="text"
                      placeholder="Поиск..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="bg-white border border-[#E8E9F0] rounded-xl pl-8 pr-4 py-2 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5] focus:ring-2 focus:ring-[#5048E5]/10 w-full sm:w-48"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filtered.map((deal) => {
                const s = statusConfig[deal.status] || statusConfig["active"];
                return (
                    <Link
                        key={deal.id}
                        to={`/deal/${deal.id}`}
                        className="block bg-white border border-[#E8E9F0] rounded-2xl p-4 md:p-5 hover:border-[#5048E5]/20 hover:shadow-[0_4px_16px_rgba(13,13,20,0.06)] transition-all group relative"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm shrink-0"
                              style={{ background: deal.counterpartColor, fontWeight: 600 }}
                          >
                            {deal.counterpartInitial}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm text-[#0D0D14] truncate font-medium">{deal.title}</p>
                              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text}`} style={{ fontWeight: 500 }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${deal.status === "active" ? "animate-pulse" : ""}`} />
                                {s.label}
                          </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-xs text-[#8B8FA8]">{deal.role} · {deal.counterpart}</p>
                              <span className="w-1 h-1 rounded-full bg-[#E8E9F0]" />
                              <p className="text-xs text-[#8B8FA8]">до {deal.deadline}</p>
                            </div>
                          </div>
                        </div>

                        {deal.status === "pending_receive" ? (
                            <div className="flex items-center gap-2 z-20 relative sm:ml-auto">
                              <button
                                  onClick={(e) => { e.preventDefault(); handleAccept(deal.id); }}
                                  className="flex-1 sm:flex-none px-4 py-1.5 bg-[#5048E5] text-white text-xs rounded-lg hover:bg-[#4338CA] transition-colors font-medium"
                              >
                                Принять
                              </button>
                              <button
                                  onClick={(e) => { e.preventDefault(); handleDecline(deal.id); }}
                                  className="flex-1 sm:flex-none px-4 py-1.5 bg-[#F7F8FA] border border-[#E8E9F0] text-[#6B7280] text-xs rounded-lg hover:bg-white hover:text-[#0D0D14] transition-colors"
                              >
                                Отклонить
                              </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:ml-auto">
                              {deal.status !== "pending_sent" && (
                                  <div className="hidden lg:block w-24">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[11px] text-[#8B8FA8]">Прогресс</span>
                                      <span className="text-[11px] text-[#0D0D14]" style={{ fontWeight: 500 }}>{deal.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-[#F1F2F6] rounded-full overflow-hidden">
                                      <div
                                          className={`h-full rounded-full ${deal.status === "completed" ? "bg-emerald-500" : "bg-[#5048E5]"}`}
                                          style={{ width: `${deal.progress}%` }}
                                      />
                                    </div>
                                  </div>
                              )}

                              <div className="text-left sm:text-right shrink-0">
                                <p className="text-sm text-[#0D0D14] font-semibold">
                                  {deal.amount.toLocaleString("ru-RU")} ₽
                                </p>
                                <p className="text-[11px] text-[#8B8FA8]">аванс {deal.prepayment.toLocaleString("ru-RU")} ₽</p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {deal.hasVideo && (
                                    <div className="w-7 h-7 bg-[#5048E5]/8 rounded-lg flex items-center justify-center">
                                      <Video size={12} className="text-[#5048E5]" />
                                    </div>
                                )}
                                <div className="hidden sm:flex w-7 h-7 bg-[#F7F8FA] rounded-lg items-center justify-center">
                                  <FileText size={12} className="text-[#8B8FA8]" />
                                </div>
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <ChevronRight size={14} className="text-[#C4C6D3] group-hover:text-[#8B8FA8] transition-colors" />
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                    </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
                <div className="bg-white border border-[#E8E9F0] rounded-2xl p-16 text-center">
                  <div className="w-12 h-12 bg-[#F7F8FA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText size={20} className="text-[#C4C6D3]" />
                  </div>
                  <p className="text-sm text-[#8B8FA8]">Сделок не найдено</p>
                </div>
            )}
          </div>
        </main>
      </div>
  );
}
