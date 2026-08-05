import { createContext, useContext } from "react";
import type { GraphType } from "../../graphs/plugins";
import type { TupleInfo } from "../../../structure/tupleInfo";

export const GraphInfoContext = createContext<{
  tupleInfo: TupleInfo;
  graphType: GraphType;
  locked: boolean;
} | null>(null);

export const useGraphInfo = () => {
  const context = useContext(GraphInfoContext);

  if (!context)
    console.error("Parent of graph component didn't provide graphInfoContext.");

  return (
    useContext(GraphInfoContext) ?? {
      tupleInfo: { name: "", type: "predicate", arity: 0 } as TupleInfo,
      graphType: "oriented" as GraphType,
      locked: false,
    }
  );
};
