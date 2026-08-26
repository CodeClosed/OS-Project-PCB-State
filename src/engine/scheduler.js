import { SCHEDULING_ALGORITHMS } from '../types/constants';

/**
 * Standard Scheduler Interface:
 * Selects the next process from the ready queue based on the chosen algorithm.
 *
 * @param {Array} readyQueue - List of processes in READY state
 * @param {string} algorithm - Algorithm ID (FCFS, RR, SJF, SRTF, PRIORITY_PREEMPTIVE, etc.)
 * @param {Object|null} currentRunning - Current process on CPU (if needed for comparison)
 * @param {Object} config - Extra settings (e.g. timeQuantum)
 * @returns {Object|null} Selected PCB to dispatch
 */
export function selectNextProcess(readyQueue, algorithm, currentRunning = null, config = {}) {
  if (!readyQueue || readyQueue.length === 0) {
    return null;
  }

  const pool = [...readyQueue];

  switch (algorithm) {
    case SCHEDULING_ALGORITHMS.FCFS.id:
    case SCHEDULING_ALGORITHMS.RR.id:
      // FIFO: Earliest arrival time or queue insertion order
      pool.sort((a, b) => {
        if (a.identity.arrivalTime !== b.identity.arrivalTime) {
          return a.identity.arrivalTime - b.identity.arrivalTime;
        }
        return a.identity.pid - b.identity.pid;
      });
      return pool[0];

    case SCHEDULING_ALGORITHMS.SJF.id:
      // Shortest Job First (Non-preemptive based on totalBurst)
      pool.sort((a, b) => {
        if (a.cpu.totalBurst !== b.cpu.totalBurst) {
          return a.cpu.totalBurst - b.cpu.totalBurst;
        }
        return a.identity.arrivalTime - b.identity.arrivalTime;
      });
      return pool[0];

    case SCHEDULING_ALGORITHMS.SRTF.id:
      // Shortest Remaining Time First (Preemptive based on remainingBurst)
      pool.sort((a, b) => {
        if (a.cpu.remainingBurst !== b.cpu.remainingBurst) {
          return a.cpu.remainingBurst - b.cpu.remainingBurst;
        }
        return a.identity.arrivalTime - b.identity.arrivalTime;
      });
      return pool[0];

    case SCHEDULING_ALGORITHMS.PRIORITY_NON_PREEMPTIVE.id:
    case SCHEDULING_ALGORITHMS.PRIORITY_PREEMPTIVE.id:
      // Priority: Lower number = higher priority (1 is highest, 5 is lowest)
      pool.sort((a, b) => {
        if (a.identity.priority !== b.identity.priority) {
          return a.identity.priority - b.identity.priority;
        }
        return a.identity.arrivalTime - b.identity.arrivalTime;
      });
      return pool[0];

    default:
      return pool[0];
  }
}

/**
 * Checks if the currently running process must yield the CPU
 *
 * @param {Object} runningProcess - Currently running PCB
 * @param {Array} readyQueue - List of processes in READY state
 * @param {string} algorithm - Active scheduling algorithm
 * @param {Object} config - { timeQuantum: number }
 * @returns {{ shouldPreempt: boolean, reason: string|null }}
 */
export function checkPreemption(runningProcess, readyQueue, algorithm, config = { timeQuantum: 2 }) {
  if (!runningProcess) {
    return { shouldPreempt: false, reason: null };
  }

  // 1. Round Robin: Time quantum expired
  if (algorithm === SCHEDULING_ALGORITHMS.RR.id) {
    if (runningProcess.cpu.quantumUsed >= config.timeQuantum) {
      return {
        shouldPreempt: true,
        reason: `Time quantum expired (${config.timeQuantum} ticks)`,
      };
    }
  }

  // If ready queue is empty, no one to preempt for
  if (!readyQueue || readyQueue.length === 0) {
    return { shouldPreempt: false, reason: null };
  }

  // 2. Preemptive Priority: Higher priority task in ready queue
  if (algorithm === SCHEDULING_ALGORITHMS.PRIORITY_PREEMPTIVE.id) {
    const highestReady = [...readyQueue].sort((a, b) => a.identity.priority - b.identity.priority)[0];
    if (highestReady && highestReady.identity.priority < runningProcess.identity.priority) {
      return {
        shouldPreempt: true,
        reason: `Preempted by higher-priority task ${highestReady.identity.name} (Priority ${highestReady.identity.priority} vs ${runningProcess.identity.priority})`,
      };
    }
  }

  // 3. Shortest Remaining Time First (SRTF)
  if (algorithm === SCHEDULING_ALGORITHMS.SRTF.id) {
    const shortestReady = [...readyQueue].sort((a, b) => a.cpu.remainingBurst - b.cpu.remainingBurst)[0];
    if (shortestReady && shortestReady.cpu.remainingBurst < runningProcess.cpu.remainingBurst) {
      return {
        shouldPreempt: true,
        reason: `Preempted by shorter remaining job ${shortestReady.identity.name} (${shortestReady.cpu.remainingBurst}t left vs ${runningProcess.cpu.remainingBurst}t)`,
      };
    }
  }

  return { shouldPreempt: false, reason: null };
}
