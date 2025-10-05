import { Card } from "react-bootstrap";
import type { GraphType } from "../../graphs/plugins";
import NodeSelector from "../NodeSelector/NodeSelector";
import PredicateSelector from "../PredicateSelector/PredicateSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

export default function GraphHUD({
  id,
  type,
  typeSelected,
  isFullscreen,
  fullScreenToggled,
  onExitClicked,
  disableNodeSelector = false,
  disableTypeSelector = false,
}: {
  id: string;
  type: GraphType;
  typeSelected: (type: GraphType) => void;
  isFullscreen: boolean;
  fullScreenToggled: () => void;
  onExitClicked: () => void;
  disableNodeSelector?: boolean;
  disableTypeSelector?: boolean;
}) {
  return (
    <Card
      style={{
        backgroundColor: "white",
        padding: "1rem",
        display: "flex",
        zIndex: 1,
        flexDirection: "column",
        position: "absolute",
        alignItems: "center",
        gap: "1.5rem",
        right: "1rem",
        top: "1rem",
        bottom: "1rem",
        flexGrow: 1,
        overflowY: "auto",
      }}
    >
      <FontAwesomeIcon
        icon={faX}
        style={{
          position: "absolute",
          right: "1rem",
          top: "1rem",
          cursor: "pointer",
        }}
        onClick={() => onExitClicked()}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {!disableTypeSelector && (
          <>
            <h6>Graph Types</h6>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "0.2rem",
              }}
            >
              <button onClick={() => typeSelected("oriented")}>Oriented</button>
              <button onClick={() => typeSelected("hasse")}>Hasse</button>
              <button
                style={{ margin: "0 auto" }}
                onClick={() => typeSelected("bipartite")}
              >
                Bipartite
              </button>
            </div>
          </>
        )}
      </div>
      <PredicateSelector id={id} type={type} />
      {!disableNodeSelector && <NodeSelector id={id} type={type} />}
      <div style={{ minHeight: "fit-content" }}>
        <button onClick={() => fullScreenToggled()}>
          {isFullscreen ? "Empty Screen ?" : "Full Screen"}
        </button>
      </div>
    </Card>
  );
}
