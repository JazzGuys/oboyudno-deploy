import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Search, User, Star, FileText, Video } from "lucide-react";
import { api } from "../../api/api";

type ProfileDto = {
  id?: string;
  Id?: string;
  userId?: string;
  UserId?: string;
  profileId?: string;
  ProfileId?: string;
  firstName?: string;
  FirstName?: string;
  lastName?: string;
  LastName?: string;
  username?: string;
  Username?: string;
  email?: string;
  Email?: string;
  rating?: number;
  Rating?: number;
  receivedComments?: any[];
  ReceivedComments?: any[];
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

function getId(source: any): string | null {
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
      const nestedUserId = getId(normalized.user);
      if (nestedUserId) return nestedUserId;
    }

    if (normalized.account && typeof normalized.account === "object") {
      const nestedAccountId = getId(normalized.account);
      if (nestedAccountId) return nestedAccountId;
    }
  }

  return null;
}

function getUsername(source: any): string {
  const normalized = unwrapProfile(source);
  return normalized?.username || normalized?.Username || "";
}

function getDisplayName(source: any): string {
  const normalized = unwrapProfile(source);
  const fullName = `${normalized?.firstName || normalized?.FirstName || ""} ${normalized?.lastName || normalized?.LastName || ""}`.trim();
  return fullName || normalized?.username || normalized?.Username || normalized?.email || normalized?.Email || "";
}

