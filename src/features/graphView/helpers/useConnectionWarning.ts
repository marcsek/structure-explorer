import { useCallback, useEffect, useState } from "react";
import { useConnection, type IsValidConnection } from "@xyflow/react";
import { graphs, type GraphType } from "../graphs/graphRegistry";
import type { DirectEdgeType } from "../graphs/graphComponents/DirectEdge";

export default function useConnectionWarning(
  graphType: GraphType,
  edges: DirectEdgeType[],
) {
  const [warning, setWarning] = useState<string>();

  const overHandle = useConnection((connection) => !!connection.toHandle);
  const connectionValid = useConnection(
    (connection) => connection.isValid === true,
  );

  useEffect(() => {
    if (!overHandle || connectionValid) setWarning(undefined);
  }, [overHandle, connectionValid]);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const [valid, error] = graphs[graphType].validateConnection(
        edges,
        connection,
      );

      setWarning(valid ? undefined : error);

      return valid;
    },
    [graphType, edges],
  );

  const clearWarning = useCallback(() => setWarning(undefined), []);

  return { warning, isValidConnection, clearWarning };
}
