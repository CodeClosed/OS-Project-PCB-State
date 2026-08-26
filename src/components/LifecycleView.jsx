import React from 'react';
import { PROCESS_STATES, STATE_COLORS } from '../types/process';

export default function LifecycleView({
  processes,
  selectedPid,
  onSelectPid,
}) {
  const getProcsInState = (state) => processes.filter((p) => p.state === state);

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5 font-mono shadow-xs">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 font-sans">Process Lifecycle Diagram</h2>
          <p className="text-xs text-slate-500">
            Active scheduler manages discrete transitions between 5 OS states
          </p>
        </div>
      </div>

      {/* Main 5-State Machine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start text-xs">

        {/* 1. NEW STATE */}
        <div className={`rounded-xl border ${STATE_COLORS.NEW.border} ${STATE_COLORS.NEW.bg} p-3.5 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
          <div className="flex items-center justify-between font-bold border-b border-blue-200/80 pb-1.5">
            <span className={STATE_COLORS.NEW.text}>1. NEW</span>
            <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 font-bold">
              {getProcsInState(PROCESS_STATES.NEW).length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {getProcsInState(PROCESS_STATES.NEW).length === 0 ? (
              <span className="text-[11px] text-slate-400 italic py-4 text-center">Empty</span>
            ) : (
              getProcsInState(PROCESS_STATES.NEW).map((p) => (
                <div
                  key={p.pid}
                  onClick={() => onSelectPid(p.pid)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    selectedPid === p.pid
                      ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-[10px] text-slate-500">P:{p.priority}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Burst: {p.totalBurst}t</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. READY QUEUE */}
        <div className={`rounded-xl border ${STATE_COLORS.READY.border} ${STATE_COLORS.READY.bg} p-3.5 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
          <div className="flex items-center justify-between font-bold border-b border-cyan-200/80 pb-1.5">
            <span className={STATE_COLORS.READY.text}>2. READY</span>
            <span className="text-[10px] text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200 font-bold">
              {getProcsInState(PROCESS_STATES.READY).length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {getProcsInState(PROCESS_STATES.READY).length === 0 ? (
              <span className="text-[11px] text-slate-400 italic py-4 text-center">Empty</span>
            ) : (
              getProcsInState(PROCESS_STATES.READY).map((p, idx) => (
                <div
                  key={p.pid}
                  onClick={() => onSelectPid(p.pid)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    selectedPid === p.pid
                      ? 'bg-cyan-100 border-cyan-500 text-cyan-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-400 hover:bg-cyan-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">#{idx + 1} {p.name}</span>
                    <span className="text-[10px] text-slate-500">P:{p.priority}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Left: {p.remainingBurst}t</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. RUNNING (CPU) */}
        <div className={`rounded-xl border ${STATE_COLORS.RUNNING.border} ${STATE_COLORS.RUNNING.bg} p-3.5 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
          <div className="flex items-center justify-between font-bold border-b border-emerald-200/80 pb-1.5">
            <span className={STATE_COLORS.RUNNING.text}>3. RUNNING</span>
            <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {getProcsInState(PROCESS_STATES.RUNNING).length > 0 ? 'CPU BUSY' : 'IDLE'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {getProcsInState(PROCESS_STATES.RUNNING).length === 0 ? (
              <span className="text-[11px] text-slate-400 italic py-4 text-center">CPU Idle</span>
            ) : (
              getProcsInState(PROCESS_STATES.RUNNING).map((p) => (
                <div
                  key={p.pid}
                  onClick={() => onSelectPid(p.pid)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    selectedPid === p.pid
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-xs'
                      : 'bg-white border-emerald-400 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">{p.name}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">{p.remainingBurst}t left</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200">
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

        {/* 4. WAITING (I/O) */}
        <div className={`rounded-xl border ${STATE_COLORS.WAITING.border} ${STATE_COLORS.WAITING.bg} p-3.5 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
          <div className="flex items-center justify-between font-bold border-b border-amber-200/80 pb-1.5">
            <span className={STATE_COLORS.WAITING.text}>4. WAITING</span>
            <span className="text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200 font-bold">
              {getProcsInState(PROCESS_STATES.WAITING).length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {getProcsInState(PROCESS_STATES.WAITING).length === 0 ? (
              <span className="text-[11px] text-slate-400 italic py-4 text-center">Empty</span>
            ) : (
              getProcsInState(PROCESS_STATES.WAITING).map((p) => (
                <div
                  key={p.pid}
                  onClick={() => onSelectPid(p.pid)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    selectedPid === p.pid
                      ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-[10px] text-amber-700 font-bold">{p.ioRemaining}t I/O</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Blocked on Device</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. TERMINATED */}
        <div className={`rounded-xl border ${STATE_COLORS.TERMINATED.border} ${STATE_COLORS.TERMINATED.bg} p-3.5 flex flex-col gap-2 min-h-[140px] shadow-xs`}>
          <div className="flex items-center justify-between font-bold border-b border-rose-200/80 pb-1.5">
            <span className={STATE_COLORS.TERMINATED.text}>5. TERMINATED</span>
            <span className="text-[10px] text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200 font-bold">
              {getProcsInState(PROCESS_STATES.TERMINATED).length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {getProcsInState(PROCESS_STATES.TERMINATED).length === 0 ? (
              <span className="text-[11px] text-slate-400 italic py-4 text-center">Empty</span>
            ) : (
              getProcsInState(PROCESS_STATES.TERMINATED).map((p) => (
                <div
                  key={p.pid}
                  onClick={() => onSelectPid(p.pid)}
                  className={`p-2.5 rounded-lg border opacity-80 hover:opacity-100 transition-all cursor-pointer ${
                    selectedPid === p.pid
                      ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-rose-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold line-through text-slate-800">{p.name}</span>
                    <span className="text-[10px] text-rose-600 font-bold">Exit T+{p.turnaroundTime}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">TAT: {p.turnaroundTime}t</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* OS Transition Flow Map Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600 border-t border-slate-200 pt-3 mt-4">
        <span><strong className="text-blue-700">NEW</strong> ➔ admit ➔ <strong className="text-cyan-700">READY</strong></span>
        <span><strong className="text-cyan-700">READY</strong> ➔ dispatch ➔ <strong className="text-emerald-700">RUNNING</strong></span>
        <span><strong className="text-emerald-700">RUNNING</strong> ➔ I/O ➔ <strong className="text-amber-700">WAITING</strong> ➔ I/O done ➔ <strong className="text-cyan-700">READY</strong></span>
        <span><strong className="text-emerald-700">RUNNING</strong> ➔ complete ➔ <strong className="text-rose-700">TERMINATED</strong></span>
      </div>
    </div>
  );
}
