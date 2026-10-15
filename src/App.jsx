import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import LifecycleView from './components/LifecycleView';
import PCBInspector from './components/PCBInspector';
import ProcessTable from './components/ProcessTable';
import GanttChart from './components/GanttChart';
import EventTimeline from './components/EventTimeline';
import NewProcessModal from './components/NewProcessModal';
import FinalReportModal from './components/FinalReportModal';

// Features
import BattleArena from './components/BattleArena';
import LiveProcessDashboard from './components/LiveProcessDashboard';

import { INITIAL_PROCESSES, PROCESS_STATES, createProcess } from './types/process';
import { executeStep, resetEngineSequence } from './engine/simulationEngine';

export default function App() {
  const [activeModule, setActiveModule] = useState('SIMULATOR');
  // Starts completely clear (0 processes loaded)
  const [processes, setProcesses] = useState(INITIAL_PROCESSES);
  const [clockTick, setClockTick] = useState(0);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPid, setSelectedPid] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [ganttHistory, setGanttHistory] = useState([]);
  const [historyStack, setHistoryStack] = useState([]);
  const [eventLogs, setEventLogs] = useState([
    '[T+0] Simulator initialized. Add processes below or import CSV to start.'
  ]);

  const timerRef = useRef(null);

  // Single step execution (forward 1 tick)
  const handleStep = useCallback(() => {
    setProcesses((prev) => {
      // Guard against empty process list
      if (prev.length === 0) {
        setIsRunning(false);
        setEventLogs((logs) => {
          if (logs[0]?.includes('No processes')) return logs;
          return [`[T+${clockTick}] No processes to schedule. Add a process below to start simulation.`, ...logs].slice(0, 50);
        });
        return prev;
      }

      // Guard against stepping when all processes are already terminated
      if (prev.every((p) => p.state === PROCESS_STATES.TERMINATED)) {
        setIsRunning(false);
        setEventLogs((logs) => {
          if (logs[0]?.includes('Simulation finished')) return logs;
          return [`[T+${clockTick}] Simulation finished: All processes have terminated. Click "Final Report" to view metrics.`, ...logs].slice(0, 50);
        });
        return prev;
      }

      // Ensure all processes have valid numbers before executing step
      const sanitized = prev.map((p) => {
        const b1 = p.cpuBurst1 === '' || isNaN(Number(p.cpuBurst1)) || Number(p.cpuBurst1) < 1 ? (Number(p.totalBurst) || 4) : Number(p.cpuBurst1);
        const b2 = p.cpuBurst2 === '' || isNaN(Number(p.cpuBurst2)) ? 0 : Number(p.cpuBurst2);
        const total = b1 + b2;
        return {
          ...p,
          priority: p.priority === '' || isNaN(Number(p.priority)) ? 0 : Number(p.priority),
          arrivalTime: p.arrivalTime === '' || isNaN(Number(p.arrivalTime)) ? 0 : Number(p.arrivalTime),
          cpuBurst1: b1,
          cpuBurst2: b2,
          totalBurst: total,
          remainingBurst: p.remainingBurst === '' || isNaN(Number(p.remainingBurst)) ? total : Number(p.remainingBurst),
        };
      });

      // Push historical snapshot of state before this tick
      setHistoryStack((history) => [
        ...history,
        {
          processes: prev.map((p) => ({ ...p })),
          clockTick,
          ganttHistory: [...ganttHistory],
          eventLogs: [...eventLogs],
          selectedPid,
        },
      ]);

      const result = executeStep(sanitized, clockTick, algorithm, timeQuantum, ganttHistory);
      setClockTick(result.clockTick);
      setGanttHistory(result.ganttHistory);

      if (result.eventLogs.length > 0) {
        setEventLogs((logs) => [...result.eventLogs, ...logs].slice(0, 50));
      }

      // If all terminated, pause simulation
      const allDone = result.processes.every((p) => p.state === PROCESS_STATES.TERMINATED);
      if (allDone && isRunning) {
        setIsRunning(false);
      }

      return result.processes;
    });
  }, [clockTick, algorithm, timeQuantum, ganttHistory, eventLogs, selectedPid, isRunning]);

  // Step back 1 clock tick
  const handleStepBack = useCallback(() => {
    if (historyStack.length === 0 || clockTick === 0) return;

    setHistoryStack((prevHistory) => {
      const nextHistory = [...prevHistory];
      const previousState = nextHistory.pop();

      if (previousState) {
        setProcesses(previousState.processes);
        setClockTick(previousState.clockTick);
        setGanttHistory(previousState.ganttHistory);
        setEventLogs(previousState.eventLogs);
        setSelectedPid(previousState.selectedPid);
      }

      return nextHistory;
    });
  }, [historyStack, clockTick]);

  // Reset simulator to completely clean/empty state
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setClockTick(0);
    resetEngineSequence();
    setProcesses([]);
    setGanttHistory([]);
    setHistoryStack([]);
    setEventLogs(['[T+0] Simulator reset. All processes cleared.']);
    setSelectedPid(null);
  }, []);

  // Timer interval for play/pause
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        handleStep();
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, handleStep]);

  // Create new process from modal (strictly created in NEW state)
  const handleCreateProcess = (procData) => {
    const newProc = createProcess(procData);
    newProc.state = PROCESS_STATES.NEW;
    setProcesses((prev) => [...prev, newProc]);
    setEventLogs((logs) => [
      `[T+${clockTick}] Created process ${newProc.name} (PID ${newProc.pid}) with AT: ${newProc.arrivalTime}, Burst: ${newProc.totalBurst}, Priority: ${newProc.priority}.`,
      ...logs,
    ].slice(0, 50));
    setSelectedPid(newProc.pid);
  };

  // Quick add process from table (strictly created in NEW state)
  const handleQuickAddProcess = (procData) => {
    const newProc = createProcess(procData);
    newProc.state = PROCESS_STATES.NEW;
    setProcesses((prev) => [...prev, newProc]);
    setEventLogs((logs) => [
      `[T+${clockTick}] Added process ${newProc.name} (PID ${newProc.pid}) to pool.`,
      ...logs,
    ].slice(0, 50));
    setSelectedPid(newProc.pid);
  };

  // Delete process
  const handleDeleteProcess = (pid) => {
    setProcesses((prev) => {
      const remaining = prev.filter((p) => p.pid !== pid);
      if (selectedPid === pid) {
        setSelectedPid(remaining[0]?.pid || null);
      }
      return remaining;
    });
    setEventLogs((logs) => [`[T+${clockTick}] Deleted process PID ${pid}.`, ...logs].slice(0, 50));
  };

  // Clear all processes
  const handleClearAll = () => {
    setIsRunning(false);
    setProcesses([]);
    setSelectedPid(null);
    setEventLogs((logs) => [`[T+${clockTick}] Cleared all processes from simulator.`, ...logs].slice(0, 50));
  };

  // Import processes from preset or Live OS Monitor (all start in NEW state)
  const handleImportProcesses = (importedList) => {
    setIsRunning(false);
    setClockTick(0);
    resetEngineSequence();
    setGanttHistory([]);
    setHistoryStack([]);
    const formatted = importedList.map((p, idx) => ({
      ...p,
      pid: p.pid || idx + 1,
      name: p.name || `P${idx + 1}`,
      state: PROCESS_STATES.NEW,
    }));
    setProcesses(formatted);
    setSelectedPid(formatted[0]?.pid || null);
    setEventLogs([`[T+0] Imported ${formatted.length} processes (all initialized in NEW state).`]);
    setActiveModule('SIMULATOR');
  };

  // Inline update process from table inputs
  const handleUpdateProcess = (pid, field, value) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid !== pid) return p;
        const updated = { ...p };

        if (field === 'name') {
          updated.name = value;
        } else if (field === 'arrivalTime') {
          updated.arrivalTime = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        } else if (field === 'priority') {
          updated.priority = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        } else if (field === 'cpuBurst1') {
          const b1 = value === '' ? '' : Math.max(1, parseInt(value) || 1);
          updated.cpuBurst1 = b1;
          const b2 = updated.cpuBurst2 === '' || isNaN(Number(updated.cpuBurst2)) ? 0 : Number(updated.cpuBurst2);
          const total = (b1 === '' ? 0 : b1) + b2;
          updated.totalBurst = total;
          if (!updated.executedBurst || updated.state === PROCESS_STATES.NEW) {
            updated.remainingBurst = total;
          } else {
            updated.remainingBurst = Math.max(0, total - (updated.executedBurst || 0));
          }
        } else if (field === 'cpuBurst2') {
          const b2 = value === '' ? '' : Math.max(0, parseInt(value) || 0);
          updated.cpuBurst2 = b2;
          const b1 = updated.cpuBurst1 === '' || isNaN(Number(updated.cpuBurst1)) ? (Number(updated.totalBurst) || 4) : Number(updated.cpuBurst1);
          const total = b1 + (b2 === '' ? 0 : b2);
          updated.totalBurst = total;
          if (!updated.executedBurst || updated.state === PROCESS_STATES.NEW) {
            updated.remainingBurst = total;
          } else {
            updated.remainingBurst = Math.max(0, total - (updated.executedBurst || 0));
          }
        } else if (field === 'ioDuration') {
          updated.ioDuration = value === '' ? '' : Math.max(0, parseInt(value) || 0);
        }

        return updated;
      })
    );
  };

  const handleBlurProcess = (pid, field) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid !== pid) return p;
        const updated = { ...p };

        if (field === 'arrivalTime') {
          if (updated.arrivalTime === '' || isNaN(Number(updated.arrivalTime))) {
            updated.arrivalTime = 0;
          }
        } else if (field === 'priority') {
          if (updated.priority === '' || isNaN(Number(updated.priority))) {
            updated.priority = 0;
          }
        } else if (field === 'cpuBurst1') {
          if (updated.cpuBurst1 === '' || isNaN(Number(updated.cpuBurst1))) {
            updated.cpuBurst1 = 4;
            const total = 4 + (Number(updated.cpuBurst2) || 0);
            updated.totalBurst = total;
            if (!updated.executedBurst || updated.state === PROCESS_STATES.NEW) {
              updated.remainingBurst = total;
            } else {
              updated.remainingBurst = Math.max(0, total - (updated.executedBurst || 0));
            }
          }
        } else if (field === 'cpuBurst2') {
          if (updated.cpuBurst2 === '' || isNaN(Number(updated.cpuBurst2))) {
            updated.cpuBurst2 = 0;
            const total = (Number(updated.cpuBurst1) || 4);
            updated.totalBurst = total;
            if (!updated.executedBurst || updated.state === PROCESS_STATES.NEW) {
              updated.remainingBurst = total;
            } else {
              updated.remainingBurst = Math.max(0, total - (updated.executedBurst || 0));
            }
          }
        } else if (field === 'ioDuration') {
          if (updated.ioDuration === '' || isNaN(Number(updated.ioDuration))) {
            updated.ioDuration = 0;
          }
        } else if (field === 'name') {
          if (!updated.name || !updated.name.trim()) {
            updated.name = `P${pid}`;
          }
        }

        return updated;
      })
    );
  };

  const selectedProcess = processes.find((p) => p.pid === selectedPid) || null;
  const nextPid = processes.length > 0 ? Math.max(...processes.map((p) => Number(p.pid) || 0)) + 1 : 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Header & Navigation */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        clockTick={clockTick}
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning((prev) => !prev)}
        onStep={handleStep}
        onStepBack={handleStepBack}
        canStepBack={historyStack.length > 0 && clockTick > 0}
        onReset={handleReset}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        timeQuantum={timeQuantum}
        setTimeQuantum={setTimeQuantum}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* 2. Main Module Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
        {/* --- MODULE 1: CORE SIMULATOR & PCB LIFECYCLE --- */}
        {activeModule === 'SIMULATOR' && (
          <>
            <LifecycleView
              processes={processes}
              selectedPid={selectedPid}
              onSelectPid={setSelectedPid}
              algorithm={algorithm}
            />

            <GanttChart
              ganttHistory={ganttHistory}
              currentTick={clockTick}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7">
                <ProcessTable
                  processes={processes}
                  selectedPid={selectedPid}
                  onSelectPid={setSelectedPid}
                  onDeleteProcess={handleDeleteProcess}
                  onQuickAddProcess={handleQuickAddProcess}
                  onUpdateProcess={handleUpdateProcess}
                  onBlurProcess={handleBlurProcess}
                  onImportProcesses={handleImportProcesses}
                  onClearAll={handleClearAll}
                  nextPid={nextPid}
                  algorithm={algorithm}
                />
              </div>

              <div className="lg:col-span-5">
                <PCBInspector process={selectedProcess} />
              </div>
            </div>

            <EventTimeline
              logs={eventLogs}
              onClearLogs={() => setEventLogs([])}
            />
          </>
        )}

        {/* --- MODULE 2: ALGORITHM BATTLE ARENA --- */}
        {activeModule === 'BATTLE_ARENA' && (
          <BattleArena defaultProcesses={processes} />
        )}

        {/* --- MODULE 3: LIVE OS PROCESS MONITOR --- */}
        {activeModule === 'LIVE_MONITOR' && (
          <LiveProcessDashboard onImportToSimulator={handleImportProcesses} />
        )}
      </main>

      {/* Modals for Core Simulator */}
      <NewProcessModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateProcess={handleCreateProcess}
        nextPid={nextPid}
        currentTick={clockTick}
      />

      <FinalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        processes={processes}
        clockTick={clockTick}
        algorithm={algorithm}
      />
    </div>
  );
}
