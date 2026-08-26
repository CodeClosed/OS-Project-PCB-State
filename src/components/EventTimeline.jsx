import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';

export default function EventTimeline({ logs, onClearLogs }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs flex flex-col gap-2.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 font-sans text-sm">State Transition Event Log</h3>
        </div>
        <button
          onClick={onClearLogs}
          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          title="Clear logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto flex flex-col gap-1.5 text-[11px]">
        {logs.length === 0 ? (
          <span className="text-slate-400 italic py-2 text-center">No logged events yet</span>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="text-slate-700">
              <span className="text-blue-700 font-bold">{log.slice(0, log.indexOf(']') + 1)}</span>
              <span className="text-slate-800">{log.slice(log.indexOf(']') + 1)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
