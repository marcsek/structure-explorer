import z from "zod";

const formulaStateSchema = z.object({
  name: z.string().optional(),
  text: z.string(),
  guess: z.boolean().nullable(),
  locked: z.boolean(),
  lockedGuess: z.boolean(),
  gameChoices: z.array(
    z.object({
      formula: z.union([z.literal(0), z.literal(1)]).optional(),
      element: z.string().optional(),
      type: z.enum(["alpha", "beta", "gamma", "delta"]),
    }),
  ),
});

export const serializedFormulasStateSchema = z.object({
  allFormulas: z.array(formulaStateSchema),
});

export type SerializedFormulasState = z.infer<
  typeof serializedFormulasStateSchema
>;
