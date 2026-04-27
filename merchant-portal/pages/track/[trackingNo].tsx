import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import MerchantHeader from "../../components/MerchantHeader";

export default function TrackPage() {
  const router = useRouter();
  const { trackingNo } = router.query;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackingNo) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/api/v1/track/${trackingNo}`
    )
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Waybill not found"));
  }, [trackingNo]);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "delivered") return "bg-green-900 text-green-100";
    if (s === "out for delivery") return "bg-[#FFD600] text-black";
    if (s === "in transit") return "bg-blue-900 text-blue-100";
    return "bg-black text-white";
  };

  return (
    <Layout>
      <MerchantHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors mb-8 block"
          onClick={() => router.push("/")}
        >
          ← Back
        </button>

        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
          Track: {trackingNo}
        </h1>

        {!data && !error && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">
              Loading…
            </p>
          </div>
        )}

        {error && (
          <div className="border-4 border-black p-8 text-center bg-gray-50 mt-6">
            <h2 className="text-xl font-black uppercase mb-2">{error}</h2>
            <p className="text-gray-400 text-sm">
              Please check the waybill number and try again.
            </p>
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-8">
            {/* Status */}
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 font-black uppercase tracking-tight ${getStatusColor(
                  data.status
                )}`}
              >
                {data.status}
              </span>
            </div>

            {/* Timeline */}
            <div className="border-4 border-black p-8 bg-white">
              <h2 className="text-lg font-black uppercase tracking-tight mb-6">
                Timeline
              </h2>
              <div className="border-l-4 border-black ml-4 pl-8 space-y-6">
                {data.timeline?.map((ev: any, idx: number) => {
                  const isFirst = idx === 0;
                  return (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[42px] top-1 w-6 h-6 border-4 border-black rounded-full ${
                          isFirst ? "bg-[#FFD600]" : "bg-white"
                        }`}
                      />
                      <div className={isFirst ? "opacity-100" : "opacity-40"}>
                        <div className="font-black uppercase text-lg">
                          {ev.status}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          {ev.timestamp
                            ? new Date(ev.timestamp).toLocaleString()
                            : "—"}{" "}
                          — {ev.location || "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
