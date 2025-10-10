import "./graphComponents.css";

import {
  Handle,
  Position,
  useConnection,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  leftoverDeleted,
  selectRelevantConstants,
  selectRelevantUnaryPreds,
} from "../graphSlice";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

interface PredicateNodeData extends Record<string, unknown> {
  label: string;
  error?: boolean;
  leftover?: boolean;
}

// Omitting "domAttributes" is needed to prevent issues with immer library.
// It's never used anyway due to issues with serialization.
export type PredicateNodeType<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
> = Omit<Node<PredicateNodeData & NodeData>, "domAttributes">;

export default function PredicateNode({
  id,
  data,
  selectable,
  selected,
  isConnectable,
}: NodeProps<PredicateNodeType>) {
  const dispatch = useAppDispatch();

  const connection = useConnection();
  const parentInfo = useGraphInfo();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  const constants = useAppSelector((state) =>
    selectRelevantConstants(state, data.label),
  );

  const unaryPreds = useAppSelector((state) =>
    selectRelevantUnaryPreds(state, data.label),
  );

  const selectedPreds = useAppSelector(
    (state) =>
      state.graphView[parentInfo.id].state[parentInfo.type].selectedPreds,
  );

  const predsToDisplay = unaryPreds.filter((relevant) =>
    selectedPreds.includes(relevant),
  );

  const handleLeftOverDeletion = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    dispatch(leftoverDeleted({ ...parentInfo, deletedNode: id }));
  };

  return (
    <div
      // TODO: not like this
      className={`graph_editor__node ${data.error || data.leftover ? "border-danger" : ""} ${selectable ? "selectable" : ""} ${selected ? "selected" : ""}`}
    >
      <div className={`predicateNodeBody`}>
        {!connection.inProgress && (
          <Handle
            className="predicateNodeHandle"
            position={Position.Right}
            type="source"
            isConnectable={!data.leftover}
            isConnectableStart={isConnectable}
          />
        )}

        {(!connection.inProgress || isTarget) && (
          <Handle
            className="predicateNodeHandle"
            position={Position.Left}
            type="target"
            isConnectable={!data.leftover}
            isConnectableStart={false}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0, lineHeight: 0 }}>
            {data.label.toUpperCase()}
          </h2>
          <Button
            style={{
              zIndex: 100,
              transform: "scale(0.65)",
              visibility: data.leftover ? "visible" : "hidden",
              position: "absolute",
              top: "-30px",
              right: "-30px",
            }}
            variant="danger"
            onClick={handleLeftOverDeletion}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>

          {!data.leftover ? (
            <>
              <p style={{ margin: 0 }}>{constants.join(", ")}</p>
              <p style={{ margin: 0 }}>{predsToDisplay.join(", ")}</p>
            </>
          ) : (
            <p
              style={{
                fontSize: "0.65rem",
                position: "absolute",
                fontWeight: "normal",
                textWrap: "nowrap",
                bottom: -20,
                left: "50%",
                transform: "translateX(-50%)",
              }}
              className="text-danger"
            >
              Leftover node
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
