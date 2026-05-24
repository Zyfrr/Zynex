const apiBaseUrl = process.env.NEXT_PUBLIC_ZYNEX_API_URL || "http://localhost:4101";

export async function zynexApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    ...init
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload?.error?.message || "ZyNex API request failed");
  }

  return payload.data as T;
}
