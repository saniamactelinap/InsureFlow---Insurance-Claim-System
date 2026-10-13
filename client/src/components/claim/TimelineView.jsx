import React from 'react';
import { CheckCircle2, Clock, FileText, AlertCircle, ArrowRight } from 'lucide-react';

export const TimelineView = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return <div className="text-center py-6 text-slate-400 text-xs">No audit events recorded yet.</div>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event, index) => {
        let iconBg = 'bg-blue-600 text-white';
        if (event.eventType.includes('APPROVED') || event.eventType.includes('SETTLED')) {
          iconBg = 'bg-emerald-600 text-white';
        } else if (event.eventType.includes('REJECTED')) {
          iconBg = 'bg-rose-600 text-white';
        } else if (event.eventType.includes('DOCUMENT')) {
          iconBg = 'bg-indigo-600 text-white';
        }

        return (
          <div key={event._id || index} className="relative group">
            {/* Timeline bullet */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${iconBg}`}
            >
              <CheckCircle2 className="w-3 h-3" />
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs transition hover:border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs text-slate-900">{event.title}</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>

              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                  {event.performerRole}
                </span>
                {event.previousStatus && event.newStatus && (
                  <span className="flex items-center gap-1 font-mono">
                    {event.previousStatus} <ArrowRight className="w-2.5 h-2.5" /> {event.newStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineView;
