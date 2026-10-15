import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Maximize2, Minimize2, Copy, Check, Search, X } from 'lucide-react';

export default function EventTimeline({ logs, onClearLogs }) {
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const modalScrollRef = useRef(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPoppedOut) {
        setIsPoppedOut(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPoppedOut]);

  // Copy all logs to clipboard
  const handleCopyLogs = () => {
    if (logs.length === 0) return;
    const text = logs.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredLogs = searchQuery.trim()
    ? logs.filter((log) => log.toLowerCase().includes(searchQuery.toLowerCase()))
    : logs;

  return (
    <>
      {/* 1. Main Inline Component Container */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs flex flex-col gap-2.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 font-sans text-sm">State Transition Event Log</h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {logs.length} {logs.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Full Screen / Pop Out Button */}
            <button
              onClick={() => setIsPoppedOut(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer font-sans text-xs font-semibold shadow-2xs"
              title="Open full screen / pop out to view all logs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen / Pop</span>
            </button>

            {/* Clear Logs Button */}
            <button
              onClick={onClearLogs}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Log View */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto flex flex-col gap-1.5 text-[11px]">
          {logs.length === 0 ? (
            <span className="text-slate-400 italic py-2 text-center">No logged events yet</span>
          ) : (
            logs.map((log, idx) => {
              const closeBracket = log.indexOf(']');
              const timestamp = closeBracket !== -1 ? log.slice(0, closeBracket + 1) : '';
              const message = closeBracket !== -1 ? log.slice(closeBracket + 1) : log;
              return (
                <div key={idx} className="text-slate-700">
                  {timestamp && <span className="text-blue-700 font-bold">{timestamp}</span>}
                  <span className="text-slate-800">{message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Full Screen / Pop Out Modal */}
      {isPoppedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
            
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 font-sans text-base">
                      State Transition Event Log
                    </h2>
                    <span className="text-[11px] bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                      {logs.length} Total Events
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Complete chronological history of state transitions, PCB updates, burst executions, and I/O cycles
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                {/* Search Filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter logs (e.g. RUNNING, P1, T+2)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-44 sm:w-64 font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Copy All Logs */}
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-sans text-xs font-medium transition-colors cursor-pointer"
                  title="Copy all logs to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>

                {/* Clear Logs */}
                <button
                  onClick={onClearLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 font-sans text-xs font-medium transition-colors cursor-pointer"
                  title="Clear all logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsPoppedOut(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-sans text-xs font-semibold transition-colors cursor-pointer ml-1"
                  title="Close pop out (Esc)"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Pop</span>
                </button>
              </div>
            </div>

            {/* Log Feed */}
            <div
              ref={modalScrollRef}
              className="flex-1 bg-slate-900 text-slate-100 p-4 sm:p-5 overflow-y-auto flex flex-col gap-1.5 text-xs font-mono leading-relaxed selection:bg-blue-600 selection:text-white"
            >
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500 py-16">
                  <Terminal className="w-10 h-10 opacity-30 mb-2" />
                  <p className="text-sm italic">
                    {logs.length === 0 ? 'No logged events recorded yet.' : 'No events match your search query.'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  const closeBracket = log.indexOf(']');
                  const timestamp = closeBracket !== -1 ? log.slice(0, closeBracket + 1) : '';
                  const message = closeBracket !== -1 ? log.slice(closeBracket + 1) : log;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 hover:bg-slate-800/80 px-2 py-1 rounded transition-colors group"
                    >
                      <span className="text-slate-600 select-none text-[11px] w-9 text-right shrink-0 font-mono">
                        #{filteredLogs.length - idx}
                      </span>
                      {timestamp && (
                        <span className="text-cyan-400 font-bold shrink-0">
                          {timestamp}
                        </span>
                      )}
                      <span className="text-slate-200">
                        {message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 font-sans">
              <span>
                Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> total events
                {searchQuery && ` (matching "${searchQuery}")`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 hidden sm:inline">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">Esc</kbd> or click <strong>Exit Pop</strong> to return
                </span>
                <button
                  onClick={() => setIsPoppedOut(false)}
                  className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
