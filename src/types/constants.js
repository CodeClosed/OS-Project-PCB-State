// OS Process Lifecycle States (Single Source of Truth)
export const PROCESS_STATES = {
  NEW: 'NEW',
  READY: 'READY',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  TERMINATED: 'TERMINATED',
};

// CPU Hardware & Kernel States
export const CPU_STATES = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  CONTEXT_SWITCHING: 'CONTEXT_SWITCHING',
};

// Scheduling Algorithms
export const SCHEDULING_ALGORITHMS = {
  FCFS: {
    id: 'FCFS',
    name: 'First-Come First-Served (FCFS)',
    type: 'Non-Preemptive',
    description: 'Processes executed in arrival/queue order without preemption',
  },
  RR: {
    id: 'RR',
    name: 'Round Robin (RR)',
    type: 'Preemptive',
    description: 'Time-sliced execution with fixed Quantum preemption',
  },
  SJF: {
    id: 'SJF',
    name: 'Shortest Job First (Non-Preemptive)',
    type: 'Non-Preemptive',
    description: 'Dispatches process with smallest initial CPU burst',
  },
  SRTF: {
    id: 'SRTF',
    name: 'Shortest Remaining Time First (SRTF)',
    type: 'Preemptive',
    description: 'Preempts currently running process if a shorter job arrives',
  },
  PRIORITY_NON_PREEMPTIVE: {
    id: 'PRIORITY_NON_PREEMPTIVE',
    name: 'Priority (Non-Preemptive)',
    type: 'Non-Preemptive',
    description: 'Executes highest priority (lowest level number) to completion',
  },
  PRIORITY_PREEMPTIVE: {
    id: 'PRIORITY_PREEMPTIVE',
    name: 'Priority (Preemptive)',
    type: 'Preemptive',
    description: 'Preempts running process if a higher-priority task arrives',
  },
};

// Palette Colors for Distinct Process Identification
export const PROCESS_PALETTES = [
  { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-400', hex: '#3B82F6', light: 'bg-blue-500/20 text-blue-300' },
  { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-400', hex: '#10B981', light: 'bg-emerald-500/20 text-emerald-300' },
  { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-400', hex: '#8B5CF6', light: 'bg-purple-500/20 text-purple-300' },
  { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-400', hex: '#F59E0B', light: 'bg-amber-500/20 text-amber-300' },
  { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-400', hex: '#EF4444', light: 'bg-rose-500/20 text-rose-300' },
  { bg: 'bg-cyan-600', border: 'border-cyan-400', text: 'text-cyan-400', hex: '#06B6D4', light: 'bg-cyan-500/20 text-cyan-300' },
  { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-400', hex: '#6366F1', light: 'bg-indigo-500/20 text-indigo-300' },
  { bg: 'bg-fuchsia-600', border: 'border-fuchsia-400', text: 'text-fuchsia-400', hex: '#D946EF', light: 'bg-fuchsia-500/20 text-fuchsia-300' },
];

export const STATE_CONFIG = {
  [PROCESS_STATES.NEW]: {
    label: 'NEW',
    color: 'border-blue-500 text-blue-400 bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.4)',
    description: 'Process created and awaiting admission by Long-term Scheduler.',
  },
  [PROCESS_STATES.READY]: {
    label: 'READY',
    color: 'border-cyan-500 text-cyan-400 bg-cyan-500/10',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.4)',
    description: 'Process allocated in main memory, ready for CPU dispatch.',
  },
  [PROCESS_STATES.RUNNING]: {
    label: 'RUNNING',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.5)',
    description: 'Process assigned to CPU core and executing instructions.',
  },
  [PROCESS_STATES.WAITING]: {
    label: 'WAITING',
    color: 'border-amber-500 text-amber-400 bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.4)',
    description: 'Process blocked waiting for an I/O device or system event.',
  },
  [PROCESS_STATES.TERMINATED]: {
    label: 'TERMINATED',
    color: 'border-rose-500 text-rose-400 bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    glow: 'rgba(239, 68, 68, 0.4)',
    description: 'Process execution complete. PCB deallocated from kernel.',
  },
};
