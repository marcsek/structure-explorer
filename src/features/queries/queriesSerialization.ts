import type { QueriesState } from "./queriesSlice";
import type { SerializedQueriesState } from "./validationSchema";

export const getQueriesStateToExport = (
  queriesState: QueriesState,
): SerializedQueriesState => ({
  queries: queriesState.queries.map(({ stale: _, ...q }) => q),
});
