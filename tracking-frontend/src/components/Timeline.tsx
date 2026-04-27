import React from 'react';

interface TimelineEvent {
  status: string;
  location?: string;
  timestamp?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-gray-400 text-sm font-medium italic">
        No events recorded yet.
      </p>
    );
  }

  return (
    <div className="border-l-4 border-black ml-4 pl-8 py-2 space-y-8 relative">
      {events.map((event, index) => {
        const isLatest = index === 0;
        return (
          <div key={index} className="relative">
            {/* Status dot */}
            <div
              className={`absolute -left-[42px] top-1 w-6 h-6 border-4 border-black rounded-full transition-colors ${
                isLatest ? 'bg-[#FFD600]' : 'bg-white'
              }`}
            />

            <div className={`${isLatest ? 'opacity-100' : 'opacity-40'}`}>
              <h3 className="text-xl font-black uppercase">{event.status}</h3>
              <p className="text-gray-600 font-medium mt-1">
                {event.location || '—'}
              </p>
              <time className="text-sm text-gray-500 font-bold block mt-1">
                {event.timestamp
                  ? new Date(event.timestamp).toLocaleString()
                  : '—'}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
