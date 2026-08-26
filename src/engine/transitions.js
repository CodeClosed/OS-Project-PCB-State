import { PROCESS_STATES } from '../types/constants';

/**
 * Valid OS Process State Transitions (Single Source of Truth)
 *
 * Rules:
 * NEW -> READY (Long-term scheduler admits process)
 * READY -> RUNNING (Short-term scheduler dispatches process)
 * RUNNING -> WAITING (Process blocks on I/O request or event)
 * RUNNING -> READY (Time quantum expires or preempted by higher priority / shorter job)
 * RUNNING -> TERMINATED (Process finishes execution or killed)
 * WAITING -> READY (I/O operation completes or event signaled)
 * TERMINATED -> (No forward transitions; memory purged)
 */
export const VALID_TRANSITIONS = {
  [PROCESS_STATES.NEW]: [PROCESS_STATES.READY],
  [PROCESS_STATES.READY]: [PROCESS_STATES.RUNNING],
  [PROCESS_STATES.RUNNING]: [
    PROCESS_STATES.READY,
    PROCESS_STATES.WAITING,
    PROCESS_STATES.TERMINATED,
  ],
  [PROCESS_STATES.WAITING]: [PROCESS_STATES.READY],
  [PROCESS_STATES.TERMINATED]: [],
};

/**
 * Validates if moving from currentState to targetState conforms to OS standards
 *
 * @param {string} fromState
 * @param {string} toState
 * @returns {boolean}
 */
export function isValidTransition(fromState, toState) {
  if (!fromState || !toState) return false;
  const allowed = VALID_TRANSITIONS[fromState] || [];
  return allowed.includes(toState);
}

/**
 * Returns available target states and user-friendly action descriptions for a given state
 *
 * @param {string} currentState
 * @returns {Array<{ targetState: string, actionLabel: string, description: string, variant: string }>}
 */
export function getAvailableTransitions(currentState) {
  switch (currentState) {
    case PROCESS_STATES.NEW:
      return [
        {
          targetState: PROCESS_STATES.READY,
          actionLabel: 'Admit to Ready Queue',
          description: 'Long-term scheduler admits process into main memory',
          variant: 'cyan',
        },
      ];

    case PROCESS_STATES.READY:
      return [
        {
          targetState: PROCESS_STATES.RUNNING,
          actionLabel: 'Dispatch to CPU',
          description: 'Short-term scheduler assigns CPU core',
          variant: 'emerald',
        },
      ];

    case PROCESS_STATES.RUNNING:
      return [
        {
          targetState: PROCESS_STATES.WAITING,
          actionLabel: 'Request I/O Block',
          description: 'Process issues I/O system call and yields CPU',
          variant: 'amber',
        },
        {
          targetState: PROCESS_STATES.READY,
          actionLabel: 'Time Slice Expire / Preempt',
          description: 'Context switched back to Ready Queue',
          variant: 'cyan',
        },
        {
          targetState: PROCESS_STATES.TERMINATED,
          actionLabel: 'Complete / Exit',
          description: 'Process terminates and exits cleanly',
          variant: 'rose',
        },
      ];

    case PROCESS_STATES.WAITING:
      return [
        {
          targetState: PROCESS_STATES.READY,
          actionLabel: 'I/O Completed ➔ Ready',
          description: 'Hardware interrupt signals I/O completion',
          variant: 'cyan',
        },
      ];

    case PROCESS_STATES.TERMINATED:
    default:
      return [];
  }
}
