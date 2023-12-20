import colors from 'colors/safe';

const prefix = '[Just]' as const;

export function timer() {
  let start: [number, number];

  return {
    start(...args: unknown[]) {
      start = process.hrtime();
      wait(...args);
    },
    end(...args: unknown[]) {
      const end = process.hrtime(start);
      event(...args, (end[1] / 1000000).toFixed(2), 'in', 'ms');
    },
  };
}

export function wait(...args: unknown[]) {
  log(colors.bold(colors.magenta('wait')), '-', ...args);
}

export function event(...args: unknown[]) {
  log(colors.bold(colors.green('event')), '-', ...args);
}

export function error(...args: unknown[]) {
  log(colors.bold(colors.red('error')), '-', ...args);
}

export function warning(...args: unknown[]) {
  log(colors.bold(colors.yellow('warning')), '-', ...args);
}

export function info(...args: unknown[]) {
  log(colors.bold(colors.cyan('info')), '-', ...args);
}

export function debug(...args: unknown[]) {
  if (process.env.JUST_DEBUG) {
    log(colors.bold(colors.gray('DEBUG')), '-', ...args);
  }
}

export function log(...args: unknown[]) {
  console.log(colors.blue(prefix), ...args);
}
