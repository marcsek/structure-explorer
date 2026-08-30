import "./PredicateNode.css";

import {
  Handle,
  Position,
  useConnection,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { leftoverDeleted, onConnected } from "../../graphViewSlice";
import { useGraphInfo } from "../../graphInfoContext";
import { selectRelevantConstants } from "../../../structure/structureSlice";
import DeleteElementButton from "../../../../shared/ui/DeleteElementButton";
import PredicateNodeVisual from "./PredicateNodeVisual";
import NodeUnaryPredicatesIndicator from "./NodeUnaryPredicatesIndicator";

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
  const connectionInProgress = useConnection((c) => c.inProgress);
  const connectionFromNodeId = useConnection((c) => c.fromNode?.id);

  const constants = useAppSelector((state) =>
    selectRelevantConstants(state, data.label),
  );

  const isConnectingFromOtherNode =
    connectionInProgress && connectionFromNodeId !== id;

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

  return (
    <>
      <PredicateNodeVisual
        label={data.label}
        constants={constants}
        indicator={<NodeUnaryPredicatesIndicator domainId={data.label} />}
        error={data.error}
        leftover={data.leftover}
        ghost={data.ghost}
        hatched={data.hatched}
        onDoubleClick={createSelfEdge}
      >
        <div className="predicate-node-handle-container">
          {!connectionInProgress && (
            <Handle
              id={`source-${id}`}
              className="predicate-node-handle source"
              position={Position.Right}
              type="source"
              isConnectable={!data.leftover}
              isConnectableStart={isConnectable}
            />
          )}

          {(!connectionInProgress || isConnectingFromOtherNode) && (
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
      </PredicateNodeVisual>

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
