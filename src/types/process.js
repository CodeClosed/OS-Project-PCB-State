// OS Process Lifecycle States
export const PROCESS_STATES = {
  NEW: 'NEW',
  READY: 'READY',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  TERMINATED: 'TERMINATED',
};

export const SCHEDULERS = [
  { id: 'FCFS', name: 'First-Come First-Served (FCFS)' },
  { id: 'RR', name: 'Round Robin (RR)' },
  { id: 'SJF', name: 'Shortest Job First (SJF - Non-Preemptive)' },
  { id: 'SRTF', name: 'Shortest Remaining Time First (SRTF - Preemptive)' },
  { id: 'PRIORITY_NP', name: 'Priority (Non-Preemptive)' },
  { id: 'PRIORITY_P', name: 'Priority (Preemptive)' },
];

export const STATE_COLORS = {
  NEW: {
    bg: 'bg-blue-50/80',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  READY: {
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  RUNNING: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  WAITING: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  TERMINATED: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
  },
};

export const PROCESS_PALETTES = [
  { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-300' },
  { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-300' },
  { bg: 'bg-rose-600', text: 'text-rose-700', border: 'border-rose-300' },
  { bg: 'bg-cyan-600', text: 'text-cyan-700', border: 'border-cyan-300' },
];

/**
 * Creates a structured process PCB
 */
export function createProcess({
  pid,
  name,
  priority = 1,
  arrivalTime = 0,
  cpuBurst1,
  totalBurst,
  cpuBurst2 = 0,
  memoryMB = 32,
  ioAfter = 0,
  ioDuration = 0,
}) {
  const paletteIndex = (pid - 1) % PROCESS_PALETTES.length;
  const palette = PROCESS_PALETTES[paletteIndex >= 0 ? paletteIndex : 0];
  const basePC = 0x00401000 + pid * 0x1000;

  const b1 = cpuBurst1 !== undefined ? Math.max(1, Number(cpuBurst1)) : (totalBurst !== undefined ? Math.max(1, Number(totalBurst)) : 4);
  const b2 = cpuBurst2 !== undefined && !isNaN(Number(cpuBurst2)) ? Math.max(0, Number(cpuBurst2)) : 0;
  const combinedTotal = b1 + b2;
  const ioDur = ioDuration !== undefined && !isNaN(Number(ioDuration)) ? Math.max(0, Number(ioDuration)) : 0;

  return {
    pid: Number(pid),
    name: name || `P${pid}`,
    state: PROCESS_STATES.NEW,
    priority: Number(priority),
    palette,

    // Timing & Bursts
    arrivalTime: Number(arrivalTime),
    cpuBurst1: b1,
    cpuBurst2: b2,
    totalBurst: combinedTotal,
    remainingBurst: combinedTotal,
    executedBurst: 0,
    executedBurst1: 0,
    executedBurst2: 0,
    burstPhase: 'CPU1', // 'CPU1' | 'IO' | 'CPU2' | 'DONE'
    quantumUsed: 0,
    readyEnterTime: Number(arrivalTime),
    queueSeq: Number(pid),

    // I/O config
    ioAfter: Number(ioAfter) || (ioDur > 0 ? b1 : 0),
    ioDuration: ioDur,
    ioRemaining: 0,

    // Hardware PCB Registers
    pc: `0x${basePC.toString(16).toUpperCase()}`,
    r0: `0x${(pid * 12).toString(16).padStart(4, '0').toUpperCase()}`,
    r1: `0x${(pid * 24).toString(16).padStart(4, '0').toUpperCase()}`,
    sp: `0x${(basePC + memoryMB * 1024).toString(16).toUpperCase()}`,

    // Memory
    memoryMB: Number(memoryMB),

    // Final OS Performance Metrics
    startTime: null,
    completionTime: null,
    turnaroundTime: null,
    waitingTime: 0,
    responseTime: null,
  };
}

export const INITIAL_PROCESSES = [
  createProcess({ pid: 1, name: 'P1', priority: 1, arrivalTime: 0, cpuBurst1: 4, ioDuration: 2, cpuBurst2: 3, memoryMB: 64 }),
  createProcess({ pid: 2, name: 'P2', priority: 2, arrivalTime: 1, cpuBurst1: 3, ioDuration: 0, cpuBurst2: 0, memoryMB: 32 }),
  createProcess({ pid: 3, name: 'P3', priority: 1, arrivalTime: 2, cpuBurst1: 2, ioDuration: 1, cpuBurst2: 2, memoryMB: 48 }),
  createProcess({ pid: 4, name: 'P4', priority: 3, arrivalTime: 3, cpuBurst1: 4, ioDuration: 0, cpuBurst2: 0, memoryMB: 32 }),
];
