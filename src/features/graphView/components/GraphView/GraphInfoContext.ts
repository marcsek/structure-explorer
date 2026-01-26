import { createContext, useContext } from "react";
import type { GraphType } from "../../graphs/plugins";

export const GraphInfoContext = createContext<{
  id: string;
  type: GraphType;
} | null>(null);

export const useGraphInfo = () => {
  const context = useContext(GraphInfoContext);

  if (!context)
    console.error("Parent of graph component didn't provide graphInfoContext.");

  return useContext(GraphInfoContext) ?? { id: "", type: "oriented" };
};
