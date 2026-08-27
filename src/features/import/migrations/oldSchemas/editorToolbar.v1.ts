import { z } from "zod";

const editorTypesV1 = [
  "text",
  "matrix",
  "database",
  "caseTree",
  "oriented",
  "hasse",
  "bipartite",
] as const;

export const editorToolbarSchemaV1 = z
  .record(
    z.string(),
    z.object({
      selectedUnary: z.array(z.string()),
      selectedDomain: z.array(z.string()).optional(),
      deselectedDomain: z.array(z.string()).optional(),
      unaryFilterDomain: z.boolean(),
      openedEditor: z.enum(editorTypesV1),
    }),
  )
  .default(() => ({}));
