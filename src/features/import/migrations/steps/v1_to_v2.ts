import type { Migration } from "..";
import type { V1Fields, V2Fields, V2State } from "../versions";

export const migrateV1ToV2: Migration<V1Fields, V2Fields> = (state) => {
  const domain = state.structure?.domain.value ?? [];
  const editorToolbar: NonNullable<V2State["editorToolbar"]> = {};

  for (const [tupleId, entry] of Object.entries(state.editorToolbar ?? {})) {
    const { selectedDomain, deselectedDomain, ...rest } = entry;

    editorToolbar[tupleId] = {
      ...rest,
      deselectedDomain:
        deselectedDomain ??
        (selectedDomain === undefined
          ? []
          : domain.filter((element) => !selectedDomain.includes(element))),
    };
  }

  return { ...state, editorToolbar };
};
