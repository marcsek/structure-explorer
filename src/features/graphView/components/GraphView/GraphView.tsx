import "./GraphView.css";
import "@xyflow/react/dist/style.css";
import "../../graphs.css";

import OrientedGraph from "../../graphs/OrientedGraph/OrientedGraph";
import HasseDiagram from "../../graphs/HasseDiagram/HasseDiagram";
import BipartiteGraph from "../../graphs/BipartiteGraph/BipartiteGraph.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphInfoContext } from "./GraphInfoContext.ts";
import { GenerateMarker } from "../../graphs/graphComponents/DirectEdge.tsx";
import { useInstanceId } from "../../../../instanceIdContext.ts";
import { useAppDispatch } from "../../../../app/hooks.ts";
import { useEffect } from "react";
import { editorLocked } from "../../graphs/graphSlice.ts";
import type { GraphType } from "../../graphs/plugins.ts";
import type { TupleType } from "../../../structure/structureSlice.ts";

export type OnExpandedViewChange = (change: boolean) => void;

export interface GraphComponentProps {
  id: string;
  tupleName: string;
  tupleType: TupleType;
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

export default function GraphView({
  tupleName,
  tupleType,
  locked,
  graphType,
  expandedView,
  onExpandedViewChange,
}: {
  tupleName: string;
  tupleType: TupleType;
  locked: boolean;
  graphType: GraphType;
  expandedView: boolean;
  onExpandedViewChange: OnExpandedViewChange;
}) {
  const dispatch = useAppDispatch();
  const instanceId = useInstanceId();

  useEffect(() => {
    dispatch(editorLocked({ tupleName: tupleName, tupleType, locked }));
  }, [dispatch, locked, tupleName, tupleType]);

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
        <div className="graphViewItem" key={tupleName}>
          <GraphInfoContext.Provider
            value={{ tupleName, graphType, tupleType }}
          >
            <ReactFlowProvider>
              <GraphComponent
                id={`${graphType}-${tupleName}-${instanceId}`}
                tupleName={tupleName}
                tupleType={tupleType}
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
