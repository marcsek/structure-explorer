import z from "zod";
import { lockable } from "../../common/validation";
import { initialStructureState } from "./structureSlice";

const domainRepresentationSchema = z.array(z.string());
const constantInterpretationSchema = z.string();
const tupleInterpretationSchema = z.array(z.array(z.string()));

export const serializedStructureStateSchema = z.object({
  domain: lockable(domainRepresentationSchema),
  iC: z.record(z.string(), lockable(constantInterpretationSchema)),
  iP: z.record(z.string(), lockable(tupleInterpretationSchema)),
  iF: z.record(z.string(), lockable(tupleInterpretationSchema)),
});

export type SerializedStructureState = z.infer<
  typeof serializedStructureStateSchema
>;

export const serializedStructureStateDefault: SerializedStructureState =
  initialStructureState;
