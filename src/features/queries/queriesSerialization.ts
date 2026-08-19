import type { QueriesState } from "./queriesSlice";
import type { SerializedQueriesState } from "./validationSchema";

export const getRelevantQueriesState = (
  queriesState: QueriesState,
): SerializedQueriesState => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  queries: queriesState.queries.map(({ stale, ...q }) => q),
});
