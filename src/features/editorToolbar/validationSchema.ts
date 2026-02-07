import { z } from "zod";
import { initialEditorToolbarState } from "./editorToolbarSlice";

export const editorTypes = [
  "text",
  "matrix",
  "database",
  "oriented",
  "hasse",
  "bipartite",
] as const;

export const serializedEditorToolbarStateSchema = z
  .record(
    z.string(),
    z.object({
      hoveredUnary: z.array(z.string()).optional(),
      selectedUnary: z.array(z.string()),
      selectedDomain: z.array(z.string()).optional(),
      unaryFilterDomain: z.boolean(),
      unaryFilterHovered: z.boolean().optional(),
      openedEditor: z.enum(editorTypes),
    }),
  )
  .default({});

export type SerializedEditorToolbarState = z.infer<
  typeof serializedEditorToolbarStateSchema
>;

export const serializedEditorToolbarStateDefault: SerializedEditorToolbarState =
  initialEditorToolbarState;
