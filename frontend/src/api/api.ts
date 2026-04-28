const DEFAULT_BASE_URL = "/api";
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

async function request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("dealvid_token");
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let message = `API Error (${response.status})`;

        if (contentType?.includes("application/json")) {
            const errorBody = await response.json();
            message =
                errorBody?.message ||
                errorBody?.error ||
                errorBody?.title ||
                JSON.stringify(errorBody);
        } else {
            const text = await response.text();
            if (text) message = text;
        }

        throw new Error(message);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}

export const api = {
    get: (endpoint: string) => request(endpoint, { method: "GET" }),
    post: (endpoint: string, body?: any) =>
        request(endpoint, {
            method: "POST",
            body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
        }),
};
