import { PROCESS_STATES } from '../types/process';

/**
 * Valid OS State Transitions
 */
export const VALID_TRANSITIONS = {
  [PROCESS_STATES.NEW]: [PROCESS_STATES.READY],
  [PROCESS_STATES.READY]: [PROCESS_STATES.RUNNING],
  [PROCESS_STATES.RUNNING]: [PROCESS_STATES.READY, PROCESS_STATES.WAITING, PROCESS_STATES.TERMINATED],
  [PROCESS_STATES.WAITING]: [PROCESS_STATES.READY],
  [PROCESS_STATES.TERMINATED]: [],
};

export function isValidTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

// Global monotonic sequence counter to maintain strict queue insertion order
let globalSequence = 1000;

export function resetEngineSequence() {
  globalSequence = 1000;
}

/**
 * Selects the next process from the ready queue based on the active scheduler
 * If priority, arrival time, or bursts are equal, tie-breaker always picks lowest PID (ascending)
 */
function selectCandidate(readyList, algorithm) {
  if (!readyList || readyList.length === 0) return null;
  const pool = [...readyList];

  switch (algorithm) {
    case 'RR':
      // True FIFO Ready Queue: Earliest readyEnterTime, then insertion sequence, then arrival time, then PID ascending
      return pool.sort(
        (a, b) =>
          (a.readyEnterTime ?? 0) - (b.readyEnterTime ?? 0) ||
          (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
          a.arrivalTime - b.arrivalTime ||
          a.pid - b.pid
      )[0];

    case 'FCFS':
      // FIFO Arrival: Earliest Arrival Time, then queue sequence, then PID ascending
      return pool.sort(
        (a, b) =>
          a.arrivalTime - b.arrivalTime ||
          (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
          a.pid - b.pid
      )[0];

    case 'SJF':
      // Shortest Job First (Total burst), then arrival time, then sequence, then PID ascending (Priority is ignored)
      return pool.sort(
        (a, b) =>
          a.totalBurst - b.totalBurst ||
          a.arrivalTime - b.arrivalTime ||
          (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
          a.pid - b.pid
      )[0];

    case 'SRTF':
      // Shortest Remaining Time First (Remaining burst), then arrival time, then sequence, then PID ascending (Priority is ignored)
      return pool.sort(
        (a, b) =>
          a.remainingBurst - b.remainingBurst ||
          a.arrivalTime - b.arrivalTime ||
          (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
          a.pid - b.pid
      )[0];

    case 'PRIORITY_NP':
    case 'PRIORITY_P':
      // Priority: Lower number = higher priority (0 is top priority), then arrival time, then PID ascending
      return pool.sort(
        (a, b) =>
          a.priority - b.priority ||
          a.arrivalTime - b.arrivalTime ||
          (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
          a.pid - b.pid
      )[0];

    default:
      return pool.sort((a, b) => a.pid - b.pid)[0];
  }
}

/**
 * Checks if current running process must be preempted at time boundary T
 */
function checkPreemption(running, readyList, algorithm, timeQuantum) {
  if (!running) return { shouldPreempt: false };

  // 1. Round Robin: Quantum expired and other processes are waiting in READY queue
  if (algorithm === 'RR') {
    if (running.quantumUsed >= timeQuantum) {
      if (readyList && readyList.length > 0) {
        return { shouldPreempt: true, reason: `Time Quantum (${timeQuantum}t) expired` };
      } else {
        // If ready queue is empty, process continues running with reset quantum
        return { shouldPreempt: false, resetQuantum: true };
      }
    }
  }

  if (!readyList || readyList.length === 0) return { shouldPreempt: false };

  // 2. Preemptive Priority
  if (algorithm === 'PRIORITY_P') {
    const highestReady = [...readyList].sort(
      (a, b) =>
        a.priority - b.priority ||
        a.arrivalTime - b.arrivalTime ||
        (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
        a.pid - b.pid
    )[0];
    if (highestReady && highestReady.priority < running.priority) {
      return {
        shouldPreempt: true,
        reason: `Preempted by higher priority ${highestReady.name} (Lvl ${highestReady.priority} vs ${running.priority})`,
      };
    }
  }

  // 3. SRTF (Shortest Remaining Time First - Preemptive by remaining burst)
  if (algorithm === 'SRTF') {
    const shortestReady = [...readyList].sort(
      (a, b) =>
        a.remainingBurst - b.remainingBurst ||
        a.arrivalTime - b.arrivalTime ||
        (a.queueSeq ?? 0) - (b.queueSeq ?? 0) ||
        a.pid - b.pid
    )[0];
    if (shortestReady && shortestReady.remainingBurst < running.remainingBurst) {
      return {
        shouldPreempt: true,
        reason: `Preempted by shorter job ${shortestReady.name} (${shortestReady.remainingBurst}t left vs ${running.remainingBurst}t)`,
      };
    }
  }

  return { shouldPreempt: false };
}

/**
 * Executes a single discrete simulation step for interval [T, T+1]
 */
export function executeStep(processes, clockTick, algorithm, timeQuantum = 2, ganttHistory = []) {
  const currentTick = clockTick; // Time boundary at start of tick
  const nextTick = clockTick + 1; // Time boundary at end of tick
  let newProcesses = processes.map((p) => ({ ...p }));
  let newGantt = [...ganttHistory];
  let eventLogs = [];

  // 1. Admit NEW processes whose arrival time is <= currentTick (sorted by AT asc, then PID asc)
  const procsToAdmit = newProcesses
    .filter((p) => p.state === PROCESS_STATES.NEW && p.arrivalTime <= currentTick)
    .sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid - b.pid);

  const admitMap = new Map();
  for (const proc of procsToAdmit) {
    globalSequence++;
    admitMap.set(proc.pid, globalSequence);
    eventLogs.push(`[T+${currentTick}] ${proc.name} arrived (AT: ${proc.arrivalTime}) ➔ Admitted to READY queue`);
  }

  newProcesses = newProcesses.map((p) => {
    if (admitMap.has(p.pid)) {
      return {
        ...p,
        state: PROCESS_STATES.READY,
        readyEnterTime: currentTick,
        queueSeq: admitMap.get(p.pid),
      };
    }
    return p;
  });

  // 2. Check currently RUNNING process for preemption at boundary T
  let runningIndex = newProcesses.findIndex((p) => p.state === PROCESS_STATES.RUNNING);
  let readyList = newProcesses.filter((p) => p.state === PROCESS_STATES.READY);

  if (runningIndex !== -1) {
    let running = newProcesses[runningIndex];
    const preemption = checkPreemption(running, readyList, algorithm, timeQuantum);
    if (preemption.shouldPreempt) {
      eventLogs.push(`[T+${currentTick}] ${running.name} ${preemption.reason} ➔ Preempted to tail of READY queue`);
      globalSequence++;
      newProcesses[runningIndex] = {
        ...running,
        state: PROCESS_STATES.READY,
        quantumUsed: 0,
        readyEnterTime: currentTick,
        queueSeq: globalSequence,
      };
      runningIndex = -1;
    } else if (preemption.resetQuantum) {
      newProcesses[runningIndex] = {
        ...running,
        quantumUsed: 0,
      };
    }
  }

  // 3. If CPU is idle at time T, dispatch candidate from READY queue
  readyList = newProcesses.filter((p) => p.state === PROCESS_STATES.READY);
  if (runningIndex === -1 && readyList.length > 0) {
    const candidate = selectCandidate(readyList, algorithm);
    if (candidate) {
      runningIndex = newProcesses.findIndex((p) => p.pid === candidate.pid);
      const isFirstRun = newProcesses[runningIndex].startTime === null;
      const startTime = isFirstRun ? currentTick : newProcesses[runningIndex].startTime;
      const responseTime = isFirstRun ? currentTick - newProcesses[runningIndex].arrivalTime : newProcesses[runningIndex].responseTime;

      newProcesses[runningIndex] = {
        ...newProcesses[runningIndex],
        state: PROCESS_STATES.RUNNING,
        startTime,
        responseTime: Math.max(0, responseTime),
        quantumUsed: 0,
      };
      eventLogs.push(`[T+${currentTick}] Dispatcher allocated CPU to ${candidate.name} [${algorithm}]`);
    }
  }

  // 4. Increment wait time for all processes resting in READY queue during interval [T, T+1]
  newProcesses = newProcesses.map((p, idx) => {
    if (p.state === PROCESS_STATES.READY && idx !== runningIndex) {
      return { ...p, waitingTime: p.waitingTime + 1 };
    }
    return p;
  });

  // 5. Progress all processes in WAITING state during interval [T, T+1]
  newProcesses = newProcesses.map((p) => {
    if (p.state === PROCESS_STATES.WAITING) {
      const remainingIO = (p.ioRemaining || p.ioDuration || 1) - 1;
      if (remainingIO <= 0) {
        globalSequence++;
        eventLogs.push(`[T+${nextTick}] ${p.name} completed I/O operation ➔ Re-admitted to READY queue`);
        return {
          ...p,
          state: PROCESS_STATES.READY,
          ioRemaining: 0,
          readyEnterTime: nextTick,
          queueSeq: globalSequence,
        };
      }
      return {
        ...p,
        ioRemaining: remainingIO,
      };
    }
    return p;
  });

  // 6. Execute 1 CPU cycle on RUNNING process during interval [T, T+1]
  if (runningIndex !== -1) {
    let running = newProcesses[runningIndex];
    const newRemaining = running.remainingBurst - 1;
    const newExecuted = running.executedBurst + 1;
    const newQuantum = running.quantumUsed + 1;

    // Advance Program Counter & Registers
    const currentPC = parseInt(running.pc, 16);
    const nextPC = `0x${(currentPC + 4).toString(16).toUpperCase()}`;
    const nextR0 = `0x${Math.floor(Math.random() * 65535).toString(16).padStart(4, '0').toUpperCase()}`;

    // Record Gantt block for interval [currentTick, nextTick]
    newGantt.push({
      start: currentTick,
      end: nextTick,
      pid: running.pid,
      name: running.name,
      palette: running.palette,
    });

    if (newRemaining <= 0) {
      // Process complete at nextTick
      const completionTime = nextTick;
      const turnaroundTime = completionTime - running.arrivalTime;
      const waitingTime = turnaroundTime - running.totalBurst;

      eventLogs.push(
        `[T+${nextTick}] ${running.name} completed (CT: ${completionTime}, TAT: ${turnaroundTime}t, WT: ${waitingTime}t) ➔ TERMINATED`
      );

      newProcesses[runningIndex] = {
        ...running,
        state: PROCESS_STATES.TERMINATED,
        remainingBurst: 0,
        executedBurst: newExecuted,
        completionTime,
        turnaroundTime: Math.max(0, turnaroundTime),
        waitingTime: Math.max(0, waitingTime),
        pc: nextPC,
        r0: nextR0,
      };
    } else if (running.ioAfter > 0 && newExecuted >= running.ioAfter && running.ioDuration > 0) {
      // Process requests I/O operation at nextTick ➔ moves to WAITING
      eventLogs.push(
        `[T+${nextTick}] ${running.name} executed ${newExecuted}t CPU burst, requested I/O (${running.ioDuration}t) ➔ WAITING`
      );

      newProcesses[runningIndex] = {
        ...running,
        state: PROCESS_STATES.WAITING,
        remainingBurst: newRemaining,
        executedBurst: newExecuted,
        ioRemaining: running.ioDuration,
        ioAfter: 0, // Reset I/O trigger after firing
        quantumUsed: 0,
        pc: nextPC,
        r0: nextR0,
      };
    } else {
      newProcesses[runningIndex] = {
        ...running,
        remainingBurst: newRemaining,
        executedBurst: newExecuted,
        quantumUsed: newQuantum,
        pc: nextPC,
        r0: nextR0,
      };
    }
  } else {
    // CPU was IDLE during interval [currentTick, nextTick]
    newGantt.push({
      start: currentTick,
      end: nextTick,
      pid: null,
      name: 'IDLE',
      palette: { bg: 'bg-slate-200', text: 'text-slate-500', border: 'border-slate-300' },
    });
  }

  // 6. After interval [T, T+1], admit any new process whose arrivalTime <= nextTick (sorted by AT asc, then PID asc)
  const nextProcsToAdmit = newProcesses
    .filter((p) => p.state === PROCESS_STATES.NEW && p.arrivalTime <= nextTick)
    .sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid - b.pid);

  const nextAdmitMap = new Map();
  for (const proc of nextProcsToAdmit) {
    globalSequence++;
    nextAdmitMap.set(proc.pid, globalSequence);
    eventLogs.push(`[T+${nextTick}] ${proc.name} arrived (AT: ${proc.arrivalTime}) ➔ Admitted to READY queue`);
  }

  newProcesses = newProcesses.map((p) => {
    if (nextAdmitMap.has(p.pid)) {
      return {
        ...p,
        state: PROCESS_STATES.READY,
        readyEnterTime: nextTick,
        queueSeq: nextAdmitMap.get(p.pid),
      };
    }
    return p;
  });

  return {
    processes: newProcesses,
    clockTick: nextTick,
    ganttHistory: newGantt,
    eventLogs,
  };
}

/**
 * Manually changes a process's state
 */
export function manualTransition(processes, pid, targetState, clockTick) {
  const pIndex = processes.findIndex((p) => p.pid === pid);
  if (pIndex === -1) return { processes, event: null };

  const proc = processes[pIndex];
  if (!isValidTransition(proc.state, targetState)) {
    return { processes, error: `Invalid transition: Cannot move from ${proc.state} to ${targetState}` };
  }

  let updated = [...processes];

  if (targetState === PROCESS_STATES.RUNNING) {
    updated = updated.map((p) =>
      p.state === PROCESS_STATES.RUNNING && p.pid !== pid
        ? { ...p, state: PROCESS_STATES.READY, quantumUsed: 0 }
        : p
    );
  }

  const isFirstRun = proc.startTime === null && targetState === PROCESS_STATES.RUNNING;
  const startTime = isFirstRun ? clockTick : proc.startTime;
  const responseTime = isFirstRun ? clockTick - proc.arrivalTime : proc.responseTime;

  const newProc = {
    ...proc,
    state: targetState,
    startTime,
    responseTime: Math.max(0, responseTime),
    quantumUsed: 0,
  };

  if (targetState === PROCESS_STATES.TERMINATED) {
    newProc.completionTime = clockTick;
    newProc.turnaroundTime = Math.max(0, clockTick - proc.arrivalTime);
    newProc.waitingTime = Math.max(0, newProc.turnaroundTime - proc.totalBurst);
  }

  updated[pIndex] = newProc;

  return {
    processes: updated,
    event: `[T+${clockTick}] Manual: ${proc.name} moved ${proc.state} ➔ ${targetState}`,
    error: null,
  };
}
