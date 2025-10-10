import { Card } from "react-bootstrap";
import type { GraphType } from "../../graphs/plugins";
import NodeSelector from "../NodeSelector/NodeSelector";
import PredicateSelector from "../PredicateSelector/PredicateSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

export default function GraphHUD({
  id,
  type,
  isFullscreen,
  fullScreenToggled,
  onExitClicked,
  disableNodeSelector = false,
}: {
  id: string;
  type: GraphType;
  isFullscreen: boolean;
  fullScreenToggled: () => void;
  onExitClicked: () => void;
  disableNodeSelector?: boolean;
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
      ></div>
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
