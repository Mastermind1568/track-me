import Layout from "../../components/Layout";
import MerchantHeader from "../../components/MerchantHeader";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function MerchantDashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/v1/shipments")
      .then((data) => setShipments(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Compute stats
  const totalShipments = shipments.length;
  const inTransit = shipments.filter(
    (s) => s.status?.toLowerCase() === "in transit" || s.status?.toLowerCase() === "out for delivery"
  ).length;
  const delivered = shipments.filter(
    (s) => s.status?.toLowerCase() === "delivered"
  ).length;
  const pending = shipments.filter(
    (s) => s.status?.toLowerCase() === "accepted" || s.status?.toLowerCase() === "picked_up"
  ).length;

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "delivered") return "bg-green-900 text-green-100";
    if (s === "out for delivery") return "bg-[#FFD600] text-black";
    if (s === "in transit") return "bg-blue-900 text-blue-100";
    if (s === "exception") return "bg-red-900 text-red-100";
    return "bg-black text-white";
  };

  return (
    <Layout>
      <MerchantHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Shipments</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
              Manage your Quickship Direct inventory
            </p>
          </div>
          <Link
            href="/merchant/create"
            className="bg-[#FFD600] text-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-[#FFD600] transition-all active:scale-95 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            + New Shipment
          </Link>
        </div>

        {/* Stats Bar */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-4 border-black mb-10">
            <div className="p-6 border-r-2 border-black border-l-8 border-l-[#FFD600] bg-white">
              <div className="text-3xl font-black">{totalShipments}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Total
              </div>
            </div>
            <div className="p-6 border-r-2 border-black border-l-8 border-l-black bg-white">
              <div className="text-3xl font-black">{inTransit}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                In Transit
              </div>
            </div>
            <div className="p-6 border-r-2 border-black border-l-8 border-l-[#FFD600] bg-white">
              <div className="text-3xl font-black">{delivered}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Delivered
              </div>
            </div>
            <div className="p-6 border-l-8 border-l-black bg-white">
              <div className="text-3xl font-black">{pending}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                Pending
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 mb-6 font-bold text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">Loading shipments…</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-24 border-4 border-dashed border-gray-300 bg-white">
            <div className="text-6xl mb-6 opacity-10">📦</div>
            <p className="text-gray-500 text-lg mb-6 font-medium">No shipments yet.</p>
            <Link
              href="/merchant/create"
              className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest text-sm inline-block hover:bg-gray-800 transition-colors"
            >
              Create Your First Shipment
            </Link>
          </div>
        ) : (
          <div className="border-4 border-black bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white text-left text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-5 py-4">Tracking #</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s: any) => (
                  <tr
                    key={s.id}
                    className="border-t-2 border-black/10 hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-sm">
                      {s.tracking_no}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getStatusBadge(
                          s.status
                        )}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium capitalize">
                      {s.service}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">
                      {s.reference || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/merchant/shipments/${s.id}`}
                        className="text-[10px] font-black uppercase tracking-widest hover:underline opacity-40 group-hover:opacity-100 transition-opacity"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </Layout>
  );
}
