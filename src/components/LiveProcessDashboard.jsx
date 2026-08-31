import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  Cpu,
  HardDrive,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Play,
  Pause,
  Layers,
  Terminal,
} from 'lucide-react';
import { PROCESS_STATES, STATE_COLORS } from '../types/process.js';
import { processLiveSnapshot } from '../engine/liveProcessTracker.js';

export default function LiveProcessDashboard({ onImportToSimulator }) {
  const [liveProcesses, setLiveProcesses] = useState([]);
  const [terminatedHistory, setTerminatedHistory] = useState([]);
  const [selectedPid, setSelectedPid] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [isAutoPolling, setIsAutoPolling] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    platform: 'win32',
    hostname: 'Host System',
    totalMemoryMB: 16384,
    freeMemoryMB: 8192,
    cpus: 8,
  });
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [connectionError, setConnectionError] = useState(null);

  const prevProcsRef = useRef([]);
  const terminatedRef = useRef([]);

  // Fetch live processes from Vite API middleware
  const fetchLiveProcesses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/system-processes');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach host kernel API`);
      const data = await res.json();

      if (data.success && Array.isArray(data.processes)) {
        setConnectionError(null);
        if (data.hostname) {
          setSystemInfo({
            platform: data.platform || 'win32',
            hostname: data.hostname,
            totalMemoryMB: data.totalMemoryMB || 16384,
            freeMemoryMB: data.freeMemoryMB || 8192,
            cpus: data.cpus || 8,
          });
        }

        const { activeProcesses, terminatedProcesses } = processLiveSnapshot(
          data.processes,
          prevProcsRef.current,
          terminatedRef.current
        );

        prevProcsRef.current = activeProcesses;
        terminatedRef.current = terminatedProcesses;

        setLiveProcesses(activeProcesses);
        setTerminatedHistory(terminatedProcesses);
        setLastUpdated(Date.now());

        if (!selectedPid && activeProcesses.length > 0) {
          setSelectedPid(activeProcesses[0].pid);
        }
      } else {
        throw new Error(data.error || 'Empty response from OS process monitor');
      }
    } catch (err) {
      console.error('Failed to fetch live system processes:', err);
      setConnectionError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling loop
  useEffect(() => {
    fetchLiveProcesses();

    if (isAutoPolling) {
      const interval = setInterval(() => {
        fetchLiveProcesses();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoPolling, refreshInterval]);

  // Filtered lists
  const allCurrent = [...liveProcesses, ...terminatedHistory];
  const filtered = allCurrent.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pid.toString().includes(searchTerm)
  );

  const getProcsInState = (state) => filtered.filter((p) => p.state === state);

  const selectedProcess = allCurrent.find((p) => p.pid === selectedPid) || liveProcesses[0];

  const runningCount = getProcsInState(PROCESS_STATES.RUNNING).length;
  const readyCount = getProcsInState(PROCESS_STATES.READY).length;
  const waitingCount = getProcsInState(PROCESS_STATES.WAITING).length;
  const newCount = getProcsInState(PROCESS_STATES.NEW).length;
  const terminatedCount = getProcsInState(PROCESS_STATES.TERMINATED).length;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Host System Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 border border-slate-700 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Host Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold font-sans">Real OS Kernel Process Monitor</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE OS: {systemInfo.platform.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Host: <strong className="text-white">{systemInfo.hostname}</strong> • Cores: <strong className="text-white">{systemInfo.cpus}</strong> • Total RAM: <strong className="text-white">{Math.round(systemInfo.totalMemoryMB / 1024)} GB</strong> • Active Tracked: <strong className="text-emerald-300">{liveProcesses.length}</strong>
              </p>
            </div>
          </div>

          {/* Polling & Refresh Controls */}
          <div className="flex items-center gap-2.5 font-mono text-xs flex-wrap">
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setIsAutoPolling(!isAutoPolling)}
                className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAutoPolling
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAutoPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isAutoPolling ? 'Polling' : 'Paused'}
              </button>

              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-slate-300 px-2 py-1 focus:outline-none cursor-pointer text-xs"
              >
                <option value={1000} className="bg-slate-800 text-white">1s</option>
                <option value={2000} className="bg-slate-800 text-white">2s</option>
                <option value={3000} className="bg-slate-800 text-white">3s</option>
                <option value={5000} className="bg-slate-800 text-white">5s</option>
              </select>
            </div>

            <button
              onClick={fetchLiveProcesses}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              Refresh
            </button>
          </div>

        </div>

        {connectionError && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-900/40 border border-rose-700 text-rose-200 text-xs font-mono">
            ⚠️ Connection error: {connectionError}. Make sure the Vite dev server is running.
          </div>
        )}
      </div>

      {/* 2. Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs font-mono text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search process name or PID (e.g. chrome, code, 1204)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-sans text-xs"
          />
        </div>

        <div className="flex items-center gap-2 font-bold flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            NEW: {newCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
            READY: {readyCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            RUNNING: {runningCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            WAITING: {waitingCount}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            EXITED: {terminatedCount}
          </span>
        </div>
      </div>

      {/* 3. Live 5-State Process Machine */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 font-mono shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">Live Operating System 5-State Machine</h3>
            <p className="text-xs text-slate-500">
              Captures actual Windows kernel tasks and tracks real-time state transitions
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            Last snapshot: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start text-xs">
          
          {/* 1. NEW STATE */}
          <div className={`rounded-xl border ${STATE_COLORS.NEW.border} ${STATE_COLORS.NEW.bg} p-3 flex flex-col gap-2 min-h-[160px]`}>
            <div className="flex items-center justify-between font-bold border-b border-blue-200 pb-1.5">
              <span className={STATE_COLORS.NEW.text}>1. NEW (SPAWNED)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">
                {newCount}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {getProcsInState(PROCESS_STATES.NEW).length === 0 ? (
                <span className="text-[11px] text-slate-400 italic py-4 text-center">No new spawns</span>
              ) : (
                getProcsInState(PROCESS_STATES.NEW).map((p) => (
                  <div
                    key={p.pid}
                    onClick={() => setSelectedPid(p.pid)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all ${
                      selectedPid === p.pid
                        ? 'bg-blue-100 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-blue-700">#{p.pid}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.memoryMB} MB RAM</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. READY QUEUE */}
          <div className={`rounded-xl border ${STATE_COLORS.READY.border} ${STATE_COLORS.READY.bg} p-3 flex flex-col gap-2 min-h-[160px]`}>
            <div className="flex items-center justify-between font-bold border-b border-cyan-200 pb-1.5">
              <span className={STATE_COLORS.READY.text}>2. READY POOL</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-cyan-200 text-cyan-700 font-bold">
                {readyCount}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {getProcsInState(PROCESS_STATES.READY).length === 0 ? (
                <span className="text-[11px] text-slate-400 italic py-4 text-center">Pool empty</span>
              ) : (
                getProcsInState(PROCESS_STATES.READY).map((p) => (
                  <div
                    key={p.pid}
                    onClick={() => setSelectedPid(p.pid)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all ${
                      selectedPid === p.pid
                        ? 'bg-cyan-100 border-cyan-500 text-cyan-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-cyan-700">#{p.pid}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
                      <span>{p.memoryMB} MB</span>
                      <span>{p.cpuSeconds}s CPU</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. RUNNING (CPU) */}
          <div className={`rounded-xl border ${STATE_COLORS.RUNNING.border} ${STATE_COLORS.RUNNING.bg} p-3 flex flex-col gap-2 min-h-[160px]`}>
            <div className="flex items-center justify-between font-bold border-b border-emerald-200 pb-1.5">
              <span className={STATE_COLORS.RUNNING.text}>3. RUNNING (CPU)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 font-bold">
                {runningCount > 0 ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {getProcsInState(PROCESS_STATES.RUNNING).length === 0 ? (
                <span className="text-[11px] text-slate-400 italic py-4 text-center">CPU Idle</span>
              ) : (
                getProcsInState(PROCESS_STATES.RUNNING).map((p) => (
                  <div
                    key={p.pid}
                    onClick={() => setSelectedPid(p.pid)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs ring-1 ring-emerald-300`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[110px] text-emerald-950">{p.name}</span>
                      <span className="text-[10px] text-emerald-800">#{p.pid}</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-1">
                      CPU Active: {p.cpuSeconds}s
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">
                      Working Set: {p.memoryMB} MB
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. WAITING (I/O) */}
          <div className={`rounded-xl border ${STATE_COLORS.WAITING.border} ${STATE_COLORS.WAITING.bg} p-3 flex flex-col gap-2 min-h-[160px]`}>
            <div className="flex items-center justify-between font-bold border-b border-amber-200 pb-1.5">
              <span className={STATE_COLORS.WAITING.text}>4. WAITING (I/O)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-700 font-bold">
                {waitingCount}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {getProcsInState(PROCESS_STATES.WAITING).length === 0 ? (
                <span className="text-[11px] text-slate-400 italic py-4 text-center">None waiting</span>
              ) : (
                getProcsInState(PROCESS_STATES.WAITING).slice(0, 10).map((p) => (
                  <div
                    key={p.pid}
                    onClick={() => setSelectedPid(p.pid)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all ${
                      selectedPid === p.pid
                        ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[110px]">{p.name}</span>
                      <span className="text-[10px] text-amber-700">#{p.pid}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{p.memoryMB} MB (I/O Block)</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. TERMINATED */}
          <div className={`rounded-xl border ${STATE_COLORS.TERMINATED.border} ${STATE_COLORS.TERMINATED.bg} p-3 flex flex-col gap-2 min-h-[160px]`}>
            <div className="flex items-center justify-between font-bold border-b border-rose-200 pb-1.5">
              <span className={STATE_COLORS.TERMINATED.text}>5. TERMINATED</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-rose-200 text-rose-700 font-bold">
                {terminatedCount}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {getProcsInState(PROCESS_STATES.TERMINATED).length === 0 ? (
                <span className="text-[11px] text-slate-400 italic py-4 text-center">No recent exits</span>
              ) : (
                getProcsInState(PROCESS_STATES.TERMINATED).map((p) => (
                  <div
                    key={p.pid}
                    onClick={() => setSelectedPid(p.pid)}
                    className="p-2 rounded-lg border bg-rose-50/60 border-rose-200 text-slate-700 opacity-80"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[110px] line-through">{p.name}</span>
                      <span className="text-[10px] text-rose-700">#{p.pid}</span>
                    </div>
                    <div className="text-[9px] text-rose-600 mt-0.5">Exited normally</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 4. Split Area: Real Process Table + PCB Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Real Process Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 font-mono text-xs flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Host Process Control Block (PCB) Table</h3>
              <p className="text-[11px] text-slate-500">
                Click any process to inspect its OS PCB or port it to the scheduler
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-bold">Showing {filtered.length} processes</span>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="text-slate-600 text-[11px] border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">NAME</th>
                  <th className="py-2.5 px-3">STATE</th>
                  <th className="py-2.5 px-3">MEMORY</th>
                  <th className="py-2.5 px-3">CPU TIME</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isSelected = selectedPid === p.pid;
                  const badgeStyle = STATE_COLORS[p.state]?.badge || 'bg-slate-100 text-slate-700';

                  return (
                    <tr
                      key={p.pid}
                      onClick={() => setSelectedPid(p.pid)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-blue-700">#{p.pid}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[140px] truncate">{p.name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                          {p.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{p.memoryMB} MB</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{p.cpuSeconds}s</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onImportToSimulator) onImportToSimulator(p);
                          }}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-300 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          title="Import into CPU Simulator"
                        >
                          <span>Simulate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Focused Real PCB Inspector (5 Cols) */}
        <div className="lg:col-span-5">
          {selectedProcess ? (
            <div className="rounded-xl bg-white border border-slate-200 p-4 font-mono text-xs flex flex-col gap-3 shadow-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">{selectedProcess.name}</h3>
                  <span className="text-[11px] text-slate-500 font-medium">OS Kernel PCB (PID: #{selectedProcess.pid})</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${STATE_COLORS[selectedProcess.state]?.badge || 'bg-slate-100'}`}>
                  {selectedProcess.state}
                </span>
              </div>

              {/* Hardware Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Process Name</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedProcess.name}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Host PID</span>
                  <span className="font-bold text-blue-700">#{selectedProcess.pid}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Working Set RAM</span>
                  <span className="font-bold text-purple-700">{selectedProcess.memoryMB} MB</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Total CPU Consumption</span>
                  <span className="font-bold text-cyan-800">{selectedProcess.cpuSeconds} seconds</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Program Counter (PC)</span>
                  <span className="font-bold text-emerald-700">{selectedProcess.pc}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Stack Pointer (SP)</span>
                  <span className="font-bold text-purple-700">{selectedProcess.sp}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Register R0</span>
                  <span className="font-bold text-slate-800">{selectedProcess.r0}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-medium">Register R1</span>
                  <span className="font-bold text-slate-800">{selectedProcess.r1}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2">
                  <span className="text-slate-500 block text-[10px] font-medium">OS Responsiveness & I/O Status</span>
                  <span className={`font-bold ${selectedProcess.responding ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedProcess.responding ? '🟢 Active & Responding (No Deadlock)' : '⏳ Waiting on System I/O / Input'}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  if (onImportToSimulator) onImportToSimulator(selectedProcess);
                }}
                className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Import {selectedProcess.name} to Algorithm Simulator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-slate-400 font-mono text-xs">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>Select any live process to view its real PCB</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
