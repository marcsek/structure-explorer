import { BaseEdge, type EdgeProps } from "@xyflow/react";
import type { DirectEdgeType } from "./DirectEdge";

export default function SelfConnectingEdge(props: EdgeProps<DirectEdgeType>) {
  const { sourceX, sourceY, targetX, targetY, markerEnd } = props;
  const radiusX = (sourceX - targetX) * 0.6;
  const radiusY = 50;

  const edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${
    targetX + 2
  } ${targetY}`;

  return (
    <BaseEdge
      className={`react-flow__edge-path ${props.data?.duplicate ? "error" : ""}`}
      path={edgePath}
      markerEnd={markerEnd}
    />
  );
}
