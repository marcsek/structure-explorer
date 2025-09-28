import "./GraphView.css";
import "../../graphs.css";

import { useState } from "react";
import OrientedGraph from "../../graphs/OrientedGraph/OrientedGraph";
import HasseDiagram from "../../graphs/HasseDiagram/HasseDiagram";
import BipartiteGraph from "../../graphs/BipartiteGraph/BipartiteGraph.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import { GraphInfoContext } from "./GraphInfoContext.ts";
import GraphHUD from "../GraphHUD/GraphHUD.tsx";

type SelectedType = "oriented" | "hasse" | "bipartite";

export default function GraphView({ predName }: { predName: string }) {
  const [selectedType, setSelectedType] = useState<SelectedType>("oriented");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const graphComponents: Record<
    SelectedType,
    React.ComponentType<{ id: string }>
  > = {
    oriented: OrientedGraph,
    hasse: HasseDiagram,
    bipartite: BipartiteGraph,
  };

  const GraphComponent = graphComponents[selectedType];

  console.log(isFullscreen);
  return (
    <div className={"graphViewContainer " + (isFullscreen ? "fullscreen" : "")}>
      <div className="graphViewItem" key={predName}>
        <GraphHUD
          id={predName}
          type={selectedType}
          typeSelected={setSelectedType}
          isFullscreen={isFullscreen}
          fullScreenToggled={() => setIsFullscreen((prev) => !prev)}
        />
        <GraphInfoContext.Provider value={{ id: predName, type: selectedType }}>
          <ReactFlowProvider>
            <GraphComponent id={predName} />
          </ReactFlowProvider>
        </GraphInfoContext.Provider>
      </div>
    </div>
  );
}
