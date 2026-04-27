import Layout from "../../components/Layout";
import MerchantHeader from "../../components/MerchantHeader";
import { useRouter } from "next/router";
import { useState } from "react";
import { apiFetch } from "../../lib/api";

export default function CreateShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    reference: "",
    service: "standard",
    weight_kg: "1.0",
    sender_name: "",
    sender_company: "",
    sender_email: "",
    sender_phone: "",
    sender_line1: "",
    sender_city: "",
    sender_province: "",
    sender_postal: "",
    sender_country: "US",
    recipient_name: "",
    recipient_company: "",
    recipient_email: "",
    recipient_phone: "",
    recipient_instructions: "",
    recipient_line1: "",
    recipient_city: "",
    recipient_province: "",
    recipient_postal: "",
    recipient_country: "US",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        reference: form.reference || undefined,
        service: form.service,
        parcel: { weight_kg: parseFloat(form.weight_kg) },
        sender: {
          name: form.sender_name,
          company_name: form.sender_company || undefined,
          email: form.sender_email || undefined,
          phone: form.sender_phone || undefined,
          line1: form.sender_line1,
          city: form.sender_city,
          province: form.sender_province,
          postal: form.sender_postal,
          country: form.sender_country,
        },
        recipient: {
          name: form.recipient_name,
          company_name: form.recipient_company || undefined,
          email: form.recipient_email || undefined,
          phone: form.recipient_phone || undefined,
          special_instructions: form.recipient_instructions || undefined,
          line1: form.recipient_line1,
          city: form.recipient_city,
          province: form.recipient_province,
          postal: form.recipient_postal,
          country: form.recipient_country,
        },
      };
      const res = await apiFetch("/api/v1/shipments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <MerchantHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <button
          className="text-sm text-gray-600 mb-6 block"
          onClick={() => router.push("/merchant")}
        >
          ← Back to shipments
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">
          Create Shipment
        </h1>

        {result ? (
          <div className="border-4 border-black p-8 text-center">
            <h2 className="text-2xl font-black uppercase mb-4">Shipment Created!</h2>
            <p className="text-lg mb-2">
              Tracking No:{" "}
              <span className="font-mono font-bold bg-black text-white px-3 py-1">
                {result.tracking_no}
              </span>
            </p>
            <p className="text-sm text-gray-500 mb-6">Shipment ID: {result.shipment_id}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push(`/merchant/shipments/${result.shipment_id}`)}
                className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-sm"
              >
                Manage Shipment
              </button>
              <button
                onClick={() => { setResult(null); setForm({
                  reference: "", service: "standard", weight_kg: "1.0",
                  sender_name: "", sender_company: "", sender_email: "", sender_phone: "",
                  sender_line1: "", sender_city: "", sender_province: "", sender_postal: "", sender_country: "US",
                  recipient_name: "", recipient_company: "", recipient_email: "", recipient_phone: "", recipient_instructions: "",
                  recipient_line1: "", recipient_city: "", recipient_province: "", recipient_postal: "", recipient_country: "US",
                }); }}
                className="border-4 border-black px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-[#FFD600] transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
            )}

            <fieldset className="border-4 border-black p-6">
              <legend className="text-sm font-bold uppercase tracking-widest px-2">
                Shipment Details
              </legend>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Reference (optional)
                  </label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => update("reference", e.target.value)}
                    placeholder="e.g. ORDER-12345"
                    className="w-full border-2 border-black px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Service
                  </label>
                  <select
                    value={form.service}
                    onChange={(e) => update("service", e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="overnight">Overnight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.weight_kg}
                    onChange={(e) => update("weight_kg", e.target.value)}
                    required
                    className="w-full border-2 border-black px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="border-4 border-black p-6">
              <legend className="text-sm font-bold uppercase tracking-widest px-2">
                Sender Details
              </legend>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input value={form.sender_name} onChange={(e) => update("sender_name", e.target.value)} required placeholder="Full Name" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.sender_company} onChange={(e) => update("sender_company", e.target.value)} placeholder="Company (Optional)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input type="email" value={form.sender_email} onChange={(e) => update("sender_email", e.target.value)} placeholder="Email (Optional)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input type="tel" value={form.sender_phone} onChange={(e) => update("sender_phone", e.target.value)} placeholder="Phone (Optional)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                
                <div className="col-span-2 pt-2 border-t-2 border-dashed border-gray-200 mt-2"></div>
                <div className="col-span-2">
                  <input value={form.sender_line1} onChange={(e) => update("sender_line1", e.target.value)} required placeholder="Street Address" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                </div>
                <input value={form.sender_city} onChange={(e) => update("sender_city", e.target.value)} required placeholder="City" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.sender_province} onChange={(e) => update("sender_province", e.target.value)} required placeholder="State/Province" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.sender_postal} onChange={(e) => update("sender_postal", e.target.value)} required placeholder="Postal Code" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.sender_country} onChange={(e) => update("sender_country", e.target.value)} required placeholder="Country" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
              </div>
            </fieldset>

            <fieldset className="border-4 border-black p-6">
              <legend className="text-sm font-bold uppercase tracking-widest px-2">
                Recipient Details
              </legend>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input value={form.recipient_name} onChange={(e) => update("recipient_name", e.target.value)} required placeholder="Full Name" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.recipient_company} onChange={(e) => update("recipient_company", e.target.value)} placeholder="Company (Optional)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input type="email" value={form.recipient_email} onChange={(e) => update("recipient_email", e.target.value)} placeholder="Email (Optional)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input type="tel" value={form.recipient_phone} onChange={(e) => update("recipient_phone", e.target.value)} placeholder="Phone (Optional)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                
                <div className="col-span-2 pt-2 border-t-2 border-dashed border-gray-200 mt-2"></div>
                <div className="col-span-2">
                  <input value={form.recipient_line1} onChange={(e) => update("recipient_line1", e.target.value)} required placeholder="Street Address" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                </div>
                <input value={form.recipient_city} onChange={(e) => update("recipient_city", e.target.value)} required placeholder="City" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.recipient_province} onChange={(e) => update("recipient_province", e.target.value)} required placeholder="State/Province" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.recipient_postal} onChange={(e) => update("recipient_postal", e.target.value)} required placeholder="Postal Code" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                <input value={form.recipient_country} onChange={(e) => update("recipient_country", e.target.value)} required placeholder="Country" className="w-full border-2 border-black px-3 py-2 text-sm font-bold" />
                
                <div className="col-span-2">
                  <input value={form.recipient_instructions} onChange={(e) => update("recipient_instructions", e.target.value)} placeholder="Special Delivery Instructions (e.g. Leave at back door)" className="w-full border-2 border-black px-3 py-2 text-sm font-bold bg-[#FFFDE7]" />
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Shipment"}
            </button>
          </form>
        )}
      </main>
    </Layout>
  );
}
