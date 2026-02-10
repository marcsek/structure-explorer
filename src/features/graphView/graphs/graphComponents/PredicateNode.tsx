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
  selectUnaryPreds,
} from "../graphSlice";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";
import { Button, type ButtonProps } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { getUnaryPredicateColor } from "../../../drawerEditor/unaryPredicateColors";
import { selectPredicatesToDisplay } from "../../../editorToolbar/editorToolbarSlice";
import { memo } from "react";

interface PredicateNodeData extends Record<string, unknown> {
  label: string;
  error?: boolean;
  ghost?: boolean;
  leftover?: boolean;
}

// Omitting "domAttributes" is needed to prevent issues with immer library.
// It's never used anyway due to issues with serialization.
export type PredicateNodeType<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
> = Omit<Node<PredicateNodeData & NodeData>, "domAttributes">;

function PredicateNode({
  id,
  data,
  isConnectable,
}: NodeProps<PredicateNodeType>) {
  const dispatch = useAppDispatch();

  const connection = useConnection();
  const parentInfo = useGraphInfo();
  const hasTarget = connection.inProgress && connection.fromNode.id !== id;

  const constants = useAppSelector((state) =>
    selectRelevantConstants(state, data.label),
  );

  const handleLeftOverDeletion = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    dispatch(leftoverDeleted({ ...parentInfo, deletedNode: id }));
  };

  const createSelfEdge = () => {
    if (parentInfo.graphType === "bipartite" || data.leftover || data.ghost)
      return;

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

  const hasErrorState = data.error || data.leftover;

  return (
    <>
      <div
        className={`predicate-node ${hasErrorState ? "error" : ""} ${data.ghost ? "ghost" : ""}`}
        onDoubleClick={() => createSelfEdge()}
      >
        {!hasErrorState && <UnaryPredicatesIndicator domainId={data.label} />}

        <div className="predicate-node-handle-container">
          {!connection.inProgress && (
            <Handle
              id={`source-${id}`}
              className="predicate-node-handle source"
              position={Position.Right}
              type="source"
              isConnectable={!data.leftover}
              isConnectableStart={isConnectable}
            />
          )}

          {(!connection.inProgress || hasTarget) && (
            <Handle
              id={`target-${id}`}
              className="predicate-node-handle target"
              position={Position.Left}
              type="target"
              isConnectable={!data.leftover}
              isConnectableStart={false}
            />
          )}
        </div>

        <div className="predicate-node-body">
          <span className="predicate-node-label">{data.label}</span>
          {!data.leftover ? (
            <>
              {constants.length > 0 && (
                <span className="predicate-node-constants">
                  {constants.join(", ")}
                </span>
              )}
            </>
          ) : (
            <span className="predicate-node-error-text">Leftover node</span>
          )}
        </div>
      </div>

      {data.leftover && (
        <DeleteElementButton
          onClick={handleLeftOverDeletion}
          className="predicate-node-delete-button"
        />
      )}
    </>
  );
}

export default memo(PredicateNode);

interface UnaryPredicatesIndicatorProps {
  domainId: string;
}

function UnaryPredicatesIndicator({ domainId }: UnaryPredicatesIndicatorProps) {
  const parentInfo = useGraphInfo();
  const allUnaryPreds = useAppSelector(selectUnaryPreds);

  const [predsToDisplay, previewedPreds] = useAppSelector((state) =>
    selectPredicatesToDisplay(
      state,
      parentInfo.tupleName,
      parentInfo.tupleType,
      domainId,
    ),
  );

  return (
    <div className="predicate-node-indicator">
      <div className="predicate-node-indicator-stripy-overlay" />
      {predsToDisplay.map((pred) => (
        <div
          key={pred}
          className={`predicate-node-indicator-item ${previewedPreds.includes(pred) ? "stripy" : ""}`}
          style={{
            color: getUnaryPredicateColor(
              allUnaryPreds.findIndex((p) => p[0] === pred),
            ),
          }}
        />
      ))}
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
