import React from 'react';
import { Layers, HardDrive, Wifi, Keyboard } from 'lucide-react';
import { PROCESS_STATES } from '../types/constants';

export default function QueueView({
  processes,
  selectedProcessId,
  onSelectProcess,
  timeQuantum,
  algorithm,
}) {
  const readyQueue = processes.filter((p) => p.state === PROCESS_STATES.READY);
  const waitingProcesses = processes.filter((p) => p.state === PROCESS_STATES.WAITING);

  // Group waiting by device
  const diskQueue = waitingProcesses.filter((p) => (p.io.activeEvent?.device || 'Disk') === 'Disk');
  const networkQueue = waitingProcesses.filter((p) => (p.io.activeEvent?.device || 'Disk') === 'Network');
  const keyboardQueue = waitingProcesses.filter((p) => (p.io.activeEvent?.device || 'Disk') === 'Keyboard');

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-sans">
            <Layers className="w-4 h-4 text-cyan-400" />
            Operating System Scheduling Queues
          </h2>
          <p className="text-xs text-slate-400">
            Real-time CPU dispatch & device I/O buffer queues
          </p>
        </div>
        <div className="text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-2.5 py-1 rounded">
          Scheduler: {algorithm} {algorithm === 'RR' && `(Q: ${timeQuantum}t)`}
        </div>
      </div>

      {/* OS Queues Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch text-xs">

        {/* Ready Queue (Col 1 to 7) */}
        <div className="lg:col-span-7 flex flex-col gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              READY QUEUE (FIFO / Priority Ordered)
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {readyQueue.length} Waiting
            </span>
          </div>

          <div className="flex-1 min-h-[90px] flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
            {readyQueue.length === 0 ? (
              <span className="text-xs text-slate-600 italic mx-auto font-sans">Ready queue is empty</span>
            ) : (
              readyQueue.map((proc, index) => (
                <div
                  key={proc.identity.pid}
                  onClick={() => onSelectProcess(proc.identity.pid)}
                  className={`flex-shrink-0 flex flex-col gap-1 p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    selectedProcessId === proc.identity.pid
                      ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-glow-cyan'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-cyan-400 font-bold">#{index + 1}</span>
                    <span className="font-bold">{proc.identity.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>P:{proc.identity.priority}</span>
                    <span>Burst:{proc.cpu.remainingBurst}t</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <span className="text-[10px] text-slate-500 text-center">Head of queue dispatched next to CPU</span>
        </div>

        {/* Device / I/O Queues (Col 8 to 12) */}
        <div className="lg:col-span-5 flex flex-col gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              DEVICE / I/O WAIT QUEUES
            </span>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {waitingProcesses.length} Blocked
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-2 min-h-[90px] p-2 bg-slate-950/50 rounded-lg border border-slate-800/80 text-xs">
            {/* Disk Device */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] w-20">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Disk:
              </span>
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {diskQueue.length === 0 ? (
                  <span className="text-[10px] text-slate-600">idle</span>
                ) : (
                  diskQueue.map((p) => (
                    <span
                      key={p.identity.pid}
                      onClick={() => onSelectProcess(p.identity.pid)}
                      className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 text-[10px] cursor-pointer"
                    >
                      {p.identity.name} ({p.io.timeRemaining}t)
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Network Device */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] w-20">
                <Wifi className="w-3.5 h-3.5 text-blue-400" /> Network:
              </span>
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {networkQueue.length === 0 ? (
                  <span className="text-[10px] text-slate-600">idle</span>
                ) : (
                  networkQueue.map((p) => (
                    <span
                      key={p.identity.pid}
                      onClick={() => onSelectProcess(p.identity.pid)}
                      className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-600/50 text-blue-300 text-[10px] cursor-pointer"
                    >
                      {p.identity.name} ({p.io.timeRemaining}t)
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Keyboard Device */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1 text-[11px] w-20">
                <Keyboard className="w-3.5 h-3.5 text-purple-400" /> Keyboard:
              </span>
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {keyboardQueue.length === 0 ? (
                  <span className="text-[10px] text-slate-600">idle</span>
                ) : (
                  keyboardQueue.map((p) => (
                    <span
                      key={p.identity.pid}
                      onClick={() => onSelectProcess(p.identity.pid)}
                      className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-600/50 text-purple-300 text-[10px] cursor-pointer"
                    >
                      {p.identity.name} ({p.io.timeRemaining}t)
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>
          <span className="text-[10px] text-slate-500 text-center">Processes awaken on hardware interrupt</span>
        </div>

      </div>
    </div>
  );
}
