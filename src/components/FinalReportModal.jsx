import React from 'react';
import { FileText, X, Clock, CheckCircle2, Zap } from 'lucide-react';
import { STATE_COLORS } from '../types/process';

export default function FinalReportModal({ isOpen, onClose, processes, clockTick, algorithm }) {
  if (!isOpen) return null;

  const totalProcs = processes.length;
  const terminated = processes.filter((p) => p.state === 'TERMINATED');
  const evaluated = terminated.length > 0 ? terminated : processes;

  // Calculations
  const sumTAT = evaluated.reduce((sum, p) => sum + (p.turnaroundTime || (clockTick - p.arrivalTime)), 0);
  const avgTAT = totalProcs > 0 ? (sumTAT / totalProcs).toFixed(2) : '0.00';

  const sumWT = evaluated.reduce((sum, p) => sum + (p.waitingTime || 0), 0);
  const avgWT = totalProcs > 0 ? (sumWT / totalProcs).toFixed(2) : '0.00';

  const sumRT = evaluated.reduce((sum, p) => sum + (p.responseTime !== null ? p.responseTime : 0), 0);
  const avgRT = totalProcs > 0 ? (sumRT / totalProcs).toFixed(2) : '0.00';

  const throughput = clockTick > 0 ? ((terminated.length / clockTick) * 10).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl p-6 border border-slate-200 font-mono text-xs flex flex-col gap-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">
                OS Scheduling Evaluation Report
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Algorithm: <strong className="text-blue-700">{algorithm}</strong> | Total Clock Ticks: <strong className="text-blue-700">T+{clockTick}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Summary Average Report KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-2xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-sans font-medium">
              <Clock className="w-3.5 h-3.5 text-cyan-600" /> Avg Turnaround (ATAT)
            </span>
            <span className="text-xl font-bold text-cyan-800">
              {avgTAT} <span className="text-xs font-normal text-slate-500">ticks</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">TAT = CT - AT</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-2xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-sans font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Avg Waiting Time (AWT)
            </span>
            <span className="text-xl font-bold text-emerald-800">
              {avgWT} <span className="text-xs font-normal text-slate-500">ticks</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">WT = TAT - BT</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-2xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-sans font-medium">
              <Zap className="w-3.5 h-3.5 text-purple-600" /> Avg Response Time (ART)
            </span>
            <span className="text-xl font-bold text-purple-800">
              {avgRT} <span className="text-xs font-normal text-slate-500">ticks</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">RT = Start - AT</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1 shadow-2xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-sans font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Throughput
            </span>
            <span className="text-xl font-bold text-amber-800">
              {throughput} <span className="text-xs font-normal text-slate-500">p/10t</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{terminated.length}/{totalProcs} Done</span>
          </div>

        </div>

        {/* 2. Detailed Process Metrics Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 font-bold text-slate-800 text-xs font-sans">
            Process-by-Process Metric Breakdown
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">PROCESS</th>
                  <th className="py-2.5 px-3">ARRIVAL (AT)</th>
                  <th className="py-2.5 px-3">CPU (BT)</th>
                  <th className="py-2.5 px-3 text-amber-700">I/O BURST</th>
                  <th className="py-2.5 px-3">PRIORITY</th>
                  <th className="py-2.5 px-3 text-cyan-800">COMPLETION (CT)</th>
                  <th className="py-2.5 px-3 text-rose-800">TURNAROUND (TAT)</th>
                  <th className="py-2.5 px-3 text-emerald-800">WAITING (WT)</th>
                  <th className="py-2.5 px-3 text-purple-800">RESPONSE (RT)</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processes.map((p) => {
                  const ct = p.completionTime !== null ? `T+${p.completionTime}` : '—';
                  const tat = p.turnaroundTime !== null ? `${p.turnaroundTime}t` : `${clockTick - p.arrivalTime}t*`;
                  const wt = `${p.waitingTime}t`;
                  const rt = p.responseTime !== null ? `${p.responseTime}t` : '—';
                  const io = (p.ioDuration || 0) > 0 ? `${p.ioDuration}t` : '—';

                  return (
                    <tr key={p.pid} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-700">#{p.pid}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">T+{p.arrivalTime}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{p.totalBurst}t</td>
                      <td className="py-2.5 px-3 text-amber-700 font-bold">{io}</td>
                      <td className="py-2.5 px-3 text-amber-700 font-bold">Lvl {p.priority}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-800">{ct}</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">{tat}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">{wt}</td>
                      <td className="py-2.5 px-3 font-bold text-purple-700">{rt}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATE_COLORS[p.state]?.badge || 'bg-slate-100 text-slate-600'}`}>
                          {p.state}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Formulas Legend */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <span><strong>CT</strong> = Time process finishes</span>
          <span><strong>TAT</strong> = CT - AT (Turnaround)</span>
          <span><strong>WT</strong> = TAT - BT (Wait Time)</span>
          <span><strong>RT</strong> = Start - AT (Response)</span>
        </div>

        {/* Modal Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
