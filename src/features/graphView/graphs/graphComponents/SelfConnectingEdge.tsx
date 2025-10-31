import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { DirectEdgeType } from "./DirectEdge";
import { DeleteElementButton } from "./PredicateNode";

export default function SelfConnectingEdge(props: EdgeProps<DirectEdgeType>) {
  const { deleteElements } = useReactFlow();

  const { sourceX, sourceY, markerEnd } = props;

  const edgePath = `
  M ${sourceX} ${sourceY - 10}
  C ${sourceX + 50} ${sourceY - 45},
    ${sourceX - 20} ${sourceY - 85},
    ${sourceX - 30} ${sourceY - 40}`;

  const labelX = sourceX + 12;
  const labelY = sourceY - 55;

  const shouldError = props.data?.duplicate || props.data?.error;

  return (
    <>
      <BaseEdge
        className={`react-flow__edge-path ${props.data?.duplicate ? "error" : ""}`}
        path={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        {shouldError && (
          <DeleteElementButton
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(0.6)`,
              pointerEvents: "all",
              zIndex: 100,
            }}
            className="nodrag nopan"
            onClick={() => deleteElements({ edges: [{ id: props.id }] })}
          >
            delete
          </DeleteElementButton>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
