import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Video, FileText, CheckCircle, Clock,
  AlertCircle, Shield, User, Calendar,
  DollarSign, Play, Copy, ExternalLink, Save, Check,
} from "lucide-react";
import { api } from "../../api/api";

const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string; icon: React.ElementType }> = {
  active: { label: "Активна", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", icon: Clock },
  completed: { label: "Завершена", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
  pending_receive: { label: "Ожидает вашего ответа", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", icon: AlertCircle },
  pending_sent: { label: "Ожидает контрагента", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", icon: AlertCircle },
};

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

function looksLikeTransaction(value: any): boolean {
  if (!value || typeof value !== "object") return false;
  const hasCustomer = value.customerId || value.CustomerId || value.customer_id || value.customer;
  const hasExecutor = value.executorId || value.ExecutorId || value.executor_id || value.executor;
  const hasTitle = typeof (value.title || value.Title) === "string";
  return Boolean((hasCustomer && hasExecutor) || hasTitle);
}

function extractCollections(profileData: any): {
  pendingTransactions: any[];
  sentTransactions: any[];
  activeTransactions: any[];
} {
  const pendingTransactions = toArray(
    profileData.pendingTransactions || profileData.PendingTransactions || profileData.pendingInvites || profileData.PendingInvites
  );
  const sentTransactions = toArray(
    profileData.sentTransactions || profileData.SentTransactions || profileData.sentInvites || profileData.SentInvites
  );
  const activeTransactions = toArray(
    profileData.transactions || profileData.Transactions || profileData.activeTransactions || profileData.ActiveTransactions
  );

  if (pendingTransactions.length || sentTransactions.length || activeTransactions.length) {
    return { pendingTransactions, sentTransactions, activeTransactions };
  }

  const fallbackPending: any[] = [];
  const fallbackSent: any[] = [];
  const fallbackActive: any[] = [];
  for (const [key, rawValue] of Object.entries(profileData || {})) {
    const list = toArray(rawValue).filter(looksLikeTransaction);
    if (!list.length) continue;
    const lower = key.toLowerCase();
    if (lower.includes("pending")) fallbackPending.push(...list);
    else if (lower.includes("sent")) fallbackSent.push(...list);
    else if (lower.includes("transaction") || lower.includes("deal") || lower.includes("invite")) fallbackActive.push(...list);
  }

  return {
    pendingTransactions: fallbackPending,
    sentTransactions: fallbackSent,
    activeTransactions: fallbackActive,
  };
}

function normalizeStatus(status?: string): "active" | "completed" {
  const value = String(status ?? "").toLowerCase();
  if (value === "4" || value === "finished" || value === "completed") return "completed";
  return "active";
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

function getDisplayNameFromRaw(raw: any, fallbackId: any): string {
  if (raw && typeof raw === "object") {
    const fullName = `${raw.firstName || raw.FirstName || ""} ${raw.lastName || raw.LastName || ""}`.trim();
    const direct =
      fullName ||
      raw.username ||
      raw.Username ||
      raw.email ||
      raw.Email ||
      raw.name ||
      raw.Name;
    if (direct) return String(direct);
  }

  if (typeof raw === "string" && raw.trim()) return raw.trim();

  if (fallbackId) return `ID ${String(fallbackId).slice(0, 8)}`;
  return "Не указан";
}

function getInitial(value: string, fallback = "У"): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed[0].toUpperCase();
}

const USER_DIRECTORY_KEY = "dealvid_user_directory";

function readUserDirectory(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USER_DIRECTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUserDirectory(next: Record<string, string>) {
  localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(next));
}

function rememberUserName(userId: any, name: string) {
  const id = userId ? String(userId) : "";
  const normalizedName = name?.trim();
  if (!id || !normalizedName) return;
  const current = readUserDirectory();
  current[id] = normalizedName;
  saveUserDirectory(current);
}

function getRememberedUserName(userId: any): string | null {
  const id = userId ? String(userId) : "";
  if (!id) return null;
  const current = readUserDirectory();
  const value = current[id];
  return value && value.trim() ? value.trim() : null;
}

function isGenericName(value: string): boolean {
  const normalized = value?.trim() || "";
  return !normalized || normalized === "Не указан" || normalized.startsWith("ID ");
}

function toDateInputValue(dateLike: any): string {
  if (!dateLike) return "";
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pickFirstNonEmptyString(...values: any[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeVideoUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.toLowerCase() === "minio" && parsed.port === "9000") {
      const browserProtocol = window.location.protocol === "https:" ? "https:" : "http:";
      parsed.protocol = browserProtocol;
      parsed.hostname = window.location.hostname || "localhost";
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return trimmed.replace(/^https?:\/\/minio:9000\//i, `${window.location.protocol}//${window.location.hostname || "localhost"}:9000/`);
  }
}

function extractVideoUrl(source: any): string | null {
  if (!source) return null;

  const direct = pickFirstNonEmptyString(source);
  if (direct) return normalizeVideoUrl(direct);

  const firstLayer = unwrapObject(source);
  const layers = [
    firstLayer,
    firstLayer?.data,
    firstLayer?.result,
    firstLayer?.value,
    firstLayer?.video,
    firstLayer?.file,
  ];

  for (const layer of layers) {
    if (!layer || typeof layer !== "object") continue;

    const url = pickFirstNonEmptyString(
      layer.videoUrl,
      layer.VideoUrl,
      layer.videoURL,
      layer.videoLink,
      layer.VideoLink,
      layer.url,
      layer.Url,
      layer.link,
      layer.Link,
      layer.href,
      layer.Href
    );
    if (url) return normalizeVideoUrl(url);
  }

  if (firstLayer && typeof firstLayer === "object") {
    for (const [key, value] of Object.entries(firstLayer)) {
      const normalized = key.toLowerCase();
      if ((normalized.includes("video") || normalized.includes("url") || normalized.includes("link")) && typeof value === "string" && value.trim()) {
        return normalizeVideoUrl(value.trim());
      }
    }
  }

  return null;
}

const LOCAL_VIDEO_CACHE_KEY = "dealvid_uploaded_video_urls";

function readLocalVideoCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_VIDEO_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getCachedVideoUrl(transactionId: string): string | null {
  const cache = readLocalVideoCache();
  return normalizeVideoUrl(cache[transactionId] || null);
}

function setCachedVideoUrl(transactionId: string, url: string) {
  const normalized = normalizeVideoUrl(url);
  if (!normalized) return;
  const cache = readLocalVideoCache();
  cache[transactionId] = normalized;
  localStorage.setItem(LOCAL_VIDEO_CACHE_KEY, JSON.stringify(cache));
}

type DealComment = {
  transactionId: string;
  reviewerId: string;
  reviewerUsername: string;
  receiverId: string;
  receiverUsername: string;
  rating: number;
  text: string;
  reviewerRole: string;
  createdAt: string;
};

function normalizeDealComment(raw: any): DealComment | null {
  if (!raw || typeof raw !== "object") return null;

  const transactionId = raw.transactionId || raw.TransactionId;
  const reviewerId = raw.reviewerId || raw.ReviewerId;
  const receiverId = raw.receiverId || raw.ReceiverId;
  const rating = Number(raw.rating ?? raw.Rating ?? 0);

  if (!transactionId || !reviewerId || !receiverId || !Number.isFinite(rating)) return null;

  return {
    transactionId: String(transactionId),
    reviewerId: String(reviewerId),
    reviewerUsername: String(raw.reviewerUsername || raw.ReviewerUsername || "Не указан"),
    receiverId: String(receiverId),
    receiverUsername: String(raw.receiverUsername || raw.ReceiverUsername || "Не указан"),
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    text: String(raw.text || raw.Text || "").trim(),
    reviewerRole: String(raw.reviewerRole || raw.ReviewerRole || ""),
    createdAt: String(raw.createdAt || raw.CreatedAt || ""),
  };
}

function formatRatingStars(value: number): string {
  const rating = Math.max(1, Math.min(5, Math.round(Number(value) || 0)));
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

export function DealDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [dealComments, setDealComments] = useState<DealComment[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<string>("");
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [commentFormInitialized, setCommentFormInitialized] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  const fetchDealComments = async (transactionId: string) => {
    try {
      const commentsData: any = await api.get(`/transaction/comments/${transactionId}`);
      const list = toArray(unwrapObject(commentsData));
      const normalized = list
        .map(normalizeDealComment)
        .filter((value): value is DealComment => Boolean(value))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDealComments(normalized);
    } catch {
      setDealComments([]);
    }
  };

  const fetchDeal = async () => {
    if (!id) return;

    try {
      setError("");
      const profileData: any = unwrapObject(await api.get("/profile/me"));
      const myId =
        profileData?.id ||
        profileData?.Id ||
        profileData?.userId ||
        profileData?.UserId ||
        getUserIdFromToken();
      setCurrentUserId(myId ? String(myId) : null);
      const myName = getDisplayNameFromRaw(
        {
          firstName: profileData?.firstName || profileData?.FirstName,
          lastName: profileData?.lastName || profileData?.LastName,
          username: profileData?.username || profileData?.Username,
          email: profileData?.email || profileData?.Email,
        },
        myId
      );
      if (myId && myName && !isGenericName(myName)) {
        rememberUserName(myId, myName);
      }

      const { pendingTransactions, sentTransactions, activeTransactions } = extractCollections(profileData);
      const pendingDeals: any[] = pendingTransactions;
      const sentDeals: any[] = sentTransactions;
      const activeDeals: any[] = activeTransactions;

      const allDeals = [...pendingDeals, ...sentDeals, ...activeDeals];
      const data = allDeals.find(
        (t: any) =>
          String(t.id || t.Id || t.transactionId || t.TransactionId) === String(id)
      );
      if (!data) {
        setDeal(null);
        setDealComments([]);
        setVideoUrl(getCachedVideoUrl(String(id)));
        setError("Сделка не найдена или у вас нет к ней доступа.");
        return;
      }

      let uiStatus = "active";
      if (pendingDeals.some((t: any) => String(t.id || t.Id || t.transactionId || t.TransactionId) === String(id))) uiStatus = "pending_receive";
      else if (sentDeals.some((t: any) => String(t.id || t.Id || t.transactionId || t.TransactionId) === String(id))) uiStatus = "pending_sent";
      else if (activeDeals.some((t: any) => String(t.id || t.Id || t.transactionId || t.TransactionId) === String(id))) {
        uiStatus = normalizeStatus(data.status || data.Status);
      }

      const customerId =
        data.customerId ||
        data.CustomerId ||
        data.customer_id ||
        data.customer?.id ||
        data.Customer?.Id;
      const executorId =
        data.executorId ||
        data.ExecutorId ||
        data.executor_id ||
        data.executor?.id ||
        data.Executor?.Id;
      const customerName = getDisplayNameFromRaw(
        data.customer ||
          data.Customer ||
          data.customerName ||
          data.CustomerName ||
          data.customerUsername ||
          data.CustomerUsername ||
          `${data.customerFirstName || data.CustomerFirstName || ""} ${data.customerLastName || data.CustomerLastName || ""}`.trim(),
        customerId
      );
      let resolvedCustomerName = customerName;
      const rememberedCustomer = getRememberedUserName(customerId);
      if (isGenericName(resolvedCustomerName) && rememberedCustomer) {
        resolvedCustomerName = rememberedCustomer;
      }

      const executorName = getDisplayNameFromRaw(
        data.executor ||
          data.Executor ||
          data.executorName ||
          data.ExecutorName ||
          data.executorUsername ||
          data.ExecutorUsername ||
          `${data.executorFirstName || data.ExecutorFirstName || ""} ${data.executorLastName || data.ExecutorLastName || ""}`.trim(),
        executorId
      );
      let resolvedExecutorName = executorName;
      const rememberedExecutor = getRememberedUserName(executorId);
      if (isGenericName(resolvedExecutorName) && rememberedExecutor) {
        resolvedExecutorName = rememberedExecutor;
      }

      if (customerId && resolvedCustomerName && !isGenericName(resolvedCustomerName)) {
        rememberUserName(customerId, resolvedCustomerName);
      }
      if (executorId && resolvedExecutorName && !isGenericName(resolvedExecutorName)) {
        rememberUserName(executorId, resolvedExecutorName);
      }

      const title = data.title || data.Title;
      const descriptionRaw = data.description || data.Description;
      const createdAt = data.createdAt || data.CreatedAt;
      const finishedAt = data.finishedAt || data.FinishedAt;
      const finisherId = data.finisherId || data.FinisherId || null;
      const expiresAt = data.expiresAt || data.ExpiresAt;
      const videoLink = extractVideoUrl(data);

      const isCustomer = Boolean(myId) && String(customerId) === String(myId);
      const isExecutor = Boolean(myId) && String(executorId) === String(myId);
      const counterpartId = isCustomer ? executorId : isExecutor ? customerId : (executorId || customerId);
      const counterpartName = isCustomer
        ? resolvedExecutorName
        : isExecutor
          ? resolvedCustomerName
          : getDisplayNameFromRaw(getRememberedUserName(counterpartId), counterpartId);

      const amountMatch = descriptionRaw?.match(/Сумма:\s*(\d+)/);
      const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;
      const prepayMatch = descriptionRaw?.match(/Предоплата:\s*(\d+)/);
      const prepayment = prepayMatch ? parseInt(prepayMatch[1], 10) : 0;

      let cleanDesc = descriptionRaw || "—";
      cleanDesc = cleanDesc.replace(/Сумма:\s*\d+/g, "").replace(/Предоплата:\s*\d+/g, "").replace(/Оплата:\s*.*/g, "").trim();

      const dealId = data.id || data.Id || data.transactionId || data.TransactionId || id;
      const cachedVideoUrl = getCachedVideoUrl(String(dealId));
      const backendVideoUrl = videoLink || null;
      const initialVideoUrl = backendVideoUrl || cachedVideoUrl;

      setDeal({
        id: dealId,
        customerId,
        executorId,
        customerName: resolvedCustomerName,
        executorName: resolvedExecutorName,
        title: title || "Сделка",
        role: isCustomer ? "Заказчик" : isExecutor ? "Исполнитель" : "Участник",
        counterpart: counterpartId ? counterpartId.toString().substring(0, 8) : "—",
        counterpartName,
        counterpartInitial: getInitial(counterpartName, "К"),
        counterpartColor: "#5048E5",
        amount: amount,
        prepayment: prepayment,
        status: uiStatus,
        date: new Date(createdAt || Date.now()).toLocaleDateString(),
        finishedAt: finishedAt || null,
        finisherId: finisherId ? String(finisherId) : null,
        deadline: expiresAt ? new Date(expiresAt).toLocaleDateString() : "—",
        description: cleanDesc,
        deliverables: "Согласно ТЗ",
        paymentTerms: "Определены при создании",
        hasVideo: !!initialVideoUrl,
        progress: uiStatus === "completed" ? 100 : (uiStatus === "active" ? 50 : 0),
      });
      setVideoUrl(initialVideoUrl);
      setVideoError("");
      setActionMessage("");
      setEditForm({
        title: title || "Сделка",
        description: cleanDesc || "",
        deadline: toDateInputValue(expiresAt),
      });

      await fetchDealComments(String(dealId));

      try {
        const videoData: any = await api.get(`/transaction/get-video/${id}`);
        const resolvedVideoUrl = extractVideoUrl(videoData);
        if (resolvedVideoUrl) {
          setVideoUrl(resolvedVideoUrl);
          setCachedVideoUrl(String(dealId), resolvedVideoUrl);
          setDeal((prev: any) => prev ? { ...prev, hasVideo: true } : prev);
          setVideoError("");
        }
      } catch {
      }
    } catch (err: any) {
      setDeal(null);
      setDealComments([]);
      setError(err?.message || "Не удалось загрузить сделку.");
    }
  };

  useEffect(() => {
    setCommentText("");
    setCommentRating(5);
    setCommentFormInitialized(false);
    if (id) void fetchDeal();
  }, [id]);

  const myComment = dealComments.find((comment) =>
    currentUserId ? String(comment.reviewerId) === String(currentUserId) : false
  );

  useEffect(() => {
    if (!deal || deal.status !== "completed") return;
    if (commentFormInitialized) return;

    if (myComment) {
      setCommentText(myComment.text || "");
      setCommentRating(myComment.rating);
    }

    setCommentFormInitialized(true);
  }, [deal, myComment, commentFormInitialized]);

  const handleAccept = async () => {
    try {
      await api.post(`/transaction/accept-invite/${id}`);
      void fetchDeal();
    } catch (err) {
      alert("Ошибка при принятии сделки");
    }
  };

  const handleDecline = async () => {
    try {
      await api.post(`/transaction/decline-invite/${id}`);
      navigate("/dashboard");
    } catch (err) {
      alert("Ошибка при отклонении сделки");
    }
  };

  const canUploadVideo = Boolean(
      deal &&
      currentUserId &&
      String(deal.executorId) === String(currentUserId) &&
      deal.status === "active"
  );

  const handleUploadVideo = async () => {
    if (!id || !videoFile) return;

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      const uploadRes: any = await api.post(`/transaction/upload-video/${id}`, formData);
      const uploadedUrl = extractVideoUrl(uploadRes);

      if (uploadedUrl) {
        setVideoUrl(uploadedUrl);
        setCachedVideoUrl(String(id), uploadedUrl);
        setVideoError("");
      }

      setDeal((prev: any) => prev ? { ...prev, hasVideo: true } : prev);
      setVideoFile(null);

      if (!uploadedUrl) {
        await fetchDeal();
      }
    } catch (err: any) {
      alert(err?.message || "Не удалось загрузить видео.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRefreshVideo = async () => {
    if (!id) return;
    try {
      const videoData: any = await api.get(`/transaction/get-video/${id}`);
      const resolvedVideoUrl = extractVideoUrl(videoData);
      if (resolvedVideoUrl) {
        setVideoUrl(resolvedVideoUrl);
        setCachedVideoUrl(String(id), resolvedVideoUrl);
        setDeal((prev: any) => (prev ? { ...prev, hasVideo: true } : prev));
        setVideoError("");
        return;
      }
    } catch {
    }

    await fetchDeal();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionMessage("Ссылка на сделку скопирована.");
    } catch {
      setActionMessage("Не удалось скопировать ссылку.");
    }
  };

  const handleOpenProtectedVideo = async () => {
    if (!deal?.hasVideo) {
      setActionMessage("Видео для этой сделки пока не загружено.");
      return;
    }

    if (videoUrl) {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!id) {
      setActionMessage("Не удалось определить сделку для открытия видео.");
      return;
    }

    setActionLoading("open-video");
    const preopenedTab = window.open("", "_blank", "noopener,noreferrer");

    try {
      const videoData: any = await api.get(`/transaction/get-video/${id}`);
      const resolvedVideoUrl = extractVideoUrl(videoData);

      if (!resolvedVideoUrl) {
        if (preopenedTab) preopenedTab.close();
        setActionMessage("Не удалось получить ссылку на видео.");
        return;
      }

      setVideoUrl(resolvedVideoUrl);
      setCachedVideoUrl(String(deal.id || id), resolvedVideoUrl);
      setDeal((prev: any) => (prev ? { ...prev, hasVideo: true } : prev));
      setVideoError("");

      if (preopenedTab) preopenedTab.location.href = resolvedVideoUrl;
      else window.open(resolvedVideoUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      if (preopenedTab) preopenedTab.close();
      setActionMessage(err?.message || "Не удалось открыть видео.");
    } finally {
      setActionLoading("");
    }
  };

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    setActionLoading(key);
    setActionMessage("");
    try {
      await action();
      setActionMessage(successMessage);
      await fetchDeal();
    } catch (err: any) {
      setActionMessage(err?.message || "Не удалось выполнить действие.");
    } finally {
      setActionLoading("");
    }
  };

  const handleSendEndRequest = async () =>
    runAction(
      "send-end",
      () => api.post(`/transaction/send-end-request/${id}`),
      "Запрос на завершение отправлен."
    );

  const handleAcceptEndRequest = async () =>
    runAction(
      "accept-end",
      () => api.post(`/transaction/accept-end-request/${id}`),
      "Сделка завершена."
    );

  const handleCancelEndRequest = async () =>
    runAction(
      "cancel-end",
      () => api.post(`/transaction/cancel-end-request/${id}`),
      "Запрос на завершение отменён."
    );

  const handleChangeAndResendInvite = async () => {
    if (!deal) return;
    if (!editForm.title.trim()) {
      setActionMessage("Введите название сделки.");
      return;
    }

    const description = editForm.description.trim();
    const amountLine = `Сумма: ${deal.amount || 0}`;
    const prepaymentLine = `Предоплата: ${deal.prepayment || 0}`;
    const paymentLine = `Оплата: ${deal.paymentTerms || "По договоренности"}`;
    const finalDescription = `${description}\n\n${amountLine}\n${prepaymentLine}\n${paymentLine}`.trim();

    await runAction(
      "change-invite",
      () =>
        api.post(`/transaction/change-and-send-invite/${id}`, {
          customerId: deal.customerId,
          executorId: deal.executorId,
          title: editForm.title.trim(),
          description: finalDescription,
          expiresAt: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
        }),
      "Изменения отправлены контрагенту."
    );
    setEditMode(false);
  };

  const handleLeaveComment = async () => {
    if (!commentText.trim()) {
      setActionMessage("Введите текст комментария.");
      return;
    }

    if (!Number.isFinite(commentRating) || commentRating < 1 || commentRating > 5) {
      setActionMessage("Оценка должна быть от 1 до 5.");
      return;
    }

    await runAction(
      "leave-comment",
      () =>
        api.post(`/transaction/leave-comment/${id}`, {
          text: commentText.trim(),
          rating: Math.round(commentRating),
        }),
      "Комментарий отправлен."
    );
  };

  if (!deal) {
    return (
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#6B7280] mb-3">{error || "Загрузка или сделка не найдена"}</p>
            <Link to="/dashboard" className="text-sm text-[#5048E5] hover:underline">Вернуться к списку</Link>
          </div>
        </div>
    );
  }

  const s = statusConfig[deal.status] || statusConfig["active"];
  const isCurrentUserExecutor = Boolean(currentUserId && String(deal.executorId) === String(currentUserId));
  const isCurrentUserCustomer = Boolean(currentUserId && String(deal.customerId) === String(currentUserId));
  const hasEndRequestFromExecutor = Boolean(deal.finisherId && String(deal.finisherId) === String(deal.executorId));
  const canExecutorSendEndRequest = deal.status === "active" && isCurrentUserExecutor && !hasEndRequestFromExecutor;
  const canCustomerProcessEndRequest = deal.status === "active" && isCurrentUserCustomer && hasEndRequestFromExecutor;

  return (
      <div className="min-h-screen bg-[#F7F8FA] flex">
        <aside className="w-[220px] bg-white border-r border-[#E8E9F0] flex flex-col min-h-screen sticky top-0 shrink-0">
          <div className="px-5 py-5 border-b border-[#E8E9F0]">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#5048E5] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[#0D0D14] text-sm" style={{ fontWeight: 600 }}>«Обоюдно»</span>
            </Link>
          </div>
          <div className="p-4 flex-1">
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-[#8B8FA8] hover:text-[#0D0D14] transition-colors"
            >
              <ArrowLeft size={13} />
              Мои сделки
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white border-b border-[#E8E9F0] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shrink-0"
                  style={{ background: deal.counterpartColor, fontWeight: 600 }}
              >
                {deal.counterpartInitial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[#0D0D14] text-base" style={{ fontWeight: 600 }}>{deal.title}</h1>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${s.bg} ${s.text}`} style={{ fontWeight: 500 }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${deal.status === "active" ? "animate-pulse" : ""}`} />
                    {s.label}
                </span>
                </div>
                <p className="text-xs text-[#8B8FA8]">ID {deal.id} · Создана {deal.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0D0D14] px-3 py-2 bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl transition-all hover:border-[#5048E5]/20"
              >
                <Copy size={13} />
                Скопировать ссылку
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-5">
              {actionMessage && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3">
                    <p className="text-sm text-blue-800">{actionMessage}</p>
                  </div>
              )}
              {deal.status === "pending_receive" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-900" style={{ fontWeight: 600 }}>Ожидает вашего подтверждения</p>
                      <p className="text-xs text-amber-700">Внимательно изучите условия и видео ТЗ перед согласием.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDecline} className="px-4 py-2 bg-white text-amber-700 border border-amber-200 rounded-xl text-sm hover:bg-amber-100 transition-colors">Отклонить</button>
                      <button onClick={handleAccept} className="px-4 py-2 bg-[#5048E5] text-white rounded-xl text-sm hover:bg-[#4338CA] transition-colors shadow-sm">Принять сделку</button>
                      <button
                        onClick={() => setEditMode((prev) => !prev)}
                        className="px-4 py-2 bg-white text-[#0D0D14] border border-[#E8E9F0] rounded-xl text-sm hover:bg-[#F7F8FA] transition-colors"
                      >
                        {editMode ? "Скрыть правки" : "Изменить условия"}
                      </button>
                    </div>
                  </div>
              )}

              {editMode && deal.status === "pending_receive" && (
                <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5 space-y-3">
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>Изменить и отправить предложение</p>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Название сделки"
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:border-[#5048E5]"
                  />
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание задачи"
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] resize-none focus:outline-none focus:border-[#5048E5]"
                  />
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] focus:outline-none focus:border-[#5048E5]"
                  />
                  <button
                    onClick={handleChangeAndResendInvite}
                    disabled={actionLoading === "change-invite"}
                    className="inline-flex items-center gap-2 bg-[#5048E5] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#4338CA] disabled:opacity-60"
                  >
                    <Save size={14} />
                    {actionLoading === "change-invite" ? "Отправляем..." : "Сохранить и отправить"}
                  </button>
                </div>
              )}

              {deal.hasVideo && (
                  <div className="bg-gradient-to-r from-[#5048E5]/8 to-transparent border border-[#5048E5]/15 rounded-2xl px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#5048E5]/10 rounded-xl flex items-center justify-center shrink-0">
                      <Shield size={18} className="text-[#5048E5]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>Сделка видеозащищена</p>
                      <p className="text-xs text-[#8B8FA8]">Видеозапись подтверждения условий сохранена и зашифрована · {deal.date}</p>
                    </div>
                    <button
                      onClick={handleOpenProtectedVideo}
                      disabled={actionLoading === "open-video"}
                      className="inline-flex items-center gap-1.5 text-xs text-[#5048E5] hover:text-[#4338CA] transition-colors disabled:opacity-60"
                      style={{ fontWeight: 500 }}
                      type="button"
                      title="Открыть видео"
                    >
                      <ExternalLink size={12} />
                      {actionLoading === "open-video" ? "Открываем..." : "Доступно"}
                    </button>
                  </div>
              )}

              <div className="bg-white border border-[#E8E9F0] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E8E9F0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video size={14} className="text-[#8B8FA8]" />
                    <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>Видео ТЗ</p>
                  </div>
                  {deal.hasVideo && (
                      <span className="text-[11px] bg-[#5048E5]/8 text-[#5048E5] px-2 py-0.5 rounded-md" style={{ fontWeight: 500 }}>
                    deal_video.mp4
                  </span>
                  )}
                </div>
                {deal.hasVideo ? (
                    videoUrl ? (
                        <div>
                          <video
                            src={videoUrl}
                            controls
                            playsInline
                            onError={() => setVideoError("Браузер не смог воспроизвести этот файл. Попробуйте открыть видео в новой вкладке или загрузить mp4 (H.264).")}
                            className="w-full"
                            style={{ aspectRatio: "16/9", backgroundColor: "#0D0D14" }}
                          />
                          {videoError && (
                            <div className="px-4 py-3 border-t border-[#E8E9F0] text-xs text-amber-700 bg-amber-50">
                              {videoError}{" "}
                              <a href={videoUrl} target="_blank" rel="noreferrer" className="underline">
                                Открыть видео
                              </a>
                            </div>
                          )}
                        </div>
                    ) : (
                        <div className="bg-[#0D0D14] relative group" style={{ aspectRatio: "16/9" }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-br from-[#5048E5]/15 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              onClick={handleRefreshVideo}
                              className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/25 group-hover:scale-105 transition-all border border-white/20"
                              title="Обновить ссылку на видео"
                            >
                              <Play size={22} className="text-white ml-1" fill="white" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white text-sm" style={{ fontWeight: 500 }}>Видеозапись сделки</p>
                                <p className="text-white/50 text-xs">{deal.date} · Обе стороны присутствуют</p>
                              </div>
                              <button
                                onClick={handleRefreshVideo}
                                className="text-xs text-white/80 border border-white/30 px-3 py-1 rounded-lg hover:bg-white/10"
                              >
                                Обновить
                              </button>
                            </div>
                          </div>
                        </div>
                    )
                ) : (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-[#F7F8FA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Video size={20} className="text-[#C4C6D3]" />
                      </div>
                      <p className="text-sm text-[#6B7280] mb-3">Видео ещё не прикреплено</p>
                      {canUploadVideo ? (
                          <div className="max-w-xs mx-auto space-y-3">
                            <input
                                type="file"
                                accept="video/mp4,video/avi,video/quicktime,video/x-msvideo"
                                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                className="block w-full text-xs text-[#6B7280] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#5048E5] file:text-white file:cursor-pointer"
                            />
                            {videoFile && (
                                <p className="text-xs text-[#8B8FA8] truncate">{videoFile.name}</p>
                            )}
                            <button
                                onClick={handleUploadVideo}
                                disabled={!videoFile || uploadingVideo}
                                className="w-full bg-[#5048E5] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#4338CA] disabled:opacity-60"
                            >
                              {uploadingVideo ? "Загрузка..." : "Загрузить видео"}
                            </button>
                          </div>
                      ) : (
                          <p className="text-xs text-[#8B8FA8]">
                            Загрузить видео можно только исполнителю в активной сделке.
                          </p>
                      )}
                    </div>
                )}
              </div>

              <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-[#8B8FA8]" />
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>Описание задачи</p>
                </div>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-5" style={{ whiteSpace: "pre-wrap" }}>{deal.description}</p>
                <div className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl p-4">
                  <p className="text-xs text-[#8B8FA8] mb-1.5" style={{ fontWeight: 500 }}>Результат работы</p>
                  <p className="text-sm text-[#0D0D14]">{deal.deliverables}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User size={14} className="text-[#8B8FA8]" />
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>Участники</p>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Заказчик",
                      id: deal.customerId,
                      name: deal.customerName,
                      initial: getInitial(deal.customerName, "З"),
                      color: "linear-gradient(135deg, #5048E5, #7C3AED)",
                    },
                    {
                      label: "Исполнитель",
                      id: deal.executorId,
                      name: deal.executorName,
                      initial: getInitial(deal.executorName, "И"),
                      color: "#0EA5E9",
                    },
                  ].map((p) => (
                      <div key={p.label} className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs shrink-0"
                            style={{ background: p.color, fontWeight: 600 }}
                        >
                          {p.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0D0D14] truncate" style={{ fontWeight: 500 }}>{p.name}</p>
                          <p className="text-xs text-[#8B8FA8]">{p.label} · {p.id ? `ID ${String(p.id).slice(0, 8)}` : "ID —"}</p>
                        </div>
                        {currentUserId && p.id && String(currentUserId) === String(p.id) && (
                            <span className="text-[10px] bg-[#5048E5]/8 text-[#5048E5] px-2 py-0.5 rounded-md" style={{ fontWeight: 600 }}>Вы</span>
                        )}
                      </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={14} className="text-[#8B8FA8]" />
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>Сроки</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Дата создания", val: deal.date },
                    { label: "Дедлайн", val: deal.deadline },
                  ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <p className="text-xs text-[#8B8FA8]">{row.label}</p>
                        <p className="text-xs text-[#0D0D14]" style={{ fontWeight: 500 }}>{row.val}</p>
                      </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={14} className="text-[#8B8FA8]" />
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>Финансы</p>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8B8FA8]">Общая сумма</p>
                    <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 700 }}>
                      {deal.amount.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8B8FA8]">Предоплата</p>
                    <p className="text-sm text-[#5048E5]" style={{ fontWeight: 600 }}>
                      {deal.prepayment.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8B8FA8]">Остаток</p>
                    <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>
                      {(deal.amount - deal.prepayment).toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                </div>
                {deal.amount > 0 && (
                    <div>
                      <div className="h-1.5 bg-[#F1F2F6] rounded-full overflow-hidden mb-1.5">
                        <div
                            className="h-full bg-[#5048E5] rounded-full"
                            style={{ width: `${(deal.prepayment / deal.amount) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#8B8FA8]">
                        {Math.round((deal.prepayment / deal.amount) * 100)}% предоплачено
                      </p>
                    </div>
                )}
                <div className="mt-4 pt-3 border-t border-[#F1F2F6]">
                  <p className="text-[11px] text-[#8B8FA8] leading-relaxed">{deal.paymentTerms}</p>
                </div>
              </div>

              {deal.status === "active" || deal.status === "completed" ? (
                  <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 500 }}>Прогресс</p>
                      <p className="text-sm text-[#5048E5]" style={{ fontWeight: 700 }}>{deal.progress}%</p>
                    </div>
                    <div className="h-2 bg-[#F1F2F6] rounded-full overflow-hidden">
                      <div
                          className={`h-full rounded-full transition-all ${deal.status === "completed" ? "bg-emerald-500" : "bg-[#5048E5]"}`}
                          style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#8B8FA8] mt-2">
                      {deal.status === "completed" ? "Работа принята заказчиком" : "В процессе выполнения"}
                    </p>
                  </div>
              ) : null}

              {deal.status === "active" && (
                <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5 space-y-2">
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>Завершение сделки</p>
                  {canExecutorSendEndRequest && (
                    <button
                      onClick={handleSendEndRequest}
                      disabled={actionLoading === "send-end"}
                      className="w-full bg-[#5048E5] text-white py-2.5 rounded-xl text-sm hover:bg-[#4338CA] disabled:opacity-60"
                    >
                      {actionLoading === "send-end" ? "Отправляем..." : "Запросить завершение"}
                    </button>
                  )}

                  {isCurrentUserExecutor && hasEndRequestFromExecutor && (
                    <p className="text-xs text-[#8B8FA8] bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2">
                      Запрос отправлен заказчику. Ожидайте подтверждения или отклонения.
                    </p>
                  )}

                  {canCustomerProcessEndRequest && (
                    <>
                      <p className="text-xs text-[#8B8FA8] bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2">
                        Исполнитель запросил завершение. Проверьте результат и примите решение.
                      </p>
                      <button
                        onClick={handleAcceptEndRequest}
                        disabled={actionLoading === "accept-end"}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actionLoading === "accept-end" ? "Подтверждаем..." : "Подтвердить завершение"}
                      </button>
                      <button
                        onClick={handleCancelEndRequest}
                        disabled={actionLoading === "cancel-end"}
                        className="w-full bg-white border border-[#E8E9F0] text-[#6B7280] py-2.5 rounded-xl text-sm hover:text-[#0D0D14] hover:border-[#5048E5]/20 disabled:opacity-60"
                      >
                        {actionLoading === "cancel-end" ? "Отклоняем..." : "Отклонить запрос"}
                      </button>
                    </>
                  )}

                  {isCurrentUserCustomer && !hasEndRequestFromExecutor && (
                    <p className="text-xs text-[#8B8FA8] bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2">
                      Ожидание запроса на завершение от исполнителя.
                    </p>
                  )}
                </div>
              )}

              {deal.status === "completed" && (
                <div className="bg-white border border-[#E8E9F0] rounded-2xl p-5 space-y-3">
                  <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>Комментарий по сделке</p>
                  {myComment && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <p className="text-xs text-emerald-800" style={{ fontWeight: 600 }}>Ваш комментарий уже сохранён</p>
                      <p className="text-xs text-emerald-700">Можно изменить текст или оценку и отправить повторно.</p>
                    </div>
                  )}
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Опишите опыт по этой сделке"
                    className="w-full bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5 text-sm text-[#0D0D14] resize-none focus:outline-none focus:border-[#5048E5]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#6B7280]">Оценка:</label>
                    <select
                      value={commentRating}
                      onChange={(e) => setCommentRating(Number(e.target.value))}
                      className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-lg px-2 py-1 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleLeaveComment}
                    disabled={actionLoading === "leave-comment"}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#5048E5] text-white py-2.5 rounded-xl text-sm hover:bg-[#4338CA] disabled:opacity-60"
                  >
                    <Check size={14} />
                    {actionLoading === "leave-comment" ? "Отправляем..." : myComment ? "Обновить комментарий" : "Оставить комментарий"}
                  </button>

                  <div className="pt-2 border-t border-[#F1F2F6]">
                    <p className="text-xs text-[#8B8FA8] mb-2">Комментарии по этой сделке</p>
                    {dealComments.length > 0 ? (
                      <div className="space-y-2">
                        {dealComments.map((comment) => {
                          const isMine = currentUserId && String(comment.reviewerId) === String(currentUserId);
                          const reviewerName = getDisplayNameFromRaw(comment.reviewerUsername, comment.reviewerId);
                          const receiverName = getDisplayNameFromRaw(comment.receiverUsername, comment.receiverId);
                          const createdAtLabel = comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString()
                            : "дата не указана";

                          return (
                            <div key={`${comment.reviewerId}-${comment.receiverId}`} className="bg-[#F7F8FA] border border-[#E8E9F0] rounded-xl px-3 py-2.5">
                              <p className="text-sm text-[#0D0D14]" style={{ fontWeight: 600 }}>
                                {reviewerName}
                                {isMine ? " · Вы" : ""}
                              </p>
                              <p className="text-[11px] text-[#8B8FA8]">
                                Кому: {receiverName} · Роль: {comment.reviewerRole || "Участник"}
                              </p>
                              <p className="text-[11px] text-[#8B8FA8]">
                                Отправлен: {createdAtLabel} · ID автора {String(comment.reviewerId).slice(0, 8)} · ID получателя {String(comment.receiverId).slice(0, 8)}
                              </p>
                              <p className="text-sm text-[#6B7280] mt-1">{comment.text || "Без текста"}</p>
                              <p className="text-xs text-amber-600 mt-1" style={{ fontWeight: 600 }}>
                                {formatRatingStars(comment.rating)} ({comment.rating}/5)
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8B8FA8]">Комментариев пока нет.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
  );
}
