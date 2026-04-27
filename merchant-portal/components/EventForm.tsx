import { useState } from "react";

interface EventFormProps {
  onSubmit: (payload: { status: string; location: string; details: string; timestamp: string }) => Promise<void>;
  initial?: { status: string; location: string; details: string; timestamp: string };
  submitLabel?: string;
}

export default function EventForm({ onSubmit, initial, submitLabel = "Add Event" }: EventFormProps) {
  const [status, setStatus] = useState(initial?.status || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [details, setDetails] = useState(initial?.details || "");
  const [timestamp, setTimestamp] = useState(initial?.timestamp || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ status, location, details, timestamp });
      if (!initial) {
        setStatus("");
        setLocation("");
        setDetails("");
        setTimestamp("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full border-2 border-black px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Select status…</option>
            <option value="accepted">Accepted</option>
            <option value="picked_up">Picked Up</option>
            <option value="In Transit">In Transit</option>
            <option value="at_hub">At Hub</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="exception">Exception</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Memphis, TN"
            className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Details</label>
        <input
          type="text"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Optional details"
          className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-6 py-2 font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
