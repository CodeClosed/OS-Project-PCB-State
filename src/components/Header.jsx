import React from 'react';
import { Cpu, RefreshCw, Activity, Layers, Play, Pause, Plus } from 'lucide-react';
import { PROCESS_STATES } from '../types/constants';

export default function Header({
  clockTick,
  processes,
  contextSwitchCount,
  onOpenCreator,
  simulationMode,
  setSimulationMode,
}) {
  const readyCount = processes.filter((p) => p.state === PROCESS_STATES.READY).length;
  const runningCount = processes.filter((p) => p.state === PROCESS_STATES.RUNNING).length;
  const waitingCount = processes.filter((p) => p.state === PROCESS_STATES.WAITING).length;
  const terminatedCount = processes.filter((p) => p.state === PROCESS_STATES.TERMINATED).length;

  return (
    <header className="border-b border-slate-800 bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-glow-blue">
            <Cpu className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                OS Process Lifecycle <span className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded bg-cyan-500/10">PCB v2.5</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Process Control Block & CPU Scheduling Architecture
            </p>
          </div>
        </div>

        {/* Center: Live OS Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-4 font-mono text-xs">
          {/* Clock Tick */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Clock Tick:</span>
            <span className="font-bold text-cyan-300 text-sm">T+{clockTick}</span>
          </div>

          {/* Context Switches */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Context Switches:</span>
            <span className="font-bold text-amber-300 text-sm">{contextSwitchCount}</span>
          </div>

          {/* Process State Counts Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">States:</span>
            <span className="text-cyan-400 font-semibold" title="Ready">{readyCount} R</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold" title="Running">{runningCount} RUN</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-semibold" title="Waiting">{waitingCount} W</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-semibold" title="Terminated">{terminatedCount} T</span>
          </div>
        </div>

        {/* Right: Simulation Mode Pill & Action CTA */}
        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSimulationMode('auto')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                simulationMode === 'auto'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto Scheduler
            </button>
            <button
              onClick={() => setSimulationMode('manual')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                simulationMode === 'manual'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Manual OS Mode
            </button>
          </div>

          {/* Create Process Button */}
          <button
            onClick={onOpenCreator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-glow-emerald cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Process
          </button>
        </div>

      </div>
    </header>
  );
}
