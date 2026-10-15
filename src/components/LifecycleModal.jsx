import React, { useEffect } from 'react';
import { Info, X, Cpu, Clock, Layers, ArrowRight, Activity } from 'lucide-react';
import { PROCESS_STATES, STATE_COLORS } from '../types/process';
import { sortReadyQueue } from '../engine/simulationEngine.js';

export default function LifecycleModal({
  isOpen,
  onClose,
  processes,
  selectedPid,
  onSelectPid,
  algorithm = 'FCFS',
  clockTick = 0,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedProcess = processes.find((p) => p.pid === selectedPid) || processes[0] || null;
  const getProcsInState = (state) => processes.filter((p) => p.state === state);
  const readyQueueOrdered = sortReadyQueue(getProcsInState(PROCESS_STATES.READY), algorithm);

  // Helper text explaining what the process's current state means
  const getStateExplanation = (proc) => {
    if (!proc) return null;
    switch (proc.state) {
      case PROCESS_STATES.NEW:
        return {
          title: 'State: 1. NEW (Instantiated)',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          desc: `Process ${proc.name} is instantiated in memory. It will be admitted to the READY queue once the simulation clock tick reaches Arrival Time T+${proc.arrivalTime}.`,
          nextAction: `Next transition: ADMIT ➔ READY at T+${proc.arrivalTime}`,
        };
      case PROCESS_STATES.READY: {
        const queuePos = readyQueueOrdered.findIndex((p) => p.pid === proc.pid);
        const posText = queuePos === 0 ? 'Next in line to be dispatched to CPU core' : `Position #${queuePos + 1} in queue`;
        return {
          title: 'State: 2. READY (Queued in Memory)',
          color: 'text-cyan-800 bg-cyan-50 border-cyan-200',
          desc: `Process ${proc.name} is residing in RAM Ready Queue waiting for dispatcher selection under active scheduling algorithm (${algorithm}). ${posText}.`,
          nextAction: queuePos === 0 ? 'Next transition: DISPATCH ➔ RUNNING (Next CPU tick)' : 'Next transition: Waits in Ready Queue',
        };
      }
      case PROCESS_STATES.RUNNING:
        return {
          title: 'State: 3. RUNNING (Executing on CPU)',
          color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
          desc: `Process ${proc.name} is actively executing instructions on the virtual CPU Core. Phase: ${proc.burstPhase || 'CPU1'} with ${proc.remainingBurst}t CPU burst remaining.`,
          nextAction:
            proc.ioDuration > 0 && proc.burstPhase !== 'CPU2'
              ? `Next transition: BLOCK ➔ WAITING for ${proc.ioDuration}t I/O when CPU Burst 1 finishes`
              : proc.remainingBurst <= 1
              ? 'Next transition: EXIT ➔ TERMINATED upon burst completion'
              : `Next transition: Preempt to READY (if RR quantum expires) or continue executing`,
        };
      case PROCESS_STATES.WAITING:
        return {
          title: 'State: 4. WAITING / BLOCKED (Servicing I/O)',
          color: 'text-amber-800 bg-amber-50 border-amber-200',
          desc: `Process ${proc.name} has relinquished the CPU to service an asynchronous I/O operation (e.g. disk read or network call). Remaining I/O burst: ${proc.ioRemaining !== undefined ? proc.ioRemaining : proc.ioDuration}t.`,
          nextAction: `Next transition: I/O COMPLETION ➔ READY queue when remaining I/O reaches 0`,
        };
      case PROCESS_STATES.TERMINATED:
        return {
          title: 'State: 5. TERMINATED (Execution Finished)',
          color: 'text-rose-800 bg-rose-50 border-rose-200',
          desc: `Process ${proc.name} has finished all execution bursts. Its PCB metrics are finalized: Turnaround Time (TAT) = ${proc.turnaroundTime || (clockTick - proc.arrivalTime)}t, Waiting Time (WT) = ${proc.waitingTime}t, Response Time (RT) = ${proc.responseTime !== null ? proc.responseTime : '—'}t.`,
          nextAction: 'Execution complete. Process lifecycle ended.',
        };
      default:
        return null;
    }
  };

  const stateInfo = getStateExplanation(selectedProcess);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col font-mono text-xs overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 font-sans text-base">
                  Process Lifecycle State Diagram
                </h2>
                <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  {algorithm} Scheduler
                </span>
                <span className="text-[11px] text-slate-500">
                  Clock: <strong className="text-blue-600 font-bold">T+{clockTick}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Real-time 5-State process machine &amp; PCB state transition tracking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
          
          {/* Process Selector Pills */}
          {processes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pb-1">
              <span className="text-slate-500 text-[11px] font-sans font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Focus Process:
              </span>
              {processes.map((p) => {
                const isSelected = selectedProcess?.pid === p.pid;
                const badgeColor = STATE_COLORS[p.state]?.badge || 'bg-slate-100 text-slate-700';
                return (
                  <button
                    key={p.pid}
                    onClick={() => onSelectPid(p.pid)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : badgeColor}`}>
                      {p.state}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Focused Process State Card */}
          {selectedProcess && stateInfo && (
            <div className={`p-4 rounded-xl border ${stateInfo.color} flex flex-col gap-2 shadow-2xs`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-bold text-sm font-sans">{selectedProcess.name} (PID #{selectedProcess.pid})</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/80 border border-current">
                    {stateInfo.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>AT: <strong>T+{selectedProcess.arrivalTime}</strong></span>
                  <span>Burst Left: <strong>{selectedProcess.remainingBurst}t</strong> / {selectedProcess.totalBurst}t</span>
                  {selectedProcess.ioDuration > 0 && <span>IO: <strong>{selectedProcess.ioDuration}t</strong></span>}
                  <span>Priority: <strong>Lvl {selectedProcess.priority}</strong></span>
                </div>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-sans">
                {stateInfo.desc}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 border-t border-current/20 pt-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                <span>{stateInfo.nextAction}</span>
              </div>
            </div>
          )}

          {/* 5-State Lifecycle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start text-xs">
            
            {/* 1. NEW */}
            <div className={`rounded-xl border ${STATE_COLORS.NEW.border} ${STATE_COLORS.NEW.bg} p-3 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-blue-200/80 pb-1.5">
                <span className={STATE_COLORS.NEW.text}>1. NEW</span>
                <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">
                  {getProcsInState(PROCESS_STATES.NEW).length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {getProcsInState(PROCESS_STATES.NEW).length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  getProcsInState(PROCESS_STATES.NEW).map((p) => {
                    const isFocused = selectedProcess?.pid === p.pid;
                    return (
                      <div
                        key={p.pid}
                        onClick={() => onSelectPid(p.pid)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isFocused
                            ? 'bg-blue-100 border-blue-600 text-blue-950 shadow-xs ring-2 ring-blue-500'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">P:{p.priority}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Burst: {p.totalBurst}t | AT: {p.arrivalTime}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. READY */}
            <div className={`rounded-xl border ${STATE_COLORS.READY.border} ${STATE_COLORS.READY.bg} p-3 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-cyan-200/80 pb-1.5">
                <div className="flex items-center gap-1">
                  <span className={STATE_COLORS.READY.text}>2. READY</span>
                </div>
                <span className="text-[10px] text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200 font-bold">
                  {readyQueueOrdered.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {readyQueueOrdered.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  readyQueueOrdered.map((p, idx) => {
                    const isFocused = selectedProcess?.pid === p.pid;
                    const isNext = idx === 0;
                    return (
                      <div
                        key={p.pid}
                        onClick={() => onSelectPid(p.pid)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isFocused
                            ? 'bg-cyan-100 border-cyan-600 text-cyan-950 shadow-xs ring-2 ring-cyan-500'
                            : isNext
                            ? 'bg-white border-emerald-400 text-slate-800 shadow-xs ring-1 ring-emerald-300'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-400'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1">
                            #{idx + 1} {p.name}
                            {isNext && (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded border border-emerald-300 font-bold">
                                NEXT
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-normal text-slate-500">P:{p.priority}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Rem: {p.remainingBurst}t {p.cpuBurst2 > 0 ? `(${p.burstPhase || 'CPU1'})` : ''}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. RUNNING */}
            <div className={`rounded-xl border ${STATE_COLORS.RUNNING.border} ${STATE_COLORS.RUNNING.bg} p-3 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-emerald-200/80 pb-1.5">
                <span className={STATE_COLORS.RUNNING.text}>3. RUNNING</span>
                <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {getProcsInState(PROCESS_STATES.RUNNING).length > 0 ? 'CPU BUSY' : 'IDLE'}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {getProcsInState(PROCESS_STATES.RUNNING).length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">CPU Idle</span>
                ) : (
                  getProcsInState(PROCESS_STATES.RUNNING).map((p) => {
                    const isFocused = selectedProcess?.pid === p.pid;
                    return (
                      <div
                        key={p.pid}
                        onClick={() => onSelectPid(p.pid)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isFocused
                            ? 'bg-emerald-100 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-500'
                            : 'bg-white border-emerald-400 text-slate-900 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {p.remainingBurst}t left
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.round(((p.totalBurst - p.remainingBurst) / p.totalBurst) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. WAITING */}
            <div className={`rounded-xl border ${STATE_COLORS.WAITING.border} ${STATE_COLORS.WAITING.bg} p-3 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-amber-200/80 pb-1.5">
                <span className={STATE_COLORS.WAITING.text}>4. WAITING</span>
                <span className="text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200 font-bold">
                  {getProcsInState(PROCESS_STATES.WAITING).length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {getProcsInState(PROCESS_STATES.WAITING).length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  getProcsInState(PROCESS_STATES.WAITING).map((p) => {
                    const isFocused = selectedProcess?.pid === p.pid;
                    return (
                      <div
                        key={p.pid}
                        onClick={() => onSelectPid(p.pid)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isFocused
                            ? 'bg-amber-100 border-amber-600 text-amber-950 shadow-xs ring-2 ring-amber-500'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-amber-700 font-bold">{p.ioRemaining}t I/O</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Blocked on Device</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 5. TERMINATED */}
            <div className={`rounded-xl border ${STATE_COLORS.TERMINATED.border} ${STATE_COLORS.TERMINATED.bg} p-3 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-rose-200/80 pb-1.5">
                <span className={STATE_COLORS.TERMINATED.text}>5. TERMINATED</span>
                <span className="text-[10px] text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 font-bold">
                  {getProcsInState(PROCESS_STATES.TERMINATED).length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {getProcsInState(PROCESS_STATES.TERMINATED).length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  getProcsInState(PROCESS_STATES.TERMINATED).map((p) => {
                    const isFocused = selectedProcess?.pid === p.pid;
                    return (
                      <div
                        key={p.pid}
                        onClick={() => onSelectPid(p.pid)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isFocused
                            ? 'bg-rose-100 border-rose-600 text-rose-950 shadow-xs ring-2 ring-rose-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-rose-400'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="line-through">{p.name}</span>
                          <span className="text-[10px] text-rose-600">Exit T+{p.turnaroundTime}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">TAT: {p.turnaroundTime}t</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* OS Transition Flow Legend */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-3 font-sans">
            <span><strong className="text-blue-700">NEW</strong> ➔ admit ➔ <strong className="text-cyan-700">READY</strong></span>
            <span><strong className="text-cyan-700">READY</strong> ➔ dispatch ➔ <strong className="text-emerald-700">RUNNING</strong></span>
            <span><strong className="text-emerald-700">RUNNING</strong> ➔ I/O burst ➔ <strong className="text-amber-700">WAITING</strong> ➔ complete ➔ <strong className="text-cyan-700">READY</strong></span>
            <span><strong className="text-emerald-700">RUNNING</strong> ➔ finish ➔ <strong className="text-rose-700">TERMINATED</strong></span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-slate-50 font-sans text-xs">
          <span className="text-slate-500">
            Click any process card inside the 5-state grid to view its state explanation
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close Diagram
          </button>
        </div>

      </div>
    </div>
  );
}
