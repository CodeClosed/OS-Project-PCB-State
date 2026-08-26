import React from 'react';
import { Activity, Clock, CheckCircle2, RefreshCw, BarChart2, Zap } from 'lucide-react';

export default function MetricsPanel({ metrics }) {
  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-3 font-mono text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 font-sans">System Performance Metrics</h2>
        </div>
        <span className="text-[11px] text-slate-500">Live OS Accounting</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* CPU Utilization */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> CPU Utilization
          </span>
          <span className="text-base font-bold text-cyan-300">
            {metrics.cpuUtilization}%
          </span>
        </div>

        {/* Avg Waiting Time */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" /> Avg Wait Time (AWT)
          </span>
          <span className="text-base font-bold text-emerald-300">
            {metrics.avgWaitingTime} <span className="text-xs font-normal text-slate-500">ticks</span>
          </span>
        </div>

        {/* Avg Turnaround Time */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] flex items-center gap-1">
            <Activity className="w-3 h-3 text-rose-400" /> Avg Turnaround (ATAT)
          </span>
          <span className="text-base font-bold text-rose-300">
            {metrics.avgTurnaroundTime} <span className="text-xs font-normal text-slate-500">ticks</span>
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" /> Avg Response (ART)
          </span>
          <span className="text-base font-bold text-purple-300">
            {metrics.avgResponseTime} <span className="text-xs font-normal text-slate-500">ticks</span>
          </span>
        </div>

        {/* Throughput */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-400" /> Throughput
          </span>
          <span className="text-base font-bold text-amber-300">
            {metrics.throughput} <span className="text-[10px] font-normal text-slate-500">p/10t</span>
          </span>
        </div>

        {/* Context Switches */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-slate-500 text-[10px] flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-cyan-400" /> Context Switches
          </span>
          <span className="text-base font-bold text-cyan-300">
            {metrics.totalContextSwitches}
          </span>
        </div>

      </div>

    </div>
  );
}
