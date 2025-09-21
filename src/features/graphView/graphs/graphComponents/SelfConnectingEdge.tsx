import { BaseEdge, type EdgeProps } from "@xyflow/react";

export default function SelfConnectingEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, markerEnd } = props;
  const radiusX = (sourceX - targetX) * 0.6;
  const radiusY = 50;

  const edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${
    targetX + 2
  } ${targetY}`;

  return <BaseEdge path={edgePath} markerEnd={markerEnd} />;
}
