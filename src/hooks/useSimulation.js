import { useState, useEffect, useRef, useCallback } from 'react';
import { PRESETS } from '../engine/presets';
import { stepSimulation, manualTransitionProcess, createLogEntry } from '../engine/simulationEngine';
import { calculateSystemMetrics } from '../engine/metrics';
import { PROCESS_STATES, CPU_STATES } from '../types/constants';

export function useSimulation(initialPresetId = 'multitasking') {
  const defaultPreset = PRESETS.find((p) => p.id === initialPresetId) || PRESETS[0];

  // Core Simulation State
  const [processes, setProcesses] = useState(() => defaultPreset.processes.map((p) => ({ ...p })));
  const [clockTick, setClockTick] = useState(0);
  const [algorithm, setAlgorithm] = useState(defaultPreset.algorithm);
  const [timeQuantum, setTimeQuantum] = useState(defaultPreset.timeQuantum);
  const [contextSwitchCount, setContextSwitchCount] = useState(0);
  const [busyCpuTicks, setBusyCpuTicks] = useState(0);
  const [cpuState, setCpuState] = useState(CPU_STATES.IDLE);
  const [ganttHistory, setGanttHistory] = useState([]);
  const [eventLogs, setEventLogs] = useState([
    createLogEntry(0, 'ADMIT', 'Kernel initialized with standard multitasking process table.')
  ]);

  // Controls State
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5, 1, 2, 4
  const [simulationMode, setSimulationMode] = useState('auto'); // 'auto' | 'manual'
  const [selectedPresetId, setSelectedPresetId] = useState(defaultPreset.id);
  const [selectedProcessId, setSelectedProcessId] = useState(defaultPreset.processes[0]?.identity.pid || 1);

  const timerRef = useRef(null);

  // Single Clock Step
  const step = useCallback(() => {
    setProcesses((prevProcesses) => {
      const nextState = stepSimulation({
        processes: prevProcesses,
        clockTick,
        algorithm,
        timeQuantum,
        contextSwitchCount,
        busyCpuTicks,
        cpuState,
        ganttHistory,
        eventLogs,
      });

      setClockTick(nextState.clockTick);
      setContextSwitchCount(nextState.contextSwitchCount);
      setBusyCpuTicks(nextState.busyCpuTicks);
      setCpuState(nextState.cpuState);
      setGanttHistory(nextState.ganttHistory);
      setEventLogs(nextState.eventLogs);

      // Auto-pause when all processes terminate
      const allDone = nextState.processes.every((p) => p.state === PROCESS_STATES.TERMINATED);
      if (allDone && isRunning) {
        setIsRunning(false);
      }

      return nextState.processes;
    });
  }, [clockTick, algorithm, timeQuantum, contextSwitchCount, busyCpuTicks, cpuState, ganttHistory, eventLogs, isRunning]);

  // Automatic Clock Loop
  useEffect(() => {
    if (isRunning && simulationMode === 'auto') {
      const intervalMs = Math.max(200, Math.floor(1000 / speed));
      timerRef.current = setInterval(() => {
        step();
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, speed, simulationMode, step]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  // Manual State Transition
  const manualTransition = useCallback(
    (pid, targetState, reason) => {
      const nextState = manualTransitionProcess(
        {
          processes,
          clockTick,
          eventLogs,
          contextSwitchCount,
          busyCpuTicks,
        },
        pid,
        targetState,
        reason
      );

      if (nextState.error) {
        alert(nextState.error);
        return;
      }

      setProcesses(nextState.processes);
      setContextSwitchCount(nextState.contextSwitchCount);
      setCpuState(nextState.cpuState);
      setEventLogs(nextState.eventLogs);
    },
    [processes, clockTick, eventLogs, contextSwitchCount, busyCpuTicks]
  );

  // Reset Simulation
  const reset = useCallback(() => {
    setIsRunning(false);
    const preset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];
    setProcesses(preset.processes.map((p) => ({ ...p })));
    setClockTick(0);
    setContextSwitchCount(0);
    setBusyCpuTicks(0);
    setCpuState(CPU_STATES.IDLE);
    setGanttHistory([]);
    setEventLogs([createLogEntry(0, 'ADMIT', `Simulator reset to preset: ${preset.name}`)]);
    setSelectedProcessId(preset.processes[0]?.identity.pid || 1);
  }, [selectedPresetId]);

  // Load Preset
  const selectPreset = useCallback((presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setIsRunning(false);
    setSelectedPresetId(preset.id);
    setAlgorithm(preset.algorithm);
    setTimeQuantum(preset.timeQuantum);
    setProcesses(preset.processes.map((p) => ({ ...p })));
    setClockTick(0);
    setContextSwitchCount(0);
    setBusyCpuTicks(0);
    setCpuState(CPU_STATES.IDLE);
    setGanttHistory([]);
    setEventLogs([createLogEntry(0, 'ADMIT', `Loaded preset scenario: ${preset.name}`)]);
    setSelectedProcessId(preset.processes[0]?.identity.pid || 1);
  }, []);

  // Add Process
  const createProcess = useCallback(
    (newPcb) => {
      setProcesses((prev) => [...prev, newPcb]);
      setEventLogs((prev) => [
        createLogEntry(
          clockTick,
          'ADMIT',
          `Created process ${newPcb.identity.name} (PID: ${newPcb.identity.pid}, Arrival: ${newPcb.identity.arrivalTime})`,
          newPcb.identity.pid
        ),
        ...prev,
      ]);
      setSelectedProcessId(newPcb.identity.pid);
    },
    [clockTick]
  );

  // Kill Process
  const killProcess = useCallback(
    (pid) => {
      manualTransition(pid, PROCESS_STATES.TERMINATED, 'Process forcefully killed by user');
    },
    [manualTransition]
  );

  // Clear Event Logs
  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Calculate live system metrics
  const metrics = calculateSystemMetrics(processes, clockTick, contextSwitchCount, busyCpuTicks);

  const selectedProcess = processes.find((p) => p.identity.pid === selectedProcessId) || null;
  const nextPid = processes.length > 0 ? Math.max(...processes.map((p) => p.identity.pid)) + 1 : 1;

  return {
    // State
    processes,
    clockTick,
    algorithm,
    timeQuantum,
    contextSwitchCount,
    cpuState,
    ganttHistory,
    eventLogs,
    metrics,
    isRunning,
    speed,
    simulationMode,
    selectedPresetId,
    selectedProcessId,
    selectedProcess,
    nextPid,

    // Actions
    step,
    togglePlay,
    reset,
    setSpeed,
    setAlgorithm,
    setTimeQuantum,
    setSimulationMode,
    selectPreset,
    manualTransition,
    createProcess,
    killProcess,
    clearLogs,
    setSelectedProcessId,
  };
}
