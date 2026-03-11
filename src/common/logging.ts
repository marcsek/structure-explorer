const isDev = import.meta.env.DEV;

export const dev = {
  log: (...args: unknown[]) => isDev && console.log(...args),
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  time: (label: string) => isDev && console.time(label),
  timeEnd: (label: string) => isDev && console.timeEnd(label),
};
