import Layout from "../../components/Layout";
import MerchantHeader from "../../components/MerchantHeader";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

interface WebhookEntry {
  id: string;
  url: string;
  created_at: string;
}

export default function DeveloperHub() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: string; msg: string } | null>(null);

  const loadWebhooks = async () => {
    try {
      const data = await apiFetch("/api/v1/webhooks");
      setWebhooks(data);
    } catch (err: any) {
      console.error("Failed to load webhooks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleRegister = async () => {
    if (!newUrl.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await apiFetch(`/api/v1/webhooks?url=${encodeURIComponent(newUrl)}`, {
        method: "POST",
      });
      setFeedback({ type: "success", msg: "Webhook registered successfully." });
      setNewUrl("");
      await loadWebhooks();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to register webhook" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/v1/webhooks/${id}`, { method: "DELETE" });
      setFeedback({ type: "success", msg: "Webhook removed." });
      await loadWebhooks();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to delete webhook" });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const apiKey = typeof window !== "undefined" ? localStorage.getItem("qs_api_key") || "demo-merchant-key" : "";

  return (
    <Layout>
      <MerchantHeader />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Developer Hub</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            API Keys, Webhooks & Integration Tools
          </p>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mb-6 p-4 border-4 border-black font-bold text-sm uppercase tracking-wider ${
            feedback.type === "success" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* API Key Card */}
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 border-b-4 border-[#FFD600] pb-3">
            🔑 Your API Key
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
            Use this key in the <code className="bg-gray-100 px-2 py-0.5 font-mono">X-API-Key</code> header for all API requests.
          </p>
          <div className="bg-black text-[#FFD600] p-4 font-mono text-sm flex items-center justify-between">
            <span>{apiKey}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(apiKey); setFeedback({ type: "success", msg: "API key copied!" }); setTimeout(() => setFeedback(null), 2000); }}
              className="bg-[#FFD600] text-black px-4 py-1 font-black uppercase text-[10px] tracking-widest hover:bg-white transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Sample Request Card */}
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] mb-8">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 border-b-4 border-[#FFD600] pb-3">
            📡 API Endpoints
          </h2>
          <div className="space-y-4 text-sm font-mono">
            <div className="bg-gray-50 p-4 border-2 border-gray-200">
              <span className="bg-green-700 text-white px-2 py-0.5 text-[10px] font-black mr-2">POST</span>
              <span>/api/v1/shipments</span>
              <span className="text-gray-400 ml-3">— Create a new shipment</span>
            </div>
            <div className="bg-gray-50 p-4 border-2 border-gray-200">
              <span className="bg-blue-700 text-white px-2 py-0.5 text-[10px] font-black mr-2">GET</span>
              <span>/api/v1/shipments</span>
              <span className="text-gray-400 ml-3">— List all shipments</span>
            </div>
            <div className="bg-gray-50 p-4 border-2 border-gray-200">
              <span className="bg-green-700 text-white px-2 py-0.5 text-[10px] font-black mr-2">POST</span>
              <span>/api/v1/shipments/:id/events</span>
              <span className="text-gray-400 ml-3">— Add tracking event</span>
            </div>
            <div className="bg-gray-50 p-4 border-2 border-gray-200">
              <span className="bg-blue-700 text-white px-2 py-0.5 text-[10px] font-black mr-2">GET</span>
              <span>/api/v1/track/:trackingNo</span>
              <span className="text-gray-400 ml-3">— Public tracking lookup</span>
            </div>
            <div className="bg-gray-50 p-4 border-2 border-gray-200">
              <span className="bg-green-700 text-white px-2 py-0.5 text-[10px] font-black mr-2">POST</span>
              <span>/api/v1/webhooks?url=...</span>
              <span className="text-gray-400 ml-3">— Register a webhook</span>
            </div>
          </div>
        </div>

        {/* Webhook Payload Example */}
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] mb-8">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 border-b-4 border-[#FFD600] pb-3">
            📦 Webhook Payload Example
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
            When a shipment event is created, we POST this JSON to your registered URLs:
          </p>
          <pre className="bg-black text-[#FFD600] p-6 font-mono text-xs overflow-x-auto">
{JSON.stringify({
  event: "shipment.updated",
  tracking_no: "QS123456789",
  shipment_id: "abc123def456",
  status: "in transit",
  location: "Chicago, IL",
  timestamp: "2026-04-27T12:00:00Z",
}, null, 2)}
          </pre>
        </div>

        {/* Webhooks Management */}
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 border-b-4 border-[#FFD600] pb-3">
            🪝 Webhook Endpoints
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
            Register URLs to receive real-time shipment updates via HTTP POST.
          </p>

          {/* Register New */}
          <div className="flex gap-3 mb-8">
            <input
              type="url"
              placeholder="https://your-server.com/webhook"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 border-4 border-black px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#FFD600] transition-colors"
            />
            <button
              onClick={handleRegister}
              disabled={submitting || !newUrl.trim()}
              className="bg-[#FFD600] text-black px-8 py-3 font-black uppercase text-xs tracking-widest border-4 border-black hover:bg-black hover:text-[#FFD600] transition-colors disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {submitting ? "Saving…" : "Register"}
            </button>
          </div>

          {/* Existing Webhooks */}
          {loading ? (
            <div className="text-center py-8 text-gray-400 font-bold uppercase tracking-widest text-xs">Loading…</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No webhooks registered yet</p>
              <p className="text-gray-300 text-xs mt-1">Add a URL above to start receiving real-time updates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((hook) => (
                <div key={hook.id} className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 px-4 py-3">
                  <div>
                    <p className="font-mono text-sm">{hook.url}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                      Created {new Date(hook.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(hook.id)}
                    className="bg-red-600 text-white px-4 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
