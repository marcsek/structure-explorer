import "./GraphView.css";
import "@xyflow/react/dist/style.css";
import "../../graphs.css";

import OrientedGraph from "../../graphs/OrientedGraph/OrientedGraph";
import HasseDiagram from "../../graphs/HasseDiagram/HasseDiagram";
import BipartiteGraph from "../../graphs/BipartiteGraph/BipartiteGraph.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphInfoContext } from "./GraphInfoContext.ts";
import { GenerateMarker } from "../../graphs/graphComponents/DirectEdge.tsx";

export type OnExpandedViewChange = (change: boolean) => void;

type SelectedType = "oriented" | "hasse" | "bipartite";

export default function GraphView({
  predName,
  locked,
  graphType = "oriented",
  expandedView = false,
  onExpandedViewChange,
}: {
  predName: string;
  locked: boolean;
  graphType: SelectedType;
  expandedView?: boolean;
  onExpandedViewChange?: OnExpandedViewChange;
}) {
  const graphComponents: Record<
    SelectedType,
    React.ComponentType<{
      id: string;
      locked: boolean;
      expandedView?: boolean;
      onExpandedViewChange?: OnExpandedViewChange;
    }>
  > = {
    oriented: OrientedGraph,
    hasse: HasseDiagram,
    bipartite: BipartiteGraph,
  };

  const GraphComponent = graphComponents[graphType];

  return (
    <div className="react-flow" style={{ height: "100%" }}>
      {/* Edge markers need to be present in DOM before referencing them. */}
      <GenerateMarker type="error" />
      <GenerateMarker type="focusError" />
      <GenerateMarker type="selected" />
      <GenerateMarker type="hover" />
      <GenerateMarker type="connection" />

      <div className="graphViewContainer">
        <div className="graphViewItem" key={predName}>
          <GraphInfoContext.Provider value={{ id: predName, type: graphType }}>
            <ReactFlowProvider>
              <GraphComponent
                id={predName}
                locked={locked}
                expandedView={expandedView}
                onExpandedViewChange={onExpandedViewChange}
              />
            </ReactFlowProvider>
          </GraphInfoContext.Provider>
        </div>
      </div>
    </div>
  );
}
