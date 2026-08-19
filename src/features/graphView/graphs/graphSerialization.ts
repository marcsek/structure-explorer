import type { RootState } from "../../../app/store.ts";
import type { RelevantSymbols } from "../../import/importExportUtils.ts";
import type { SerializedGraphViewState } from "../validationSchema.ts";
import type { PredicateNodeType } from "./graphComponents/PredicateNode";
import { getKeyFromTupleId } from "./graphSlice.ts";
import type { GraphType } from "./graphRegistry.ts";

export const getGraphViewStateToExport = (
  state: RootState,
  relevantSymbols: RelevantSymbols,
): SerializedGraphViewState => {
  const relevantEntries = Object.entries(state.present.graphView).filter(
    ([tupleId, { tupleType }]) => {
      const tupleName = getKeyFromTupleId(tupleId);
      const relevantEntry = relevantSymbols[tupleName];

      if (!relevantEntry || relevantEntry.type === "constant") return false;
      return relevantEntry.arity === (tupleType === "function" ? 1 : 2);
    },
  );

  const getNodesToExport = (
    nodes: PredicateNodeType[],
    didLayout: boolean,
  ): [string, [number, number]][] => {
    const changedNodes = didLayout ? nodes : [];

    return changedNodes
      .filter(
        ({ position: { x, y } }) => Number.isFinite(x) && Number.isFinite(y),
      )
      .map(({ id, position: { x, y } }) => [
        id,
        [x, y].map(Math.trunc) as [number, number],
      ]);
  };

  const serializedState: SerializedGraphViewState = {};

  for (const [tupleId, { state }] of relevantEntries) {
    const graphEntries: [GraphType, Record<string, [number, number]>][] = [];
    for (const graphType in state) {
      const { nodes, didLayout } = state[graphType as GraphType];
      const positions = getNodesToExport(nodes, !!didLayout);

      if (positions.length === 0) continue;

      graphEntries.push([
        graphType as GraphType,
        Object.fromEntries(positions),
      ]);
    }

    if (graphEntries.length === 0) continue;
    serializedState[tupleId] = Object.fromEntries(
      graphEntries,
    ) as SerializedGraphViewState[string];
  }

  return serializedState;
};
