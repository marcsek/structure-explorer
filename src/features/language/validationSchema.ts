import z from "zod";
import { lockable } from "../../common/validation";

const constantsRepresentationSchema = z.array(z.string());
const aritySymbolsRepresentationSchema = z.array(
  z.tuple([z.string(), z.number()]),
);

export const serializedLanguageStateSchema = z.object({
  constants: lockable(constantsRepresentationSchema),
  predicates: lockable(aritySymbolsRepresentationSchema),
  functions: lockable(aritySymbolsRepresentationSchema),
});

export type SerializedLanguageState = z.infer<
  typeof serializedLanguageStateSchema
>;
