import z from "zod";

export const lockable = <T extends z.ZodType>(value: T) =>
  z.object({ value, locked: z.boolean() });
