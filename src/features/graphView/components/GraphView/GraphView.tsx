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
import {
  faEdit,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

type SelectedType = "oriented" | "hasse" | "bipartite";

export default function GraphView({
  predName,
  hasIntrError,
  locked,
  enableNodeFiltering = true,
  enableGraphTypeSelector = true,
  initialGraphType = "oriented",
}: {
  predName: string;
  hasIntrError: boolean;
  locked: boolean;
  enableNodeFiltering?: boolean;
  enableGraphTypeSelector?: boolean;
  initialGraphType?: SelectedType;
}) {
  const [selectedType, setSelectedType] =
    useState<SelectedType>(initialGraphType);
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

  const GraphComponent = graphComponents[selectedType];

  return (
    <div className={"graphViewContainer " + (isFullscreen ? "fullscreen" : "")}>
      {hasIntrError ? (
        <ErrorModal />
      ) : (
        <div className="graphViewItem" key={predName}>
          {graphHudVissible ? (
            <GraphHUD
              id={predName}
              type={selectedType}
              typeSelected={setSelectedType}
              isFullscreen={isFullscreen}
              fullScreenToggled={() => setIsFullscreen((prev) => !prev)}
              onExitClicked={() => setGraphHudVissible(false)}
              disableNodeSelector={!enableNodeFiltering}
              disableTypeSelector={!enableGraphTypeSelector}
            />
          ) : (
            <GraphConfiguratorButton
              setGraphHudVissible={setGraphHudVissible}
            />
          )}
          <GraphInfoContext.Provider
            value={{ id: predName, type: selectedType }}
          >
            <ReactFlowProvider>
              <GraphComponent id={predName} locked={locked} />
            </ReactFlowProvider>
          </GraphInfoContext.Provider>
        </div>
      )}
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

function ErrorModal() {
  return (
    <div className="intrErrorContainer">
      <div className="warnIconBox">
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          size="xl"
          className="text-danger"
        />
      </div>
      <div className="warnText">
        <h5>There is an error in this predicate's interpretation.</h5>
        <p>Please fix it using the text editor.</p>
      </div>
    </div>
  );
}
