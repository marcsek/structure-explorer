import z from "zod";

export type SchemaFields = Record<string, z.ZodType>;

export type LooseState<F extends SchemaFields> = {
  [K in keyof F]?: z.infer<F[K]>;
};

export function parseFields<F extends SchemaFields>(
  fields: F,
  input: Record<string, unknown>,
  errorPrefix: string,
): { data: LooseState<F>; errors: string[] } {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [key, schema] of Object.entries(fields)) {
    const parsed = schema.safeParse(input[key]);

    if (parsed.success) data[key] = parsed.data;
    else errors.push(`${errorPrefix}${key}: ${z.prettifyError(parsed.error)}`);
  }

  return { data: data as LooseState<F>, errors };
}
