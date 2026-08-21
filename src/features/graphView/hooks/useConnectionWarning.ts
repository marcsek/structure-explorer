import { useCallback, useMemo, useRef } from "react";
import {
  useConnection,
  type Connection,
  type ConnectionState,
  type Edge,
  type IsValidConnection,
} from "@xyflow/react";
import { graphs, type GraphType } from "../graphs/registry";
import type { ConnectionValidity } from "../graphs/GraphModel";
import type { DirectEdgeType } from "../canvas/edges/DirectEdge";

function toConnection(state: ConnectionState): Connection | undefined {
  if (!state.inProgress || !state.toHandle) return undefined;

  const [source, target] =
    state.fromHandle.type === "source"
      ? [state.fromHandle, state.toHandle]
      : [state.toHandle, state.fromHandle];

  return {
    source: source.nodeId,
    target: target.nodeId,
    sourceHandle: source.id ?? null,
    targetHandle: target.id ?? null,
  };
}

const connectionKey = (connection: Connection | Edge) =>
  [
    connection.source,
    connection.sourceHandle,
    connection.target,
    connection.targetHandle,
  ].join(" ");

interface ValidityCache {
  graphType: GraphType;
  edges: DirectEdgeType[];
  entries: Map<string, ConnectionValidity>;
}

export default function useConnectionWarning(
  graphType: GraphType,
  edges: DirectEdgeType[],
) {
  const connection = useConnection(toConnection);

  const warning = useMemo(
    () =>
      connection && graphs[graphType].validateConnection(edges, connection)[1],
    [connection, graphType, edges],
  );

  const cacheRef = useRef<ValidityCache | null>(null);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      let cache = cacheRef.current;

      if (!cache || cache.graphType !== graphType || cache.edges !== edges) {
        cache = { graphType, edges, entries: new Map() };
        cacheRef.current = cache;
      }

      const key = connectionKey(connection);
      let validity = cache.entries.get(key);

      if (!validity) {
        validity = graphs[graphType].validateConnection(edges, connection);
        cache.entries.set(key, validity);
      }

      return validity[0];
    },
    [graphType, edges],
  );

  return { warning, isValidConnection };
}
