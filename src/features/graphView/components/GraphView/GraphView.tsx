import "./GraphView.css";
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

export default function GraphView({ predName }: { predName: string }) {
  const [selectedType, setSelectedType] = useState<SelectedType>("oriented");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphHudVissible, setGraphHudVissible] = useState(true);

  const graphComponents: Record<
    SelectedType,
    React.ComponentType<{ id: string }>
  > = {
    oriented: OrientedGraph,
    hasse: HasseDiagram,
    bipartite: BipartiteGraph,
  };

  const GraphComponent = graphComponents[selectedType];

  return (
    <div className={"graphViewContainer " + (isFullscreen ? "fullscreen" : "")}>
      <div className="graphViewItem" key={predName}>
        {graphHudVissible ? (
          <GraphHUD
            id={predName}
            type={selectedType}
            typeSelected={setSelectedType}
            isFullscreen={isFullscreen}
            fullScreenToggled={() => setIsFullscreen((prev) => !prev)}
            onExitClicked={() => setGraphHudVissible(false)}
          />
        ) : (
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
        )}
        <GraphInfoContext.Provider value={{ id: predName, type: selectedType }}>
          <ReactFlowProvider>
            <GraphComponent id={predName} />
          </ReactFlowProvider>
        </GraphInfoContext.Provider>
      </div>
    </div>
  );
}
