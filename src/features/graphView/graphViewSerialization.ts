import type { RelevantSymbols } from "../import/importExportUtils.ts";
import { getTupleId, isBinaryTuple } from "../structure/tupleInfo.ts";
import type { SerializedGraphViewState } from "./validationSchema.ts";
import { graphTypes, type AnyGraphState } from "./graphs/registry.ts";
import type { GraphViewState } from "./graphViewSlice.ts";

type NodePositions = Record<string, [number, number]>;

const getPositionsToExport = ({
  nodes,
  didLayout,
}: AnyGraphState): NodePositions => {
  if (!didLayout) return {};

  return Object.fromEntries(
    nodes
      .filter(
        ({ position: { x, y } }) => Number.isFinite(x) && Number.isFinite(y),
      )
      .map(({ id, position: { x, y } }): [string, [number, number]] => [
        id,
        [Math.trunc(x), Math.trunc(y)],
      ]),
  );
};

export const getGraphViewStateToExport = (
  state: GraphViewState,
  relevantSymbols: RelevantSymbols,
): SerializedGraphViewState => {
  const serializedState: SerializedGraphViewState = {};

  for (const [tupleName, symbol] of Object.entries(relevantSymbols)) {
    if (symbol.type === "constant" || !isBinaryTuple(symbol.type, symbol.arity))
      continue;

    const tupleId = getTupleId({ type: symbol.type, name: tupleName });
    const graphStates = state[tupleId]?.state;

    if (!graphStates) continue;

    const graphEntries: SerializedGraphViewState[string] = {};

    for (const graphType of graphTypes) {
      const positions = getPositionsToExport(graphStates[graphType]);
      if (Object.keys(positions).length > 0)
        graphEntries[graphType] = positions;
    }

    if (Object.keys(graphEntries).length > 0)
      serializedState[tupleId] = graphEntries;
  }

  return serializedState;
};
