import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Swords,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Trophy,
  Download,
  Flame,
  CheckCircle2,
  Clock,
  Cpu,
  BarChart3,
  Layers,
  Check,
  Zap,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ARENA_ALGORITHMS, initializeArena, executeArenaStep } from '../engine/battleEngine.js';

/**
 * Individual Block Gantt Track identical to the Core Simulator Gantt Chart
 */
function BattleGanttTrack({ ganttHistory, currentTick, color, name }) {
  const containerRef = useRef(null);

  // Auto-scroll to end as execution progresses
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [ganttHistory]);

  // Group continuous execution intervals: [{ name, pid, start, end, duration, palette }]
  const intervals = [];
  ganttHistory.forEach((item) => {
    const last = intervals[intervals.length - 1];
    if (last && last.pid === item.pid && last.name === item.name) {
      last.end = item.end;
      last.duration += item.end - item.start;
    } else {
      intervals.push({
        pid: item.pid,
        name: item.name,
        start: item.start,
        end: item.end,
        duration: item.end - item.start,
        palette: item.palette,
      });
    }
  });

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center min-h-[68px] scroll-smooth font-mono"
    >
      {intervals.length === 0 ? (
        <span className="text-slate-400 italic text-[11px] py-2 mx-auto font-sans">
          Gantt chart is empty. Click "Start Race" or "Step" to simulate.
        </span>
      ) : (
        <div className="flex items-center">
          {intervals.map((block, idx) => {
            const isIdle = block.name === 'IDLE';

            return (
              <div key={idx} className="flex flex-col items-center flex-shrink-0">
                {/* Colored Block Box */}
                <div
                  className={`h-9 border border-slate-300 px-2 flex items-center justify-center font-bold text-xs shadow-2xs transition-all ${
                    isIdle
                      ? 'bg-slate-200 text-slate-600 border-dashed'
                      : `${block.palette?.bg || 'bg-blue-600'} text-white`
                  }`}
                  style={{ minWidth: `${Math.max(44, block.duration * 24)}px` }}
                >
                  <span className="truncate">{isIdle ? 'IDLE' : block.name.split(' ')[0]}</span>
                </div>

                {/* Time Tick Indicator */}
                <div className="w-full flex justify-between text-[9px] text-slate-600 mt-1 px-1 font-bold">
                  <span>{block.start}</span>
                  <span>{block.end}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BattleArena({ defaultProcesses }) {
  // Everything starts DESELECTED by default
  const [selectedAlgos, setSelectedAlgos] = useState([]);
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [arenaState, setArenaState] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef(null);

  // Sync / Reset Arena State
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsFinished(false);
    if (selectedAlgos.length === 0) {
      setArenaState({});
    } else {
      setArenaState(initializeArena(defaultProcesses, selectedAlgos, timeQuantum));
    }
  }, [defaultProcesses, selectedAlgos, timeQuantum]);

  useEffect(() => {
    handleReset();
  }, [selectedAlgos, defaultProcesses]);

  // Step Execution
  const handleStep = useCallback(() => {
    if (selectedAlgos.length === 0) return;
    setArenaState((prev) => {
      const { arenaState: nextState, allFinished } = executeArenaStep(prev, timeQuantum);
      if (allFinished) {
        setIsRunning(false);
        setIsFinished(true);
      }
      return nextState;
    });
  }, [selectedAlgos, timeQuantum]);

  // Continuous running ticker
  useEffect(() => {
    if (isRunning && selectedAlgos.length > 0) {
      timerRef.current = setInterval(() => {
        handleStep();
      }, 700);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedAlgos, handleStep]);

  const toggleAlgorithm = (id) => {
    if (selectedAlgos.includes(id)) {
      setSelectedAlgos(selectedAlgos.filter((a) => a !== id));
    } else {
      setSelectedAlgos([...selectedAlgos, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedAlgos(ARENA_ALGORITHMS.map((a) => a.id));
  };

  const handleSelectStandard = () => {
    setSelectedAlgos(['FCFS', 'SJF', 'SRTF', 'RR']);
  };

  const handleClearAll = () => {
    setIsRunning(false);
    setIsFinished(false);
    setSelectedAlgos([]);
    setArenaState({});
  };

  // Rank algorithms by lowest average Turnaround Time & Waiting Time
  const rankedTracks = Object.values(arenaState).sort((a, b) => {
    if (a.metrics.completedCount === 0 && b.metrics.completedCount === 0) return 0;
    return a.metrics.avgTAT - b.metrics.avgTAT || a.metrics.avgWT - b.metrics.avgWT;
  });

  const bestAlgoId = rankedTracks[0]?.algorithm;
  const bestAlgoInfo = ARENA_ALGORITHMS.find((a) => a.id === bestAlgoId);

  // Export Lab Report
  const handleExportReport = () => {
    if (rankedTracks.length === 0) return;
    const reportDate = new Date().toLocaleString();
    let text = `# Operating Systems Lab: Multi-Scheduler Benchmark Report\n`;
    text += `*Generated automatically by Process Lifecycle Dashboard: Visualize PCB State Transition on ${reportDate}*\n\n`;
    text += `## 1. Workload Summary\n`;
    text += `- **Total Processes:** ${defaultProcesses.length}\n`;
    text += `- **Round Robin Quantum (Q):** ${timeQuantum}\n\n`;
    text += `## 2. Comparative Performance Matrix\n\n`;
    text += `| Algorithm | Completed | Avg Turnaround Time (TAT) | Avg Waiting Time (WT) | Avg Response Time (RT) | Context Switches | Starvation Index |\n`;
    text += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    rankedTracks.forEach((t) => {
      const info = ARENA_ALGORITHMS.find((a) => a.id === t.algorithm);
      text += `| ${info?.name || t.algorithm} | ${t.metrics.completedCount}/${t.metrics.totalCount} | **${t.metrics.avgTAT}** | **${t.metrics.avgWT}** | ${t.metrics.avgRT} | ${t.metrics.totalContextSwitches} | ${t.metrics.starvationIndex} |\n`;
    });

    text += `\n## 3. Analysis & Winner\n`;
    text += `- **Optimal Algorithm for this workload:** **${bestAlgoInfo?.name || bestAlgoId}** (lowest turnaround & waiting time).\n`;
    text += `- **Observation on Starvation:** Algorithms with higher Starvation Index heavily favored short bursts over older processes.\n`;

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OS_Algorithm_Battle_Report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 1. Header Banner & Main Controls */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-slate-100">
                Algorithm Battle Arena & Benchmark
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                selectedAlgos.length > 0
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {selectedAlgos.length} Schedulers Selected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute identical process workloads concurrently to benchmark latency, throughput, and fairness.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            disabled={selectedAlgos.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Race
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" /> Start Race
              </>
            )}
          </button>

          <button
            onClick={handleStep}
            disabled={isRunning || isFinished || selectedAlgos.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Step 1 clock tick forward across all selected schedulers"
          >
            <SkipForward className="w-3.5 h-3.5 text-indigo-400" /> Step
          </button>

          <button
            onClick={handleReset}
            disabled={selectedAlgos.length === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Reset Race"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportReport}
            disabled={rankedTracks.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Download comparative assignment report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Report
          </button>
        </div>
      </div>

      {/* 2. Schedulers Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Competing Schedulers
            </span>
          </div>

          {/* Presets & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedAlgos.includes('RR') && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-amber-800 font-bold">RR Quantum (Q):</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-8 text-center font-bold bg-white border border-amber-300 rounded text-amber-900 text-xs focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={handleSelectStandard}
                className="px-2 py-0.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
              >
                Standard 4
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleSelectAll}
                className="px-2 py-0.5 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold transition-colors cursor-pointer"
              >
                Select All 6
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleClearAll}
                className="px-2 py-0.5 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>

        {/* Schedulers Grid (All start deselected) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ARENA_ALGORITHMS.map((algo) => {
            const isSelected = selectedAlgos.includes(algo.id);
            return (
              <button
                key={algo.id}
                onClick={() => toggleAlgorithm(algo.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: algo.color }}
                    />
                    <span
                      className={`text-[9px] font-mono uppercase font-bold tracking-tight ${
                        isSelected ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {algo.tag}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs font-bold truncate w-full ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {algo.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Comparative Performance Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Comparative Performance Benchmark</span>
          </div>

          {bestAlgoInfo && rankedTracks.some((t) => t.metrics.completedCount > 0) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Leader: {bestAlgoInfo.name}
            </div>
          )}
        </div>

        {selectedAlgos.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No schedulers selected.</p>
            <p className="text-[11px] text-slate-400">
              Click any algorithm chip above (or "Standard 4") to start benchmarking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Scheduler Algorithm</th>
                  <th className="p-3 text-center">Progress</th>
                  <th className="p-3 text-center">Avg Turnaround (TAT)</th>
                  <th className="p-3 text-center">Avg Waiting (WT)</th>
                  <th className="p-3 text-center">Avg Response (RT)</th>
                  <th className="p-3 text-center">Context Switches</th>
                  <th className="p-3 text-center">Starvation Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankedTracks.map((track, idx) => {
                  const info = ARENA_ALGORITHMS.find((a) => a.id === track.algorithm);
                  const isWinner = idx === 0 && track.metrics.completedCount > 0;
                  return (
                    <tr
                      key={track.algorithm}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isWinner ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black text-[11px] shadow-xs">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-bold text-[11px]">
                            2
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                            {idx + 1}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: info?.color || '#3b82f6' }}
                          />
                          <span className="font-sans font-bold text-slate-900">{info?.name || track.algorithm}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({info?.tag})</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {track.metrics.completedCount} / {track.metrics.totalCount}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-blue-700 text-sm">
                        {track.metrics.avgTAT}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700 text-sm">
                        {track.metrics.avgWT}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {track.metrics.avgRT}
                      </td>
                      <td className="p-3 text-center text-slate-700 font-bold">
                        {track.metrics.totalContextSwitches}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            track.metrics.starvationIndex > 6
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {track.metrics.starvationIndex}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Side-by-Side Block Gantt Tracks */}
      {selectedAlgos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedAlgos.map((algoId) => {
            const track = arenaState[algoId];
            const info = ARENA_ALGORITHMS.find((a) => a.id === algoId);
            if (!track) return null;

            const progressPct =
              track.metrics.totalCount > 0
                ? Math.round((track.metrics.completedCount / track.metrics.totalCount) * 100)
                : 0;

            return (
              <div
                key={algoId}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: info?.color }} />
                    <span className="text-xs font-bold text-slate-900 font-sans">{info?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400 font-sans text-[11px]">{progressPct}% Done</span>
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      T+{track.clockTick}
                    </span>
                  </div>
                </div>

                {/* Block Gantt Track */}
                <BattleGanttTrack
                  ganttHistory={track.ganttHistory}
                  currentTick={track.clockTick}
                  color={info?.color}
                  name={info?.name}
                />

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center pt-1 border-t border-slate-100 text-slate-600">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-sans">Avg WT</span>
                    <strong className="text-emerald-700">{track.metrics.avgWT}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-sans">Avg TAT</span>
                    <strong className="text-blue-700">{track.metrics.avgTAT}</strong>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-sans">Context Sw</span>
                    <strong className="text-slate-800">{track.metrics.totalContextSwitches}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
