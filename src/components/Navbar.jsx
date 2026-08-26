import React from 'react';
import { Cpu, Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, FileText } from 'lucide-react';
import { SCHEDULERS } from '../types/process';

export default function Navbar({
  clockTick,
  isRunning,
  onTogglePlay,
  onStep,
  onStepBack,
  canStepBack,
  onReset,
  algorithm,
  setAlgorithm,
  timeQuantum,
  setTimeQuantum,
  onOpenNewModal,
  onOpenReport,
}) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 lg:px-6 py-3 font-mono shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Branding & Clock */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wide font-sans">
              OS Process Lifecycle Simulator
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Clock: <strong className="text-blue-600 font-bold">T+{clockTick}</strong></span>
            </div>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-colors shadow-xs cursor-pointer shrink-0 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-white" /> Start</>}
          </button>

          {/* Step Controls: Back & Forward */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onStepBack}
              disabled={isRunning || !canStepBack}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 border border-slate-300 font-medium transition-colors cursor-pointer"
              title="Step back 1 clock tick"
            >
              <SkipBack className="w-3.5 h-3.5 text-blue-600" />
              <span>Back</span>
            </button>

            <button
              onClick={onStep}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 border border-slate-300 font-medium transition-colors cursor-pointer"
              title="Step forward 1 clock tick"
            >
              <SkipForward className="w-3.5 h-3.5 text-blue-600" />
              <span>Step</span>
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border border-slate-300 transition-colors cursor-pointer shrink-0"
            title="Reset Simulator"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Schedulers Selector (Fixed Stable Width to Prevent Layout Shift) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg shrink-0">
            <span className="text-slate-500 text-[11px] font-medium shrink-0">Scheduler:</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer w-60 sm:w-68 truncate"
            >
              {SCHEDULERS.map((algo) => (
                <option key={algo.id} value={algo.id}>
                  {algo.name}
                </option>
              ))}
            </select>
            {algorithm === 'RR' && (
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-300 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold">Q:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-8 bg-white text-blue-700 font-bold text-center text-xs rounded border border-slate-300 focus:outline-none focus:border-blue-500"
                  title="Time Quantum (ticks)"
                />
              </div>
            )}
          </div>

          {/* Final Report Button */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition-colors cursor-pointer shrink-0"
            title="Open CT, TAT, WT, RT Performance Report"
          >
            <FileText className="w-3.5 h-3.5" /> Report
          </button>

          {/* New Process */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors cursor-pointer shrink-0 ml-1"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

      </div>
    </header>
  );
}
