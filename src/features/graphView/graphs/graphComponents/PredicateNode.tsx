import "./graphComponents.css";

import {
  Handle,
  Position,
  useConnection,
  useReactFlow,
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
  error?: boolean;
  leftOver?: boolean;
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
  const { deleteElements } = useReactFlow();

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

  const handleLeftOverDeletion = () => {
    const toDelete =
      parentInfo.type === "bipartite"
        ? [`d-${id.slice("d-".length)}`, `r-${id.slice("d-".length)}`]
        : [id];

    deleteElements({ nodes: toDelete.map((id) => ({ id })) });
  };

  return (
    <div
      // TODO: not like this
      className={`graph_editor__node ${data.error || data.leftOver ? "border-danger" : ""} ${selectable ? "selectable" : ""} ${selected ? "selected" : ""}`}
    >
      <div className={`predicateNodeBody`}>
        {!connection.inProgress && (
          <Handle
            className="predicateNodeHandle"
            position={Position.Right}
            type="source"
            isConnectable={!data.leftOver}
            isConnectableStart={isConnectable}
          />
        )}

        {(!connection.inProgress || isTarget) && (
          <Handle
            className="predicateNodeHandle"
            position={Position.Left}
            type="target"
            isConnectable={!data.leftOver}
            isConnectableStart={false}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0 }}>{data.label.toUpperCase()}</h2>
          <p style={{ margin: 0 }}>{constants.join(", ")}</p>
          {data.leftOver && (
            <button
              style={{ margin: 0, zIndex: 100 }}
              onClick={handleLeftOverDeletion}
            >
              Delete
            </button>
          )}
          <p style={{ margin: 0 }}>{predsToDisplay.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}
