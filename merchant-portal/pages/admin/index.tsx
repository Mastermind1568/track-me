import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../../components/Layout";

interface MerchantData {
  id: string;
  name: string;
  api_key: string;
  active_device_id: string | null;
}

export default function AdminPortal() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("qs_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
      fetchMerchants(savedKey);
    }
  }, []);

  async function fetchMerchants(key: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/api/v1/admin/merchants`, {
        headers: { "X-Admin-Key": key }
      });
      if (res.ok) {
        const data = await res.json();
        setMerchants(data);
        setIsAuthenticated(true);
        localStorage.setItem("qs_admin_key", key);
        setError(null);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("qs_admin_key");
        if (key) setError("Invalid Admin Key");
      }
    } catch {
      setError("Failed to connect to backend");
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetchMerchants(adminKey);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/api/v1/admin/merchants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({ name: newMerchantName })
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Created: ${data.merchant.name}. API KEY: ${data.api_key} — Save this key, it won't be shown again!`);
        setNewMerchantName("");
        fetchMerchants(adminKey);
      } else {
        setError("Failed to create merchant");
      }
    } catch {
      setError("Error creating merchant");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const activeMerchants = merchants.filter(m => m.active_device_id);
  const totalMerchants = merchants.length;

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Head><title>Admin Login | Quickship Direct</title></Head>
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="inline-block bg-[#FFD600] text-black px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-4">
              Restricted Access
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Admin Portal</h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">Quickship Direct Platform Management</p>
          </div>
          <div className="bg-white text-black p-10 border-4 border-black shadow-[16px_16px_0px_0px_#FFD600]">
            {error && <div className="bg-red-50 text-red-700 p-3 mb-6 font-bold text-sm border-2 border-red-200">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Admin Secret Key</label>
                <input
                  type="password"
                  placeholder="Enter admin key…"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  className="w-full border-4 border-black p-4 font-bold focus:border-[#FFD600] outline-none transition-colors"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-[#FFD600] border-4 border-black p-4 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-[#FFD600] transition-colors">
                Access Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <Layout>
      <Head><title>Admin Dashboard | Quickship Direct</title></Head>

      {/* Admin Header */}
      <header className="bg-black text-white px-6 md:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FFD600] flex items-center justify-center">
            <span className="text-black font-black text-lg">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Admin Portal</h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Platform Management</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem("qs_admin_key"); setIsAuthenticated(false); }}
          className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#FFD600] transition-colors"
        >
          ← Log out
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="border-4 border-black p-4 md:p-6 bg-white">
            <div className="text-3xl md:text-4xl font-black">{totalMerchants}</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Total Merchants</div>
          </div>
          <div className="border-4 border-black p-4 md:p-6 bg-white">
            <div className="text-3xl md:text-4xl font-black text-green-600">{activeMerchants.length}</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Active Sessions</div>
          </div>
          <div className="border-4 border-black p-4 md:p-6 bg-[#FFD600]">
            <div className="text-3xl md:text-4xl font-black">{totalMerchants - activeMerchants.length}</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-black/50 mt-1">Inactive</div>
          </div>
          <div className="border-4 border-black p-4 md:p-6 bg-black text-white">
            <div className="text-3xl md:text-4xl font-black text-[#FFD600]">v1.0</div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-1">API Version</div>
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div className="bg-green-100 text-green-900 border-4 border-green-800 p-4 mb-8 font-bold text-sm break-all">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 border-4 border-red-300 p-4 mb-8 font-bold text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Merchants List — 2 cols */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 border-b-4 border-[#FFD600] pb-3">
              Registered Merchants
            </h2>
            {merchants.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 p-12 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No merchants registered</p>
                <p className="text-gray-300 text-xs mt-1">Create one using the form →</p>
              </div>
            ) : (
              <div className="space-y-4">
                {merchants.map(m => (
                  <div key={m.id} className="border-4 border-black p-5 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase text-lg truncate">{m.name}</div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 truncate max-w-[200px]" title={m.id}>
                          {m.id}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 ${
                          m.active_device_id
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-400"
                        }`}>
                          {m.active_device_id ? "● Online" : "○ Offline"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(m.api_key)}
                      className="text-[10px] font-black uppercase tracking-widest bg-black text-[#FFD600] px-4 py-2 hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                      {copiedKey === m.api_key ? "✓ Copied!" : "Copy API Key"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New — 1 col */}
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 border-b-4 border-[#FFD600] pb-3">
              Add Merchant
            </h2>
            <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_#FFD600]">
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={newMerchantName}
                    onChange={e => setNewMerchantName(e.target.value)}
                    className="w-full border-4 border-black p-3 font-bold focus:border-[#FFD600] outline-none transition-colors"
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-black text-[#FFD600] font-black uppercase p-4 tracking-widest text-sm hover:bg-gray-800 transition-colors border-4 border-black">
                  Generate API Key
                </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest text-center">
                API key will be shown once after creation
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 border-4 border-black p-6 bg-gray-50">
              <h3 className="text-sm font-black uppercase tracking-tight mb-4 border-b border-black/10 pb-3">Quick Links</h3>
              <div className="space-y-2">
                <a href="/merchant" className="block text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors py-2">
                  → Merchant Dashboard
                </a>
                <a href="/merchant/analytics" className="block text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors py-2">
                  → Analytics
                </a>
                <a href="/merchant/developer" className="block text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors py-2">
                  → Developer Hub
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
