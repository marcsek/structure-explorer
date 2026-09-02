import z from "zod";
import { defaultPalette, paletteKinds } from "./palettes";

export const serializedPredicatePaletteStateSchema = z
  .object({
    activePaletteKind: z.enum(paletteKinds),
    customPaletteColors: z.array(z.string()).min(1),
  })
  .default(() => ({
    activePaletteKind: "default" as const,
    customPaletteColors: [...defaultPalette],
  }));

export type SerializedPredicatePaletteState = z.infer<
  typeof serializedPredicatePaletteStateSchema
>;

export const serializedPredicatePaletteStateDefault =
  (): SerializedPredicatePaletteState => ({
    activePaletteKind: "default",
    customPaletteColors: [...defaultPalette],
  });
