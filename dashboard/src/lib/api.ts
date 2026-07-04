const API_BASE = import.meta.env.VITE_API_URL || window.__ENV__?.API_URL || "/api";

interface ApiResponse<T> {
  status: "success" | "failure";
  message: string;
  data: T | null;
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("wani_auth_token");
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) ?? {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = (await res.json()) as ApiResponse<T>;

  if (json.status === "failure") {
    throw new Error(json.message);
  }

  return json;
}
