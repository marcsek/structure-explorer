import z from "zod";
import { parseFields, type LooseState, type SchemaFields } from "./parseFields";
import { migrateV1ToV2 } from "./steps/v1_to_v2";
import {
  currentFields,
  SERIALIZED_STATE_VERSION,
  v1Fields,
  type CurrentFields,
  type V1Fields,
  type V2Fields,
} from "./versions";

export type Migration<F extends SchemaFields, T extends SchemaFields> = (
  fromState: LooseState<F>,
) => LooseState<T>;

interface MigrationStep {
  from: number;
  run: (input: Record<string, unknown>) => {
    data: Record<string, unknown>;
    errors: string[];
  };
}

const step = <F extends SchemaFields, T extends SchemaFields>(
  from: number,
  fromFields: F,
  migrate: Migration<F, T>,
): MigrationStep => ({
  from,
  run: (input) => {
    const { data, errors } = parseFields(fromFields, input, `v${from}.`);

    return { data: migrate(data), errors };
  },
});

const migrationSteps: MigrationStep[] = [
  step<V1Fields, V2Fields>(1, v1Fields, migrateV1ToV2),
];

export const MINIMAL_SUPPORTED_VERSION =
  migrationSteps[0]?.from ?? SERIALIZED_STATE_VERSION;

const versionSchema = z.number().int().positive();

const readVersion = (
  input: Record<string, unknown>,
): { version: number; errors: string[] } => {
  const parsed = versionSchema.safeParse(input.version);

  if (parsed.success) return { version: parsed.data, errors: [] };

  return {
    version: MINIMAL_SUPPORTED_VERSION,
    errors:
      input.version === undefined
        ? []
        : [`version: ${z.prettifyError(parsed.error)}`],
  };
};

export function migrateToCurrent(input: Record<string, unknown>): {
  data: LooseState<CurrentFields>;
  errors: string[];
} {
  const { version, errors } = readVersion(input);
  let data = input;

  if (
    version > SERIALIZED_STATE_VERSION ||
    version < MINIMAL_SUPPORTED_VERSION
  ) {
    errors.push(
      `version: unsupported state version (${version}), supported versions are ${MINIMAL_SUPPORTED_VERSION}–${SERIALIZED_STATE_VERSION}`,
    );
  } else {
    for (const migration of migrationSteps) {
      if (migration.from < version) continue;

      const result = migration.run(data);

      data = result.data;
      errors.push(...result.errors);
    }
  }

  const parsed = parseFields(currentFields, data, "");

  return { data: parsed.data, errors: [...errors, ...parsed.errors] };
}
