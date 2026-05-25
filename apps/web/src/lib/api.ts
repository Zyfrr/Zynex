const apiBaseUrl = process.env.NEXT_PUBLIC_ZYNEX_API_URL || "http://localhost:4101";

export class ZyNexApiError extends Error {
  constructor(
    message: string,
    public readonly code = "SYS001",
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

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
    throw new ZyNexApiError(
      payload?.error?.message || "ZyNex API request failed",
      payload?.error?.code || "SYS001",
      payload?.error?.details || {}
    );
  }

  return payload.data as T;
}
