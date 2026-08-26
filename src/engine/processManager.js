import { PROCESS_STATES } from '../types/constants';
import { clonePCB } from '../types/process';

/**
 * Admits a NEW process into the READY state
 */
export function admitProcess(pcb, tick) {
  const next = clonePCB(pcb);
  const fromState = next.state;
  next.state = PROCESS_STATES.READY;
  next.history.push({
    timestamp: tick,
    fromState,
    toState: PROCESS_STATES.READY,
    reason: 'Long-term scheduler admitted process into main memory',
  });
  return next;
}

/**
 * Dispatches a READY process to RUNNING state on CPU
 */
export function dispatchProcess(pcb, tick) {
  const next = clonePCB(pcb);
  const fromState = next.state;
  next.state = PROCESS_STATES.RUNNING;
  next.cpu.quantumUsed = 0;

  if (next.metrics.firstRunAt === null) {
    next.metrics.firstRunAt = tick;
    next.metrics.responseTime = tick - next.identity.arrivalTime;
  }

  next.history.push({
    timestamp: tick,
    fromState,
    toState: PROCESS_STATES.RUNNING,
    reason: 'Short-term scheduler dispatched process to CPU Core',
  });
  return next;
}

/**
 * Simulates 1 clock cycle execution on CPU
 */
export function executeCpuTick(pcb, tick) {
  const next = clonePCB(pcb);
  next.cpu.remainingBurst -= 1;
  next.cpu.executedTime += 1;
  next.cpu.quantumUsed += 1;

  // Advance Program Counter & Simulated hardware registers
  const currentPC = parseInt(next.registers.PC, 16);
  next.registers.PC = `0x${(currentPC + 4).toString(16).toUpperCase().padStart(8, '0')}`;
  next.registers.R0 = `0x${(Math.floor(Math.random() * 65535)).toString(16).padStart(4, '0').toUpperCase()}`;
  next.registers.R1 = `0x${(next.cpu.executedTime * 23).toString(16).padStart(4, '0').toUpperCase()}`;

  return next;
}

/**
 * Transitions a RUNNING process into WAITING state for I/O
 */
export function requestIo(pcb, ioEvent, tick) {
  const next = clonePCB(pcb);
  const fromState = next.state;
  next.state = PROCESS_STATES.WAITING;
  next.cpu.quantumUsed = 0;
  next.io.activeEvent = { ...ioEvent };
  next.io.timeRemaining = ioEvent.duration;

  next.history.push({
    timestamp: tick,
    fromState,
    toState: PROCESS_STATES.WAITING,
    reason: `Issued ${ioEvent.device} I/O system call (Blocked for ${ioEvent.duration} ticks)`,
  });
  return next;
}

/**
 * Completes an I/O operation and transitions WAITING process back to READY
 */
export function completeIo(pcb, tick) {
  const next = clonePCB(pcb);
  const fromState = next.state;
  const devName = next.io.activeEvent ? next.io.activeEvent.device : 'Device';
  next.state = PROCESS_STATES.READY;
  next.io.activeEvent = null;
  next.io.timeRemaining = 0;

  next.history.push({
    timestamp: tick,
    fromState,
    toState: PROCESS_STATES.READY,
    reason: `${devName} I/O completed (Hardware Interrupt received)`,
  });
  return next;
}

/**
 * Preempts a RUNNING process back to READY state
 */
export function preemptProcess(pcb, tick, reason = 'Time quantum expired') {
  const next = clonePCB(pcb);
  const fromState = next.state;
  next.state = PROCESS_STATES.READY;
  next.cpu.quantumUsed = 0;

  next.history.push({
    timestamp: tick,
    fromState,
    toState: PROCESS_STATES.READY,
    reason,
  });
  return next;
}

/**
 * Completes and terminates a process
 */
export function terminateProcess(pcb, tick, reason = 'Process execution completed successfully') {
  const next = clonePCB(pcb);
  const fromState = next.state;
  next.state = PROCESS_STATES.TERMINATED;
  next.metrics.completedAt = tick;
  next.metrics.turnaroundTime = tick - next.identity.arrivalTime;

  next.history.push({
    timestamp: tick,
    fromState,
    toState: PROCESS_STATES.TERMINATED,
    reason,
  });
  return next;
}

/**
 * Increments waiting time for processes resting in READY queue
 */
export function incrementWaitingTime(pcb) {
  const next = clonePCB(pcb);
  next.metrics.waitingTime += 1;
  return next;
}
