const isDev = import.meta.env.DEV;

const guard =
  <T extends (...args: never[]) => void>(fn: T) =>
  (...args: Parameters<T>): void =>
    void (isDev && fn(...args));

const timed = <T>(label: string, fn: () => T): T => {
  if (!isDev) return fn();

  console.time(label);
  try {
    return fn();
  } finally {
    console.timeEnd(label);
  }
};

export const dev = {
  log: guard(console.log),
  warn: guard(console.warn),
  time: guard(console.time),
  timeEnd: guard(console.timeEnd),
  timed,
};
