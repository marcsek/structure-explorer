const isDev = import.meta.env.DEV;

const guard =
  <T extends (...args: never[]) => void>(fn: T) =>
  (...args: Parameters<T>): void =>
    void (isDev && fn(...args));

export const dev = {
  log: guard(console.log),
  warn: guard(console.warn),
  time: guard(console.time),
  timeEnd: guard(console.timeEnd),
};
