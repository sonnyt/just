import colors from 'colors/safe';

const prefix = colors.blue('[Just]');

export function timer() {
  let start: number;

  return {
    start(...args: unknown[]) {
      start = performance.now();
      wait(...args);
    },
    end(...args: unknown[]) {
      const end = performance.now();
      event(...args, Math.round(end - start), 'in', 'ms');
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

export function log(...args: unknown[]) {
  console.log(prefix, ...args);
}