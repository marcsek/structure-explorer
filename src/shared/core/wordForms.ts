export const plural = (count: number, noun: string) =>
  `${noun}${count === 1 ? "" : "s"}`;

export const toBe = (count: number) => (count === 1 ? "is" : "are");

export const withArticle = (noun: string) =>
  `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;

export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);
