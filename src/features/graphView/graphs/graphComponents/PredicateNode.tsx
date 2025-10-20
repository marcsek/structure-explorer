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
  onConnected,
  selectRelevantConstants,
  selectRelevantUnaryPreds,
  selectUnaryPreds,
} from "../graphSlice";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";
import { Button, type ButtonProps } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { unaryPredsColors } from "../../../structure/EditorToolbar/EditorToolbar";

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

  const allUnaryPreds = useAppSelector(selectUnaryPreds)?.sort();
  const unaryPreds = useAppSelector((state) =>
    selectRelevantUnaryPreds(state, data.label),
  );

  const selectedPreds = useAppSelector(
    (state) =>
      state.graphView[parentInfo.id].state[parentInfo.type].selectedPreds,
  );

  const predsToDisplay = unaryPreds
    .filter((relevant) => selectedPreds.includes(relevant))
    ?.sort();

  const handleLeftOverDeletion = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    dispatch(leftoverDeleted({ ...parentInfo, deletedNode: id }));
  };

  const createSelfEdge = () => {
    if (parentInfo.type === "bipartite") return;

    dispatch(
      onConnected({
        ...parentInfo,
        connection: {
          source: id,
          target: id,
          sourceHandle: null,
          targetHandle: null,
        },
      }),
    );
  };

  return (
    <div
      // TODO: not like this
      className={`graph_editor__node ${data.error || data.leftover ? "error" : ""} ${selectable ? "selectable" : ""} ${selected ? "selected" : ""}`}
      onDoubleClick={() => createSelfEdge()}
    >
      {!data.error && !data.leftover && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            borderRadius: "8px 8px 0 0",
            zIndex: 1,
            height: "12px",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {predsToDisplay.map((pred) => (
            <div
              key={pred}
              style={{
                backgroundColor:
                  unaryPredsColors[
                    allUnaryPreds.findIndex((p) => p[0] === pred) %
                      allUnaryPreds.length
                  ],
                width: "100%",
              }}
            />
          ))}
        </div>
      )}
      <div className="handle-container">
        {!connection.inProgress && (
          <Handle
            className="predicateNodeHandle source"
            position={Position.Right}
            type="source"
            isConnectable={!data.leftover}
            isConnectableStart={isConnectable}
          />
        )}

        {(!connection.inProgress || isTarget) && (
          <Handle
            className="predicateNodeHandle target"
            position={Position.Left}
            type="target"
            isConnectable={!data.leftover}
            isConnectableStart={false}
          />
        )}
      </div>
      <div className="predicateNodeBody">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0, lineHeight: 0 }}>
            {data.label.toUpperCase()}
          </h2>
          {!data.leftover ? (
            <>
              <p style={{ margin: 0 }}>{constants.join(", ")}</p>
            </>
          ) : (
            <>
              <DeleteElementButton
                onClick={handleLeftOverDeletion}
                style={{
                  zIndex: 100,
                  transform: "scale(0.6)",
                  position: "absolute",
                  top: "-30px",
                  right: "-30px",
                }}
              />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeleteElementButton(props: ButtonProps) {
  return (
    <Button {...props} variant="danger">
      <FontAwesomeIcon icon={faTrash} />
    </Button>
  );
}
