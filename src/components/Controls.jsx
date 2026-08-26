import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Sliders, Gauge, Sparkles } from 'lucide-react';
import { SCHEDULING_ALGORITHMS } from '../types/constants';
import { PRESETS } from '../engine/presets';

export default function Controls({
  isRunning,
  onTogglePlay,
  onStepForward,
  onReset,
  speed,
  setSpeed,
  algorithm,
  setAlgorithm,
  timeQuantum,
  setTimeQuantum,
  onSelectPreset,
  simulationMode,
  selectedPresetId,
}) {
  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
      
      {/* Simulation Play/Pause & Step Controls */}
      <div className="flex items-center gap-2">
        {simulationMode === 'auto' ? (
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-glow-amber'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow-blue'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pause Engine
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Run Engine
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800 text-purple-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            Manual OS Mode (Click processes to transition)
          </div>
        )}

        {/* Step 1 Tick Forward */}
        <button
          onClick={onStepForward}
          disabled={isRunning && simulationMode === 'auto'}
          title="Advance clock by 1 tick"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
        >
          <SkipForward className="w-4 h-4 text-cyan-400" />
          <span>Step 1 Tick</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset simulation to initial preset state"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition-colors border border-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Algorithm Selector & Quantum */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">Scheduler:</span>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={simulationMode === 'manual'}
            className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
          >
            {Object.values(SCHEDULING_ALGORITHMS).map((algo) => (
              <option key={algo.id} value={algo.id}>
                {algo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantum Setting for Round Robin */}
        {algorithm === 'RR' && (
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Quantum:</span>
            <input
              type="number"
              min="1"
              max="10"
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 bg-slate-800 text-cyan-300 font-bold text-center text-xs rounded px-1 py-1 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">ticks</span>
          </div>
        )}

        {/* Speed Controls for Auto Simulation */}
        {simulationMode === 'auto' && (
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Speed:</span>
            <div className="flex items-center gap-1">
              {[0.5, 1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    speed === s
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preset Scenarios Dropdown */}
      <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-slate-400">Preset:</span>
        <select
          value={selectedPresetId || ''}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="bg-slate-800 text-purple-300 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          {PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}
