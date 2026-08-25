export const plural = (count: number, noun: string) => {
  if (count === 1) return noun;
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(noun)) return `${noun}es`;
  return `${noun}s`;
};

export const toBe = (count: number, past: boolean = false) =>
  past ? (count === 1 ? "was" : "were") : count === 1 ? "is" : "are";

export const list = (items: string[], conjunction: "and" | "or" = "and") =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;

export const withArticle = (noun: string) =>
  `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;

export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);