function getRating(source: any): number {
  const normalized = unwrapProfile(source);
  const value = normalized?.rating ?? normalized?.Rating ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function getFirstName(source: any): string {
  const normalized = unwrapProfile(source);
  return normalized?.firstName || normalized?.FirstName || "";
}

function getLastName(source: any): string {
  const normalized = unwrapProfile(source);
  return normalized?.lastName || normalized?.LastName || "";
}

function getEmail(source: any): string {
  const normalized = unwrapProfile(source);
  return normalized?.email || normalized?.Email || "";
}

function getComments(source: any): any[] {
  const normalized = unwrapProfile(source);
  return normalized?.receivedComments || normalized?.ReceivedComments || [];
}

async function resolveUserIdByUsername(rawUsername: string): Promise<string | null> {
  const username = rawUsername.trim().replace(/^@/, "");
  if (!username) return null;

  const encoded = encodeURIComponent(username);
  const endpoints = [
    `/profile/${encoded}`,
    `/search/user?username=${encoded}`,
    `/search/user/${encoded}`,
    `/users/search?username=${encoded}`,
    `/user/search?username=${encoded}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response: any = await api.get(endpoint);
      const resolved = getId(response);
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

export function Profile() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [me, setMe] = useState<ProfileDto | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [searchUsername, setSearchUsername] = useState(username === "me" ? "" : (username || ""));

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    role: "customer",
    description: "",
    amount: "",
    prepayment: "",
    paymentTerms: "",
    deadline: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const myProfile: any = unwrapProfile(await api.get("/profile/me"));
      setMe(myProfile);
      const myProfileId = getId(myProfile);
      const myDisplayName = getDisplayName(myProfile);
      if (myProfileId && myDisplayName) rememberUserName(myProfileId, myDisplayName);

      if (!username || username === "me") {
        setProfile(myProfile);
      } else {
        const externalProfile: any = unwrapProfile(
          await api.get(`/profile/${encodeURIComponent(username)}`)
        );
        setProfile(externalProfile);
        const externalProfileId = getId(externalProfile);
        const externalDisplayName = getDisplayName(externalProfile);
        if (externalProfileId && externalDisplayName) rememberUserName(externalProfileId, externalDisplayName);
      }
    } catch (err: any) {
      setProfile(null);
      setError(err?.message || "Не удалось загрузить профиль.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("dealvid_token")) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    setSearchUsername(getUsername(profile) || searchUsername);
  }, [profile]);

  const myId = getId(me) || getUserIdFromToken();
  const profileId = getId(profile);
  const isOwnProfile = Boolean(myId && profileId && String(myId) === String(profileId));
  const fullName = useMemo(() => {
    if (!profile) return "";
    const firstName = getFirstName(profile);
    const lastName = getLastName(profile);
    return `${firstName} ${lastName}`.trim();
  }, [profile]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const value = searchUsername.trim();
    if (!value) return;
    navigate(`/profile/${encodeURIComponent(value)}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setCreateError("");
  };

  const handleCreateDeal = async () => {
    if (!profile) return;
    if (!form.title.trim()) {
      setCreateError("Введите название сделки.");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      let resolvedMyId = myId;
      if (!resolvedMyId) {
        const myUsername = getUsername(me) || getEmail(me);
        if (myUsername) {
          resolvedMyId = await resolveUserIdByUsername(myUsername);
        }
      }

      if (!resolvedMyId) {
        throw new Error("Не удалось получить данные текущего пользователя.");
      }

      let resolvedProfileId = profileId;
      if (!resolvedProfileId) {
        const usernameToResolve = getUsername(profile) || getEmail(profile) || searchUsername.trim() || username || "";
        if (usernameToResolve) {
          if (usernameToResolve !== "me") {
            const resolvedId = await resolveUserIdByUsername(usernameToResolve);
            if (resolvedId) {
              resolvedProfileId = resolvedId;
            } else {
              const resolvedProfile: any = unwrapProfile(
                await api.get(`/profile/${encodeURIComponent(usernameToResolve)}`)
              );
              const fallbackResolvedId = getId(resolvedProfile);
              if (fallbackResolvedId) {
                resolvedProfileId = fallbackResolvedId;
                setProfile(resolvedProfile);
              }
            }
          }
        }
      }

      if (!resolvedProfileId) {
        throw new Error("Не удалось получить данные контрагента. Откройте профиль по username и попробуйте снова.");
      }

      if (String(resolvedProfileId) === String(resolvedMyId)) {
        throw new Error("Нельзя создать сделку с самим собой.");
      }

      const myDisplayName = getDisplayName(me) || getUsername(me) || getEmail(me);
      const counterpartyDisplayName = getDisplayName(profile) || getUsername(profile) || getEmail(profile);
      if (myDisplayName) rememberUserName(resolvedMyId, myDisplayName);
      if (counterpartyDisplayName) rememberUserName(resolvedProfileId, counterpartyDisplayName);

      const executorId = form.role === "executor" ? resolvedMyId : resolvedProfileId;
      const resolvedCustomerId = form.role === "customer" ? resolvedMyId : resolvedProfileId;

      await api.post("/transaction/send-invite", {
        customerId: resolvedCustomerId,
        executorId,
        title: form.title,
        description: `${form.description}\n\nСумма: ${form.amount}\nПредоплата: ${form.prepayment}\nОплата: ${form.paymentTerms}`,
        expiresAt: form.deadline ? new Date(form.deadline).toISOString() : null,
        videoLink: null,
      });

      if (videoFile) {
        localStorage.setItem(
          "dealvid_notice",
          "Сделка создана. Видео добавляется после активации сделки из её карточки (только исполнителем)."
        );
      }

      navigate("/dashboard");
    } catch (err: any) {
      setCreateError(err?.message || "Не удалось создать сделку.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#8B8FA8] hover:text-[#0D0D14] transition-colors"
          >
            <ArrowLeft size={14} />
            Назад в кабинет
          </Link>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C4C6D3]" />
              <input
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="username профиля"
                className="w-full sm:w-64 bg-white border border-[#E8E9F0] rounded-xl pl-8 pr-3 py-2 text-sm text-[#0D0D14] placeholder-[#C4C6D3] focus:outline-none focus:border-[#5048E5]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#5048E5] text-white rounded-xl text-sm hover:bg-[#4338CA] transition-colors shrink-0"
            >
              Открыть
            </button>
          </form>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E8E9F0] rounded-2xl p-8 text-center text-[#8B8FA8]">
            Загрузка профиля...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : profile ? (
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5">
            <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#5048E5]/10 text-[#5048E5] flex items-center justify-center">
                  <User size={22} />
                </div>
                <div>
                  <h1 className="text-xl text-[#0D0D14]" style={{ fontWeight: 700 }}>
                    {fullName || getUsername(profile) || "Профиль"}
                  </h1>
                  <p className="text-sm text-[#8B8FA8]">@{getUsername(profile) || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl p-3">
                  <p className="text-xs text-[#8B8FA8] mb-1">Рейтинг</p>
                  <p className="text-sm text-[#0D0D14] flex items-center gap-1" style={{ fontWeight: 600 }}>
                    <Star size={12} className="text-amber-500" />
                    {getRating(profile).toFixed(1)}
                  </p>
                </div>
                <div className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl p-3">
                  <p className="text-xs text-[#8B8FA8] mb-1">Email/username</p>
                  <p className="text-sm text-[#0D0D14] truncate" style={{ fontWeight: 600 }}>
                    {getEmail(profile) || getUsername(profile) || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl p-4">
                <p className="text-xs text-[#8B8FA8] mb-2">Отзывы ({getComments(profile).length})</p>
                {getComments(profile).slice(0, 3).map((c: any, idx: number) => (
                  <div key={idx} className="text-sm text-[#6B7280] mb-2">
                    {c?.text || c?.Text || "Без текста"}
                  </div>
                ))}
                {getComments(profile).length === 0 && (
                  <p className="text-sm text-[#8B8FA8]">Пока нет отзывов.</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#E8E9F0] rounded-2xl p-6">
              <h2 className="text-[#0D0D14] text-lg mb-1" style={{ fontWeight: 700 }}>
                Создать Сделку С Профиля
              </h2>
              <p className="text-sm text-[#8B8FA8] mb-5">
                Укажите роли и условия. Видео выбирается здесь, загрузка будет доступна после активации сделки.
              </p>

              {isOwnProfile && (
                <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                  Это ваш профиль. Сделку с самим собой создать нельзя.
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5">Название сделки</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Например: дизайн лендинга"
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5">Ваша роль</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5]"
                  >
                    <option value="customer">Я заказчик</option>
                    <option value="executor">Я исполнитель</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5">Описание</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] resize-none focus:outline-none focus:bg-white focus:border-[#5048E5]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Сумма"
                    className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5]"
                  />
                  <input
                    type="number"
                    name="prepayment"
                    value={form.prepayment}
                    onChange={handleChange}
                    placeholder="Предоплата"
                    className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5]"
                  />
                </div>

                <input
                  name="paymentTerms"
                  value={form.paymentTerms}
                  onChange={handleChange}
                  placeholder="Условия оплаты"
                  className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5]"
                />

                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:bg-white focus:border-[#5048E5]"
                />

                <div className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Video size={14} className="text-[#8B8FA8]" />
                    <span className="text-xs text-[#6B7280]">Видео подтверждения</span>
                  </div>
                  <input
                    type="file"
                    accept="video/mp4,video/avi,video/quicktime,video/x-msvideo"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-[#6B7280] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#5048E5] file:text-white"
                  />
                  {videoFile && (
                    <p className="mt-2 text-xs text-[#8B8FA8] truncate">{videoFile.name}</p>
                  )}
                </div>

                {createError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">
                    {createError}
                  </div>
                )}

                <button
                  onClick={handleCreateDeal}
                  disabled={creating || isOwnProfile}
                  className="w-full bg-[#5048E5] text-white py-2.5 rounded-xl text-sm hover:bg-[#4338CA] transition-colors disabled:opacity-60"
                >
                  {creating ? "Создаём..." : "Создать сделку"}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E8E9F0]">
                <Link to="/deal/new" className="inline-flex items-center gap-2 text-xs text-[#5048E5] hover:underline">
                  <FileText size={12} />
                  Открыть полный мастер создания сделки
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
