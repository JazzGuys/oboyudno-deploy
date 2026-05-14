const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5021").replace(/\/$/, "");

export type RegistrationPayload = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

export async function registerUser(payload: RegistrationPayload): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/Auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const userId = await response.json();
  return String(userId);
}

export async function loginUser(username: string, password: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = await response.json();
  return String(body.token ?? body.Token);
}

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body)) return body.join(" ");
    if (typeof body === "string") return body;
    if (body?.errors) return Object.values(body.errors).flat().join(" ");
  } catch {
    // Fall through to a generic message when the API returns an empty body.
  }

  return "Не удалось выполнить запрос к серверу.";
}
