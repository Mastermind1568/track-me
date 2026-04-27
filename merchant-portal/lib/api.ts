const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const API_KEY =
  typeof window !== "undefined"
    ? localStorage.getItem("qs_api_key") || process.env.NEXT_PUBLIC_API_KEY || "demo-merchant-key"
    : process.env.NEXT_PUBLIC_API_KEY || "demo-merchant-key";

export function getApiKey(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("qs_api_key") || process.env.NEXT_PUBLIC_API_KEY || "demo-merchant-key";
  }
  return process.env.NEXT_PUBLIC_API_KEY || "demo-merchant-key";
}

export function getDeviceId(): string {
  if (typeof window !== "undefined") {
    let deviceId = localStorage.getItem("qs_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("qs_device_id", deviceId);
    }
    return deviceId;
  }
  return "server-side-fetch";
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey(),
      "X-Device-Id": getDeviceId(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}
