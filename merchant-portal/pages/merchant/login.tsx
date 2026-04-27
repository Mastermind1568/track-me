import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Get or generate device ID
      let deviceId = localStorage.getItem("qs_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("qs_device_id", deviceId);
      }

      // 2. Authenticate
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/api/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: apiKey.trim(),
            device_id: deviceId,
          }),
        }
      );

      if (res.ok) {
        localStorage.setItem("qs_api_key", apiKey.trim());
        router.push("/merchant");
      } else {
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || "Invalid API key. Please check and try again.");
      }
    } catch {
      setError("Unable to reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Merchant Login | Quickship Direct</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div
        className="min-h-screen bg-black text-white flex items-center justify-center"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="w-full max-w-md px-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16 justify-center">
            <img src="/logo.png" alt="Quickship Direct Logo" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-black tracking-tighter uppercase">
              Quickship <span className="font-light opacity-40">Direct</span>
            </span>
          </div>

          {/* Login Card */}
          <div className="bg-white text-black p-10 shadow-[16px_16px_0px_0px_#FFD600]">
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Merchant Portal
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
              Enter your API key to continue
            </p>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  placeholder="Enter your merchant API key"
                  className="w-full border-4 border-black px-4 py-4 text-sm font-bold focus:outline-none focus:border-[#FFD600] placeholder:text-gray-300 placeholder:font-medium transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFD600] text-black py-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-[#FFD600] transition-all disabled:opacity-50 active:scale-[0.98] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
              >
                {loading ? "Verifying…" : "Sign In"}
              </button>
            </form>

            <p className="text-center mt-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Contact sales for a merchant account
            </p>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-[10px] font-bold uppercase tracking-widest text-white/30">
            &copy; 2026 Quickship Direct Inc.
          </div>
        </div>
      </div>
    </>
  );
}
