import React from 'react';
import { Cpu, RefreshCw, Zap, Shield, Activity } from 'lucide-react';
import { CPU_STATES, PROCESS_STATES } from '../types/constants';

export default function CPUCore({
  cpuState,
  processes,
  selectedProcessId,
  onSelectProcess,
  timeQuantum,
  algorithm,
}) {
  const runningProcess = processes.find((p) => p.state === PROCESS_STATES.RUNNING);

  const getStatusBadge = () => {
    switch (cpuState) {
      case CPU_STATES.RUNNING:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-glow-emerald/30';
      case CPU_STATES.CONTEXT_SWITCHING:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow-amber/30 animate-pulse';
      case CPU_STATES.IDLE:
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col gap-3 font-mono text-xs shadow-lg">
      
      {/* Core Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-xs font-sans">CPU Core 0</span>
            <span className="text-[10px] text-slate-500 block">Hardware Processing Unit</span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge()}`}>
          {cpuState}
        </span>
      </div>

      {/* Core Body */}
      <div className="min-h-[110px] bg-slate-950/90 rounded-lg border border-slate-800/80 p-3 flex flex-col justify-center items-center text-center">
        {cpuState === CPU_STATES.CONTEXT_SWITCHING ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            <span className="text-amber-300 font-bold text-xs">Context Switch in Progress...</span>
            <span className="text-[10px] text-slate-400">Saving & Restoring Hardware PCB Registers</span>
          </div>
        ) : runningProcess ? (
          <div
            onClick={() => onSelectProcess(runningProcess.identity.pid)}
            className="w-full flex flex-col gap-2 cursor-pointer group"
          >
            {/* Process Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${runningProcess.identity.color.bg} animate-ping`} />
                <span className="font-bold text-sm text-emerald-300 group-hover:text-emerald-200">
                  {runningProcess.identity.name}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-1 py-0.5 rounded">
                  PID: {runningProcess.identity.pid}
                </span>
              </div>
              <span className="text-emerald-400 font-bold text-[11px]">
                {runningProcess.cpu.remainingBurst}t / {runningProcess.cpu.totalBurst}t
              </span>
            </div>

            {/* Instruction PC */}
            <div className="flex items-center justify-between text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-500">Program Counter:</span>
              <span className="text-cyan-300 font-bold">{runningProcess.registers.PC}</span>
            </div>

            {/* Quantum Slice Indicator (for RR) */}
            {algorithm === 'RR' && (
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Quantum Slice:</span>
                <span className="text-amber-300 font-bold">
                  {runningProcess.cpu.quantumUsed} / {timeQuantum} ticks
                </span>
              </div>
            )}

            {/* Execution Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-glow-emerald"
                style={{
                  width: `${Math.round(
                    ((runningProcess.cpu.totalBurst - runningProcess.cpu.remainingBurst) /
                      runningProcess.cpu.totalBurst) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-600">
            <Activity className="w-5 h-5 opacity-40" />
            <span className="text-xs italic">CPU Core Idle</span>
            <span className="text-[10px]">Awaiting Dispatcher Assignment</span>
          </div>
        )}
      </div>

    </div>
  );
}
