import type { QueriesState } from "./queriesSlice";
import type { SerializedQueriesState } from "./validationSchema";

export const getRelevantQueriesState = (
  queriesState: QueriesState,
): SerializedQueriesState => ({
  queries: queriesState.queries.map(({ stale: _, ...q }) => q),
});
