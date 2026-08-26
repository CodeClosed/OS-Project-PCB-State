import React from 'react';
import { Terminal } from 'lucide-react';
import { STATE_COLORS } from '../types/process';

export default function PCBInspector({ process }) {
  if (!process) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col items-center justify-center text-center h-full min-h-[220px] font-mono text-xs text-slate-400 shadow-xs">
        <Terminal className="w-6 h-6 mb-2 opacity-40 text-slate-400" />
        <span>Click any process to inspect its PCB record</span>
      </div>
    );
  }

  const badgeStyle = STATE_COLORS[process.state]?.badge || STATE_COLORS.READY.badge;

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs flex flex-col gap-3 shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-sans">{process.name}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Process Control Block (PID: #{process.pid})</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${badgeStyle}`}>
          {process.state}
        </span>
      </div>

      {/* PCB Data Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        
        {/* Priority & Burst */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Priority</span>
          <span className="font-bold text-amber-700">Level {process.priority}</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">CPU Burst (Left / Total)</span>
          <span className="font-bold text-cyan-800">{process.remainingBurst}t / {process.totalBurst}t</span>
        </div>

        {/* Program Counter & Registers */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Program Counter (PC)</span>
          <span className="font-bold text-emerald-700">{process.pc}</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Stack Pointer (SP)</span>
          <span className="font-bold text-purple-700">{process.sp}</span>
        </div>

        {/* General Registers */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Register R0</span>
          <span className="text-slate-800 font-bold">{process.r0}</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Register R1</span>
          <span className="text-slate-800 font-bold">{process.r1}</span>
        </div>

        {/* Memory & Timers */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Memory Footprint</span>
          <span className="font-bold text-purple-800">{process.memoryMB} MB</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-[10px] font-medium">Waiting Time (WT)</span>
          <span className="font-bold text-slate-800">{process.waitingTime} ticks</span>
        </div>

      </div>

    </div>
  );
}
