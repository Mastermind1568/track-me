import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import MerchantHeader from "../../../components/MerchantHeader";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import EventForm from "../../../components/EventForm";
import Barcode from "react-barcode";

export default function ShipmentDetailPage() {
  const router = useRouter();
  const { shipment_id } = router.query;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<{type: "success" | "error", msg: string} | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);

  async function load() {
    if (!shipment_id) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/shipments/${shipment_id}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, [shipment_id]);

  async function addEvent(payload: any) {
    await apiFetch(`/api/v1/shipments/${shipment_id}/events`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setShowAddForm(false);
    await load();
  }

  async function editEvent(eventId: number, payload: any) {
    await apiFetch(`/api/v1/shipments/${shipment_id}/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setEditingEventId(null);
    await load();
  }

  async function handleNotify(method: "sms" | "email") {
    if (!notifyMessage) return;
    setIsNotifying(true);
    setNotifyStatus(null);
    try {
      await apiFetch(`/api/v1/shipments/${shipment_id}/notify`, {
        method: "POST",
        body: JSON.stringify({ message: notifyMessage, method }),
      });
      setNotifyStatus({ type: "success", msg: `Successfully queued ${method.toUpperCase()} update.` });
      setNotifyMessage("");
      setTimeout(() => setNotifyStatus(null), 3000);
    } catch (err: any) {
      setNotifyStatus({ type: "error", msg: err.message || "Failed to send update" });
    } finally {
      setIsNotifying(false);
    }
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered") return "bg-green-900 text-green-100";
    if (s === "out for delivery") return "bg-[#FFD600] text-black";
    if (s === "in transit") return "bg-blue-900 text-blue-100";
    if (s === "exception") return "bg-red-900 text-red-100";
    return "bg-black text-white";
  };

  return (
    <Layout>
      <MerchantHeader />
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Back Nav */}
        <button
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors mb-8 block"
          onClick={() => router.push("/merchant")}
        >
          ← Back to Shipments
        </button>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 mb-6 font-bold text-sm">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">Loading Shipment…</p>
          </div>
        )}

        {data && (
          <>
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">
                  {data.tracking_no}
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
                  Shipment ID: {data.id}
                </p>
                <div className="bg-white p-4 border-4 border-black inline-block">
                  <Barcode value={data.tracking_no} width={2} height={50} displayValue={false} background="#ffffff" lineColor="#000000" margin={0} />
                </div>
              </div>
              <div className={`px-6 py-3 font-black uppercase tracking-tight text-lg ${getStatusColor(data.status)}`}>
                {data.status}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="border-4 border-black p-8 mb-10 bg-white">
              <div className="w-full h-3 bg-gray-100 mb-3 border border-gray-200">
                <div
                  className="h-full bg-[#FFD600] transition-all duration-700 ease-out relative"
                  style={{
                    width:
                      data.status?.toLowerCase() === "delivered"
                        ? "100%"
                        : data.status?.toLowerCase() === "out for delivery"
                        ? "75%"
                        : data.status?.toLowerCase() === "in transit"
                        ? "50%"
                        : "15%",
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-md shadow-[#FFD600]"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>Accepted</span>
                <span>In Transit</span>
                <span>Out for Delivery</span>
                <span>Delivered</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Timeline — Left 2 cols */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Delivery Timeline
                  </h2>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-[#FFD600] text-black px-5 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#FFD600] transition-all active:scale-95 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                  >
                    {showAddForm ? "Cancel" : "+ Add Event"}
                  </button>
                </div>

                {/* Add Event Form (collapsible) */}
                {showAddForm && (
                  <div className="border-4 border-black p-6 mb-6 bg-gray-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">New Event</h3>
                    <EventForm onSubmit={addEvent} />
                  </div>
                )}

                {/* Timeline Events */}
                <div className="border-l-4 border-black ml-4 pl-8 space-y-0">
                  {data.timeline.map((ev: any, idx: number) => {
                    const isFirst = idx === 0;
                    return (
                      <div key={ev.id || idx} className="relative pb-8 last:pb-0">
                        {/* Dot */}
                        <div
                          className={`absolute -left-[42px] top-1 w-6 h-6 border-4 border-black rounded-full transition-colors ${
                            isFirst ? "bg-[#FFD600]" : "bg-white"
                          }`}
                        />

                        <div className={`${isFirst ? "opacity-100" : "opacity-60"}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-black uppercase tracking-tight">
                                {ev.status}
                              </h3>
                              <p className="text-gray-500 font-medium text-sm mt-0.5">
                                {ev.location || "—"}
                              </p>
                              <time className="text-xs text-gray-400 font-bold block mt-1">
                                {ev.timestamp
                                  ? new Date(ev.timestamp).toLocaleString()
                                  : "—"}
                              </time>
                            </div>
                            <div className="flex-shrink-0">
                              {editingEventId === ev.id ? (
                                <div className="w-80 border-2 border-black p-4 bg-white">
                                  <EventForm
                                    initial={{
                                      status: ev.status,
                                      location: ev.location || "",
                                      details: ev.details || "",
                                      timestamp: ev.timestamp || "",
                                    }}
                                    submitLabel="Save"
                                    onSubmit={(payload) =>
                                      editEvent(ev.id, payload)
                                    }
                                  />
                                  <button
                                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mt-3 transition-colors"
                                    onClick={() => setEditingEventId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="bg-gray-100 text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                                  onClick={() => setEditingEventId(ev.id)}
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-black text-white p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest border-b border-white/20 pb-3 opacity-50">
                    Quick Actions
                  </h3>
                  <a
                    href={`${process.env.NEXT_PUBLIC_TRACKING_BASE || "http://localhost:4321"}/track/${data.tracking_no}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full border border-white/30 py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    🔗 Public Tracking Page
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(data.tracking_no);
                    }}
                    className="w-full border border-white/30 py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    📋 Copy Tracking #
                  </button>
                </div>

                {/* Shipment Info */}
                <div className="border-4 border-black p-6 bg-white space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3">
                    Shipment Info
                  </h3>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Tracking Number
                    </div>
                    <div className="font-mono font-bold text-lg">
                      {data.tracking_no}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Current Status
                    </div>
                    <div className="font-bold uppercase">{data.status}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      Total Events
                    </div>
                    <div className="font-bold">{data.timeline?.length || 0}</div>
                  </div>
                </div>

                {/* Sender/Recipient Info */}
                <div className="border-4 border-black p-6 bg-white space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-3">
                      Sender
                    </h3>
                    <div className="text-sm font-bold">{data.sender?.name || "Unknown"}</div>
                    {data.sender?.company_name && <div className="text-xs text-gray-600">{data.sender.company_name}</div>}
                    <div className="text-xs text-gray-500 mt-1">
                      {data.sender?.line1}<br/>
                      {data.sender?.city}, {data.sender?.province} {data.sender?.postal}
                    </div>
                    {(data.sender?.email || data.sender?.phone) && (
                      <div className="text-xs text-gray-500 mt-2">
                        {data.sender?.email && <div>✉️ {data.sender.email}</div>}
                        {data.sender?.phone && <div>📞 {data.sender.phone}</div>}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-3 mb-3">
                      Recipient
                    </h3>
                    <div className="text-sm font-bold">{data.recipient?.name || "Unknown"}</div>
                    {data.recipient?.company_name && <div className="text-xs text-gray-600">{data.recipient.company_name}</div>}
                    <div className="text-xs text-gray-500 mt-1">
                      {data.recipient?.line1}<br/>
                      {data.recipient?.city}, {data.recipient?.province} {data.recipient?.postal}
                    </div>
                    {(data.recipient?.email || data.recipient?.phone) && (
                      <div className="text-xs text-gray-500 mt-2">
                        {data.recipient?.email && <div>✉️ {data.recipient.email}</div>}
                        {data.recipient?.phone && <div>📞 {data.recipient.phone}</div>}
                      </div>
                    )}
                    {data.recipient?.special_instructions && (
                      <div className="mt-3 bg-[#FFFDE7] border-l-4 border-[#FFD600] p-2 text-xs font-medium text-black">
                        <strong>Note:</strong> {data.recipient.special_instructions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Communications */}
                <div className="border-4 border-black p-6 bg-[#F7F5F0]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 border-b-2 border-black pb-3 mb-4 flex items-center gap-2">
                    <span className="text-[#FFD600] text-xl leading-none">💬</span> Client Communication
                  </h3>
                  <p className="text-xs font-bold text-gray-500 mb-4">
                    Send a direct update to the recipient via Email or SMS.
                  </p>
                  
                  {notifyStatus && (
                    <div className={`p-3 mb-4 text-xs font-bold uppercase tracking-widest ${notifyStatus.type === "success" ? "bg-green-100 text-green-800 border-2 border-green-800" : "bg-red-100 text-red-800 border-2 border-red-800"}`}>
                      {notifyStatus.msg}
                    </div>
                  )}

                  <textarea
                    className="w-full border-4 border-black p-3 text-sm font-medium mb-4 focus:outline-none focus:border-[#FFD600] resize-none h-24"
                    placeholder="e.g. Driver is stuck in traffic, arriving in 15 mins."
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                  />
                  
                  <div className="flex gap-4">
                    <button
                      disabled={isNotifying || !notifyMessage}
                      onClick={() => handleNotify("email")}
                      className="flex-1 bg-black text-white font-black uppercase text-[10px] tracking-widest py-3 hover:bg-[#FFD600] hover:text-black transition-colors disabled:opacity-50"
                    >
                      Send Email
                    </button>
                    <button
                      disabled={isNotifying || !notifyMessage}
                      onClick={() => handleNotify("sms")}
                      className="flex-1 bg-black text-white font-black uppercase text-[10px] tracking-widest py-3 hover:bg-[#FFD600] hover:text-black transition-colors disabled:opacity-50"
                    >
                      Send SMS
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}