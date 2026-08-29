import { PROCESS_STATES } from '../types/process.js';

/**
 * Tracks consecutive live OS process snapshots and maps them into
 * the formal 5-state process lifecycle machine:
 * NEW -> READY -> RUNNING -> WAITING -> TERMINATED
 */
export function processLiveSnapshot(incomingList, previousProcs = [], terminatedHistory = []) {
  if (!incomingList || incomingList.length === 0) {
    return { activeProcesses: previousProcs, terminatedProcesses: terminatedHistory };
  }

  const prevMap = new Map(previousProcs.map((p) => [p.pid, p]));
  const incomingPids = new Set(incomingList.map((p) => p.pid));

  // 1. Detect TERMINATED processes (present in previous snapshot, but vanished now)
  const newlyTerminated = [];
  for (const prev of previousProcs) {
    if (!incomingPids.has(prev.pid) && prev.state !== PROCESS_STATES.TERMINATED) {
      newlyTerminated.push({
        ...prev,
        state: PROCESS_STATES.TERMINATED,
        terminatedAt: Date.now(),
        reason: 'Process closed / exited normally',
      });
    }
  }

  // Combine with existing terminated history (keep max 15 most recent)
  const combinedTerminated = [...newlyTerminated, ...terminatedHistory].slice(0, 15);

  // 2. Find the top CPU consumer for this snapshot to designate as RUNNING
  const candidateScores = incomingList.map((item) => {
    const prev = prevMap.get(item.pid);
    const cpuDelta = prev ? Math.max(0, item.cpuSeconds - (prev.cpuSeconds || 0)) : (item.cpuSeconds > 0 ? 0.1 : 0);
    return { item, cpuDelta, isNew: !prev };
  });

  // Sort by CPU delta descending to find the most active CPU process
  candidateScores.sort((a, b) => b.cpuDelta - a.cpuDelta || b.item.cpuSeconds - a.item.cpuSeconds);
  const runningCandidatePid = candidateScores[0]?.item.pid;

  // 3. Map each incoming process into 5-state model
  const processedList = incomingList.map((p) => {
    const prev = prevMap.get(p.pid);
    const isNew = !prev;
    const isRunning = p.pid === runningCandidatePid && (p.cpuSeconds > 0 || candidateScores[0]?.cpuDelta > 0);

    let state;
    if (isNew) {
      state = PROCESS_STATES.NEW;
    } else if (isRunning) {
      state = PROCESS_STATES.RUNNING;
    } else if (!p.responding) {
      state = PROCESS_STATES.WAITING;
    } else {
      const isIdleWait = p.memoryMB > 100 && (candidateScores.find((c) => c.item.pid === p.pid)?.cpuDelta || 0) === 0;
      state = isIdleWait ? PROCESS_STATES.WAITING : PROCESS_STATES.READY;
    }

    const pidHex = p.pid.toString(16).padStart(4, '0').toUpperCase();
    const pc = `0x0040${pidHex}`;
    const sp = `0x7FFF${pidHex}`;
    const r0 = `0x${((p.pid * 13) % 65535).toString(16).padStart(4, '0').toUpperCase()}`;
    const r1 = `0x${((p.pid * 37) % 65535).toString(16).padStart(4, '0').toUpperCase()}`;

    return {
      pid: p.pid,
      name: p.name,
      state,
      memoryMB: p.memoryMB,
      cpuSeconds: p.cpuSeconds,
      responding: p.responding,
      priority: p.memoryMB > 500 ? 1 : p.name.includes('System') || p.name.includes('idle') ? 0 : 2,
      arrivalTime: prev ? prev.arrivalTime : 0,
      totalBurst: Math.max(1, Math.min(20, Math.round(p.cpuSeconds % 20) || 4)),
      remainingBurst: Math.max(1, Math.min(20, Math.round((p.cpuSeconds % 20) / 2) || 2)),
      waitingTime: prev ? prev.waitingTime + (state === PROCESS_STATES.READY ? 1 : 0) : 0,
      ioDuration: state === PROCESS_STATES.WAITING ? 2 : 0,
      cpuBurst1: Math.max(1, Math.min(10, Math.round(p.cpuSeconds % 10) || 3)),
      cpuBurst2: Math.max(0, Math.min(10, Math.round((p.cpuSeconds / 2) % 10) || 2)),
      burstPhase: state === PROCESS_STATES.RUNNING ? 'CPU1' : state === PROCESS_STATES.WAITING ? 'IO' : 'READY',
      pc,
      sp,
      r0,
      r1,
      isRealProcess: true,
      lastSeen: Date.now(),
    };
  });

  return {
    activeProcesses: processedList,
    terminatedProcesses: combinedTerminated,
  };
}
