import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { PROCESS_STATES, STATE_COLORS } from '../types/process';
import { sortReadyQueue } from '../engine/simulationEngine.js';

export default function LifecycleView({
  processes,
  selectedPid,
  onSelectPid,
  algorithm = 'FCFS',
  onOpenModal,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const getProcsInState = (state) => processes.filter((p) => p.state === state);
  const readyQueueOrdered = sortReadyQueue(getProcsInState(PROCESS_STATES.READY), algorithm);

  const newCount = getProcsInState(PROCESS_STATES.NEW).length;
  const readyCount = readyQueueOrdered.length;
  const runningCount = getProcsInState(PROCESS_STATES.RUNNING).length;
  const waitingCount = getProcsInState(PROCESS_STATES.WAITING).length;
  const terminatedCount = getProcsInState(PROCESS_STATES.TERMINATED).length;

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3 sm:p-4 font-mono shadow-xs transition-all">
      {/* Compact Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Quick State Badges */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenModal}
            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Open Process Lifecycle Diagram Pop-up"
          >
            <Info className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Process Lifecycle Diagram
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                {algorithm}
              </span>
            </div>
            
            {/* Live Count Pills */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                NEW: {newCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                READY: {readyCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                RUNNING: {runningCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                WAITING: {waitingCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                TERMINATED: {terminatedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Pop-up Action & Inline Toggle */}
        <div className="flex items-center gap-2">
          {/* Main 'i' Button to open pop-up */}
          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Open Process Lifecycle Diagram Pop-up"
          >
            <Info className="w-3.5 h-3.5" />
            <span>View Diagram (Pop-up)</span>
          </button>

          {/* Toggle inline expansion */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse inline diagram' : 'Expand inline diagram'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Inline 5-State Machine Grid (Collapsed by default to save space) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start text-xs">
            {/* 1. NEW */}
            <div className={`rounded-xl border ${STATE_COLORS.NEW.border} ${STATE_COLORS.NEW.bg} p-3 flex flex-col gap-2 min-h-[130px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-blue-200/80 pb-1.5">
                <span className={STATE_COLORS.NEW.text}>1. NEW</span>
                <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">
                  {newCount}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {newCount === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  getProcsInState(PROCESS_STATES.NEW).map((p) => (
                    <div
                      key={p.pid}
                      onClick={() => onSelectPid(p.pid)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedPid === p.pid
                          ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">P:{p.priority}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Burst: {p.totalBurst}t | AT: {p.arrivalTime}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. READY */}
            <div className={`rounded-xl border ${STATE_COLORS.READY.border} ${STATE_COLORS.READY.bg} p-3 flex flex-col gap-2 min-h-[130px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-cyan-200/80 pb-1.5">
                <span className={STATE_COLORS.READY.text}>2. READY</span>
                <span className="text-[10px] text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200 font-bold">
                  {readyCount}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {readyCount === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  readyQueueOrdered.map((p, idx) => (
                    <div
                      key={p.pid}
                      onClick={() => onSelectPid(p.pid)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedPid === p.pid
                          ? 'bg-cyan-100 border-cyan-500 text-cyan-900 shadow-xs ring-1 ring-cyan-400'
                          : idx === 0
                          ? 'bg-white border-emerald-400 text-slate-800 shadow-xs ring-1 ring-emerald-300'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>#{idx + 1} {p.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">P:{p.priority}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Rem: {p.remainingBurst}t
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. RUNNING */}
            <div className={`rounded-xl border ${STATE_COLORS.RUNNING.border} ${STATE_COLORS.RUNNING.bg} p-3 flex flex-col gap-2 min-h-[130px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-emerald-200/80 pb-1.5">
                <span className={STATE_COLORS.RUNNING.text}>3. RUNNING</span>
                <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {runningCount > 0 ? 'CPU BUSY' : 'IDLE'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {runningCount === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">CPU Idle</span>
                ) : (
                  getProcsInState(PROCESS_STATES.RUNNING).map((p) => (
                    <div
                      key={p.pid}
                      onClick={() => onSelectPid(p.pid)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedPid === p.pid
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-xs'
                          : 'bg-white border-emerald-400 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">{p.remainingBurst}t left</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.round(((p.totalBurst - p.remainingBurst) / p.totalBurst) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 4. WAITING */}
            <div className={`rounded-xl border ${STATE_COLORS.WAITING.border} ${STATE_COLORS.WAITING.bg} p-3 flex flex-col gap-2 min-h-[130px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-amber-200/80 pb-1.5">
                <span className={STATE_COLORS.WAITING.text}>4. WAITING</span>
                <span className="text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200 font-bold">
                  {waitingCount}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {waitingCount === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  getProcsInState(PROCESS_STATES.WAITING).map((p) => (
                    <div
                      key={p.pid}
                      onClick={() => onSelectPid(p.pid)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedPid === p.pid
                          ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-amber-700 font-bold">{p.ioRemaining}t I/O</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Blocked on Device</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. TERMINATED */}
            <div className={`rounded-xl border ${STATE_COLORS.TERMINATED.border} ${STATE_COLORS.TERMINATED.bg} p-3 flex flex-col gap-2 min-h-[130px] shadow-xs`}>
              <div className="flex items-center justify-between font-bold border-b border-rose-200/80 pb-1.5">
                <span className={STATE_COLORS.TERMINATED.text}>5. TERMINATED</span>
                <span className="text-[10px] text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 font-bold">
                  {terminatedCount}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {terminatedCount === 0 ? (
                  <span className="text-[11px] text-slate-400 italic py-3 text-center">Empty</span>
                ) : (
                  getProcsInState(PROCESS_STATES.TERMINATED).map((p) => (
                    <div
                      key={p.pid}
                      onClick={() => onSelectPid(p.pid)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        selectedPid === p.pid
                          ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="line-through">{p.name}</span>
                        <span className="text-[10px] text-rose-600">T+{p.turnaroundTime}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">TAT: {p.turnaroundTime}t</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* OS Transition Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 border-t border-slate-200 pt-2 font-sans">
            <span><strong className="text-blue-700">NEW</strong> ➔ admit ➔ <strong className="text-cyan-700">READY</strong></span>
            <span><strong className="text-cyan-700">READY</strong> ➔ dispatch ➔ <strong className="text-emerald-700">RUNNING</strong></span>
            <span><strong className="text-emerald-700">RUNNING</strong> ➔ I/O ➔ <strong className="text-amber-700">WAITING</strong> ➔ complete ➔ <strong className="text-cyan-700">READY</strong></span>
            <span><strong className="text-emerald-700">RUNNING</strong> ➔ complete ➔ <strong className="text-rose-700">TERMINATED</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
