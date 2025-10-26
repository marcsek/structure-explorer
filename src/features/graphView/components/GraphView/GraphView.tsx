import "./GraphView.css";
import "@xyflow/react/dist/style.css";
import "../../graphs.css";

import { useState } from "react";
import OrientedGraph from "../../graphs/OrientedGraph/OrientedGraph";
import HasseDiagram from "../../graphs/HasseDiagram/HasseDiagram";
import BipartiteGraph from "../../graphs/BipartiteGraph/BipartiteGraph.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphInfoContext } from "./GraphInfoContext.ts";
import { GenerateMarker } from "../../graphs/graphComponents/DirectEdge.tsx";

type SelectedType = "oriented" | "hasse" | "bipartite";

export default function GraphView({
  predName,
  locked,
  graphType = "oriented",
}: {
  predName: string;
  locked: boolean;
  graphType: SelectedType;
  enableNodeFiltering?: boolean;
}) {
  const [isFullscreen] = useState(false);

  const graphComponents: Record<
    SelectedType,
    React.ComponentType<{ id: string; locked: boolean }>
  > = {
    oriented: OrientedGraph,
    hasse: HasseDiagram,
    bipartite: BipartiteGraph,
  };

  const GraphComponent = graphComponents[graphType];

  return (
    <div className="react-flow">
      {/* Edge markers need to be present in DOM before referencing them. */}
      <GenerateMarker type="error" />
      <GenerateMarker type="selected" />
      <GenerateMarker type="hover" />
      <GenerateMarker type="connection" />

      <div
        className={"graphViewContainer " + (isFullscreen ? "fullscreen" : "")}
      >
        <div className="graphViewItem" key={predName}>
          <GraphInfoContext.Provider value={{ id: predName, type: graphType }}>
            <ReactFlowProvider>
              <GraphComponent id={predName} locked={locked} />
            </ReactFlowProvider>
          </GraphInfoContext.Provider>
        </div>
      </div>
    </div>
  );
}
