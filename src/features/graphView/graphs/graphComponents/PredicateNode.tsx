import "./graphComponents.css";

import {
  Handle,
  Position,
  useConnection,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useAppSelector } from "../../../../app/hooks";
import {
  selectRelevantConstants,
  selectRelevantUnaryPreds,
} from "../graphSlice";
import { useGraphInfo } from "../../components/GraphView/GraphInfoContext";

interface PredicateNodeData extends Record<string, unknown> {
  label: string;
}

// Omitting "domAttributes" is needed to prevent issues with immer library.
// It's never used anyway due to issues with serialization.
export type PredicateNodeType<
  NodeData extends Record<string, unknown> = Record<string, unknown>,
> = Omit<Node<PredicateNodeData & NodeData>, "domAttributes">;

export default function PredicateNode({
  id,
  data,
  isConnectable,
}: NodeProps<PredicateNodeType>) {
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
    (state) => state.graphView[parentInfo.id][parentInfo.type].selectedPreds,
  );

  const predsToDisplay = unaryPreds.filter((relevant) =>
    selectedPreds.includes(relevant),
  );

  return (
    <div>
      <div className="predicateNodeBody">
        {!connection.inProgress && (
          <Handle
            className="predicateNodeHandle"
            position={Position.Right}
            type="source"
            isConnectableStart={isConnectable}
          />
        )}

        {(!connection.inProgress || isTarget) && (
          <Handle
            className="predicateNodeHandle"
            position={Position.Left}
            type="target"
            isConnectableStart={false}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0 }}>{data.label.toUpperCase()}</h2>
          <p style={{ margin: 0 }}>{constants.join(", ")}</p>
          <p style={{ margin: 0 }}>{predsToDisplay.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}
