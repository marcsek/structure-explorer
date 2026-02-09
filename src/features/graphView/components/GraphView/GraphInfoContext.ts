import { createContext, useContext } from "react";
import type { GraphType } from "../../graphs/plugins";
import type { TupleType } from "../../../structure/structureSlice";

export const GraphInfoContext = createContext<{
  tupleName: string;
  tupleType: TupleType;
  graphType: GraphType;
} | null>(null);

export const useGraphInfo = () => {
  const context = useContext(GraphInfoContext);

  if (!context)
    console.error("Parent of graph component didn't provide graphInfoContext.");

  return (
    useContext(GraphInfoContext) ?? {
      tupleName: "",
      graphType: "oriented",
      tupleType: "predicate",
    }
  );
};
