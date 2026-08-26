import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import LifecycleView from './components/LifecycleView';
import PCBInspector from './components/PCBInspector';
import ProcessTable from './components/ProcessTable';
import GanttChart from './components/GanttChart';
import EventTimeline from './components/EventTimeline';
import NewProcessModal from './components/NewProcessModal';
import FinalReportModal from './components/FinalReportModal';
import { INITIAL_PROCESSES, PROCESS_STATES, createProcess } from './types/process';
import { executeStep, resetEngineSequence } from './engine/simulationEngine';

export default function App() {
  const [processes, setProcesses] = useState(INITIAL_PROCESSES);
  const [clockTick, setClockTick] = useState(0);
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPid, setSelectedPid] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [ganttHistory, setGanttHistory] = useState([]);
  const [historyStack, setHistoryStack] = useState([]);
  const [eventLogs, setEventLogs] = useState([
    '[T+0] Simulator initialized with 4 processes.'
  ]);

  const timerRef = useRef(null);

  // Single step execution (forward 1 tick)
  const handleStep = useCallback(() => {
    setProcesses((prev) => {
      // Ensure all processes have valid numbers before executing step
      const sanitized = prev.map((p) => ({
        ...p,
        priority: p.priority === '' || isNaN(Number(p.priority)) ? 0 : Number(p.priority),
        arrivalTime: p.arrivalTime === '' || isNaN(Number(p.arrivalTime)) ? 0 : Number(p.arrivalTime),
        totalBurst: p.totalBurst === '' || isNaN(Number(p.totalBurst)) || Number(p.totalBurst) < 1 ? 1 : Number(p.totalBurst),
        remainingBurst: p.remainingBurst === '' || isNaN(Number(p.remainingBurst)) ? (Number(p.totalBurst) || 1) : Number(p.remainingBurst),
      }));

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
    if (isRunning) {
      setIsRunning(false);
    }
    setHistoryStack((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const lastSnapshot = prevHistory[prevHistory.length - 1];
      const newHistory = prevHistory.slice(0, prevHistory.length - 1);

      setProcesses(lastSnapshot.processes);
      setClockTick(lastSnapshot.clockTick);
      setGanttHistory(lastSnapshot.ganttHistory);
      setEventLogs(lastSnapshot.eventLogs);
      if (lastSnapshot.selectedPid) {
        setSelectedPid(lastSnapshot.selectedPid);
      }

      return newHistory;
    });
  }, [isRunning]);

  // Play / Pause timer loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        handleStep();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, handleStep]);

  // Reset simulator (Resets all existing processes to NEW state without wiping custom rows)
  const handleReset = () => {
    setIsRunning(false);
    resetEngineSequence();
    setHistoryStack([]);
    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        state: PROCESS_STATES.NEW,
        remainingBurst: p.totalBurst,
        executedBurst: 0,
        startTime: null,
        completionTime: null,
        turnaroundTime: null,
        waitingTime: 0,
        responseTime: null,
        quantumUsed: 0,
        readyEnterTime: Number(p.arrivalTime) || 0,
        queueSeq: Number(p.pid) || 0,
      }))
    );
    setClockTick(0);
    setGanttHistory([]);
    setEventLogs(['[T+0] Simulator reset to T=0. All processes returned to NEW state.']);
  };

  // Create new process via modal
  const handleCreateProcess = (newProc) => {
    setProcesses((prev) => [...prev, newProc]);
    setEventLogs((prev) => [`[T+${clockTick}] Created process ${newProc.name} (AT: ${newProc.arrivalTime})`, ...prev]);
    setSelectedPid(newProc.pid);
  };

  // Quick Add Process from inline table row
  const handleQuickAddProcess = (data) => {
    setProcesses((prev) => {
      const calcPid = prev.length > 0 ? Math.max(...prev.map((p) => Number(p.pid) || 0)) + 1 : 1;
      const totalBurst = data.totalBurst !== undefined ? data.totalBurst : 4;
      const ioDuration = data.ioDuration !== undefined ? data.ioDuration : 0;
      const ioAfter = ioDuration > 0 ? Math.max(1, Math.floor(totalBurst / 2)) : 0;

      const newProc = createProcess({
        pid: calcPid,
        name: data.name || `P${calcPid}`,
        priority: data.priority !== undefined ? data.priority : 1,
        arrivalTime: data.arrivalTime !== undefined ? data.arrivalTime : 0,
        totalBurst,
        memoryMB: data.memoryMB || 32,
        ioAfter,
        ioDuration,
      });

      setSelectedPid(calcPid);
      setEventLogs((logs) => [
        `[T+${clockTick}] Added ${newProc.name} (AT: ${newProc.arrivalTime}, BT: ${newProc.totalBurst}t, IO: ${newProc.ioDuration}t, Priority: ${newProc.priority})`,
        ...logs,
      ].slice(0, 50));

      return [...prev, newProc];
    });
  };

  // Clear all process rows
  const handleClearAll = () => {
    resetEngineSequence();
    setHistoryStack([]);
    setProcesses([]);
    setSelectedPid(null);
    setGanttHistory([]);
    setClockTick(0);
    setIsRunning(false);
    setEventLogs(['[T+0] Cleared all process rows. Use "+ Add Row" below or Import CSV to populate your problem.']);
  };

  // Direct CSV Import of entire process set
  const handleImportProcesses = (importedList) => {
    if (!importedList || importedList.length === 0) return;
    resetEngineSequence();
    setHistoryStack([]);
    setProcesses(importedList);
    setSelectedPid(importedList[0]?.pid || 1);
    setGanttHistory([]);
    setClockTick(0);
    setIsRunning(false);
    setEventLogs([
      `[T+0] Successfully imported ${importedList.length} processes from CSV.`,
    ]);
  };

  // Delete / Eliminate process from table
  const handleDeleteProcess = (pid) => {
    const target = processes.find((p) => p.pid === pid);
    const updated = processes.filter((p) => p.pid !== pid);
    setProcesses(updated);
    if (target) {
      setEventLogs((prev) => [`[T+${clockTick}] Deleted ${target.name} (PID: #${pid}) from list`, ...prev].slice(0, 50));
    }
    if (selectedPid === pid) {
      setSelectedPid(updated[0]?.pid || null);
    }
  };

  // Inline update process fields (Priority, AT, BT, IO Burst, Name) directly from table
  const handleUpdateProcess = (pid, field, rawValue) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid !== pid) return p;
        const updated = { ...p };

        if (field === 'name') {
          updated.name = rawValue;
        } else if (field === 'priority') {
          if (rawValue === '') {
            updated.priority = '';
          } else {
            const val = Math.max(0, parseInt(rawValue, 10) || 0);
            updated.priority = val;
          }
        } else if (field === 'arrivalTime') {
          if (rawValue === '') {
            updated.arrivalTime = '';
          } else {
            const val = Math.max(0, parseInt(rawValue, 10) || 0);
            updated.arrivalTime = val;
            if (updated.state === PROCESS_STATES.NEW) {
              updated.readyEnterTime = val;
            }
          }
        } else if (field === 'totalBurst') {
          if (rawValue === '') {
            updated.totalBurst = '';
          } else {
            const val = Math.max(1, parseInt(rawValue, 10) || 1);
            updated.totalBurst = val;
            if (!updated.executedBurst || updated.state === PROCESS_STATES.NEW) {
              updated.remainingBurst = val;
            } else {
              updated.remainingBurst = Math.max(0, val - (updated.executedBurst || 0));
            }
          }
        } else if (field === 'ioDuration') {
          if (rawValue === '') {
            updated.ioDuration = '';
          } else {
            const val = Math.max(0, parseInt(rawValue, 10) || 0);
            updated.ioDuration = val;
            updated.ioAfter = val > 0 ? Math.max(1, Math.floor(Number(updated.totalBurst || 4) / 2)) : 0;
            if (updated.state === PROCESS_STATES.WAITING) {
              updated.ioRemaining = val;
            }
          }
        }

        return updated;
      })
    );
  };

  // Ensure default valid values on blur if left blank
  const handleBlurProcess = (pid, field) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.pid !== pid) return p;
        const updated = { ...p };

        if (field === 'priority') {
          if (updated.priority === '' || isNaN(Number(updated.priority))) {
            updated.priority = 0;
          }
        } else if (field === 'arrivalTime') {
          if (updated.arrivalTime === '' || isNaN(Number(updated.arrivalTime))) {
            updated.arrivalTime = 0;
            if (updated.state === PROCESS_STATES.NEW) {
              updated.readyEnterTime = 0;
            }
          }
        } else if (field === 'totalBurst') {
          if (updated.totalBurst === '' || isNaN(Number(updated.totalBurst)) || Number(updated.totalBurst) < 1) {
            updated.totalBurst = 1;
            if (!updated.executedBurst || updated.state === PROCESS_STATES.NEW) {
              updated.remainingBurst = 1;
            } else {
              updated.remainingBurst = Math.max(0, 1 - (updated.executedBurst || 0));
            }
          }
        } else if (field === 'ioDuration') {
          if (updated.ioDuration === '' || isNaN(Number(updated.ioDuration))) {
            updated.ioDuration = 0;
            updated.ioAfter = 0;
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
      
      {/* 1. Header & Controls */}
      <Navbar
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

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
        
        {/* Main 5-State Lifecycle Diagram */}
        <LifecycleView
          processes={processes}
          selectedPid={selectedPid}
          onSelectPid={setSelectedPid}
        />

        {/* Simple Execution Gantt Chart */}
        <GanttChart
          ganttHistory={ganttHistory}
          currentTick={clockTick}
        />

        {/* 2-Column Split: Active Process Table + Selected PCB Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left: Active Processes Table (7 Cols) */}
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

          {/* Right: Focused PCB Inspector (5 Cols) */}
          <div className="lg:col-span-5">
            <PCBInspector process={selectedProcess} />
          </div>

        </div>

        {/* Bottom: State Transition Event Timeline */}
        <EventTimeline
          logs={eventLogs}
          onClearLogs={() => setEventLogs([])}
        />

      </main>

      {/* New Process Modal */}
      <NewProcessModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateProcess={handleCreateProcess}
        nextPid={nextPid}
        currentTick={clockTick}
      />

      {/* Final Performance Evaluation Report Modal */}
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
