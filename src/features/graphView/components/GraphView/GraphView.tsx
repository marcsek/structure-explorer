import "./GraphView.css";
import "@xyflow/react/dist/style.css";
import "../../graphs.css";

import { useState } from "react";
import OrientedGraph from "../../graphs/OrientedGraph/OrientedGraph";
import HasseDiagram from "../../graphs/HasseDiagram/HasseDiagram";
import BipartiteGraph from "../../graphs/BipartiteGraph/BipartiteGraph.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphInfoContext } from "./GraphInfoContext.ts";
import GraphHUD from "../GraphHUD/GraphHUD.tsx";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

type SelectedType = "oriented" | "hasse" | "bipartite";

export default function GraphView({
  predName,
  locked,
  graphType = "oriented",
  enableNodeFiltering = true,
}: {
  predName: string;
  locked: boolean;
  graphType: SelectedType;
  enableNodeFiltering?: boolean;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphHudVissible, setGraphHudVissible] = useState(false);

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
    <div className={"graphViewContainer " + (isFullscreen ? "fullscreen" : "")}>
      <div className="graphViewItem" key={predName}>
        {graphHudVissible ? (
          <GraphHUD
            id={predName}
            type={graphType}
            isFullscreen={isFullscreen}
            fullScreenToggled={() => setIsFullscreen((prev) => !prev)}
            onExitClicked={() => setGraphHudVissible(false)}
            disableNodeSelector={!enableNodeFiltering}
          />
        ) : (
          <>
            {/* <GraphConfiguratorButton setGraphHudVissible={setGraphHudVissible} /> */}
          </>
        )}
        <GraphInfoContext.Provider value={{ id: predName, type: graphType }}>
          <ReactFlowProvider>
            <GraphComponent id={predName} locked={locked} />
          </ReactFlowProvider>
        </GraphInfoContext.Provider>
      </div>
    </div>
  );
}

function GraphConfiguratorButton({
  setGraphHudVissible,
}: {
  setGraphHudVissible: (vissible: boolean) => void;
}) {
  return (
    <Button
      variant="secondary"
      style={{
        position: "absolute",
        top: "2rem",
        right: "2rem",
        zIndex: 2,
      }}
      onClick={() => setGraphHudVissible(true)}
    >
      <FontAwesomeIcon icon={faEdit} />
    </Button>
  );
}
