import "./GraphView.css";
import "@xyflow/react/dist/style.css";
import "../../graphs.css";

import OrientedGraph from "../../graphs/OrientedGraph/OrientedGraph";
import HasseDiagram from "../../graphs/HasseDiagram/HasseDiagram";
import BipartiteGraph from "../../graphs/BipartiteGraph/BipartiteGraph.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphInfoContext } from "./GraphInfoContext.ts";
import EdgeMarkers from "../../graphs/graphComponents/EdgeMarkers.tsx";
import type { GraphType } from "../../graphs/graphRegistry.ts";
import type { TupleInfo } from "../../../structure/tupleInfo";
import type { DrawerEditorProps } from "../../../drawerEditor/drawerEditorAdapter.tsx";

export type OnExpandedViewChange = (change: boolean) => void;

export interface GraphComponentProps {
  id: string;
  tupleInfo: TupleInfo;
  locked: boolean;
  expandedView: boolean;
  onExpandedViewChange?: OnExpandedViewChange;
}

const graphComponents: Record<
  GraphType,
  React.ComponentType<GraphComponentProps>
> = {
  oriented: OrientedGraph,
  hasse: HasseDiagram,
  bipartite: BipartiteGraph,
};

export interface GraphViewProps extends DrawerEditorProps {
  graphType: GraphType;
}

export default function GraphView({
  id,
  tupleInfo,
  locked,
  graphType,
  expandedView,
  setExpandedView,
}: GraphViewProps) {
  const { name: tupleName } = tupleInfo;

  const GraphComponent = graphComponents[graphType];

  return (
    <div className="react-flow" style={{ height: "100%" }}>
      {/* Edge markers need to be present in DOM before referencing them. */}
      <EdgeMarkers />

      <div className="graphViewContainer">
        <div className="graphViewItem" key={tupleName}>
          <GraphInfoContext.Provider value={{ tupleInfo, graphType, locked }}>
            <ReactFlowProvider key={graphType}>
              <GraphComponent
                id={`${graphType}-${id}`}
                tupleInfo={tupleInfo}
                locked={locked}
                expandedView={expandedView}
                onExpandedViewChange={setExpandedView}
              />
            </ReactFlowProvider>
          </GraphInfoContext.Provider>
        </div>
      </div>
    </div>
  );
}
