import colors from 'colors/safe';

/**
 * The prefix to use for all log messages.
 */
const prefix = '[Just]' as const;

/**
 * Creates a timer object that can be used to measure the execution time of a code block.
 * @returns An object with `start` and `end` methods.
 */
export function timer() {
  let start: [number, number];

  return {
    /**
     * Starts the timer and executes the specified function.
     * @param args - Optional arguments to pass to the function.
     */
    start(...args: unknown[]) {
      start = process.hrtime();
      wait(...args);
    },
    /**
     * Ends the timer and logs the elapsed time.
     * @param args - Optional arguments to pass to the log event.
     */
    end(...args: unknown[]) {
      const end = process.hrtime(start);
      event(...args, (end[1] / 1000000).toFixed(2), 'in', 'ms');
    },
  };
}

/**
 * Logs an wait message.
 * @param args - The arguments to be logged.
 */
export function wait(...args: unknown[]) {
  log(colors.bold(colors.magenta('wait')), '-', ...args);
}

/**
 * Logs an event message.
 * @param args - The arguments to be logged.
 */
export function event(...args: unknown[]) {
  log(colors.bold(colors.green('event')), '-', ...args);
}

/**
 * Logs an error message.
 * @param args - The error message or additional arguments to log.
 */
export function error(...args: unknown[]) {
  log(colors.bold(colors.red('error')), '-', ...args);
}

/**
 * Logs a warning message.
 * @param args - The arguments to be logged.
 */
export function warning(...args: unknown[]) {
  log(colors.bold(colors.yellow('warning')), '-', ...args);
}

/**
 * Logs an information message.
 * @param args - The arguments to be logged.
 */
export function info(...args: unknown[]) {
  log(colors.bold(colors.cyan('info')), '-', ...args);
}

/**
 * Logs debug information if the environment variable JUST_DEBUG is set.
 * @param args - The arguments to be logged.
 */
export function debug(...args: unknown[]) {
  if (process.env.JUST_DEBUG) {
    log(colors.bold(colors.gray('DEBUG')), '-', ...args);
  }
}

/**
 * Logs the provided arguments to the console.
 * @param args - The arguments to be logged.
 */
export function log(...args: unknown[]) {
  console.log(colors.blue(prefix), ...args);
}
