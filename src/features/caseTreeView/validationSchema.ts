import z from "zod";
import { initialCaseTreeViewState } from "./caseTreeViewSlice";

const CaseTreeBranchSchema = z.union([
  z.object({
    type: z.literal("value"),
    value: z.string(),
  }),
  z.object({
    type: z.literal("ref"),
    nodeId: z.string(),
  }),
]);

const CaseTreeCaseSchema = z.object({
  match: z.string(),
  branch: CaseTreeBranchSchema,
});

const CaseTreeNodeSchema = z.object({
  variable: z.string(),
  cases: z.array(CaseTreeCaseSchema),
  default: CaseTreeBranchSchema.optional(),
});

const CaseTreeEntrySchema = z.object({
  rootId: z.string(),
  nodes: z.record(z.string(), CaseTreeNodeSchema),
});

export const serializedCaseTreeViewStateSchema = z
  .record(z.string(), CaseTreeEntrySchema)
  .default({});

export type SerializedCaseTreeViewState = z.infer<
  typeof serializedCaseTreeViewStateSchema
>;

export const SerializedCaseTreeViewStateDefault: SerializedCaseTreeViewState =
  initialCaseTreeViewState;
