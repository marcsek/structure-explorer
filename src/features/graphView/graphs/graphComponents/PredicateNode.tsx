import "./graphComponents.css";

import {
  Handle,
  Position,
  useConnection,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { leftoverDeleted, onConnected } from "../graphSlice";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";
import { selectRelevantConstants } from "../../../editorToolbar/editorToolbarSlice";
import DeleteElementButton from "./DeleteElementButton";
import UnaryPredicatesIndicator from "./UnaryPredicatesIndicator";

interface PredicateNodeData extends Record<string, unknown> {
  label: string;
  error?: boolean;
  ghost?: boolean;
  hatched?: boolean;
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

  const graphInfo = useGraphInfo();
  const connection = useConnection();

  const constants = useAppSelector((state) =>
    selectRelevantConstants(state, data.label),
  );

  const isInvalid = data.error || data.leftover;

  const isConnectingFromOtherNode =
    connection.inProgress && connection.fromNode.id !== id;

  const isInteractive = !graphInfo.locked && !data.leftover && !data.ghost;

  const createSelfEdge = () => {
    if (!isInteractive) return;

    dispatch(
      onConnected({
        ...graphInfo,
        connection: {
          source: id,
          target: id,
          sourceHandle: null,
          targetHandle: null,
        },
      }),
    );
  };

  const deleteLeftover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    dispatch(leftoverDeleted({ ...graphInfo, deletedNode: id }));
  };

  const nodeClassName = [
    "predicate-node",
    isInvalid && "error",
    data.ghost && "ghost",
    data.hatched && "hatched",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={nodeClassName} onDoubleClick={createSelfEdge}>
        {!isInvalid && <UnaryPredicatesIndicator domainId={data.label} />}

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

          {(!connection.inProgress || isConnectingFromOtherNode) && (
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

          {data.leftover ? (
            <span className="predicate-node-error-text">Leftover node</span>
          ) : (
            constants.length > 0 && (
              <span className="predicate-node-constants">
                {constants.join(", ")}
              </span>
            )
          )}
        </div>
      </div>

      {data.leftover && (
        <DeleteElementButton
          onClick={deleteLeftover}
          className="predicate-node-delete-button"
        />
      )}
    </>
  );
}

export default memo(PredicateNode);
