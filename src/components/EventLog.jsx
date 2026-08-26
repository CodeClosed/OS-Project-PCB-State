import React, { useState } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function EventLog({ eventLogs, onClearLogs }) {
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = eventLogs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'DISPATCH':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'PREEMPT':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'IO':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'TERMINATE':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60';
      case 'ADMIT':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'TRANSITION':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3 font-mono text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-100 font-sans">OS Kernel Event Stream & State Log</h2>
          <span className="text-[11px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {eventLogs.length} events
          </span>
        </div>

        {/* Filters & Clear */}
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 text-slate-300 text-[11px] rounded px-2 py-1 border border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="DISPATCH">CPU Dispatch</option>
            <option value="PREEMPT">Preemption</option>
            <option value="IO">I/O Activity</option>
            <option value="ADMIT">Admissions</option>
            <option value="TRANSITION">State Transitions</option>
            <option value="TERMINATE">Terminations</option>
          </select>

          <button
            onClick={onClearLogs}
            title="Clear Event Log"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-slate-950/90 rounded-lg border border-slate-800 p-3 h-52 overflow-y-auto flex flex-col gap-1.5 scroll-smooth">
        {filteredLogs.length === 0 ? (
          <span className="text-xs text-slate-600 italic py-6 text-center font-sans">
            No logged OS events yet.
          </span>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 text-[11px] hover:bg-slate-900/60 p-1 rounded transition-colors"
            >
              {/* Tick Stamp */}
              <span className="text-cyan-500/80 font-bold w-14 flex-shrink-0">
                [T+{log.tick}]
              </span>

              {/* Type Badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${getBadgeStyle(
                  log.type
                )}`}
              >
                {log.type}
              </span>

              {/* Message */}
              <span className="text-slate-300 flex-1 break-words">
                {log.message}
              </span>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-600 flex-shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
