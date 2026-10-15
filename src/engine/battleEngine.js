/**
 * Battle Arena Multi-Scheduler Simulation Engine
 * Runs multiple algorithms concurrently tick-by-tick on identical process workloads.
 */
import { executeStep } from './simulationEngine.js';
import { PROCESS_STATES } from '../types/process.js';

export const ARENA_ALGORITHMS = [
  { id: 'FCFS', shortName: 'FCFS', tag: 'Non-Preemptive', name: 'First-Come, First-Served', color: '#3b82f6' },
  { id: 'SJF', shortName: 'SJF', tag: 'Non-Preemptive', name: 'Shortest Job First', color: '#10b981' },
  { id: 'SRTF', shortName: 'SRTF', tag: 'Preemptive', name: 'Shortest Remaining Time First', color: '#06b6d4' },
  { id: 'RR', shortName: 'Round Robin', tag: 'Time-Sliced', name: 'Round Robin', color: '#f59e0b', quantum: 2 },
  { id: 'PRIORITY_PREEMPTIVE', shortName: 'Priority (Preempt)', tag: 'Preemptive', name: 'Priority (Preemptive)', color: '#8b5cf6' },
  { id: 'PRIORITY_NON_PREEMPTIVE', shortName: 'Priority (Non-Preempt)', tag: 'Non-Preemptive', name: 'Priority (Non-Preemptive)', color: '#ec4899' },
];

export function initializeArena(initialProcesses, selectedAlgorithms = ['FCFS', 'SJF', 'SRTF', 'RR'], timeQuantum = 2) {
  const arenaState = {};

  selectedAlgorithms.forEach((algoId) => {
    // Clone processes deeply for each algorithm track
    const clonedProcesses = initialProcesses.map((p) => ({
      ...p,
      state: PROCESS_STATES.NEW,
      remainingBurst: p.totalBurst || p.cpuBurst1 || 4,
      executedBurst: 0,
      completionTime: null,
      turnaroundTime: null,
      waitingTime: null,
      responseTime: null,
      firstScheduledTime: null,
      quantumUsed: 0,
      contextSwitches: 0,
    }));

    arenaState[algoId] = {
      algorithm: algoId,
      clockTick: 0,
      processes: clonedProcesses,
      ganttHistory: [],
      eventLogs: [`[T+0] Initialized track for ${algoId}`],
      isFinished: false,
      metrics: {
        avgTAT: 0,
        avgWT: 0,
        avgRT: 0,
        throughput: 0,
        cpuUtilization: 100,
        totalContextSwitches: 0,
        starvationIndex: 0,
      },
    };
  });

  return arenaState;
}

export function executeArenaStep(arenaState, timeQuantum = 2) {
  const nextState = {};
  let allFinished = true;

  Object.keys(arenaState).forEach((algoId) => {
    const track = arenaState[algoId];

    if (track.isFinished) {
      nextState[algoId] = track;
      return;
    }

    const result = executeStep(
      track.processes,
      track.clockTick,
      algoId,
      timeQuantum,
      track.ganttHistory
    );

    const isAllTerminated = result.processes.every((p) => p.state === PROCESS_STATES.TERMINATED);
    if (!isAllTerminated) allFinished = false;

    // Calculate live comparative metrics
    const terminated = result.processes.filter((p) => p.state === PROCESS_STATES.TERMINATED);
    const n = result.processes.length;

    let avgTAT = 0;
    let avgWT = 0;
    let avgRT = 0;
    let totalCS = 0;
    let maxWT = 0;
    let minWT = Infinity;

    result.processes.forEach((p) => {
      if (p.turnaroundTime !== null) avgTAT += p.turnaroundTime;
      if (p.waitingTime !== null) {
        avgWT += p.waitingTime;
        if (p.waitingTime > maxWT) maxWT = p.waitingTime;
        if (p.waitingTime < minWT) minWT = p.waitingTime;
      }
      if (p.responseTime !== null) avgRT += p.responseTime;
      if (p.contextSwitches) totalCS += p.contextSwitches;
    });

    const divisor = terminated.length > 0 ? terminated.length : n;
    avgTAT = parseFloat((avgTAT / divisor).toFixed(2));
    avgWT = parseFloat((avgWT / divisor).toFixed(2));
    avgRT = parseFloat((avgRT / divisor).toFixed(2));
    
    // Starvation Index = Spread of Waiting Times
    const starvationIndex = minWT === Infinity ? 0 : Math.max(0, maxWT - minWT);
    const throughput = result.clockTick > 0 ? parseFloat((terminated.length / result.clockTick).toFixed(3)) : 0;

    nextState[algoId] = {
      ...track,
      clockTick: result.clockTick,
      processes: result.processes,
      ganttHistory: result.ganttHistory,
      eventLogs: result.eventLogs.length ? [...result.eventLogs, ...track.eventLogs].slice(0, 30) : track.eventLogs,
      isFinished: isAllTerminated,
      metrics: {
        avgTAT,
        avgWT,
        avgRT,
        throughput,
        cpuUtilization: 100,
        totalContextSwitches: totalCS,
        starvationIndex,
        completedCount: terminated.length,
        totalCount: n,
      },
    };
  });

  return { arenaState: nextState, allFinished };
}
