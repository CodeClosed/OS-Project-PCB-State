import { PROCESS_STATES } from '../types/constants';

/**
 * Calculates real-time system performance and OS accounting statistics
 *
 * @param {Array} processes - All processes in the system
 * @param {number} clockTick - Current system clock tick
 * @param {number} totalContextSwitches - Total context switches triggered
 * @param {number} busyCpuTicks - Total ticks CPU was actively executing instructions
 * @returns {Object} System metrics summary
 */
export function calculateSystemMetrics(processes, clockTick, totalContextSwitches, busyCpuTicks) {
  const terminated = processes.filter((p) => p.state === PROCESS_STATES.TERMINATED);
  const active = processes.filter((p) => p.state !== PROCESS_STATES.TERMINATED);

  // Average Turnaround Time (ATAT) for completed processes
  const totalTAT = terminated.reduce((sum, p) => sum + (p.metrics.turnaroundTime || 0), 0);
  const avgTurnaroundTime = terminated.length > 0 ? (totalTAT / terminated.length).toFixed(2) : '0.00';

  // Average Waiting Time (AWT) across all admitted processes
  const admitted = processes.filter((p) => p.state !== PROCESS_STATES.NEW);
  const totalWT = admitted.reduce((sum, p) => sum + (p.metrics.waitingTime || 0), 0);
  const avgWaitingTime = admitted.length > 0 ? (totalWT / admitted.length).toFixed(2) : '0.00';

  // Average Response Time (ART)
  const responded = processes.filter((p) => p.metrics.responseTime !== null);
  const totalRT = responded.reduce((sum, p) => sum + p.metrics.responseTime, 0);
  const avgResponseTime = responded.length > 0 ? (totalRT / responded.length).toFixed(2) : '0.00';

  // CPU Utilization %
  const cpuUtilization = clockTick > 0 ? Math.min(100, Math.round((busyCpuTicks / clockTick) * 100)) : 0;

  // Throughput (completed processes per 10 ticks)
  const throughput = clockTick > 0 ? ((terminated.length / clockTick) * 10).toFixed(2) : '0.00';

  return {
    totalProcesses: processes.length,
    activeProcesses: active.length,
    terminatedCount: terminated.length,
    avgTurnaroundTime,
    avgWaitingTime,
    avgResponseTime,
    cpuUtilization,
    throughput,
    totalContextSwitches,
    clockTick,
  };
}
